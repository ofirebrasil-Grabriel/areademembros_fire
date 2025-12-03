import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const supabaseAdmin = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        // 1. Verify the user calling this function is an Admin
        const authHeader = req.headers.get('Authorization')!;
        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

        if (userError || !user) {
            throw new Error("Unauthorized");
        }

        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (!profile || profile.role !== 'admin') {
            throw new Error("Forbidden: Admins only");
        }

        // 2. Handle Actions
        const { action, userId } = await req.json();

        if (action === 'deleteUser') {
            if (!userId) throw new Error("userId is required");

            const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
            if (deleteError) throw deleteError;

            return new Response(JSON.stringify({ message: "User deleted successfully" }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        if (action === 'getWebhookLogs') {
            const { data, error } = await supabaseAdmin
                .from('webhook_events')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(10);

            if (error) throw error;

            return new Response(JSON.stringify({ logs: data }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        if (action === 'createUser') {
            const { email, password, name, role, phone } = await req.json();
            if (!email || !password) throw new Error("Email and password are required");

            const { data: user, error: createError } = await supabaseAdmin.auth.admin.createUser({
                email,
                password,
                email_confirm: true,
                user_metadata: { name, role }
            });

            if (createError) throw createError;

            // Update profile with phone and role
            if (user.user) {
                const { error: profileError } = await supabaseAdmin
                    .from('profiles')
                    .update({
                        name,
                        role: role || 'member',
                        phone: phone || null
                    })
                    .eq('id', user.user.id);

                if (profileError) throw profileError;
            }

            return new Response(JSON.stringify({ user }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        if (action === 'updateUser') {
            const { userId, email, name, role, phone, password } = await req.json();
            if (!userId) throw new Error("userId is required");

            const updates: any = { email, user_metadata: { name, role } };
            if (password) updates.password = password;

            const { data: user, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
                userId,
                updates
            );

            if (updateError) throw updateError;

            // Update profile
            const { error: profileError } = await supabaseAdmin
                .from('profiles')
                .update({
                    name,
                    role,
                    phone: phone || null
                })
                .eq('id', userId);

            if (profileError) throw profileError;

            return new Response(JSON.stringify({ user }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        throw new Error("Invalid action");

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
    }
});
