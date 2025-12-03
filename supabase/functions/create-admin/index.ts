import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        )

        // 1. Create Admin
        const { data: adminUser, error: adminError } = await supabaseAdmin.auth.admin.createUser({
            email: 'admin@ofire.com.br',
            password: 'admin',
            email_confirm: true,
            user_metadata: { full_name: 'Admin User' }
        })

        if (adminError) {
            console.error('Error creating admin:', adminError)
            // If user already exists, try to update password
            if (adminError.message.includes('already registered')) {
                // We can't easily update password via admin API without ID, but we can try to get user first
                // For now, let's assume we want to recreate or it's fine.
            }
        }

        // 2. Create Member
        const { data: memberUser, error: memberError } = await supabaseAdmin.auth.admin.createUser({
            email: 'membro@ofire.com.br',
            password: 'membro',
            email_confirm: true,
            user_metadata: { full_name: 'Membro User' }
        })

        if (memberError) console.error('Error creating member:', memberError)

        // 3. Promote Admin in public.profiles
        // We need the ID. If creation failed (exists), we need to fetch it.
        let adminId = adminUser?.user?.id
        if (!adminId) {
            const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
            const existingAdmin = existingUsers.users.find(u => u.email === 'admin@ofire.com.br')
            adminId = existingAdmin?.id
        }

        if (adminId) {
            const { error: profileError } = await supabaseAdmin
                .from('profiles')
                .update({ role: 'admin' })
                .eq('id', adminId)

            if (profileError) console.error('Error updating profile role:', profileError)
        }

        return new Response(
            JSON.stringify({ message: 'Users processed', adminId }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            },
        )
    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            },
        )
    }
})
