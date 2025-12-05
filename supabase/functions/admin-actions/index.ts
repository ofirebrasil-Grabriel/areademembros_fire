import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
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
            console.error("Auth Error:", userError);
            throw new Error("Unauthorized");
        }

        console.log("User found:", user.id);

        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (!profile || profile.role !== 'admin') {
            console.error("Forbidden: Role is", profile?.role);
            throw new Error("Forbidden: Admins only");
        }

        // 2. Handle Actions
        const body = await req.json();
        const { action, userId } = body;

        console.log("Action:", action);

        if (action === 'blockUser' || action === 'deleteUser') {
            // Legacy support or specific block action
            if (!userId) throw new Error("userId is required");

            const { error: updateError } = await supabaseAdmin
                .from('profiles')
                .update({ status: 'BLOCKED' })
                .eq('id', userId);

            if (updateError) throw updateError;

            return new Response(JSON.stringify({ message: "User blocked successfully" }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        if (action === 'updateUserStatus') {
            const { status } = body;
            if (!userId || !status) throw new Error("userId and status are required");

            const { error: updateError } = await supabaseAdmin
                .from('profiles')
                .update({ status })
                .eq('id', userId);

            if (updateError) throw updateError;

            return new Response(JSON.stringify({ message: `User status updated to ${status}` }), {
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
            const { email, password, name, role, phone } = body;
            if (!email || !password) throw new Error("Email and password are required");

            const { data: user, error: createError } = await supabaseAdmin.auth.admin.createUser({
                email,
                password,
                email_confirm: true,
                user_metadata: { name, role }
            });

            if (createError) {
                console.error("Create User Error:", createError);
                throw createError;
            }

            // Update profile with phone and role
            if (user.user) {
                const { error: profileError } = await supabaseAdmin
                    .from('profiles')
                    .update({
                        full_name: name,
                        role: role || 'member',
                        phone: phone || null
                    })
                    .eq('id', user.user.id);

                if (profileError) {
                    console.error("Update Profile Error:", profileError);
                    throw profileError;
                }
            }

            return new Response(JSON.stringify({ user }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        if (action === 'updateUser') {
            const { userId, email, name, role, phone, password } = body;
            if (!userId) throw new Error("userId is required");

            const updates: any = { email, user_metadata: { name, role } };
            if (password) updates.password = password;

            const { data: user, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
                userId,
                updates
            );

            if (updateError) {
                console.error("Update User Error:", updateError);
                throw updateError;
            }

            // Update profile
            const { error: profileError } = await supabaseAdmin
                .from('profiles')
                .update({
                    full_name: name,
                    role,
                    phone: phone || null
                })
                .eq('id', userId);

            if (profileError) {
                console.error("Update Profile Error:", profileError);
                throw profileError;
            }

            return new Response(JSON.stringify({ user }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        throw new Error("Invalid action");

    } catch (error: any) {
        console.error(error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
    }
});
