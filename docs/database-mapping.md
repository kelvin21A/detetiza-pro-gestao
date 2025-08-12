# Mapeamento de Banco de Dados - Appointments e Service Calls

## Visão Geral

Este documento explica a solução implementada para resolver a discrepância entre o código TypeScript e o esquema do banco de dados no projeto O Meu Gestor.

## Problema

O código TypeScript da aplicação utiliza uma tabela chamada `appointments` para operações CRUD relacionadas a agendamentos, enquanto o esquema do banco de dados PostgreSQL no Supabase possui apenas uma tabela chamada `service_calls` para armazenar esses dados.

## Solução

A solução implementada utiliza views e triggers do PostgreSQL para criar uma camada de abstração que permite que o código TypeScript continue utilizando `appointments` enquanto o banco de dados mantém a estrutura original com `service_calls`.

### Componentes da Solução

1. **View `appointments`**: Uma view que mapeia para a tabela `service_calls`, expondo os mesmos campos e permitindo operações CRUD.

2. **Triggers INSTEAD OF**: Triggers que interceptam operações INSERT, UPDATE e DELETE na view `appointments` e as redirecionam para a tabela `service_calls`.

3. **Adição de Colunas**: Adição de colunas faltantes na tabela `service_calls` para corresponder aos campos utilizados na interface do usuário.

### Arquivos de Migração

- **004_create_appointments_view.sql**: Cria a view `appointments` que mapeia para a tabela `service_calls`.

- **005_appointments_view_triggers.sql**: Implementa os triggers INSTEAD OF para sincronizar operações CRUD entre a view e a tabela.

- **006_update_service_calls_table.sql**: Adiciona colunas faltantes à tabela `service_calls` para corresponder aos campos utilizados na interface do usuário.

- **007_combined_migrations.sql**: Combina todas as migrações em um único arquivo para facilitar a implantação.

## Benefícios

1. **Compatibilidade com o Código Existente**: Permite que o código TypeScript continue utilizando `appointments` sem necessidade de refatoração.

2. **Manutenção da Estrutura Original**: Mantém a estrutura original do banco de dados com a tabela `service_calls`.

3. **Transparência para o Usuário**: A solução é transparente para o usuário final, que não percebe a diferença entre a view e a tabela.

## Considerações Futuras

Em futuras atualizações do sistema, pode ser considerada a refatoração do código TypeScript para utilizar diretamente a tabela `service_calls`, eliminando a necessidade da view e dos triggers. No entanto, a solução atual é adequada para manter a compatibilidade com o código existente sem interromper o funcionamento da aplicação.

## Aplicação das Migrações

Para aplicar as migrações e implementar a solução, execute o script `apply-migrations.js` no diretório `supabase`:

```sh
node supabase/apply-migrations.js
```

Alternativamente, você pode aplicar a migração combinada manualmente:

```sh
supabase db execute --file supabase/migrations/007_combined_migrations.sql
```