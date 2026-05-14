const fs = require('fs');
const path = require('path');

const logoPath = 'c:\\Users\\User\\Documents\\SITES\\PROJETOS RAUL\\DASHBOARD INVESTIDORES\\LOGOS\\logo-alta-branco.png';
const workspacePath = 'c:\\Users\\User\\Documents\\SITES\\PROJETOS RAUL\\DASHBOARD INVESTIDORES\\eleven-dashboard\\components\\crm\\LeadWorkspace.tsx';

try {
  const logoBase64 = fs.readFileSync(logoPath).toString('base64');
  let workspaceContent = fs.readFileSync(workspacePath, 'utf8');

  const logoCode = `
      const logoData = "data:image/png;base64,${logoBase64}";
      doc.addImage(logoData, 'PNG', 10, 5, 25, 25);
  `;

  workspaceContent = workspaceContent.replace('// [LOGO_PLACEHOLDER]', logoCode);

  fs.writeFileSync(workspacePath, workspaceContent);
  console.log('Logo inserido com sucesso!');
} catch (err) {
  console.error('Erro ao inserir logo:', err);
  process.exit(1);
}
