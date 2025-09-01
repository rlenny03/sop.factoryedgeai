// netlify/functions/stripe-webhook.js
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE // IMPORTANT: service role, not anon
);

exports.handler = async (event) => {
  const sig = event.headers["stripe-signature"];

  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    const stripeEvent = stripe.webhooks.constructEvent(event.body, sig, webhookSecret);

    if (stripeEvent.type === "checkout.session.completed") {
      const session = stripeEvent.data.object;

      // Extract email & priceId
      const email = session.customer_email;
      const priceId = session.line_items?.[0]?.price || session.metadata?.priceId;

      // Map Stripe PriceId → Plan key
      const PLAN_MAP = {
        "price_1RzeCmHnXhjv4E1SL5USlPGo": "unlimited",
        "price_1Rz2KAHnXhjv4E1Ssth7Uvms": "credits-3",
        "price_1Rz2K7HnXhjv4E1S9KUxoSXw": "pro",
        "price_1Rz2K5HnXhjv4E1SGHU5s6p0": "starter"
      };
      const plan = PLAN_MAP[priceId] || "unknown";

      console.log("✔ Stripe checkout completed:", email, plan);

      // 1. Ensure profile exists
      let { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", email)
        .single();

      if (!profile) {
        const { data: newProfile, error: pErr } = await supabase
          .from("profiles")
          .insert({ email })
          .select("id")
          .single();
        if (pErr) throw pErr;
        profile = newProfile;
      }

      // 2. Insert subscription row
      const { error: sErr } = await supabase.from("subscriptions").insert({
        user_id: profile.id,
        plan
      });
      if (sErr) throw sErr;
    }

    return { statusCode: 200, body: JSON.stringify({ received: true }) };
  } catch (err) {
    console.error("❌ Webhook error:", err);
    return { statusCode: 400, body: `Webhook Error: ${err.message}` };
  }
};
