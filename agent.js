const { Resend } = require("resend");

const SECTORS = [
  "pavement maintenance acquisition platform",
  "commercial HVAC electrical contractor roll-up",
  "specialty distribution industrial consolidation",
  "water wastewater environmental services platform",
  "infrastructure maintenance PE-backed",
  "industrial services roll-up new platform formation",
];

const NAMED_COMPANIES = [
  "Pave America",
  "Groundworks",
  "QXO",
  "Kodiak Building Partners",
  "Apex Service Partners",
  "BrightSpring",
  "Inframark",
  "Ascend Safety Collective",
];

async function runAgent() {
  console.log("Running Roll-Up Radar agent...");

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
const prompt = `Today is ${today}. Search for news from the last 48 hours about PE-backed industrial roll-up platforms: new platform formations, acquisitions, capital raises, and executive hires.

Track these companies: ${NAMED_COMPANIES.join(", ")}
Track these sectors: pavement maintenance, commercial HVAC/electrical, specialty distribution, water/wastewater, infrastructure maintenance.

Return ONLY a raw JSON object, no preamble:
{
  "date": "${today}",
  "hot": [{"company":"","sector":"","headline":"","detail":"","why_it_matters":""}],
  "watchlist": [{"company":"","sector":"","note":""}],
  "signal": ""
}

hot = real news last 48hrs only (empty array if none). watchlist = 2-3 companies to monitor. signal = one macro trend sentence.`;


  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2000,
      tools: [{ type: "web_search_20250305", name: "web_search" }],
      messages: [{ role: "user", content: prompt }],
    }),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(`API error: ${JSON.stringify(data)}`);

  const rawText = data.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();

  let brief;
  try {
  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
if (!jsonMatch) throw new Error("No JSON found in response");
const clean = jsonMatch[0];
    brief = JSON.parse(clean);
  } catch (e) {
    console.error("Failed to parse JSON:", rawText);
    throw new Error("Could not parse brief JSON");
  }

  console.log("Brief generated:", JSON.stringify(brief, null, 2));
  await sendEmail(brief);
  console.log("Email sent successfully.");
}

function buildHtml(brief) {
  const hotSection = brief.hot && brief.hot.length > 0
    ? brief.hot.map(item => `
      <div style="background:#fff;border:1px solid #e5e7eb;border-left:4px solid #dc2626;border-radius:6px;padding:16px 20px;margin-bottom:12px;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
          <span style="font-weight:700;font-size:14px;color:#111;">${item.company}</span>
          <span style="background:#f3f4f6;color:#6b7280;font-size:11px;padding:2px 8px;border-radius:99px;">${item.sector}</span>
        </div>
        <p style="font-weight:600;font-size:13px;color:#1f2937;margin:0 0 8px;">${item.headline}</p>
        <p style="font-size:13px;color:#374151;line-height:1.6;margin:0 0 8px;">${item.detail}</p>
        <div style="background:#fef2f2;border-radius:4px;padding:8px 12px;">
          <span style="font-size:12px;font-weight:600;color:#dc2626;">Why it matters: </span>
          <span style="font-size:12px;color:#374151;">${item.why_it_matters}</span>
        </div>
      </div>`).join("")
    : `<div style="background:#f9fafb;border-radius:6px;padding:12px 16px;color:#6b7280;font-size:13px;">Nothing material in the last 48 hours.</div>`;

  const watchlistSection = (brief.watchlist || []).map(item => `
    <div style="display:flex;gap:12px;padding:12px 0;border-bottom:1px solid #f3f4f6;">
      <div style="flex:1;">
        <span style="font-weight:600;font-size:13px;color:#111;">${item.company}</span>
        <span style="background:#eff6ff;color:#2563eb;font-size:11px;padding:2px 8px;border-radius:99px;margin-left:8px;">${item.sector}</span>
        <p style="font-size:13px;color:#374151;margin:4px 0 0;line-height:1.5;">${item.note}</p>
      </div>
    </div>`).join("");

  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:24px 16px;">

    <!-- Header -->
    <div style="background:#111;border-radius:8px 8px 0 0;padding:20px 24px;display:flex;align-items:center;justify-content:space-between;">
      <div>
        <div style="color:#fff;font-size:18px;font-weight:800;letter-spacing:-0.5px;">🏗 Roll-Up Radar</div>
        <div style="color:#9ca3af;font-size:12px;margin-top:2px;">${brief.date}</div>
      </div>
      <div style="color:#6b7280;font-size:11px;">Daily Industrial Intelligence</div>
    </div>

    <!-- Hot Section -->
    <div style="background:#fff;padding:20px 24px;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px;">
        <span style="font-size:16px;">🔥</span>
        <span style="font-weight:700;font-size:14px;color:#111;text-transform:uppercase;letter-spacing:0.5px;">Hot — Last 48hrs</span>
      </div>
      ${hotSection}
    </div>

    <!-- Watchlist Section -->
    <div style="background:#fff;padding:20px 24px;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb;border-top:1px solid #f3f4f6;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px;">
        <span style="font-size:16px;">👀</span>
        <span style="font-weight:700;font-size:14px;color:#111;text-transform:uppercase;letter-spacing:0.5px;">Watchlist</span>
      </div>
      ${watchlistSection}
    </div>

    <!-- Signal Section -->
    <div style="background:#eff6ff;padding:16px 24px;border:1px solid #bfdbfe;border-top:none;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
        <span style="font-size:16px;">📡</span>
        <span style="font-weight:700;font-size:13px;color:#1d4ed8;text-transform:uppercase;letter-spacing:0.5px;">Signal</span>
      </div>
      <p style="font-size:13px;color:#1e3a5f;line-height:1.6;margin:0;">${brief.signal}</p>
    </div>

    <!-- Footer -->
    <div style="background:#fff;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px;padding:12px 24px;text-align:center;">
      <p style="font-size:11px;color:#9ca3af;margin:0;">Roll-Up Radar · Daily PE-backed industrial platform intelligence</p>
    </div>

  </div>
</body>
</html>`;
}

async function sendEmail(brief) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const html = buildHtml(brief);
  const dateStr = brief.date;

  const plainText = [
    `ROLL-UP RADAR — ${dateStr}`,
    "",
    "🔥 HOT:",
    ...(brief.hot || []).map(i => `• ${i.company} | ${i.sector}\n  ${i.headline}\n  ${i.detail}\n  Why it matters: ${i.why_it_matters}`),
    "",
    "👀 WATCHLIST:",
    ...(brief.watchlist || []).map(i => `• ${i.company} | ${i.sector}: ${i.note}`),
    "",
    "📡 SIGNAL:",
    brief.signal,
  ].join("\n");

  const { error } = await resend.emails.send({
    from: "Roll-Up Radar <onboarding@resend.dev>",
    to: process.env.RECIPIENT_EMAIL,
    subject: `🏗 Roll-Up Radar — ${dateStr}`,
    html,
    text: plainText,
  });

  if (error) throw new Error(`Resend error: ${JSON.stringify(error)}`);
}

runAgent().catch((err) => {
  console.error("Agent failed:", err);
  process.exit(1);
});
