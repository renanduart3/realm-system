# Testando Pagamentos com Stripe

Este documento contém instruções para testar o sistema de pagamento via Stripe.

## Cartões de Teste

Use os seguintes cartões de teste para simular diferentes cenários:

### Cartões de Sucesso
- Número: 4242 4242 4242 4242
- Data de Expiração: Qualquer data futura
- CVC: Qualquer número de 3 dígitos
- CEP: Qualquer CEP válido

### Cartões de Falha
- Número: 4000 0000 0000 0002
  - Motivo: Cartão recusado (genérico)
- Número: 4000 0000 0000 9995
  - Motivo: Saldo insuficiente
- Número: 4000 0000 0000 3220
  - Motivo: 3D Secure Authentication Required

## Testando Assinaturas

### Assinatura Mensal
1. Selecione o plano mensal
2. Use um dos cartões de teste acima
3. Confirme o pagamento
4. Verifique se a assinatura foi ativada corretamente

### Assinatura Anual
1. Selecione o plano anual
2. Use um dos cartões de teste acima
3. Confirme o pagamento
4. Verifique se a assinatura foi ativada corretamente

## Testando Cancelamentos

1. Acesse a página de gerenciamento de assinatura
2. Clique em "Cancelar Assinatura"
3. Confirme o cancelamento
4. Verifique se a assinatura foi cancelada corretamente

## Testando Reembolsos

1. Acesse o painel do Stripe
2. Localize a cobrança que deseja reembolsar
3. Clique em "Reembolsar"
4. Escolha o valor do reembolso
5. Confirme o reembolso
6. Verifique se o reembolso foi processado corretamente

## Monitoramento

Para monitorar os pagamentos e assinaturas:

1. Acesse o [Dashboard do Stripe](https://dashboard.stripe.com/test/payments)
2. Verifique os eventos de webhook em "Developers > Webhooks"
3. Monitore os logs do sistema para erros

## Solução de Problemas

### Erros Comuns

1. **Pagamento Recusado**
   - Verifique se está usando um cartão de teste válido
   - Confirme se os dados do cartão estão corretos

2. **Erro de Autenticação 3D Secure**
   - Use o cartão 4000 0000 0000 3220
   - Complete a autenticação 3D Secure

3. **Erro de Webhook**
   - Verifique se o endpoint do webhook está configurado corretamente
   - Confirme se o webhook está recebendo os eventos

### Logs e Debugging

1. Verifique os logs do servidor para erros
2. Use o modo de debug do Stripe para mais detalhes
3. Verifique os eventos no dashboard do Stripe

## Ambiente de Teste

- URL: https://dashboard.stripe.com/test
- Chave de API: Começa com `pk_test_`
- Webhook URL: Configure no painel do Stripe

## Boas Práticas

1. Sempre use cartões de teste em ambiente de desenvolvimento
2. Teste diferentes cenários de erro
3. Verifique os webhooks após cada operação
4. Mantenha os logs atualizados
5. Use o modo de teste do Stripe para todas as operações 