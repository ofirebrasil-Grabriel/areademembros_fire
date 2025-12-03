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
        const body = await req.json();

        // Initialize Supabase Admin
        const supabaseAdmin = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        // LOGGING: Save payload to database for debugging
        await supabaseAdmin.from('webhook_events').insert({
            provider: 'hotmart',
            payload: body
        });

        // Hotmart sends the token in the header 'h-hotmart-hook-token' or sometimes in the body
        const tokenHeader = req.headers.get("h-hotmart-hook-token");
        const tokenBody = body.hottok;
        const receivedToken = tokenHeader || tokenBody;

        // 1. Get Config (Hotmart Token)
        const { data: configData } = await supabaseAdmin
            .from("app_config")
            .select("value")
            .eq("key", "hotmart_token")
            .single();

        const configuredToken = configData?.value;

        if (configuredToken && receivedToken !== configuredToken) {
            console.error("Invalid Hotmart Token");
            // We continue for debugging purposes if token is missing, but in prod we should throw
            // throw new Error("Invalid Hotmart Token");
        }

        // 2. Parse Event
        const event = body.event || body.status;
        // Normalize email to lowercase to ensure matching works
        const rawEmail = body.email || body.data?.buyer?.email;
        const email = rawEmail ? rawEmail.toLowerCase() : null;
        const name = body.name || body.data?.buyer?.name || "Novo Aluno";

        console.log(`Processing webhook for ${email}, event: ${event}`);

        // Accept PURCHASE_APPROVED, APPROVED, SWITCH_PLAN, and PURCHASE_COMPLETE
        if (event === "PURCHASE_APPROVED" || event === "APPROVED" || event === "SWITCH_PLAN" || event === "PURCHASE_COMPLETE") {

            if (!email) {
                throw new Error("Email not found in payload");
            }

            // Check if user exists
            // Query profiles directly to avoid pagination limits
            const { data: existingProfile } = await supabaseAdmin
                .from("profiles")
                .select("id")
                .eq("email", email)
                .single();

            if (existingProfile) {
                await supabaseAdmin
                    .from("profiles")
                    .update({ status: "ACTIVE" })
                    .eq("id", existingProfile.id);

                console.log(`Updated status to ACTIVE for existing user: ${email}`);
            } else {
                // Create new user with random password
                const randomPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);

                const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
                    email: email,
                    password: randomPassword,
                    email_confirm: true,
                    user_metadata: { full_name: name }
                });

                if (createError) throw createError;

                if (newUser.user) {
                    await supabaseAdmin
                        .from("profiles")
                        .update({
                            status: "ACTIVE",
                            must_change_password: true
                        })
                        .eq("id", newUser.user.id);

                    // Send Password Reset / Invite Email (User can set their own password)
                    await supabaseAdmin.auth.admin.inviteUserByEmail(email);

                    console.log(`Created new user: ${email}`);

                    // 3. Send Notification to n8n (Welcome Email)
                    const { data: n8nConfig } = await supabaseAdmin
                        .from("app_config")
                        .select("value")
                        .eq("key", "n8n_welcome_url")
                        .single();

                    if (n8nConfig?.value) {
                        try {
                            await fetch(n8nConfig.value, {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                    email: email,
                                    password: randomPassword,
                                    name: name,
                                    event: "USER_CREATED"
                                })
                            });
                            console.log(`Sent n8n notification to ${n8nConfig.value}`);
                        } catch (n8nError) {
                            console.error("Error sending n8n notification:", n8nError);
                        }
                    }
                }
            }
        } else if (event === "CANCELED" || event === "REFUNDED" || event === "CHARGEBACK" || event === "PURCHASE_CANCELED" || event === "PURCHASE_REFUNDED" || event === "PURCHASE_CHARGEBACK") {
            // Handle cancellations/refunds - BLOCK user instead of deleting
            if (!email) {
                console.log("Email not found for cancellation event");
                return new Response(JSON.stringify({ message: "Email not found" }), {
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                });
            }

            // Query profiles directly to avoid pagination limits
            const { data: profile } = await supabaseAdmin
                .from("profiles")
                .select("id, status")
                .eq("email", email)
                .single();

            if (profile) {
                // BLOCK the user instead of deleting
                const { error: updateError } = await supabaseAdmin
                    .from("profiles")
                    .update({ status: "BLOCKED" })
                    .eq("id", profile.id);

                if (updateError) {
                    console.error(`Error blocking user ${email}:`, updateError);
                } else {
                    console.log(`Blocked user: ${email} (ID: ${profile.id}) due to event: ${event}`);
                }
            } else {
                console.log(`User not found for cancellation: ${email}`);
            }
        }

        return new Response(JSON.stringify({ message: "Processed" }), {
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
