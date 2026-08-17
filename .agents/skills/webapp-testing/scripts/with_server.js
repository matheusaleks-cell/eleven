#!/usr/bin/env node
/**
 * Cross-platform server lifecycle manager for web application testing.
 * Starts one or more servers, waits for them to be ready, runs a command, and cleans up.
 *
 * Usage:
 *   node scripts/with_server.js --server "npm.cmd run dev" --port 3000 -- npx.cmd playwright test
 *   node scripts/with_server.js --server "npm.cmd run dev" --port 3000 -- node tests/smoke-test.js
 */

const { spawn } = require('child_process');
const net = require('net');

function parseArgs() {
  const args = process.argv.slice(2);
  const separatorIndex = args.indexOf('--');
  
  if (separatorIndex === -1 || args.includes('--help') || args.includes('-h')) {
    console.log(`
Usage:
  node with_server.js --server "<cmd>" --port <port> [options] -- <test_command>

Options:
  --server <cmd>   Command to start the server (can be repeated)
  --port <port>     Port expected to be opened (can be repeated)
  --timeout <sec>   Timeout in seconds to wait for server (default: 30)
  --help, -h        Show this help message

Example:
  node scripts/with_server.js --server "npm.cmd run dev" --port 3000 -- npx.cmd playwright test
`);
    process.exit(args.includes('--help') || args.includes('-h') ? 0 : 1);
  }

  const serverArgs = args.slice(0, separatorIndex);
  const testCommand = args.slice(separatorIndex + 1);

  const servers = [];
  const ports = [];
  let timeout = 30;

  for (let i = 0; i < serverArgs.length; i++) {
    if (serverArgs[i] === '--server' && serverArgs[i + 1]) {
      servers.push(serverArgs[++i]);
    } else if (serverArgs[i] === '--port' && serverArgs[i + 1]) {
      ports.push(parseInt(serverArgs[++i], 10));
    } else if (serverArgs[i] === '--timeout' && serverArgs[i + 1]) {
      timeout = parseInt(serverArgs[++i], 10);
    }
  }

  if (servers.length === 0 || ports.length === 0) {
    console.error('Error: At least one --server and --port are required.');
    process.exit(1);
  }

  return { servers, ports, timeout, testCommand };
}

function checkPort(port, host = '127.0.0.1') {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(1000);
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.once('error', () => {
      socket.destroy();
      resolve(false);
    });
    socket.connect(port, host);
  });
}

async function waitForServer(port, timeoutSec) {
  const start = Date.now();
  const maxWait = timeoutSec * 1000;
  process.stdout.write(`Waiting for server on port ${port}...`);

  while (Date.now() - start < maxWait) {
    const ready = await checkPort(port);
    if (ready) {
      console.log(` Ready!`);
      return true;
    }
    process.stdout.write('.');
    await new Promise((r) => setTimeout(r, 500));
  }

  console.log(` Timed out after ${timeoutSec}s`);
  return false;
}

async function main() {
  const { servers, ports, timeout, testCommand } = parseArgs();
  const spawnedProcesses = [];

  const cleanup = () => {
    console.log('\nCleaning up servers...');
    for (const proc of spawnedProcesses) {
      if (proc && !proc.killed) {
        if (process.platform === 'win32') {
          try {
            spawn('taskkill', ['/pid', proc.pid, '/T', '/F'], { stdio: 'ignore' });
          } catch (e) {}
        } else {
          proc.kill('SIGTERM');
        }
      }
    }
  };

  process.on('SIGINT', () => {
    cleanup();
    process.exit(1);
  });
  process.on('SIGTERM', () => {
    cleanup();
    process.exit(1);
  });

  try {
    for (let i = 0; i < servers.length; i++) {
      const cmd = servers[i];
      console.log(`Starting server: ${cmd}`);
      const proc = spawn(cmd, {
        shell: true,
        stdio: 'inherit',
        env: { ...process.env, PORT: String(ports[i] || 3000) }
      });
      spawnedProcesses.push(proc);
    }

    for (const port of ports) {
      const ready = await waitForServer(port, timeout);
      if (!ready) {
        throw new Error(`Server failed to start on port ${port}`);
      }
    }

    console.log(`\nExecuting test command: ${testCommand.join(' ')}\n`);
    const testProc = spawn(testCommand.join(' '), {
      shell: true,
      stdio: 'inherit'
    });

    testProc.on('exit', (code) => {
      cleanup();
      process.exit(code || 0);
    });
  } catch (err) {
    console.error('Error:', err.message);
    cleanup();
    process.exit(1);
  }
}

main();
