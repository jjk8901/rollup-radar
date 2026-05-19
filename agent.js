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
];

async function runAgent() {
  console.log("Running Roll-Up Radar agent...");

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const prompt = `Today is ${today}. You are a deal intelligence analyst tracking early-stage PE-backed industrial roll-up platforms — companies in the mold of Pave America, Groundworks, or early XPO/United Waste.

Search the web for the latest news (last 24-48 hours) across these sectors:
${SECTORS.map((s) => `- ${s}`).join("\n")}

Also search specifically for recent news about these named companies:
${NAMED_COMPANIES.map((c) => `- ${c}`).join("\n")}

Additionally scan these high-value sources for relevant deal activity:
- PE Hub, Axios Pro Rata, Pitchbook News
- Business Wire and PR Newswire (PE platform announcements)
- ENR (Engineering News-Record) for contractor roll-ups
- Trade publications: Waste360, ACHR News (HVAC), WaterWorld

Look specifically for:
- New platform formations (PE firm + operator teaming up to consolidate a sector)
- Fresh PE capital raises or recapitalizations for existing platforms
- Acquisition announcements by industrial roll-up platforms
- New executive hires (CEO, COO, Chief of Staff, Head of Strategy, Head of Value Creation) at these companies
- Any "announcing our partnership with [PE firm]" press releases

Format your response as a clean daily brief with this EXACT structure:

ROLL-UP RADAR - ${today}

HOT (material news in last 24-48hrs):
[If any] - COMPANY | SECTOR | What happened | Why it matters

WATCHLIST (companies to keep eyes on today):
[Always include 2-3] - COMPANY | SECTOR | What to watch for

SIGNAL (one broader trend or theme worth noting):
[1-2 sentences on a macro pattern across the space]

Keep the whole brief under 450 words. Be specific - no filler, no generic observations. If a section has nothing real to report, say "Nothing material today" rather than inventing news.`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1500,
      tools: [
        {
          type: "web_search_20250305",
          name: "web_search",
        },
      ],
      messages: [{ role: "user", content: prompt }],
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`Anthropic API error: ${JSON.stringify(data)}`);
  }

  const briefText = data.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("\n");

  console.log("Brief generated:\n", briefText);

  await sendEmail(briefText, today);
  console.log("Email sent successfully.");
}

async function sendEmail(brief, dateStr) {
  const resend = new Resend(process.env.RESEND_API_KEY);

  const lines = brief.split("\n");
  let html = `<div style="max-width:600px;margin:0 auto;padding:24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#fff;">`;

  for (const line of lines) {
    if (line.startsWith("ROLL-UP RADAR")) {
      html += `<h2 style="font-size:18px;font-weight:700;color:#111;border-bottom:2px solid #2563eb;padding-bottom:8px;margin-bottom:20px;">${line}</h2>`;
    } else if (line.startsWith("HOT") || line.startsWith("WATCHLIST") || line.startsWith("SIGNAL")) {
      html += `<h3 style="font-size:14px;font-weight:700;color:#374151;margin:20px 0 8px;">${line}</h3>`;
    } else if (line.startsWith("-")) {
      const content = line.slice(1).trim();
      const parts = content.split("|").map((p) => p.trim());
      if (parts.length >= 3) {
        html += `<div style="border-left:3px solid #2563eb;padding:8px 12px;margin:8px 0;background:#f8fafc;">
          <strong style="color:#111;font-size:13px;">${parts[0]}</strong>
          <span style="color:#6b7280;font-size:12px;margin-left:8px;">${parts[1]}</span>
          <p style="margin:4px 0 0;font-size:13px;color:#374151;line-height:1.5;">${parts.slice(2).join(" | ")}</p>
        </div>`;
      } else {
        html += `<p style="font-size:13px;color:#374151;margin:6px 0;padding-left:12px;">- ${content}</p>`;
      }
    } else if (line.trim() === "") {
      html += `<div style="height:4px;"></div>`;
    } else {
      html += `<p style="font-size:13px;color:#374151;line-height:1.6;margin:6px 0;">${line}</p>`;
    }
  }

  html += `<hr style="margin-top:32px;border:none;border-top:1px solid #e5e7eb;"/>
    <p style="font-size:11px;color:#9ca3af;margin-top:8px;">Roll-Up Radar - Daily industrial platform intelligence</p>
  </div>`;

  const { error } = await resend.emails.send({
    from: "Roll-Up Radar <onboarding@resend.dev>",
    to: process.env.RECIPIENT_EMAIL,
    subject: `Roll-Up Radar - ${dateStr}`,
    html,
    text: brief,
  });

  if (error) {
    throw new Error(`Resend error: ${JSON.stringify(error)}`);
  }
}

runAgent().catch((err) => {
  console.error("Agent failed:", err);
  process.exit(1);
});
