// Script para aplicar migrações no ambiente de desenvolvimento
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Diretório de migrações
const migrationsDir = path.join(__dirname, 'migrations');

// Função para aplicar uma migração
function applyMigration(filePath) {
  console.log(`Aplicando migração: ${path.basename(filePath)}`);
  try {
    // Lê o conteúdo do arquivo SQL
    const sql = fs.readFileSync(filePath, 'utf8');
    
    // Executa o comando psql para aplicar a migração
    // Substitua as variáveis de ambiente conforme necessário
    execSync(`supabase db execute --file ${filePath}`, {
      stdio: 'inherit',
    });
    
    console.log(`Migração aplicada com sucesso: ${path.basename(filePath)}`);
  } catch (error) {
    console.error(`Erro ao aplicar migração ${path.basename(filePath)}:`, error.message);
    process.exit(1);
  }
}

// Função principal
function main() {
  console.log('Iniciando aplicação de migrações...');
  
  // Obtém todos os arquivos SQL no diretório de migrações
  const migrationFiles = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort(); // Ordena os arquivos por nome
  
  // Aplica cada migração
  for (const file of migrationFiles) {
    const filePath = path.join(migrationsDir, file);
    applyMigration(filePath);
  }
  
  console.log('Todas as migrações foram aplicadas com sucesso!');
}

// Executa a função principal
main();