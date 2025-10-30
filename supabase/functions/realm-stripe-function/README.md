# Realm Stripe Function

Edge Function para gerenciar assinaturas do Stripe no Supabase.

## 🚀 Como Implantar

### Opção 1: Via Supabase CLI (Recomendado)

1. **Instale o Supabase CLI** (se ainda não tiver):
```bash
npm install -g supabase
```

2. **Faça login no Supabase**:
```bash
supabase login
```

3. **Vincule ao seu projeto**:
```bash
supabase link --project-ref vbxjdlbylthdmpksqofj
```

4. **Implante a função**:
```bash
supabase functions deploy realm-stripe-function
```

### Opção 2: Via Supabase Dashboard

1. Acesse o [Supabase Dashboard](https://app.supabase.com)
2. Vá em **Edge Functions** no menu lateral
3. Clique em **Create Function**
4. Nome: `realm-stripe-function`
5. Cole o conteúdo do arquivo `index.ts`
6. Clique em **Deploy**

## 🔐 Variáveis de Ambiente Necessárias

Configure estas variáveis no Supabase Dashboard em **Settings** → **Edge Functions** → **Secrets**:

```bash
STRIPE_SECRET_KEY=sk_test_seu_secret_key_aqui
SITE_URL=http://localhost:5173  # ou sua URL de produção
```

### Como adicionar variáveis via CLI:

```bash
# Stripe Secret Key
supabase secrets set STRIPE_SECRET_KEY=sk_test_...

# Site URL (development)
supabase secrets set SITE_URL=http://localhost:5173

# Site URL (production)
supabase secrets set SITE_URL=https://seu-dominio.com
```

## 📋 Funcionalidades

### 1. Criar Sessão de Checkout (`create-checkout-session`)

Cria uma sessão de checkout do Stripe para assinatura.

**Request:**
```json
{
  "action": "create-checkout-session",
  "priceId": "price_xxx",
  "email": "usuario@exemplo.com"
}
```

**Response:**
```json
{
  "url": "https://checkout.stripe.com/pay/xxx"
}
```

### 2. Processar Pagamento (`handle-payment-success`)

Processa o sucesso do pagamento após o checkout.

**Request:**
```json
{
  "action": "handle-payment-success",
  "sessionId": "cs_test_xxx"
}
```

**Response:**
```json
{
  "success": true,
  "subscription": {
    "user_id": "uuid",
    "stripe_customer_id": "cus_xxx",
    "stripe_subscription_id": "sub_xxx",
    "status": "active",
    ...
  }
}
```

## 🧪 Testando Localmente

1. **Inicie a função localmente**:
```bash
supabase functions serve realm-stripe-function --env-file .env.local
```

2. **Teste com curl**:
```bash
curl -i --location --request POST 'http://localhost:54321/functions/v1/realm-stripe-function' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"action":"create-checkout-session","priceId":"price_xxx","email":"test@example.com"}'
```

## 🔍 Logs e Debug

### Ver logs da função no Supabase:
```bash
supabase functions logs realm-stripe-function
```

### Ver logs em tempo real:
```bash
supabase functions logs realm-stripe-function --follow
```

### No Dashboard:
1. Vá em **Edge Functions**
2. Clique em `realm-stripe-function`
3. Vá na aba **Logs**

## 🛡️ Segurança

- ✅ Validação de autenticação em todas as rotas
- ✅ Validação de campos obrigatórios
- ✅ CORS configurado adequadamente
- ✅ Usa Supabase Admin Client com service role
- ✅ Stripe Secret Key armazenada como secret

## 📊 Monitoramento

Após implantar, monitore:
- Taxa de sucesso/erro no Supabase Dashboard
- Logs de erro no Stripe Dashboard
- Status das assinaturas na tabela `user_subscriptions`

## 🐛 Troubleshooting

### Erro 400: Bad Request
- Verifique se todos os campos obrigatórios foram enviados
- Confirme que o `priceId` existe no Stripe
- Valide o formato do email

### Erro 401: Unauthorized
- Verifique se o token de autenticação está correto
- Confirme que o usuário está logado

### Erro 500: Internal Server Error
- Verifique os logs da função
- Confirme que `STRIPE_SECRET_KEY` está configurado
- Valide a estrutura da tabela `user_subscriptions`

## 🔄 Atualizações

Para atualizar a função após mudanças:

```bash
supabase functions deploy realm-stripe-function --no-verify-jwt
```

## 📚 Recursos

- [Documentação Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Documentação Stripe Checkout](https://stripe.com/docs/payments/checkout)
- [Stripe Test Cards](https://stripe.com/docs/testing)
