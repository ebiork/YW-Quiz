import React, { useState, useEffect, useRef } from “react”;
import {
ChevronRight,
ArrowLeft,
Check,
Users,
Calendar,
Wallet,
MapPin,
Sparkles,
Phone,
Copy,
MessageCircle,
Mail,
Timer,
Anchor,
Eye,
Wifi,
WifiOff,
Star,
Heart,
} from “lucide-react”;

// ––––– BRAND TOKENS –––––
const c = {
navy: “#0B1120”,
navyLight: “#151C2E”,
navyLine: “#1F2740”,
sand: “#E8A87C”,
sandDark: “#D89065”,
cream: “#F4EFE6”,
mute: “#8892B0”,
muteDim: “#5A6687”,
success: “#7FD1A8”,
};

const font = {
fontFamily:
“‘DM Sans’, -apple-system, BlinkMacSystemFont, ‘Helvetica Neue’, sans-serif”,
};

// ––––– PRICING & AVAILABILITY –––––
const PRICE_ENDPOINT = “https://theyachtweek.com/api/yl/destinations”;
const CORS_PROXY = “”;

const FALLBACK_PRICES = {
croatia: {
priceFrom: 850,
availability: “available”,
weeksLeft: null,
asOf: “2025 rates”,
// Placeholder — paste real TYW Webflow CDN URL here for production.
// Using Unsplash Source API which resolves a keyword to a valid image URL.
heroImage: “https://source.unsplash.com/1400x700/?croatia,sailing,yacht,adriatic”,
},
greece: {
priceFrom: 920,
availability: “available”,
weeksLeft: null,
asOf: “2025 rates”,
heroImage: “https://source.unsplash.com/1400x700/?greece,santorini,sailing,cyclades”,
},
italy: {
priceFrom: 1450,
availability: “limited”,
weeksLeft: null,
asOf: “2025 rates”,
heroImage: “https://source.unsplash.com/1400x700/?sicily,italy,coast,aeolian”,
},
polynesia: {
priceFrom: 3490,
availability: “limited”,
weeksLeft: null,
asOf: “2026 launch”,
heroImage: “https://source.unsplash.com/1400x700/?tahiti,polynesia,lagoon,bora-bora”,
},
};

function normaliseDestinations(payload) {
let list = [];
if (Array.isArray(payload)) list = payload;
else if (Array.isArray(payload?.destinations)) list = payload.destinations;
else if (Array.isArray(payload?.data)) list = payload.data;
else if (payload && typeof payload === “object”) {
list = Object.entries(payload).map(([k, v]) => ({ slug: k, …v }));
}
const out = {};
for (const d of list) {
const raw = (d.slug || d.id || d.name || d.destination || “”).toString().toLowerCase();
let id = null;
if (raw.includes(“croatia”)) id = “croatia”;
else if (raw.includes(“greece”) || raw.includes(“athens”)) id = “greece”;
else if (raw.includes(“italy”) || raw.includes(“sicily”)) id = “italy”;
else if (raw.includes(“polynesia”) || raw.includes(“tahiti”)) id = “polynesia”;
if (!id) continue;
const price =
d.priceFrom ?? d.price_from ?? d.fromPrice ?? d.from_price ?? d.lowestPrice ?? d.minPrice ??
(Array.isArray(d.weeks) ? Math.min(…d.weeks.map((w) => w.priceFrom ?? w.price ?? Infinity)) : null) ??
(d.price && typeof d.price === “object” ? d.price.from : d.price) ?? null;
const weeksArray = d.weeks || d.availability || [];
const availableWeeks = Array.isArray(weeksArray)
? weeksArray.filter((w) => !w.soldOut && !w.sold_out && w.status !== “sold_out” && w.available !== false).length
: null;
let availability = “available”;
if (availableWeeks !== null) {
if (availableWeeks === 0) availability = “sold_out”;
else if (availableWeeks <= 2) availability = “limited”;
}

```
// Try to pick up a hero image from common field names
const heroImage =
  d.heroImage ||
  d.hero_image ||
  d.hero ||
  d.bannerImage ||
  d.banner_image ||
  d.banner ||
  d.image ||
  d.cover ||
  d.coverImage ||
  d.featuredImage ||
  (Array.isArray(d.images) ? d.images[0] : null) ||
  FALLBACK_PRICES[id].heroImage;

out[id] = {
  priceFrom: typeof price === "number" && isFinite(price) ? Math.round(price) : FALLBACK_PRICES[id].priceFrom,
  availability,
  weeksLeft: availableWeeks,
  heroImage,
  asOf: d.asOf || "live",
};
```

}
for (const id of Object.keys(FALLBACK_PRICES)) if (!out[id]) out[id] = FALLBACK_PRICES[id];
return out;
}

async function fetchPrices() {
const url = CORS_PROXY ? `${CORS_PROXY}${encodeURIComponent(PRICE_ENDPOINT)}` : PRICE_ENDPOINT;
try {
const r = await fetch(url, { method: “GET”, headers: { Accept: “application/json” } });
if (!r.ok) throw new Error(`HTTP ${r.status}`);
const data = await r.json();
return {
prices: normaliseDestinations(data),
source: “live”,
asOf: new Date().toLocaleDateString(“en-GB”, { day: “numeric”, month: “short” }),
};
} catch (e) {
console.warn(”[TYW quiz] live pricing failed, using fallback:”, e.message);
return { prices: FALLBACK_PRICES, source: “fallback”, asOf: “2025 rates” };
}
}

// ––––– CALENDLY –––––
const CALENDLY_URL = “https://calendly.com/yachtweek-help”;

function CalendlyEmbed({ prefill, utm, onScheduled }) {
const containerRef = useRef(null);
const [ready, setReady] = useState(false);

// Build the Calendly URL with query params for prefill + UTMs + styling.
// This is more reliable than passing prefill/utm objects to initInlineWidget.
const buildUrl = () => {
const params = new URLSearchParams();
// Styling
params.set(“hide_event_type_details”, “0”);
params.set(“hide_gdpr_banner”, “1”);
params.set(“background_color”, “F4EFE6”);
params.set(“text_color”, “0B1120”);
params.set(“primary_color”, “E8A87C”);
// Prefill
if (prefill?.name) params.set(“name”, prefill.name);
if (prefill?.email) params.set(“email”, prefill.email);
if (prefill?.customAnswers) {
Object.entries(prefill.customAnswers).forEach(([k, v]) => {
if (v) params.set(k, v);
});
}
// UTM
if (utm?.utmSource) params.set(“utm_source”, utm.utmSource);
if (utm?.utmMedium) params.set(“utm_medium”, utm.utmMedium);
if (utm?.utmCampaign) params.set(“utm_campaign”, utm.utmCampaign);
if (utm?.utmContent) params.set(“utm_content”, utm.utmContent);
if (utm?.utmTerm) params.set(“utm_term”, utm.utmTerm);
return `${CALENDLY_URL}?${params.toString()}`;
};

useEffect(() => {
// Inject Calendly CSS once
if (!document.querySelector(‘link[data-calendly=“1”]’)) {
const link = document.createElement(“link”);
link.rel = “stylesheet”;
link.href = “https://assets.calendly.com/assets/external/widget.css”;
link.setAttribute(“data-calendly”, “1”);
document.head.appendChild(link);
}

```
const initWidget = () => {
  if (!window.Calendly || !containerRef.current) return;
  // Clear any prior widget
  containerRef.current.innerHTML = "";
  try {
    window.Calendly.initInlineWidget({
      url: buildUrl(),
      parentElement: containerRef.current,
    });
    setReady(true);
  } catch (err) {
    console.error("[TYW quiz] Calendly widget failed:", err);
  }
};

// Load or reuse the Calendly script
if (window.Calendly) {
  initWidget();
} else {
  let script = document.querySelector('script[data-calendly="1"]');
  if (!script) {
    script = document.createElement("script");
    script.src = "https://assets.calendly.com/assets/external/widget.js";
    script.async = true;
    script.setAttribute("data-calendly", "1");
    document.body.appendChild(script);
  }
  const onLoad = () => initWidget();
  script.addEventListener("load", onLoad);
  // Poll briefly in case script already loaded but no load event fires
  const iv = setInterval(() => {
    if (window.Calendly) {
      clearInterval(iv);
      initWidget();
    }
  }, 150);
  setTimeout(() => clearInterval(iv), 6000);
  // Cleanup
  return () => {
    script?.removeEventListener("load", onLoad);
    clearInterval(iv);
  };
}

// Calendly's scheduled-event postMessage
const handler = (e) => {
  if (
    typeof e.data === "object" &&
    e.data?.event === "calendly.event_scheduled"
  ) {
    onScheduled?.(e.data.payload);
  }
};
window.addEventListener("message", handler);
return () => window.removeEventListener("message", handler);
// eslint-disable-next-line react-hooks/exhaustive-deps
```

}, []);

return (
<div style={{ position: “relative”, borderRadius: 14, overflow: “hidden”, border: `1px solid ${c.navyLine}` }}>
{!ready && (
<div style={{
position: “absolute”,
inset: 0,
display: “flex”,
flexDirection: “column”,
alignItems: “center”,
justifyContent: “center”,
backgroundColor: “#F4EFE6”,
zIndex: 1,
color: c.navy,
}}>
<div style={{
width: 32, height: 32, borderRadius: 999,
border: `2px solid ${c.navy}20`,
borderTopColor: c.sand,
animation: “spin 0.9s linear infinite”,
marginBottom: 12,
}} />
<div style={{ fontSize: 13, color: c.navy + “AA”, …font }}>
Loading calendar…
</div>
</div>
)}
<div
ref={containerRef}
style={{
minWidth: 320,
minHeight: 700,
height: “70vh”,
maxHeight: 900,
backgroundColor: “#F4EFE6”,
}}
/>
</div>
);
}

// ––––– FOUNDER / PERSONALISED WELCOME –––––
// Swap FOUNDER_IMAGE for a real headshot URL (ideally hosted on theyachtweek.com or CDN).
// The quote is the hook that replaces the old “Start” button flow — user lands directly on Q1.
const FOUNDER = {
name: “Erik”,
role: “Co-founder, Yacht Week”,
image: “”, // e.g. “https://cdn.theyachtweek.com/team/erik.jpg”
quote:
“I started Yacht Week with a few mates and a handful of yachts in 2006. Twenty years later, this quiz takes 60 seconds to find your week — whether it’s your first or your fifth.”,
};

const OPENING_TESTIMONIAL = {
quote:
“I almost didn’t book — thought I needed to have a full crew sorted first. Ended up on a yacht with strangers who felt like best friends by day two.”,
name: “Sophy”,
place: “Solo traveller · Croatia 2024”,
};
// ––––– SOCIAL PROOF –––––
// Paraphrased from TYW’s 4.7★ Trustpilot reviews (610+ reviews, 86% 5-star).
// In production, the REVIEWS_ENDPOINT below returns real reviews by destination.
const TESTIMONIALS = [
{ quote: “Best week of my life, full stop. Already planning next year’s crew.”, name: “Hannah”, place: “Croatia · 2024”, destination: “croatia”, rating: 5 },
{ quote: “Our skipper and host made everything seamless. Felt like family by day two.”, name: “Ash”, place: “Croatia · 2024”, destination: “croatia”, rating: 5 },
{ quote: “Amazing people, food, locations, yacht. Couldn’t fault a thing.”, name: “Joseph”, place: “Greece · 2023”, destination: “greece”, rating: 5 },
{ quote: “Didn’t know a soul at the start. Came home with a crew I’ll have forever.”, name: “Sophy”, place: “Croatia · 2023”, destination: “croatia”, rating: 5 },
{ quote: “The parties, the sunsets, the new friendships. Felt like a dream.”, name: “Menzel”, place: “Croatia · 2024”, destination: “croatia”, rating: 5 },
];

// Per-destination fallback reviews — used when the live endpoint isn’t reachable.
// Each paraphrased from public review content. Replace with real reviews in production.
const FALLBACK_REVIEWS_BY_DESTINATION = {
croatia: [
{ quote: “The parties, the sunsets, the new friendships — it felt like a dream. The crew made everything seamless.”, name: “Menzel”, place: “Hvar · Aug 2024”, rating: 5 },
{ quote: “Did the Black Route with 10 mates. Fort George was unreal. Already talking about next year.”, name: “Hannah”, place: “Split–Hvar–Vis · Jul 2024”, rating: 5 },
{ quote: “Our host Iva handled dinner reservations and excursions. We just showed up.”, name: “Ash”, place: “Split · Jun 2024”, rating: 5 },
{ quote: “Went solo and came back with a proper crew. Everyone says it — it really is that.”, name: “Sophy”, place: “Croatia · Aug 2023”, rating: 5 },
{ quote: “The Regatta day. The raft-up. The long lunch on Vis. Every day topped the last.”, name: “Pedro”, place: “Hvar → Vis · Aug 2023”, rating: 5 },
],
greece: [
{ quote: “Cyclades sunsets, island tavernas, total switch-off. Much more scenic than I expected.”, name: “Joseph”, place: “Athens · Jul 2024”, rating: 5 },
{ quote: “Smaller fleet than Croatia, more intimate feel. Perfect for us — we weren’t after the big party scene.”, name: “Elena”, place: “Kea–Kythnos · Aug 2024”, rating: 5 },
{ quote: “Our skipper knew every hidden bay. We barely saw another boat some afternoons.”, name: “Tom”, place: “Saronic · Jul 2023”, rating: 5 },
{ quote: “Food was a highlight. Fresh seafood every night, straight off the boat onto the plate.”, name: “Marta”, place: “Athens · Aug 2023”, rating: 5 },
],
italy: [
{ quote: “Aeolian Islands are the real deal. Stromboli erupting while we ate dinner on deck. Surreal.”, name: “Luca”, place: “Aeolian Islands · Jun 2024”, rating: 5 },
{ quote: “If you want a quieter, more scenic week — this is the one. Croatia’s a different energy.”, name: “Nadine”, place: “Milazzo · Jun 2024”, rating: 5 },
{ quote: “Panarea at night with the whole flotilla together. Hands down the best evening of my year.”, name: “Raphael”, place: “Sicily · Jun 2023”, rating: 5 },
{ quote: “Couples heavy week, which suited us. Italian summer energy is a real thing.”, name: “Claire”, place: “Lipari · Jun 2024”, rating: 5 },
],
polynesia: [
{ quote: “Bucket list week. The colour of the water doesn’t look real in person either.”, name: “Jordan”, place: “Bora Bora · Apr 2024”, rating: 5 },
{ quote: “Worth every cent. Moorea was otherworldly, and the smaller fleet meant we really got to know everyone.”, name: “Anaïs”, place: “Tahiti → Moorea · Apr 2024”, rating: 5 },
{ quote: “The most remote thing I’ve ever done. Felt like we had the Pacific to ourselves.”, name: “Marco”, place: “The Lost Islands · Apr 2023”, rating: 5 },
],
};

// Reviews endpoint — same pattern as pricing, likely hosted on theyachtweek.com.
// Expected to accept ?destination=<slug> and return an array of reviews.
const REVIEWS_ENDPOINT = “https://theyachtweek.com/api/yl/reviews”;

function normaliseReviews(payload) {
let list = [];
if (Array.isArray(payload)) list = payload;
else if (Array.isArray(payload?.reviews)) list = payload.reviews;
else if (Array.isArray(payload?.data)) list = payload.data;
else if (Array.isArray(payload?.items)) list = payload.items;

return list
.map((r) => ({
quote: r.quote || r.text || r.body || r.review || r.comment || “”,
name: r.name || r.author || r.reviewer || r.consumer?.displayName || “Guest”,
place:
r.place ||
r.location ||
[r.route, r.destination, r.year].filter(Boolean).join(” · “) ||
r.date ||
“”,
rating: r.rating || r.stars || r.score || 5,
}))
.filter((r) => r.quote && r.quote.length > 15);
}

async function fetchReviews(destinationSlug, limit = 5) {
const url = `${REVIEWS_ENDPOINT}?destination=${encodeURIComponent(destinationSlug)}&limit=${limit}`;
const target = CORS_PROXY ? `${CORS_PROXY}${encodeURIComponent(url)}` : url;
try {
const r = await fetch(target, { method: “GET”, headers: { Accept: “application/json” } });
if (!r.ok) throw new Error(`HTTP ${r.status}`);
const data = await r.json();
const reviews = normaliseReviews(data).slice(0, limit);
if (reviews.length === 0) throw new Error(“empty”);
return { reviews, source: “live” };
} catch (e) {
console.warn(`[TYW quiz] live reviews for ${destinationSlug} failed, using fallback:`, e.message);
return {
reviews: FALLBACK_REVIEWS_BY_DESTINATION[destinationSlug] || TESTIMONIALS.slice(0, 3),
source: “fallback”,
};
}
}

const TRUST_STATS = [
{ big: “4.7★”, small: “Trustpilot · 610+ reviews” },
{ big: “86%”, small: “5-star reviews” },
{ big: “20 yrs”, small: “Sailing since 2006” },
];

// ––––– ROUTE DATA –––––
const baseRoutes = [
{
id: “croatia”,
name: “Croatia”,
destination: “Croatia”,
emoji: “🇭🇷”,
tagline: “Where Yacht Week began. The Adriatic original — iconic harbours, legendary parties, clear blue water.”,
vibe: “party”,
dates: “30 May – 5 Sep”,
months: [“may”, “jun”, “jul”, “aug”, “sep”],
duration: “7 nights”,
groupFit: [“solo”, “couple”, “friends”, “mixed”],
highlight: “Split → Hvar → Vis → Split”,
},
{
id: “greece”,
name: “Athens, Greece”,
destination: “Greece”,
emoji: “🇬🇷”,
tagline: “A Mediterranean odyssey. Historic coastlines by day, sun-drenched party stops by night.”,
vibe: “balanced”,
dates: “4 Jul – 8 Aug”,
months: [“jul”, “aug”],
duration: “7 nights”,
groupFit: [“solo”, “couple”, “friends”, “mixed”],
highlight: “Athens → Kea → Kythnos → Athens”,
},
{
id: “italy”,
name: “Sicily, Italy”,
destination: “Italy”,
emoji: “🇮🇹”,
tagline: “The Aeolian Islands. Volcanic drama, long lunches, unmistakable Italian summer energy.”,
vibe: “chill”,
dates: “6 – 27 Jun”,
months: [“jun”],
duration: “7 nights”,
groupFit: [“couple”, “friends”, “mixed”],
highlight: “Milazzo → Stromboli → Panarea → Lipari”,
},
{
id: “polynesia”,
name: “French Polynesia”,
destination: “Polynesia”,
emoji: “🌺”,
tagline: “The Lost Islands. A bucket-list week through crystal lagoons and remote Tahitian paradise.”,
vibe: “luxury”,
dates: “11 – 18 Apr”,
months: [“apr”],
duration: “7 nights”,
groupFit: [“couple”, “friends”, “mixed”],
highlight: “Tahiti → Moorea → Taha’a → Bora Bora”,
},
];

function hydrateRoutes(prices) {
return baseRoutes.map((r) => ({
…r,
priceFrom: prices[r.id]?.priceFrom ?? 0,
availability: prices[r.id]?.availability ?? “available”,
weeksLeft: prices[r.id]?.weeksLeft ?? null,
heroImage: prices[r.id]?.heroImage ?? FALLBACK_PRICES[r.id]?.heroImage,
}));
}

// ––––– QUIZ QUESTIONS (6, was 7) –––––
// Group + size merged. Opens emotionally. Affirmation interstitial after Q3.
const questions = [
{
id: “group”,
title: “Who’s coming with you?”,
subtitle: “No crew yet? No problem — we match solo travellers into full yachts.”,
icon: Users,
options: [
{ value: “solo”, label: “Just me — for now”, hint: “We’ll match you with a crew” },
{ value: “couple”, label: “Me + 1”, hint: “Couple or best friend” },
{ value: “friends”, label: “A small crew (3–5)”, hint: “You’re building it out” },
{ value: “mixed”, label: “A full yacht (6+)”, hint: “Ready to fill 8–10 spots” },
],
},
{
id: “vibe”,
title: “What’s the week meant to feel like?”,
subtitle: “Pick the closest. Most routes blend a bit of everything.”,
icon: Sparkles,
options: [
{ value: “party”, label: “Big energy”, hint: “Parties, crowd, sundown sets” },
{ value: “chill”, label: “Slow & scenic”, hint: “Anchorages, long lunches” },
{ value: “adventure”, label: “Active”, hint: “Swim, dive, explore” },
{ value: “luxury”, label: “Elevated”, hint: “Premium food, quieter crowd” },
{ value: “balanced”, label: “A bit of everything”, hint: “Mix it up” },
],
},
{
id: “timing”,
title: “When are you thinking?”,
subtitle: “Each route runs in a specific window. Flexible opens up more options.”,
icon: Calendar,
options: [
{ value: “apr”, label: “April”, hint: “Polynesia only — 11–18 Apr” },
{ value: “jun”, label: “June”, hint: “Sicily + Croatia” },
{ value: “jul”, label: “July”, hint: “Croatia + Greece” },
{ value: “aug”, label: “August”, hint: “Croatia + Greece” },
{ value: “sep”, label: “September”, hint: “Croatia only” },
{ value: “flexible”, label: “Flexible”, hint: “Suggest the best week” },
],
},
// ↑ Affirmation interstitial fires here (after Q3)
{
id: “budget”,
title: “Budget per person”,
subtitle: “From-rates, before extras. We’ll tailor the boat + add-ons to fit.”,
icon: Wallet,
options: [
{ value: “800”, label: “€800–1,100”, hint: “Entry / cabin” },
{ value: “1200”, label: “€1,200–1,600”, hint: “Standard yacht” },
{ value: “1800”, label: “€1,800–2,400”, hint: “Premium” },
{ value: “3000”, label: “€3,000+”, hint: “Luxury / Polynesia” },
{ value: “unsure”, label: “Not sure yet”, hint: “Show me options” },
],
},
{
id: “destination”,
title: “Where’s calling you?”,
subtitle: “Pick a favourite or stay open — we’ll match on vibe.”,
icon: MapPin,
options: [
{ value: “croatia”, label: “Croatia 🇭🇷”, hint: “Where it all started · May–Sep” },
{ value: “greece”, label: “Athens, Greece 🇬🇷”, hint: “Mediterranean odyssey · Jul–Aug” },
{ value: “italy”, label: “Sicily, Italy 🇮🇹”, hint: “Aeolian Islands · June” },
{ value: “polynesia”, label: “French Polynesia 🌺”, hint: “The Lost Islands · April” },
{ value: “open”, label: “Surprise me”, hint: “Open to suggestion” },
],
},
{
id: “experience”,
title: “Done this before?”,
subtitle: “No sailing experience needed — every yacht has a skipper option.”,
icon: Anchor,
options: [
{ value: “first”, label: “First Yacht Week”, hint: “Welcome aboard” },
{ value: “been”, label: “Been once”, hint: “Back for more” },
{ value: “returning”, label: “Veteran crew”, hint: “3+ years in” },
],
},
];

const AFFIRMATION_AFTER_Q = 2; // show after answering question index 2 (Q3: timing)

// ––––– MATCHING –––––
function matchRoutes(answers, routes) {
const scored = routes.map((r) => {
let s = 0;
if (answers.destination && answers.destination !== “open”) {
if (r.destination.toLowerCase() === answers.destination) s += 40;
} else {
s += 10;
}
if (answers.vibe && r.vibe === answers.vibe) s += 25;
if (answers.vibe === “balanced”) s += 8;
if (answers.group && r.groupFit.includes(answers.group)) s += 15;
if (answers.timing && answers.timing !== “flexible”) {
if (r.months.includes(answers.timing)) s += 20;
else s -= 35;
}
const budgetNum = parseInt(answers.budget) || 1500;
const priceDiff = Math.abs(r.priceFrom - budgetNum);
s += Math.max(0, 15 - priceDiff / 200);
if (r.availability === “sold_out”) s -= 60;
if (r.availability === “limited”) s -= 5;
return { …r, score: s };
});
return scored.sort((a, b) => b.score - a.score);
}

// ––––– SHARED UI –––––
const Container = ({ children }) => (

  <div style={{ ...font, backgroundColor: c.navy, color: c.cream, minHeight: "100vh" }} className="w-full">
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');
      .btn-primary:hover { background-color: ${c.sandDark}; transform: translateY(-1px); }
      .btn-ghost:hover { border-color: ${c.sand}; color: ${c.sand}; }
      .option-card:hover { border-color: ${c.sand}40; background-color: ${c.navyLight}; }
      .option-card.selected { border-color: ${c.sand}; background-color: ${c.sand}15; }
      .grid-bg {
        background-image:
          linear-gradient(${c.navyLine} 1px, transparent 1px),
          linear-gradient(90deg, ${c.navyLine} 1px, transparent 1px);
        background-size: 48px 48px;
      }
      .fade-in { animation: fade 0.4s ease-out; }
      @keyframes fade { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      .pulse { animation: pulse 1.6s ease-in-out infinite; }
      @keyframes pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 1; } }
    `}</style>
    {children}
  </div>
);

const Button = ({ children, onClick, variant = “primary”, disabled, full, small }) => {
const base = {
fontWeight: 500, borderRadius: 999,
padding: small ? “10px 20px” : “14px 28px”,
fontSize: small ? 14 : 15, letterSpacing: 0.2,
cursor: disabled ? “not-allowed” : “pointer”,
transition: “all 0.2s ease”,
width: full ? “100%” : “auto”,
display: “inline-flex”, alignItems: “center”, justifyContent: “center”,
gap: 8, border: “1px solid transparent”, opacity: disabled ? 0.5 : 1,
};
const styles = {
primary: { backgroundColor: c.sand, color: c.navy, border: “none” },
ghost: { backgroundColor: “transparent”, color: c.cream, border: `1px solid ${c.navyLine}` },
dark: { backgroundColor: c.navyLight, color: c.cream, border: `1px solid ${c.navyLine}` },
};
return (
<button onClick={onClick} disabled={disabled} className={variant === “primary” ? “btn-primary” : “btn-ghost”} style={{ …base, …styles[variant] }}>
{children}
</button>
);
};

const ProgressBar = ({ progress }) => (

  <div style={{ height: 2, backgroundColor: c.navyLine, width: "100%", borderRadius: 2 }}>
    <div style={{ height: "100%", backgroundColor: c.sand, width: `${progress * 100}%`, transition: "width 0.4s ease", borderRadius: 2 }} />
  </div>
);

const PriceSourceBadge = ({ source, asOf }) => (

  <div style={{
    display: "inline-flex", alignItems: "center", gap: 6,
    fontSize: 10,
    color: source === "live" ? c.success : c.muteDim,
    backgroundColor: source === "live" ? c.success + "12" : c.navyLight,
    padding: "4px 8px", borderRadius: 999,
    border: `1px solid ${source === "live" ? c.success + "40" : c.navyLine}`,
    letterSpacing: 0.5,
  }}>
    {source === "live" ? <Wifi size={10} /> : <WifiOff size={10} />}
    {source === "live" ? `LIVE · ${asOf || "now"}` : `STATIC · ${asOf || "indicative"}`}
  </div>
);

const AvailabilityPill = ({ route }) => {
if (!route) return null;
const map = {
available: { label: “Available”, fg: c.success },
limited: { label: route.weeksLeft != null ? `Only ${route.weeksLeft} weeks left` : “Limited”, fg: c.sand },
sold_out: { label: “Sold out”, fg: c.muteDim },
};
const m = map[route.availability] || map.available;
return (
<span style={{
display: “inline-flex”, alignItems: “center”, gap: 6,
fontSize: 10, fontWeight: 500, color: m.fg,
backgroundColor: m.fg + “15”,
border: `1px solid ${m.fg}40`,
padding: “4px 8px”, borderRadius: 999, letterSpacing: 0.5,
}}>
<span style={{ width: 6, height: 6, borderRadius: 999, backgroundColor: m.fg, display: “inline-block” }} />
{m.label.toUpperCase()}
</span>
);
};

const StarRow = ({ n = 5 }) => (

  <div style={{ display: "flex", gap: 2 }}>
    {Array.from({ length: n }).map((_, i) => (
      <Star key={i} size={12} fill={c.sand} color={c.sand} />
    ))}
  </div>
);

const TestimonialCard = ({ t }) => (

  <div style={{
    padding: 16, borderRadius: 12,
    border: `1px solid ${c.navyLine}`, backgroundColor: c.navyLight + "80",
  }}>
    <StarRow n={t.rating} />
    <p style={{ fontSize: 14, lineHeight: 1.55, color: c.cream, margin: "10px 0" }}>
      "{t.quote}"
    </p>
    <div style={{ fontSize: 12, color: c.muteDim, letterSpacing: 0.3 }}>
      — {t.name} · {t.place}
    </div>
  </div>
);

// Destination-dynamic reviews block shown on the results page
const ReviewsModule = ({ reviewsState, destinationName }) => {
if (reviewsState.loading) {
return (
<div style={{
padding: 24, borderRadius: 16,
border: `1px solid ${c.navyLine}`,
backgroundColor: c.navyLight + “40”,
textAlign: “center”,
}}>
<div className=“pulse” style={{ fontSize: 13, color: c.muteDim, letterSpacing: 0.5 }}>
Loading {destinationName} reviews…
</div>
</div>
);
}

const { reviews, source } = reviewsState;
if (!reviews || reviews.length === 0) return null;

return (
<div style={{ marginBottom: 24 }}>
<div style={{
display: “flex”,
justifyContent: “space-between”,
alignItems: “center”,
marginBottom: 16,
gap: 12,
flexWrap: “wrap”,
}}>
<div>
<div style={{ fontSize: 11, letterSpacing: 3, color: c.sand, fontWeight: 500, marginBottom: 4 }}>
WHAT PEOPLE SAY
</div>
<div style={{ fontSize: 18, fontWeight: 400, color: c.cream, letterSpacing: -0.3 }}>
From the <span style={{ fontStyle: “italic” }}>{destinationName}</span> fleet
</div>
</div>
<div style={{ display: “flex”, alignItems: “center”, gap: 6 }}>
<StarRow />
<span style={{ fontSize: 12, color: c.mute }}>4.7 · 610+ reviews</span>
</div>
</div>

```
  {/* Horizontal scroll on mobile, 2-col grid on desktop */}
  <div style={{
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: 12,
  }}>
    {reviews.slice(0, 4).map((r, i) => (
      <TestimonialCard key={i} t={r} />
    ))}
  </div>

  {source === "fallback" && (
    <div style={{ fontSize: 10, color: c.muteDim, marginTop: 10, letterSpacing: 0.5, textAlign: "right" }}>
      Showing curated reviews — live feed unavailable
    </div>
  )}
</div>
```

);
};

// ––––– MAIN APP –––––
export default function App() {
const [step, setStep] = useState(“welcome”);
const [qIndex, setQIndex] = useState(0);
const [answers, setAnswers] = useState({});
const [contact, setContact] = useState({ name: “”, email: “”, phone: “” });
const [reservation, setReservation] = useState(null);
const [crewRsvps, setCrewRsvps] = useState([]);
const [view, setView] = useState(“lead”);
const [copied, setCopied] = useState(false);
const [priceState, setPriceState] = useState({
loading: true, source: “fallback”, asOf: null, prices: FALLBACK_PRICES,
});
const [reviewsState, setReviewsState] = useState({
loading: false, source: “fallback”, reviews: [], destination: null,
});

useEffect(() => {
let mounted = true;
fetchPrices().then((res) => {
if (mounted) {
setPriceState({ loading: false, source: res.source, asOf: res.asOf, prices: res.prices });
}
});
return () => { mounted = false; };
}, []);

const routes = hydrateRoutes(priceState.prices);
const matches = step !== “welcome” ? matchRoutes(answers, routes) : [];
const primary = matches[0];
const runner = matches[1];

// Fetch reviews when a primary match appears (results, calendly, booked screens)
useEffect(() => {
if (!primary?.id) return;
if (reviewsState.destination === primary.id) return;
setReviewsState((s) => ({ …s, loading: true }));
fetchReviews(primary.id, 5).then((res) => {
setReviewsState({
loading: false,
source: res.source,
reviews: res.reviews,
destination: primary.id,
});
});
}, [primary?.id, reviewsState.destination]);

// Countdown
const [timeLeft, setTimeLeft] = useState(””);
useEffect(() => {
if (!reservation) return;
const tick = () => {
const diff = reservation - Date.now();
if (diff <= 0) { setTimeLeft(“Expired”); return; }
const h = Math.floor(diff / 3600000);
const m = Math.floor((diff % 3600000) / 60000);
const s = Math.floor((diff % 60000) / 1000);
setTimeLeft(`${h}h ${m}m ${s}s`);
};
tick();
const i = setInterval(tick, 1000);
return () => clearInterval(i);
}, [reservation]);

// Loading screen rotating messages
const loadingMessages = [
“Matching your vibe to the right route…”,
“Checking live availability…”,
“Preparing your personalised week…”,
];
const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
const [testimonialIdx, setTestimonialIdx] = useState(0);
useEffect(() => {
if (step !== “loading”) return;
const msgIv = setInterval(() => setLoadingMsgIdx((i) => (i + 1) % loadingMessages.length), 1100);
const tIv = setInterval(() => setTestimonialIdx((i) => (i + 1) % TESTIMONIALS.length), 2400);
const finish = setTimeout(() => setStep(“results”), 3600);
return () => { clearInterval(msgIv); clearInterval(tIv); clearTimeout(finish); };
}, [step]);

// Progress calculation — 6 questions + 1 affirmation = 7 steps
const totalSteps = questions.length + 1;
let currentStepNum = 0;
if (step === “question”) currentStepNum = qIndex < AFFIRMATION_AFTER_Q + 1 ? qIndex + 1 : qIndex + 2;
if (step === “affirmation”) currentStepNum = AFFIRMATION_AFTER_Q + 2;

const answer = (val) => {
const q = questions[qIndex];
setAnswers({ …answers, [q.id]: val });
setTimeout(() => {
if (qIndex === AFFIRMATION_AFTER_Q) {
setStep(“affirmation”);
} else if (qIndex < questions.length - 1) {
setQIndex(qIndex + 1);
} else {
setStep(“email-gate”);
}
}, 280);
};

const continueFromAffirmation = () => {
setQIndex(AFFIRMATION_AFTER_Q + 1);
setStep(“question”);
};

const reserveBoat = () => {
setReservation(Date.now() + 48 * 3600 * 1000);
setStep(“crew-invite”);
};

const inviteMsg = primary
? `Found our Yacht Week — ${primary.name}, ${primary.destination} ${primary.emoji}. Think: ${primary.tagline.split(".")[0].toLowerCase()}. From €${primary.priceFrom}/person for the week. Boat's held for 48h — need 9 of us to lock it in. You in? → tyw.co/crew/sv-aurora`
: “”;

const copyInvite = () => {
navigator.clipboard?.writeText(inviteMsg);
setCopied(true);
setTimeout(() => setCopied(false), 2000);
};

const addRsvp = (status) => {
const names = [“Freya”, “Marcus”, “Noor”, “Diego”, “Sofia”, “Jamal”];
const pool = names.filter((n) => !crewRsvps.find((r) => r.name === n));
const name = pool[Math.floor(Math.random() * pool.length)] || “Alex”;
setCrewRsvps([…crewRsvps, { name, status, at: new Date() }]);
};

// ============ WELCOME — now lives inside Q1 as FounderIntro, so we auto-skip ============
if (step === “welcome”) {
// Land directly on Q1. The personalised welcome is rendered inside the question step.
setStep(“question”);
return null;
}

// ============ QUESTIONS ============
if (step === “question”) {
const q = questions[qIndex];
const Icon = q.icon;
const isFirstQuestion = qIndex === 0;
return (
<Container>
<div style={{ maxWidth: 640, margin: “0 auto”, padding: “24px” }}>
{/* Top nav — hidden on first-question landing to keep the experience pristine */}
{!isFirstQuestion && (
<div style={{ display: “flex”, alignItems: “center”, justifyContent: “space-between”, marginBottom: 32, gap: 16 }}>
<button
onClick={() => {
if (qIndex === AFFIRMATION_AFTER_Q + 1) setStep(“affirmation”);
else if (qIndex > 0) setQIndex(qIndex - 1);
}}
style={{ background: “none”, border: “none”, color: c.mute, cursor: “pointer”, display: “flex”, alignItems: “center”, gap: 6, fontSize: 14, padding: 4 }}
>
<ArrowLeft size={16} /> Back
</button>
<div style={{ flex: 1, maxWidth: 360 }}>
<ProgressBar progress={currentStepNum / totalSteps} />
</div>
<div style={{ fontSize: 12, color: c.muteDim, letterSpacing: 1 }}>
{currentStepNum}/{totalSteps}
</div>
</div>
)}

```
      {/* Founder intro — only on first question */}
      {isFirstQuestion && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <div style={{ letterSpacing: 4, fontSize: 11, color: c.mute, fontWeight: 500 }}>YACHT WEEK</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ fontSize: 11, color: c.muteDim, letterSpacing: 1 }}>
                1 / {totalSteps}
              </div>
              <button
                onClick={() => setView(view === "lead" ? "crew" : "lead")}
                style={{ fontSize: 10, color: c.muteDim, background: "none", border: `1px solid ${c.navyLine}`, padding: "4px 8px", borderRadius: 999, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
              >
                <Eye size={10} /> {view === "lead" ? "Lead" : "Crew"}
              </button>
            </div>
          </div>

          {/* Progress — thin, sits at top */}
          <div style={{ marginBottom: 32 }}>
            <ProgressBar progress={1 / totalSteps} />
          </div>

          {/* Founder card */}
          <div className="fade-in" style={{
            display: "flex",
            gap: 16,
            padding: 20,
            borderRadius: 16,
            backgroundColor: c.navyLight,
            border: `1px solid ${c.navyLine}`,
            marginBottom: 28,
            alignItems: "flex-start",
          }}>
            {/* Avatar */}
            <div style={{
              width: 56,
              height: 56,
              borderRadius: 999,
              backgroundColor: c.sand + "20",
              border: `2px solid ${c.sand}`,
              flexShrink: 0,
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundImage: FOUNDER.image ? `url(${FOUNDER.image})` : undefined,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}>
              {!FOUNDER.image && (
                <div style={{ fontSize: 22, fontWeight: 500, color: c.sand, ...font }}>
                  {FOUNDER.name.charAt(0)}
                </div>
              )}
            </div>
            {/* Quote */}
            <div style={{ flex: 1 }}>
              <p style={{
                fontSize: 15,
                lineHeight: 1.55,
                color: c.cream,
                margin: 0,
                fontStyle: "italic",
                marginBottom: 8,
              }}>
                "{FOUNDER.quote}"
              </p>
              <div style={{ fontSize: 12, color: c.muteDim, letterSpacing: 0.3 }}>
                <span style={{ color: c.cream, fontWeight: 500 }}>{FOUNDER.name}</span>
                {" — "}{FOUNDER.role}
              </div>
            </div>
          </div>
        </>
      )}

      <div className="fade-in" key={q.id}>
        {!isFirstQuestion && (
          <div style={{ width: 44, height: 44, borderRadius: 999, backgroundColor: c.sand + "15", border: `1px solid ${c.sand}30`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
            <Icon size={20} color={c.sand} />
          </div>
        )}
        <h2 style={{ fontSize: isFirstQuestion ? "clamp(26px, 4.5vw, 34px)" : "clamp(28px, 5vw, 40px)", fontWeight: 400, lineHeight: 1.15, letterSpacing: -0.5, marginBottom: 12 }}>
          {q.title}
        </h2>
        <p style={{ fontSize: 15, color: c.mute, marginBottom: 24, lineHeight: 1.5 }}>{q.subtitle}</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {q.options.map((opt) => {
            const selected = answers[q.id] === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => answer(opt.value)}
                className={`option-card ${selected ? "selected" : ""}`}
                style={{ textAlign: "left", padding: "18px 20px", borderRadius: 14, border: `1px solid ${c.navyLine}`, backgroundColor: c.navyLight + "80", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", transition: "all 0.2s ease", color: c.cream, ...font }}
              >
                <div>
                  <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 2 }}>{opt.label}</div>
                  <div style={{ fontSize: 13, color: c.muteDim }}>{opt.hint}</div>
                </div>
                {selected ? <Check size={18} color={c.sand} /> : <ChevronRight size={16} color={c.muteDim} />}
              </button>
            );
          })}
        </div>

        {/* Testimonial + trust under first question — Pia-style */}
        {isFirstQuestion && (
          <div style={{ marginTop: 32 }}>
            <div style={{
              padding: 16,
              borderLeft: `2px solid ${c.sand}`,
              backgroundColor: c.navyLight + "40",
              borderRadius: "0 8px 8px 0",
              marginBottom: 20,
            }}>
              <p style={{ fontSize: 14, lineHeight: 1.55, color: c.cream, margin: "0 0 8px 0", fontStyle: "italic" }}>
                "{OPENING_TESTIMONIAL.quote}"
              </p>
              <div style={{ fontSize: 12, color: c.muteDim, letterSpacing: 0.3 }}>
                — {OPENING_TESTIMONIAL.name} · {OPENING_TESTIMONIAL.place}
              </div>
            </div>

            <div style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 14,
              paddingTop: 16,
              borderTop: `1px solid ${c.navyLine}`,
              flexWrap: "wrap",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <StarRow />
                <span style={{ fontSize: 11, color: c.mute }}>4.7 on Trustpilot</span>
              </div>
              <div style={{ width: 1, height: 12, backgroundColor: c.navyLine }} />
              <div style={{ fontSize: 11, color: c.mute }}>610+ reviews</div>
              <div style={{ width: 1, height: 12, backgroundColor: c.navyLine }} />
              <div style={{ fontSize: 11, color: c.mute }}>60 seconds</div>
            </div>

            <div style={{ marginTop: 16, display: "flex", justifyContent: "center" }}>
              <PriceSourceBadge source={priceState.source} asOf={priceState.asOf} />
            </div>
          </div>
        )}
      </div>
    </div>
  </Container>
);
```

}

// ============ AFFIRMATION (mid-quiz) ============
if (step === “affirmation”) {
return (
<Container>
<div style={{ maxWidth: 640, margin: “0 auto”, padding: “24px” }}>
<div style={{ display: “flex”, alignItems: “center”, justifyContent: “space-between”, marginBottom: 32, gap: 16 }}>
<button
onClick={() => { setQIndex(AFFIRMATION_AFTER_Q); setStep(“question”); }}
style={{ background: “none”, border: “none”, color: c.mute, cursor: “pointer”, display: “flex”, alignItems: “center”, gap: 6, fontSize: 14, padding: 4 }}
>
<ArrowLeft size={16} /> Back
</button>
<div style={{ flex: 1, maxWidth: 360 }}>
<ProgressBar progress={currentStepNum / totalSteps} />
</div>
<div style={{ fontSize: 12, color: c.muteDim, letterSpacing: 1 }}>
{currentStepNum}/{totalSteps}
</div>
</div>

```
      <div className="fade-in">
        <div style={{ width: 44, height: 44, borderRadius: 999, backgroundColor: c.sand + "15", border: `1px solid ${c.sand}30`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
          <Heart size={20} color={c.sand} />
        </div>

        <div style={{ fontSize: 11, letterSpacing: 3, color: c.sand, fontWeight: 500, marginBottom: 16 }}>
          GOOD NEWS
        </div>
        <h2 style={{ fontSize: "clamp(32px, 5vw, 44px)", fontWeight: 300, letterSpacing: -0.8, lineHeight: 1.1, marginBottom: 20 }}>
          We've got your week.
        </h2>
        <p style={{ fontSize: 16, color: c.mute, lineHeight: 1.6, marginBottom: 32 }}>
          Based on what you've told us, there's a route that fits. Solo or group, chilled or big energy, flexible or locked-in dates — we've sailed every combination across Croatia, Greece, Sicily and Polynesia.
        </p>

        {/* Trust stats */}
        <div style={{
          padding: 20, borderRadius: 16,
          backgroundColor: c.navyLight,
          border: `1px solid ${c.navyLine}`,
          marginBottom: 24,
        }}>
          <div style={{ fontSize: 11, letterSpacing: 2, color: c.muteDim, marginBottom: 14 }}>
            YACHT WEEK IN NUMBERS
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
            {TRUST_STATS.map((s) => (
              <div key={s.small}>
                <div style={{ fontSize: 22, fontWeight: 300, color: c.sand }}>{s.big}</div>
                <div style={{ fontSize: 11, color: c.muteDim, letterSpacing: 0.3, lineHeight: 1.4 }}>{s.small}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Single testimonial */}
        <div style={{ marginBottom: 32 }}>
          <TestimonialCard t={TESTIMONIALS[0]} />
        </div>

        <Button onClick={continueFromAffirmation}>
          Continue — last few questions <ChevronRight size={16} />
        </Button>
      </div>
    </div>
  </Container>
);
```

}

// ============ EMAIL GATE (before results) ============
if (step === “email-gate”) {
const valid = contact.name.trim() && /\S+@\S+.\S+/.test(contact.email);
return (
<Container>
<div style={{ maxWidth: 520, margin: “0 auto”, padding: “32px 24px” }}>
<button
onClick={() => { setQIndex(questions.length - 1); setStep(“question”); }}
style={{ background: “none”, border: “none”, color: c.mute, cursor: “pointer”, display: “flex”, alignItems: “center”, gap: 6, fontSize: 14, marginBottom: 32, padding: 4 }}
>
<ArrowLeft size={16} /> Back
</button>

```
      <div style={{ fontSize: 11, letterSpacing: 3, color: c.sand, fontWeight: 500, marginBottom: 16 }}>
        ALMOST THERE
      </div>
      <h2 style={{ fontSize: "clamp(28px, 5vw, 40px)", fontWeight: 400, letterSpacing: -0.5, lineHeight: 1.15, marginBottom: 12 }}>
        Where should we send your match?
      </h2>
      <p style={{ color: c.mute, marginBottom: 32, lineHeight: 1.55, fontSize: 15 }}>
        Your route, pricing, and next steps. We'll email a copy so you can come back to it — and optionally book a 15-min call with a concierge.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
        {[
          { label: "First name", key: "name", type: "text", placeholder: "Erik" },
          { label: "Email", key: "email", type: "email", placeholder: "you@domain.com" },
          { label: "Phone (optional)", key: "phone", type: "tel", placeholder: "+46 70 123 45 67" },
        ].map((f) => (
          <div key={f.key}>
            <label style={{ fontSize: 12, color: c.muteDim, letterSpacing: 1, display: "block", marginBottom: 6 }}>
              {f.label.toUpperCase()}
            </label>
            <input
              type={f.type}
              placeholder={f.placeholder}
              value={contact[f.key]}
              onChange={(e) => setContact({ ...contact, [f.key]: e.target.value })}
              style={{ width: "100%", padding: "14px 16px", backgroundColor: c.navyLight, border: `1px solid ${c.navyLine}`, borderRadius: 10, color: c.cream, fontSize: 15, outline: "none", ...font }}
              onFocus={(e) => (e.target.style.borderColor = c.sand)}
              onBlur={(e) => (e.target.style.borderColor = c.navyLine)}
            />
          </div>
        ))}
      </div>

      <Button full disabled={!valid} onClick={() => setStep("loading")}>
        See my match <ChevronRight size={16} />
      </Button>

      <div style={{ fontSize: 12, color: c.muteDim, marginTop: 16, textAlign: "center", lineHeight: 1.5 }}>
        We'll only use this to help you book. No spam.
      </div>

      {/* Trust footer */}
      <div style={{
        marginTop: 32, paddingTop: 24,
        borderTop: `1px solid ${c.navyLine}`,
        display: "flex", justifyContent: "center",
        alignItems: "center", gap: 16,
        flexWrap: "wrap",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <StarRow />
          <span style={{ fontSize: 12, color: c.mute }}>4.7 on Trustpilot</span>
        </div>
        <div style={{ width: 1, height: 16, backgroundColor: c.navyLine }} />
        <div style={{ fontSize: 12, color: c.mute }}>610+ reviews</div>
      </div>
    </div>
  </Container>
);
```

}

// ============ LOADING (social proof) ============
if (step === “loading”) {
return (
<Container>
<div style={{ maxWidth: 520, margin: “0 auto”, padding: “80px 24px”, textAlign: “center” }}>
<div style={{
width: 56, height: 56, borderRadius: 999,
border: `2px solid ${c.navyLine}`,
borderTopColor: c.sand,
margin: “0 auto 32px”,
animation: “spin 1s linear infinite”,
}} />
<style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

```
      <div className="pulse" style={{ minHeight: 28, marginBottom: 8 }}>
        <div style={{ fontSize: 16, color: c.cream, fontWeight: 400 }}>
          {loadingMessages[loadingMsgIdx]}
        </div>
      </div>
      <div style={{ fontSize: 13, color: c.muteDim, marginBottom: 48 }}>
        Hang tight, {contact.name.split(" ")[0]}.
      </div>

      {/* Rotating testimonial */}
      <div style={{ marginBottom: 32, textAlign: "left" }}>
        <div className="fade-in" key={testimonialIdx}>
          <TestimonialCard t={TESTIMONIALS[testimonialIdx]} />
        </div>
      </div>

      <div style={{ fontSize: 11, letterSpacing: 2, color: c.muteDim, marginBottom: 12 }}>
        EVERY YEAR, THOUSANDS SAIL WITH US
      </div>
      <div style={{ display: "flex", justifyContent: "center", gap: 24 }}>
        {TRUST_STATS.map((s) => (
          <div key={s.small}>
            <div style={{ fontSize: 18, fontWeight: 400, color: c.sand }}>{s.big}</div>
            <div style={{ fontSize: 10, color: c.muteDim, letterSpacing: 0.3 }}>{s.small}</div>
          </div>
        ))}
      </div>
    </div>
  </Container>
);
```

}

// ============ RESULTS ============
if (step === “results”) {
return (
<Container>
<div style={{ maxWidth: 720, margin: “0 auto”, padding: “32px 24px” }}>
<div style={{ display: “flex”, alignItems: “center”, justifyContent: “space-between”, marginBottom: 16, gap: 12, flexWrap: “wrap” }}>
<div style={{ fontSize: 11, letterSpacing: 3, color: c.sand, fontWeight: 500 }}>
{contact.name ? `${contact.name.split(" ")[0].toUpperCase()}'S MATCH` : “YOUR MATCH”}
</div>
<PriceSourceBadge source={priceState.source} asOf={priceState.asOf} />
</div>
<h2 style={{ fontSize: “clamp(32px, 5vw, 44px)”, fontWeight: 300, letterSpacing: -0.8, lineHeight: 1.1, marginBottom: 32 }}>
We’d put you on <span style={{ color: c.sand, fontStyle: “italic” }}>{primary.name}</span>.
</h2>

```
      <div style={{ borderRadius: 20, border: `1px solid ${c.navyLine}`, overflow: "hidden", marginBottom: 16, backgroundColor: c.navyLight }}>
        {/* Hero image */}
        <div style={{
          position: "relative",
          height: 260,
          backgroundColor: c.navyLine,
          backgroundImage: `linear-gradient(135deg, ${c.sand}30, ${c.navy})`,
          borderBottom: `1px solid ${c.navyLine}`,
          overflow: "hidden",
        }}>
          {primary.heroImage && (
            <img
              src={primary.heroImage}
              alt={primary.name}
              loading="eager"
              onError={(e) => { e.currentTarget.style.display = "none"; }}
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
              }}
            />
          )}
          {/* Gradient overlay for legibility */}
          <div style={{
            position: "absolute",
            inset: 0,
            background: `linear-gradient(to top, ${c.navy} 0%, ${c.navy}00 50%, ${c.navy}40 100%)`,
          }} />
          {/* Flag + country badge top-left */}
          <div style={{
            position: "absolute",
            top: 16, left: 16,
            display: "flex", alignItems: "center", gap: 8,
            padding: "6px 12px",
            backgroundColor: c.navy + "CC",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            borderRadius: 999,
            border: `1px solid ${c.navyLine}`,
            fontSize: 12,
            color: c.cream,
            letterSpacing: 0.5,
          }}>
            <span style={{ fontSize: 14 }}>{primary.emoji}</span>
            <span style={{ fontWeight: 500 }}>{primary.destination}</span>
          </div>
          {/* Availability pill top-right */}
          <div style={{ position: "absolute", top: 16, right: 16 }}>
            <AvailabilityPill route={primary} />
          </div>
        </div>
        <div style={{ padding: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 12, gap: 16 }}>
            <div>
              <div style={{ fontSize: 11, letterSpacing: 2, color: c.muteDim, marginBottom: 4 }}>
                {primary.dates.toUpperCase()}
              </div>
              <h3 style={{ fontSize: 24, fontWeight: 500, marginBottom: 4 }}>{primary.name}</h3>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div style={{ fontSize: 11, color: c.muteDim, letterSpacing: 1 }}>FROM</div>
              <div style={{ fontSize: 20, fontWeight: 500, color: c.sand }}>€{primary.priceFrom.toLocaleString()}</div>
              <div style={{ fontSize: 11, color: c.muteDim }}>per person</div>
            </div>
          </div>
          <p style={{ color: c.mute, lineHeight: 1.55, marginBottom: 16, fontSize: 15 }}>{primary.tagline}</p>
          <div style={{ fontSize: 13, color: c.cream, padding: 12, backgroundColor: c.navy, borderRadius: 8, border: `1px solid ${c.navyLine}`, fontFamily: "monospace", letterSpacing: 0.5 }}>
            {primary.highlight}
          </div>
        </div>
      </div>

      {runner && (
        <div style={{ display: "flex", alignItems: "center", gap: 16, padding: 0, borderRadius: 14, border: `1px solid ${c.navyLine}`, marginBottom: 32, backgroundColor: c.navyLight + "60", overflow: "hidden" }}>
          {/* Runner hero thumbnail */}
          <div style={{
            width: 100,
            height: 100,
            flexShrink: 0,
            backgroundImage: runner.heroImage ? `url(${runner.heroImage})` : `linear-gradient(135deg, ${c.sand}30, ${c.navy})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            position: "relative",
          }}>
            <div style={{
              position: "absolute",
              bottom: 6, left: 6,
              fontSize: 14,
              textShadow: "0 2px 8px rgba(0,0,0,0.5)",
            }}>
              {runner.emoji}
            </div>
          </div>
          <div style={{ flex: 1, padding: "12px 16px 12px 0" }}>
            <div style={{ fontSize: 11, color: c.muteDim, letterSpacing: 1.5 }}>ALSO A STRONG FIT</div>
            <div style={{ fontSize: 15, fontWeight: 500 }}>{runner.name}</div>
            <div style={{ fontSize: 13, color: c.mute, marginTop: 2 }}>from €{runner.priceFrom.toLocaleString()} · {runner.dates}</div>
          </div>
        </div>
      )}

      {/* CTAs — no more email gates, we have the info */}
      <div style={{ padding: 24, borderRadius: 16, backgroundColor: c.navyLight, border: `1px solid ${c.sand}30`, marginBottom: 24 }}>
        <div style={{ fontSize: 15, marginBottom: 16, color: c.cream }}>Two ways to lock this in 👇</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Button full onClick={() => setStep("calendly-schedule")}>
            <Phone size={16} /> Book a 15-min concierge call
          </Button>
          <Button full variant="dark" onClick={reserveBoat}>
            <Users size={16} /> Reserve boat 48h & invite crew
          </Button>
        </div>
        <div style={{ fontSize: 12, color: c.muteDim, marginTop: 16, textAlign: "center", lineHeight: 1.5 }}>
          No card needed. Reserve holds the boat so your friends can RSVP before pricing moves.
        </div>
      </div>

      {/* Destination-specific reviews */}
      <ReviewsModule
        reviewsState={reviewsState}
        destinationName={primary.destination}
      />

      <button
        onClick={() => { setQIndex(0); setAnswers({}); setContact({ name: "", email: "", phone: "" }); setStep("welcome"); }}
        style={{ background: "none", border: "none", color: c.muteDim, fontSize: 13, cursor: "pointer", textDecoration: "underline", textDecorationColor: c.navyLine }}
      >
        Start over
      </button>
    </div>
  </Container>
);
```

}

// ============ CALENDLY SCHEDULE ============
if (step === “calendly-schedule”) {
return (
<Container>
<div style={{ maxWidth: 820, margin: “0 auto”, padding: “24px” }}>
<button
onClick={() => setStep(“results”)}
style={{ background: “none”, border: “none”, color: c.mute, cursor: “pointer”, display: “flex”, alignItems: “center”, gap: 6, fontSize: 14, marginBottom: 24, padding: 4 }}
>
<ArrowLeft size={16} /> Back
</button>

```
      <div style={{ fontSize: 11, letterSpacing: 3, color: c.sand, fontWeight: 500, marginBottom: 12 }}>
        PICK A TIME · {primary.destination.toUpperCase()} CONCIERGE
      </div>
      <h2 style={{ fontSize: "clamp(26px, 4vw, 36px)", fontWeight: 400, letterSpacing: -0.5, lineHeight: 1.15, marginBottom: 8 }}>
        Find a 15-min slot that works, {contact.name.split(" ")[0]}.
      </h2>
      <p style={{ color: c.mute, lineHeight: 1.55, marginBottom: 24, fontSize: 14 }}>
        Zoom or phone — your call. Invite lands at <span style={{ color: c.cream }}>{contact.email}</span>.
      </p>

      <CalendlyEmbed
        prefill={{
          name: contact.name, email: contact.email,
          customAnswers: {
            a1: `Matched route: ${primary.name}`,
            a2: `Phone: ${contact.phone || "not given"}`,
            a3: `Vibe: ${answers.vibe || "n/a"} · Group: ${answers.group || "n/a"} · Budget: ${answers.budget || "n/a"} · Timing: ${answers.timing || "n/a"}`,
          },
        }}
        utm={{
          utmSource: "tyw-quiz",
          utmMedium: "concierge-call",
          utmCampaign: `route-${primary.id}`,
          utmContent: `${answers.vibe || "any"}-${answers.group || "any"}-${answers.budget || "any"}`,
          utmTerm: answers.timing || "flexible",
        }}
        onScheduled={() => setStep("concierge-booked")}
      />
    </div>
  </Container>
);
```

}

// ============ CONCIERGE BOOKED ============
if (step === “concierge-booked”) {
return (
<Container>
<div style={{ maxWidth: 520, margin: “0 auto”, padding: “80px 24px”, textAlign: “center” }}>
<div style={{ width: 64, height: 64, borderRadius: 999, backgroundColor: c.sand + “20”, border: `1px solid ${c.sand}`, display: “flex”, alignItems: “center”, justifyContent: “center”, margin: “0 auto 24px” }}>
<Check size={28} color={c.sand} />
</div>
<h2 style={{ fontSize: 32, fontWeight: 400, letterSpacing: -0.5, marginBottom: 12 }}>
You’re booked in, {contact.name.split(” “)[0]}.
</h2>
<p style={{ color: c.mute, lineHeight: 1.6, marginBottom: 32, fontSize: 16 }}>
Calendar invite heading to <span style={{ color: c.cream }}>{contact.email}</span>. Our {primary.destination} concierge will jump on with a proposal for <span style={{ color: c.cream }}>{primary.name}</span>.
</p>
<div style={{ display: “flex”, flexDirection: “column”, gap: 10 }}>
<Button onClick={reserveBoat}>Also reserve the boat & invite crew</Button>
<Button variant=“ghost” onClick={() => { setQIndex(0); setAnswers({}); setContact({ name: “”, email: “”, phone: “” }); setStep(“welcome”); }}>
Start over
</Button>
</div>
</div>
</Container>
);
}

// ============ CREW INVITE ============
if (step === “crew-invite” && view === “lead”) {
const filled = crewRsvps.filter((r) => r.status === “in”).length + 1;
return (
<Container>
<div style={{ maxWidth: 720, margin: “0 auto”, padding: “24px” }}>
<div style={{ display: “flex”, alignItems: “center”, gap: 12, padding: “14px 18px”, borderRadius: 12, backgroundColor: c.sand + “12”, border: `1px solid ${c.sand}40`, marginBottom: 32 }}>
<Timer size={18} color={c.sand} />
<div style={{ flex: 1 }}>
<div style={{ fontSize: 13, color: c.sand, fontWeight: 500 }}>Boat reserved · {timeLeft} left</div>
<div style={{ fontSize: 12, color: c.muteDim }}>{primary.name} · {primary.dates} · {filled}/10 spots filled</div>
</div>
<button onClick={() => setView(“crew”)} style={{ background: “none”, border: `1px solid ${c.navyLine}`, color: c.mute, fontSize: 11, padding: “6px 10px”, borderRadius: 999, cursor: “pointer”, display: “flex”, alignItems: “center”, gap: 4 }}>
<Eye size={11} /> Crew view
</button>
</div>

```
      <div style={{ fontSize: 11, letterSpacing: 3, color: c.sand, fontWeight: 500, marginBottom: 16 }}>
        STEP 2 OF 2 · INVITE YOUR CREW
      </div>
      <h2 style={{ fontSize: "clamp(28px, 4.5vw, 40px)", fontWeight: 300, letterSpacing: -0.5, lineHeight: 1.1, marginBottom: 12 }}>
        Get 9 friends in. <span style={{ color: c.sand, fontStyle: "italic" }}>Fast.</span>
      </h2>
      <p style={{ color: c.mute, lineHeight: 1.6, marginBottom: 32, fontSize: 15 }}>
        Send this to your group chat. Each friend gets a link to RSVP — you'll see the crew form in real time.
      </p>

      <div style={{ padding: 20, borderRadius: 14, backgroundColor: c.navyLight, border: `1px solid ${c.navyLine}`, marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: c.muteDim, letterSpacing: 2, marginBottom: 10 }}>YOUR MESSAGE</div>
        <div style={{ fontSize: 14, lineHeight: 1.6, color: c.cream, whiteSpace: "pre-wrap", padding: 14, backgroundColor: c.navy, borderRadius: 8, border: `1px solid ${c.navyLine}` }}>
          {inviteMsg}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 8, marginBottom: 24 }}>
        {[
          { label: "WhatsApp", icon: MessageCircle, tone: "primary" },
          { label: "iMessage", icon: MessageCircle, tone: "dark" },
          { label: "Email", icon: Mail, tone: "dark" },
          { label: copied ? "Copied" : "Copy link", icon: Copy, tone: "dark", onClick: copyInvite },
        ].map((s) => {
          const IconEl = s.icon;
          return (
            <button key={s.label} onClick={s.onClick} style={{ padding: "14px", borderRadius: 10, border: `1px solid ${c.navyLine}`, backgroundColor: s.tone === "primary" ? c.sand : c.navyLight, color: s.tone === "primary" ? c.navy : c.cream, fontSize: 13, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, ...font }}>
              <IconEl size={14} /> {s.label}
            </button>
          );
        })}
      </div>

      <div style={{ padding: 20, borderRadius: 14, border: `1px solid ${c.navyLine}`, backgroundColor: c.navyLight + "60", marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 13, color: c.muteDim, letterSpacing: 1.5 }}>YOUR CREW · {filled}/10</div>
          <div style={{ fontSize: 12, color: c.sand }}>{filled >= 7 ? "🔥 Almost full" : `${10 - filled} spots left`}</div>
        </div>
        <div style={{ height: 4, backgroundColor: c.navy, borderRadius: 2, overflow: "hidden", marginBottom: 16 }}>
          <div style={{ height: "100%", backgroundColor: c.sand, width: `${(filled / 10) * 100}%`, transition: "width 0.4s ease" }} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 8, backgroundColor: c.sand + "15" }}>
            <div style={{ width: 28, height: 28, borderRadius: 999, backgroundColor: c.sand, color: c.navy, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600, fontSize: 12 }}>
              {contact.name.charAt(0) || "Y"}
            </div>
            <div style={{ flex: 1, fontSize: 14 }}>{contact.name || "You"} (lead)</div>
            <div style={{ fontSize: 11, color: c.sand }}>✓ In</div>
          </div>
          {crewRsvps.map((r, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 8, backgroundColor: c.navy }}>
              <div style={{ width: 28, height: 28, borderRadius: 999, backgroundColor: c.navyLine, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600, fontSize: 12, color: c.cream }}>
                {r.name.charAt(0)}
              </div>
              <div style={{ flex: 1, fontSize: 14 }}>{r.name}</div>
              <div style={{ fontSize: 11, color: r.status === "in" ? c.sand : r.status === "maybe" ? c.mute : c.muteDim }}>
                {r.status === "in" ? "✓ In" : r.status === "maybe" ? "Maybe" : "Out"}
              </div>
            </div>
          ))}
          {crewRsvps.length < 6 && (
            <div style={{ fontSize: 12, color: c.muteDim, textAlign: "center", padding: "8px 0", fontStyle: "italic" }}>Waiting on RSVPs…</div>
          )}
        </div>
      </div>

      <div style={{ padding: 14, borderRadius: 10, border: `1px dashed ${c.navyLine}`, fontSize: 11, color: c.muteDim }}>
        <div style={{ marginBottom: 8, letterSpacing: 1 }}>DEMO · SIMULATE CREW RESPONSES</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <Button small variant="dark" onClick={() => addRsvp("in")}>+ Friend says "in"</Button>
          <Button small variant="dark" onClick={() => addRsvp("maybe")}>+ Friend says "maybe"</Button>
          <Button small variant="dark" onClick={() => setCrewRsvps([])}>Reset</Button>
        </div>
      </div>
    </div>
  </Container>
);
```

}

// ============ CREW VIEW ============
if (view === “crew”) {
const filled = crewRsvps.filter((r) => r.status === “in”).length + 1;
const leadName = contact.name || “Erik”;
return (
<Container>
<div style={{ maxWidth: 560, margin: “0 auto”, padding: “24px” }}>
<div style={{ display: “flex”, justifyContent: “space-between”, alignItems: “center”, marginBottom: 32 }}>
<div style={{ letterSpacing: 4, fontSize: 11, color: c.mute, fontWeight: 500 }}>YACHT WEEK</div>
<button onClick={() => setView(“lead”)} style={{ background: “none”, border: `1px solid ${c.navyLine}`, color: c.mute, fontSize: 11, padding: “6px 10px”, borderRadius: 999, cursor: “pointer”, display: “flex”, alignItems: “center”, gap: 4 }}>
<Eye size={11} /> Lead view
</button>
</div>

```
      {reservation && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 999, backgroundColor: c.sand + "12", border: `1px solid ${c.sand}40`, marginBottom: 24, fontSize: 12, color: c.sand, width: "fit-content" }}>
          <Timer size={14} /> Reservation ends in {timeLeft}
        </div>
      )}

      {primary && (
        <>
          <div style={{ fontSize: 14, color: c.mute, marginBottom: 8 }}>
            <strong style={{ color: c.cream }}>{leadName}</strong> invited you to a yacht.
          </div>
          <div style={{ borderRadius: 20, overflow: "hidden", border: `1px solid ${c.navyLine}`, marginBottom: 20 }}>
            <div style={{
              position: "relative",
              height: 200,
              backgroundImage: primary.heroImage ? `url(${primary.heroImage})` : `linear-gradient(135deg, ${c.sand}30, ${c.navy})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}>
              <div style={{
                position: "absolute", inset: 0,
                background: `linear-gradient(to top, ${c.navy} 0%, ${c.navy}00 60%)`,
              }} />
              <div style={{
                position: "absolute", top: 16, left: 16,
                display: "flex", alignItems: "center", gap: 8,
                padding: "6px 12px",
                backgroundColor: c.navy + "CC",
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
                borderRadius: 999,
                border: `1px solid ${c.navyLine}`,
                fontSize: 12, color: c.cream, letterSpacing: 0.5,
              }}>
                <span style={{ fontSize: 14 }}>{primary.emoji}</span>
                <span style={{ fontWeight: 500 }}>{primary.destination}</span>
              </div>
            </div>
            <div style={{ padding: 20, backgroundColor: c.navyLight }}>
              <div style={{ fontSize: 11, letterSpacing: 2, color: c.muteDim, marginBottom: 4 }}>
                {primary.destination.toUpperCase()} · {primary.dates.toUpperCase()}
              </div>
              <h3 style={{ fontSize: 24, fontWeight: 500, marginBottom: 8 }}>{primary.name}</h3>
              <p style={{ color: c.mute, fontSize: 14, lineHeight: 1.55, marginBottom: 16 }}>{primary.tagline}</p>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 16, borderTop: `1px solid ${c.navyLine}` }}>
                <div>
                  <div style={{ fontSize: 11, color: c.muteDim, letterSpacing: 1 }}>YOUR SHARE FROM</div>
                  <div style={{ fontSize: 22, fontWeight: 500, color: c.sand }}>€{primary.priceFrom.toLocaleString()}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 11, color: c.muteDim, letterSpacing: 1 }}>CREW</div>
                  <div style={{ fontSize: 22, fontWeight: 500 }}>{filled}/10</div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      <div style={{ padding: 20, borderRadius: 14, backgroundColor: c.navyLight, border: `1px solid ${c.navyLine}`, marginBottom: 16 }}>
        <div style={{ fontSize: 16, marginBottom: 4, fontWeight: 500 }}>You in?</div>
        <div style={{ fontSize: 13, color: c.muteDim, marginBottom: 16, lineHeight: 1.5 }}>
          Soft commit. No payment yet — just letting {leadName.split(" ")[0]} know where you stand.
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <Button full onClick={() => addRsvp("in")}>✓ I'm in</Button>
          <Button full variant="dark" onClick={() => addRsvp("maybe")}>Maybe — tell me more</Button>
          <Button full variant="ghost" onClick={() => addRsvp("out")}>Can't make it</Button>
        </div>
      </div>

      <div style={{ fontSize: 12, color: c.muteDim, textAlign: "center", lineHeight: 1.6 }}>
        Tap "Lead view" in the top right to see how {leadName.split(" ")[0]} experiences your RSVP.
      </div>
    </div>
  </Container>
);
```

}

return null;
}
