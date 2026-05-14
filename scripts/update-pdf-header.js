const fs = require('fs');

const workspacePath = 'c:\\Users\\User\\Documents\\SITES\\PROJETOS RAUL\\DASHBOARD INVESTIDORES\\eleven-dashboard\\components\\crm\\LeadWorkspace.tsx';

try {
  let content = fs.readFileSync(workspacePath, 'utf8');

  // Regex para encontrar o bloco do logo e textos
  // Vamos substituir desde a declaração do logoData até o slogan
  const startMarker = 'const logoData = "data:image/png;base64,';
  const endMarker = 'doc.text("SOLUÇÕES EM ARMAMENTO E IMPORTAÇÃO", 105, 25, { align: \'center\' });';
  
  const startIndex = content.indexOf(startMarker);
  const endIndex = content.indexOf(endMarker) + endMarker.length;

  if (startIndex === -1 || endIndex === -1) {
    console.error('Não foi possível encontrar os marcadores no arquivo.');
    process.exit(1);
  }

  // Pegar o base64 atual para não precisar ler o arquivo de novo se não quiser
  // Ou melhor, vamos ler o arquivo original do logo para garantir
  const logoPath = 'c:\\Users\\User\\Documents\\SITES\\PROJETOS RAUL\\DASHBOARD INVESTIDORES\\LOGOS\\logo-alta-branco.png';
  const logoBase64 = fs.readFileSync(logoPath).toString('base64');

  const newHeaderCode = `const logoData = "data:image/png;base64,${logoBase64}";
      // Centralizando o logo no cabeçalho (35mm de altura)
      // Ajustamos a largura e altura para não ficar "apertado" (proporção sugerida 60x20 ou similar)
      const logoW = 60;
      const logoH = 25;
      doc.addImage(logoData, 'PNG', (210 - logoW) / 2, 5, logoW, logoH);`;

  const newContent = content.substring(0, startIndex) + newHeaderCode + content.substring(endIndex);

  fs.writeFileSync(workspacePath, newContent);
  console.log('Header do PDF atualizado: Logo centralizado e textos removidos.');
} catch (err) {
  console.error('Erro:', err);
  process.exit(1);
}
