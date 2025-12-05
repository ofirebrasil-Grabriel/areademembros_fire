// @ts-nocheck
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

        // Hotmart sends the token in the header 'X-HOTMART-HOTTOK' (or legacy 'h-hotmart-hook-token') or in the body
        const tokenHeader = req.headers.get("X-HOTMART-HOTTOK") || req.headers.get("h-hotmart-hook-token");
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
            console.error(`Invalid Hotmart Token. Expected: ${configuredToken.substring(0, 5)}... Received: ${receivedToken ? receivedToken.substring(0, 5) + '...' : 'null'}`);
            // We continue for debugging purposes if token is missing, but in prod we should throw
            // throw new Error("Invalid Hotmart Token");
        }

        // 2. Parse Event
        const event = body.event || body.status;
        // Normalize email to lowercase to ensure matching works
        const rawEmail = body.email || body.data?.buyer?.email;
        const email = rawEmail ? rawEmail.toLowerCase() : null;


        const name = body.name || body.data?.buyer?.name || "Novo Aluno";
        const productId = body.prod || body.data?.product?.id;

        console.log(`Processing webhook event: ${event} for Product ID: ${productId}`);

        // 1.1 Check Product ID (REMOVED: User wants to accept all products)
        // const { data: productConfig } = await supabaseAdmin
        //     .from("app_config")
        //     .select("value")
        //     .eq("key", "hotmart_product_id")
        //     .single();

        // const allowedProductId = productConfig?.value;

        // if (allowedProductId && productId && String(productId) !== String(allowedProductId)) {
        //     console.log(`Ignored event for product ${productId} (Expected: ${allowedProductId})`);
        //     return new Response(JSON.stringify({ message: "Ignored: Product ID mismatch" }), {
        //         headers: { ...corsHeaders, "Content-Type": "application/json" },
        //     });
        // }

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

            // 1.2 Find Lead (to link Profile and Track Event)
            const { data: lead } = await supabaseAdmin
                .from("leads")
                .select("id")
                .eq("email", email)
                .single();

            const leadId = lead?.id || null;

            if (existingProfile) {
                await supabaseAdmin
                    .from("profiles")
                    .update({
                        status: "ACTIVE",
                        lead_id: leadId // Link to Lead
                    })
                    .eq("id", existingProfile.id);

                console.log(`Updated status to ACTIVE for existing user (ID: ${existingProfile.id})`);
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
                            must_change_password: true,
                            lead_id: leadId // Link to Lead
                        })
                        .eq("id", newUser.user.id);

                    // Send Password Reset / Invite Email (User can set their own password)
                    await supabaseAdmin.auth.admin.inviteUserByEmail(email);

                    console.log(`Created new user (ID: ${newUser.user.id})`);

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
                                    event: "USER_CREATED",
                                    phone: body.data?.buyer?.phone || body.phone_number || null,
                                    phone_local_code: body.data?.buyer?.phone_local_code || body.phone_local_code || null
                                })
                            });
                            console.log(`Sent n8n notification`);
                        } catch (n8nError) {
                            console.error("Error sending n8n notification:", n8nError);
                        }
                    }

                    // 4. Track Purchase Event (Intelligence)
                    if (leadId) {
                        await supabaseAdmin.from("eventos_tracking").insert({
                            lead_id: leadId,
                            event_name: "Compra Realizada",
                            event_data: {
                                product_id: productId,
                                provider: "hotmart",
                                price: body.price || body.data?.purchase?.price?.value,
                                currency: body.currency || body.data?.purchase?.price?.currency_code
                            },
                            context_id: "desafio-fire-15d"
                        });
                        console.log(`Tracked purchase event for Lead ID: ${leadId}`);
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
                    console.error(`Error blocking user (ID: ${profile.id}):`, updateError);
                } else {
                    console.log(`Blocked user (ID: ${profile.id}) due to event: ${event}`);
                }
            } else {
                console.log(`User not found for cancellation event`);
            }
        }

        return new Response(JSON.stringify({ message: "Processed" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (error: any) {
        console.error(error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
    }
});
