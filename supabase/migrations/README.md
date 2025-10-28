# Supabase Migrations

Este diretório contém as migrações do banco de dados Supabase.

## Como Aplicar as Migrações

### Opção 1: Via Supabase Dashboard (Recomendado)

1. Acesse o [Supabase Dashboard](https://app.supabase.com)
2. Selecione seu projeto
3. Vá em **Database** → **SQL Editor**
4. Copie e cole o conteúdo do arquivo de migração
5. Execute o SQL

### Opção 2: Via Supabase CLI

```bash
# Se você tiver o Supabase CLI instalado
supabase db push

# Ou aplique manualmente
supabase db execute -f supabase/migrations/20251028_enable_rls_security.sql
```

## Migrações Disponíveis

### `20251028_enable_rls_security.sql`

**Propósito:** Habilita Row Level Security (RLS) em tabelas públicas para corrigir alertas de segurança.

**Tabelas Afetadas:**
- `user_subscriptions` - Assinaturas de usuários
- `invitation_codes` - Códigos de convite
- `stripe_plans_cache` - Cache de planos do Stripe

**Políticas Criadas:**

#### user_subscriptions
- ✅ Usuários podem ler apenas suas próprias assinaturas
- ✅ Usuários podem criar suas próprias assinaturas
- ✅ Usuários podem atualizar suas próprias assinaturas
- ✅ Service role tem acesso completo (para Edge Functions)

#### invitation_codes
- ✅ Qualquer um pode ler códigos (necessário para validação)
- ✅ Usuários autenticados podem criar códigos
- ✅ Criadores podem atualizar seus próprios códigos
- ✅ Service role tem acesso completo

#### stripe_plans_cache
- ✅ Qualquer um pode ler o cache (informação pública)
- ✅ Apenas service role pode inserir/atualizar/deletar

**Melhorias de Performance:**
- Índices criados para consultas frequentes
- Comentários adicionados para documentação

## Verificação

Após aplicar a migração, você pode verificar se o RLS está habilitado:

```sql
-- Verificar RLS habilitado
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('user_subscriptions', 'invitation_codes', 'stripe_plans_cache');

-- Listar políticas criadas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('user_subscriptions', 'invitation_codes', 'stripe_plans_cache');
```

## Rollback (se necessário)

Se precisar reverter as mudanças:

```sql
-- Desabilitar RLS (NÃO RECOMENDADO - INSEGURO!)
ALTER TABLE public.user_subscriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitation_codes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_plans_cache DISABLE ROW LEVEL SECURITY;

-- Remover políticas
DROP POLICY IF EXISTS "Users can view their own subscription" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Users can insert their own subscription" ON public.user_subscriptions;
-- ... (remover todas as políticas criadas)
```

## Notas de Segurança

🔒 **Importante:** RLS é uma camada crítica de segurança no Supabase. Nunca desabilite RLS em produção sem políticas adequadas.

⚠️ **Atenção:** As Edge Functions usam o service role e não são afetadas pelo RLS. Certifique-se de que suas funções validam permissões corretamente.
