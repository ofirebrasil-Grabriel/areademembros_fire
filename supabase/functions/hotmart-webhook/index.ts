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

        // Hotmart sends the token in the header 'h-hotmart-hook-token' or sometimes in the body
        const tokenHeader = req.headers.get("h-hotmart-hook-token");
        const tokenBody = body.hottok; // Legacy/Basic webhook format
        const receivedToken = tokenHeader || tokenBody;

        // 1. Get Config (Hotmart Token)
        const supabaseAdmin = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        const { data: configData } = await supabaseAdmin
            .from("app_config")
            .select("value")
            .eq("key", "hotmart_token")
            .single();

        const configuredToken = configData?.value;

        if (configuredToken && receivedToken !== configuredToken) {
            throw new Error("Invalid Hotmart Token");
        }

        // 2. Parse Event
        // Hotmart payload structure varies (Standard vs Producer). 
        // We look for 'event' or 'status'.
        const event = body.event || body.status;
        const email = body.email || body.data?.buyer?.email;
        const name = body.name || body.data?.buyer?.name;

        if (!email) {
            throw new Error("No email found in payload");
        }

        // Check for Approval events
        const isApproved =
            event === "PURCHASE_APPROVED" ||
            event === "COMPLETED" ||
            event === "APPROVED";

        if (isApproved) {
            // 3. Check if user exists
            const { data: { users }, error: userError } = await supabaseAdmin.auth.admin.listUsers();
            const existingUser = users.find(u => u.email === email);

            if (existingUser) {
                // Update existing user
                await supabaseAdmin
                    .from("profiles")
                    .update({ subscription_status: "active" })
                    .eq("id", existingUser.id);

                console.log(`Updated subscription for existing user: ${email}`);
            } else {
                // Create new user
                // Generate a random password or rely on Invite logic
                const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
                    email: email,
                    email_confirm: true,
                    user_metadata: { full_name: name }
                });

                if (createError) throw createError;

                if (newUser.user) {
                    await supabaseAdmin
                        .from("profiles")
                        .update({ subscription_status: "active" })
                        .eq("id", newUser.user.id);

                    // Send Password Reset / Invite Email
                    await supabaseAdmin.auth.admin.inviteUserByEmail(email);

                    console.log(`Created and invited new user: ${email}`);
                }
            }
        } else if (event === "CANCELED" || event === "REFUNDED") {
            // Handle cancellations
            const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
            const existingUser = users.find(u => u.email === email);

            if (existingUser) {
                await supabaseAdmin
                    .from("profiles")
                    .update({ subscription_status: "inactive" })
                    .eq("id", existingUser.id);
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
