/* ===== Stripe Plans ===== */
const STRIPE_PRICE_MAP = {
  unlimited: "price_1RzeCmHnXhjv4E1SL5USlPGo",
  credits:   "price_1Rz2KAHnXhjv4E1Ssth7Uvms",
  pro:       "price_1Rz2K7HnXhjv4E1S9KUxoSXw",
  starter:   "price_1Rz2K5HnXhjv4E1SGHU5s6p0"
};

function supaClient() {
  return window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
}

/* ===== Auth ===== */
function supaClient() {
  return window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
}

function showApp(email) {
  // Hide auth view
  document.getElementById("auth_view").classList.add("hidden");
  // Show app
  const appSection = document.getElementById("app");
  appSection.classList.remove("hidden");
  // Show signed in email
  const badge = document.getElementById("user_badge");
  if (badge) {
    badge.textContent = `Signed in as ${email}`;
    badge.style.display = "block";
  }
  // Scroll smoothly into view
  appSection.scrollIntoView({ behavior: "smooth" });
}

async function signIn() {
  const email = document.getElementById("si_email").value.trim();
  const pass = document.getElementById("si_pass").value;

  const { error } = await supaClient().auth.signInWithPassword({ email, password: pass });
  if (error) {
    document.getElementById("si_msg").textContent = error.message;
  } else {
    showApp(email);
  }
}

async function signUp() {
  const email = document.getElementById("su_email").value.trim();
  const pass = document.getElementById("su_pass").value;

  const { error } = await supaClient().auth.signUp({ email, password: pass });
  if (error) {
    document.getElementById("su_msg").textContent = error.message;
  } else {
    showApp(email);
  }
}

/* ===== SOP Generator ===== */
async function generateSOP() {
  const msg = document.getElementById("app_msg");
  msg.textContent = "Generating SOP...";

  try {
    const sop_title = document.getElementById("sop_title").value.trim();
    const sop_industry = document.getElementById("sop_industry").value.trim();
    const sop_process = document.getElementById("sop_process").value.trim();
    const sop_site = document.getElementById("sop_site").value.trim();

    if (!sop_title) {
      msg.textContent = "Please enter a title.";
      return;
    }

    const r = await fetch("/.netlify/functions/generate-sop", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sop_title, sop_industry, sop_process, sop_site })
    });

    const data = await r.json();
    if (!r.ok) throw new Error(data.error || "Unknown error");

    document.getElementById("preview").textContent = data.sop;
    msg.textContent = "✅ SOP generated!";
  } catch (e) {
    console.error("Generate error", e);
    msg.textContent = "❌ Error generating SOP: " + e.message;
  }
}

/* ===== Export ===== */
function exportPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const sop = document.getElementById("preview").textContent || "No SOP generated";
  doc.text(sop, 10, 10);
  doc.save("sop.pdf");
}

function exportWord() {
  const sop = document.getElementById("preview").textContent || "No SOP generated";
  const blob = new Blob([`<html><body><pre>${sop}</pre></body></html>`], { type: "application/msword" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "sop.doc";
  link.click();
}

/* ===== Stripe Checkout ===== */
async function startCheckout(planKey) {
  const msg = document.getElementById("checkout_msg");
  try {
    msg.textContent = "Creating checkout session...";

    const { data: { user } } = await supaClient().auth.getUser();
    const email = user?.email || null;

    const r = await fetch("/.netlify/functions/create-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        priceId: STRIPE_PRICE_MAP[planKey]
      })
    });

    const data = await r.json();
    if (!r.ok || !data.url) throw new Error(data.error || "Unknown error");

    msg.textContent = "Redirecting to checkout...";
    window.location.href = data.url;
  } catch (e) {
    console.error("Checkout error", e);
    msg.textContent = "Checkout failed: " + (e.message || e);
  }
}

/* ===== Wire Buttons ===== */
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("signin_btn").onclick = signIn;
  document.getElementById("signup_btn").onclick = signUp;
  document.getElementById("ai_btn").onclick = generateSOP;
  document.getElementById("pdf_btn").onclick = exportPDF;
  document.getElementById("word_btn").onclick = exportWord;
});
