import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://lvunwfscdkpuwjuaqgmt.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2dW53ZnNjZGtwdXdqdWFxZ210Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDEwODcxMSwiZXhwIjoyMDc5Njg0NzExfQ.fhKsdsLetV0nHrubNGNgeAg2Z6EaJJKXdeOFLYk-3Hk';
const HOTMART_TOKEN = 'XQR8h3LDtwWp5BXtN3kE1JrJL67NQJ35228164';
const WEBHOOK_URL = `${SUPABASE_URL}/functions/v1/hotmart-webhook`;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function runTest() {
    console.log("🚀 Starting E2E Test: Funil -> Webhook -> Access");

    const testEmail = `test_e2e_${Date.now()}@gmail.com`;
    const testName = "Test User E2E";

    // 1. Simulate Lead Capture (Funil VF)
    console.log(`\n1️⃣  Simulating Lead Capture for: ${testEmail}`);
    const { data: lead, error: leadError } = await supabase
        .from('leads')
        .insert({
            nome: testName,
            email: testEmail,
            status: 'novo',
            context_id: 'desafio-fire-15d'
        })
        .select()
        .single();

    if (leadError) {
        console.error("❌ Error creating lead:", leadError);
        // If RLS blocks insert, we might need to skip this step or ask for Service Role Key.
        // But usually leads table is open for inserts.
        return;
    }
    console.log("✅ Lead created with ID:", lead.id);

    // 2. Simulate Hotmart Webhook (Purchase)
    console.log(`\n2️⃣  Simulating Hotmart Purchase Webhook...`);
    const payload = {
        event: "PURCHASE_APPROVED",
        hottok: HOTMART_TOKEN,
        prod: 12345, // Random product ID (since we removed the check)
        email: testEmail,
        name: testName,
        data: {
            buyer: {
                email: testEmail,
                name: testName,
                phone: "5511999999999",
                phone_local_code: "11"
            },
            purchase: {
                price: { value: 197.00, currency_code: "BRL" }
            }
        }
    };

    const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    const responseData = await response.json();
    console.log("Webhook Response:", response.status, responseData);

    if (response.status !== 200) {
        console.error("❌ Webhook failed!");
        return;
    }
    console.log("✅ Webhook processed successfully.");

    // 3. Verify Data (Access & Tracking)
    console.log(`\n3️⃣  Verifying System State...`);

    // Wait a bit for async processing
    await new Promise(r => setTimeout(r, 2000));

    // Check Profile
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', testEmail)
        .single();

    if (profileError) {
        console.error("❌ Profile not found:", profileError);
    } else {
        console.log("✅ Profile found:", profile.id);
        console.log(`   - Status: ${profile.status}`);
        console.log(`   - Lead ID Linked: ${profile.lead_id} (Expected: ${lead.id})`);

        if (String(profile.lead_id) === String(lead.id)) {
            console.log("   🌟 SUCCESS: Profile is correctly linked to Lead!");
        } else {
            console.error("   ❌ FAILURE: Profile is NOT linked to Lead.");
        }
    }

    // Check Tracking Event
    const { data: events, error: eventError } = await supabase
        .from('eventos_tracking')
        .select('*')
        .eq('lead_id', lead.id)
        .eq('event_name', 'Compra Realizada');

    if (eventError) {
        console.error("❌ Error fetching events:", eventError);
    } else {
        if (events && events.length > 0) {
            console.log("✅ Tracking Event found:", events[0].event_name);
            console.log("   - Data:", events[0].event_data);
            console.log("   🌟 SUCCESS: Purchase event tracked!");
        } else {
            console.error("❌ FAILURE: No 'Compra Realizada' event found for this lead.");
        }
    }
}

runTest();
