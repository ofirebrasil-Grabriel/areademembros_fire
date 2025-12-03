import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@12.0.0?target=deno";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        // 1. Create Supabase Client
        const supabaseClient = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_ANON_KEY") ?? "",
            { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
        );

        // 2. Get User
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) throw new Error("User not found");

        // 3. Get App Config (Stripe Key)
        // Note: In a real scenario, we might want to use the Service Role to get this if RLS blocks it, 
        // but we set RLS to allow admins. Wait, this function runs as the user (via Auth header).
        // So we might need Service Role to fetch config if it's admin-only.
        // Let's use Service Role for fetching config to be safe.
        const supabaseAdmin = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        const { data: configData } = await supabaseAdmin
            .from("app_config")
            .select("value")
            .eq("key", "stripe_secret_key")
            .single();

        const stripeKey = configData?.value || Deno.env.get("STRIPE_SECRET_KEY");

        if (!stripeKey) {
            throw new Error("Stripe Secret Key not configured");
        }

        const stripe = new Stripe(stripeKey, {
            apiVersion: "2022-11-15",
            httpClient: Stripe.createFetchHttpClient(),
        });

        // 4. Get or Create Stripe Customer
        const { data: profile } = await supabaseAdmin
            .from("profiles")
            .select("stripe_customer_id, email")
            .eq("id", user.id)
            .single();

        let customerId = profile?.stripe_customer_id;

        if (!customerId) {
            const customer = await stripe.customers.create({
                email: user.email,
                metadata: { supabase_uid: user.id },
            });
            customerId = customer.id;
            await supabaseAdmin
                .from("profiles")
                .update({ stripe_customer_id: customerId })
                .eq("id", user.id);
        }

        // 5. Create Checkout Session
        const { priceId, successUrl, cancelUrl } = await req.json();

        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            line_items: [
                {
                    price: priceId, // e.g. 'price_123...'
                    quantity: 1,
                },
            ],
            mode: "subscription",
            success_url: successUrl,
            cancel_url: cancelUrl,
        });

        return new Response(
            JSON.stringify({ url: session.url }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
    }
});
