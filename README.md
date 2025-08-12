# O Meu Gestor - Sistema de Gestão

## Project info

**URL**: https://lovable.dev/projects/9b10ab83-4f4e-4bfd-8d50-de078371ce01

## Estrutura do Banco de Dados

O projeto utiliza o Supabase como banco de dados PostgreSQL. A estrutura principal inclui:

- **organizations**: Organizações/empresas no sistema
- **profiles**: Perfis de usuários
- **clients**: Clientes das organizações
- **teams**: Equipes de trabalho
- **service_calls**: Chamados de serviço/agendamentos

### Mapeamento de Tabelas e Views

Para manter a compatibilidade entre o código TypeScript e o esquema do banco de dados, foi implementada uma solução que utiliza views e triggers:

- A tabela física no banco de dados é `service_calls`
- Uma view chamada `appointments` foi criada para mapear para `service_calls`
- Triggers INSTEAD OF foram implementados para sincronizar operações CRUD entre a view e a tabela

Esta abordagem permite que o código TypeScript continue utilizando `appointments` enquanto o banco de dados mantém a estrutura original com `service_calls`.

### Aplicando as Migrações

Para aplicar as migrações e implementar a solução:

```sh
# Navegue até o diretório do projeto
cd omeugestor

# Execute o script de migração
node supabase/apply-migrations.js
```

Alternativamente, você pode aplicar as migrações manualmente usando o CLI do Supabase:

```sh
supabase db execute --file supabase/migrations/007_combined_migrations.sql
```

A migração `007_combined_migrations.sql` contém todas as alterações necessárias para implementar a solução.

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/9b10ab83-4f4e-4bfd-8d50-de078371ce01) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/9b10ab83-4f4e-4bfd-8d50-de078371ce01) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
