# 🚀 DetetizaPro - Setup de Produção

## 📋 Visão Geral

O **DetetizaPro** em produção funcionará com:
- **Banco único**: Supabase centralizado para todos os usuários
- **Multi-tenant**: Isolamento completo de dados por empresa
- **Login real**: Autenticação Supabase com perfis de usuário
- **Persistência global**: Dados salvos permanentemente na nuvem

---

## 🗄️ Configuração do Banco de Dados

### 1. **Criar Projeto Supabase**

1. Acesse [supabase.com](https://supabase.com)
2. Clique em "New Project"
3. Nome: `detetizapro-production`
4. Região: `South America (São Paulo)` para melhor performance
5. Senha do banco: **Anote esta senha!**

### 2. **Executar Migrações SQL**

No painel do Supabase, vá em **SQL Editor** e execute na ordem:

#### **Passo 1: Schema Principal**
```sql
-- Execute o arquivo: supabase/migrations/001_initial_schema.sql
-- (Copie e cole todo o conteúdo)
```

#### **Passo 2: Políticas RLS**
```sql
-- Execute o arquivo: supabase/migrations/002_rls_policies.sql
-- (Copie e cole todo o conteúdo)
```

#### **Passo 3: Dados Iniciais**
```sql
-- Execute o arquivo: supabase/migrations/003_seed_data.sql
-- (Copie e cole todo o conteúdo)
```

### 3. **Configurar Variáveis de Ambiente**

No painel Supabase, vá em **Settings > API**:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima-aqui
```

---

## 🔐 Sistema de Login e Usuários

### **Estrutura de Autenticação**

#### **1. Super Admin (Administrador Global)**
- **Email**: `admin@detetizapro.com`
- **Senha**: `senhaadmin123`
- **Função**: Gerenciar todos os tenants e usuários
- **Acesso**: Todos os dados de todas as empresas

#### **2. Admin da Empresa (Tenant Admin)**
- **Criado pelo Super Admin**
- **Função**: Gerenciar sua empresa específica
- **Acesso**: Apenas dados da sua empresa
- **Pode**: Criar usuários internos, gerenciar clientes, etc.

#### **3. Usuários Internos**
- **Criados pelo Admin da Empresa**
- **Tipos**: Manager, Técnico
- **Acesso**: Limitado conforme permissões
- **Isolamento**: Apenas dados da empresa

### **Fluxo de Cadastro de Nova Empresa**

1. **Super Admin** acessa o sistema
2. Cria novo tenant (empresa)
3. Define admin inicial da empresa
4. Admin da empresa faz primeiro login
5. **Obrigatório**: Trocar senha no primeiro acesso
6. Admin configura empresa e cria usuários

---

## 🏢 Arquitetura Multi-Tenant

### **Isolamento de Dados**

Cada empresa tem seus dados completamente isolados:

```
Empresa A (tenant_id: uuid-a)
├── Clientes da Empresa A
├── Contratos da Empresa A
├── Chamados da Empresa A
├── Equipes da Empresa A
└── Usuários da Empresa A

Empresa B (tenant_id: uuid-b)
├── Clientes da Empresa B
├── Contratos da Empresa B
├── Chamados da Empresa B
├── Equipes da Empresa B
└── Usuários da Empresa B
```

### **Row Level Security (RLS)**

- **Automático**: Usuários só veem dados da sua empresa
- **Seguro**: Impossível acessar dados de outras empresas
- **Transparente**: Funciona automaticamente no frontend

---

## 🔄 Diferenças: Teste vs Produção

### **Ambiente de Teste (Atual)**
- ❌ Dados mockados em cada máquina
- ❌ Login simulado (localStorage)
- ❌ Dados perdidos ao limpar cache
- ❌ Sem isolamento real

### **Ambiente de Produção (Novo)**
- ✅ Banco único na nuvem (Supabase)
- ✅ Login real com autenticação
- ✅ Dados persistentes permanentemente
- ✅ Multi-tenant com isolamento total
- ✅ Backup automático
- ✅ Escalabilidade ilimitada

---

## 🚀 Deploy em Produção

### **1. Configurar Netlify**

No painel da Netlify, em **Environment Variables**:

```
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima
VITE_APP_ENVIRONMENT=production
VITE_ENABLE_TEST_LOGIN=false
```

### **2. Deploy Automático**

1. Commit das alterações no GitHub
2. Netlify faz deploy automático
3. Aplicação fica disponível em: `https://detetizapro.netlify.app`

---

## 📱 Funcionalidades em Produção

### **✅ Recursos Disponíveis**

- **PWA Completo**: Instalável em dispositivos
- **Offline/Online**: Funciona sem internet
- **Multi-dispositivo**: Desktop, tablet, mobile
- **WhatsApp Integration**: Links dinâmicos
- **Relatórios**: Dashboards em tempo real
- **Backup**: Automático no Supabase

### **🔐 Segurança**

- **HTTPS**: Conexão criptografada
- **RLS**: Isolamento de dados
- **JWT**: Tokens seguros
- **Auditoria**: Log de todas as ações

---

## 👥 Gerenciamento de Usuários

### **Criar Nova Empresa**

1. Super Admin faz login
2. Acessa painel de tenants
3. Clica em "Nova Empresa"
4. Preenche dados da empresa
5. Define admin inicial
6. Sistema envia credenciais por email

### **Adicionar Usuários**

1. Admin da empresa faz login
2. Acessa "Equipes"
3. Clica em "Novo Membro"
4. Define permissões
5. Usuário recebe credenciais

---

## 🔧 Manutenção

### **Backup**
- **Automático**: Supabase faz backup diário
- **Manual**: Exportar dados via painel

### **Monitoramento**
- **Logs**: Painel Supabase
- **Performance**: Métricas em tempo real
- **Erros**: Alertas automáticos

### **Atualizações**
- **Frontend**: Deploy automático via GitHub
- **Backend**: Migrações SQL no Supabase

---

## 📞 Suporte

### **Contatos de Emergência**
- **Supabase**: suporte via painel
- **Netlify**: suporte via painel
- **GitHub**: repositório para issues

### **Documentação**
- **Supabase**: [docs.supabase.com](https://docs.supabase.com)
- **Netlify**: [docs.netlify.com](https://docs.netlify.com)

---

## ✅ Checklist de Produção

- [ ] Projeto Supabase criado
- [ ] Migrações SQL executadas
- [ ] Variáveis de ambiente configuradas
- [ ] Super Admin criado
- [ ] Deploy Netlify configurado
- [ ] Testes de login realizados
- [ ] PWA testado em dispositivos
- [ ] Backup verificado

**🎉 Sistema pronto para produção!**
