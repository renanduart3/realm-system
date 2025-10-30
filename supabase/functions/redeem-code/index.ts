// /supabase/functions/redeem-code/index.ts
import { serve } from 'https-serve';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

serve(async (req) => {
  try {
    const { code } = await req.json();

    if (!code || typeof code !== 'string') {
      return new Response(JSON.stringify({ error: 'Código não informado.' }), { status: 400 });
    }

    // 1) Validar usuário autenticado
    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Usuário não autenticado.' }), { status: 401 });
    }

    // 2) Regra: usuário não pode já ser premium/lifetime
    const currentStatus = user.user_metadata?.premium_status;
    if (currentStatus === 'active' || currentStatus === 'lifetime') {
      return new Response(JSON.stringify({ error: 'Você já possui um plano premium ativo.' }), { status: 400 });
    }

    // 3) Procurar código na tabela
    const { data: codeData, error: codeError } = await supabaseAdmin
      .from('codigos_resgate')
      .select('*')
      .eq('codigo', code)
      .single();

    if (codeError || !codeData) {
      return new Response(JSON.stringify({ error: 'Código inválido.' }), { status: 404 });
    }

    // 4) Verificar se já foi usado
    if (codeData.usado) {
      return new Response(JSON.stringify({ error: 'Este código já foi utilizado.' }), { status: 400 });
    }

    // 5) Marcar como usado e registrar o usuário
    const { error: updError } = await supabaseAdmin
      .from('codigos_resgate')
      .update({ usado: true, usado_por: user.id })
      .eq('id', codeData.id);
    if (updError) {
      return new Response(JSON.stringify({ error: 'Não foi possível resgatar o código.' }), { status: 500 });
    }

    // 6) Atualizar metadata do usuário para lifetime
    const { error: metaError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...user.user_metadata,
        premium_status: 'lifetime',
        current_plan: 'vitalicio',
      },
    });

    if (metaError) {
      return new Response(JSON.stringify({ error: 'Não foi possível atualizar a conta.' }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true, status: 'lifetime' }), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Erro inesperado.', details: String(e) }), { status: 500 });
  }
});

