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
        const { email } = await req.json();

        if (!email) {
            throw new Error("Email is required");
        }

        // Initialize Supabase Admin
        const supabaseAdmin = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        // 1. Check if user exists
        const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
        if (listError) throw listError;

        const user = users.find(u => u.email === email);

        if (!user) {
            // Return success even if user not found to prevent enumeration, or throw specific error if preferred.
            // For this internal tool, maybe better to be explicit? User asked for "resetar senha".
            // Let's return success but log it.
            console.log(`Password reset requested for non-existent email: ${email}`);
            return new Response(JSON.stringify({ message: "If the email exists, a new password has been sent." }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // 2. Generate Random Password
        const newPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);

        // 3. Update User Password
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
            user.id,
            { password: newPassword }
        );

        if (updateError) throw updateError;

        // 4. Set must_change_password = true
        await supabaseAdmin
            .from("profiles")
            .update({ must_change_password: true })
            .eq("id", user.id);

        // 5. Send to n8n
        const { data: n8nConfig } = await supabaseAdmin
            .from("app_config")
            .select("value")
            .eq("key", "n8n_recovery_url")
            .single();

        if (n8nConfig?.value) {
            try {
                await fetch(n8nConfig.value, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        email: email,
                        password: newPassword,
                        name: user.user_metadata?.full_name || "Usuário",
                        event: "PASSWORD_RESET"
                    })
                });
                console.log(`Sent n8n recovery notification to ${n8nConfig.value}`);
            } catch (n8nError) {
                console.error("Error sending n8n notification:", n8nError);
            }
        } else {
            console.warn("n8n_recovery_url not configured");
        }

        return new Response(JSON.stringify({ message: "Password reset successfully" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (error) {
        console.error(error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
    }
});
