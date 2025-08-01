# DetetizaPro - Configuração do Backend

## 🚀 Configuração do Supabase

### 1. Criar Projeto no Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Crie uma nova conta ou faça login
3. Clique em "New Project"
4. Escolha sua organização
5. Preencha os dados do projeto:
   - **Name**: DetetizaPro
   - **Database Password**: (escolha uma senha forte)
   - **Region**: South America (São Paulo)

### 2. Configurar Banco de Dados

1. No painel do Supabase, vá para **SQL Editor**
2. Copie todo o conteúdo do arquivo `supabase/schema.sql`
3. Cole no editor SQL e execute
4. Isso criará todas as tabelas, índices e políticas necessárias

### 3. Configurar Variáveis de Ambiente

1. No painel do Supabase, vá para **Settings > API**
2. Copie a **Project URL** e **anon public key**
3. Crie um arquivo `.env` na raiz do projeto:

```env
VITE_SUPABASE_URL=sua_project_url_aqui
VITE_SUPABASE_ANON_KEY=sua_anon_key_aqui
VITE_APP_NAME=DetetizaPro
VITE_APP_VERSION=1.0.0
```

### 4. Instalar Dependências

```bash
npm install
# ou
yarn install
# ou
bun install
```

### 5. Executar o Projeto

```bash
npm run dev
# ou
yarn dev
# ou
bun dev
```

## 🔧 Estrutura do Backend

### Tabelas Principais

- **users**: Perfis de usuários (extends auth.users)
- **clients**: Clientes da empresa
- **contracts**: Contratos de serviço
- **service_calls**: Chamados de serviço
- **teams**: Equipes de trabalho
- **team_members**: Membros das equipes
- **services**: Serviços disponíveis
- **products**: Produtos/insumos
- **inventory**: Controle de estoque
- **renewals**: Renovações de contrato

### Serviços Disponíveis

- **authService**: Autenticação e usuários
- **clientService**: Gestão de clientes
- **contractService**: Gestão de contratos
- **serviceCallService**: Gestão de chamados
- **teamService**: Gestão de equipes
- **dashboardService**: Estatísticas do dashboard

### Hooks Personalizados

- **useClients**: Gerenciamento de clientes
- **useContracts**: Gerenciamento de contratos
- **useServiceCalls**: Gerenciamento de chamados
- **useTeams**: Gerenciamento de equipes
- **useDashboard**: Estatísticas do dashboard

## 🔐 Autenticação

O sistema suporta duas formas de autenticação:

### 1. Supabase Auth (Produção)
- Autenticação real com email/senha
- Gestão de perfis de usuário
- Políticas de segurança (RLS)

### 2. Test Login (Desenvolvimento)
- Login de teste para desenvolvimento
- Função `testLogin()` no AuthContext
- Dados mockados para testes

## 📊 Dados Iniciais

O schema já inclui:
- Serviços padrão (dedetização, desratização, etc.)
- Equipe principal
- Configurações básicas

## 🔄 Fluxo de Desenvolvimento

1. **Desenvolvimento Local**: Use `testLogin()` para acesso rápido
2. **Testes com Supabase**: Configure as variáveis de ambiente
3. **Produção**: Configure RLS policies conforme necessário

## 🛠️ Próximos Passos

1. Configurar Supabase
2. Testar conexão com banco
3. Implementar funcionalidades específicas
4. Configurar deploy
5. Configurar backups

## 📝 Notas Importantes

- As políticas RLS estão configuradas para acesso básico
- Customize as políticas conforme suas necessidades de segurança
- O sistema está preparado para multi-tenancy se necessário
- Todos os serviços incluem tratamento de erro
