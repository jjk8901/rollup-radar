const nodemailer = require("nodemailer");

const SECTORS = [
  "pavement maintenance acquisition platform",
  "commercial HVAC electrical contractor roll-up",
  "specialty distribution industrial consolidation",
  "water wastewater environmental services platform",
  "infrastructure maintenance PE-backed",
  "industrial services roll-up new platform formation",
];

async function runAgent() {
  console.log("Running Roll-Up Radar agent...");

  // Build the search prompt
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const prompt = `Today is ${today}. You are a deal intelligence analyst tracking early-stage PE-backed industrial roll-up platforms — companies in the mold of Pave America, Groundworks, or early XPO. 

Search the web for the latest news (last 24–48 hours) across these sectors:
${SECTORS.map((s) => `- ${s}`).join("\n")}

Look specifically for:
- New platform formations (PE firm + operator teaming up to consolidate a sector)
- Fresh PE capital raises or recapitalizations for existing platforms
- Acquisition announcements by industrial roll-up platforms
- New executive hires (CEO, COO, Chief of Staff, Head of Strategy) at these companies
- Any news about: Pave America, Groundworks, QXO, Kodiak, Apex Service Partners, or similar platforms

Format your response as a clean daily brief with this structure:

ROLL-UP RADAR — ${today}

[For each notable item found, 2–4 sentences max:]
• COMPANY NAME | SECTOR | What happened | Why it matters for someone tracking early-stage platforms

If nothing material surfaced in the last 48 hours, include a "Quiet Day" section with 1–2 evergreen companies to keep on the watchlist and why.

Keep the whole brief under 400 words. Be direct and specific — no filler.`;

  // Call Anthropic API with web search
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "anthropic-beta": "interleaved-thinking-2025-05-14",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
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
    throw new Error(`API error: ${JSON.stringify(data)}`);
  }

  // Extract text from response
  const briefText = data.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("\n");

  console.log("Brief generated:\n", briefText);

  // Send email
  await sendEmail(briefText, today);
  console.log("Email sent successfully.");
}

async function sendEmail(brief, dateStr) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

  // Convert plain text to simple HTML
  const htmlBrief = brief
    .split("\n")
    .map((line) => {
      if (line.startsWith("ROLL-UP RADAR"))
        return `<h2 style="color:#1a1a1a;font-family:sans-serif;">${line}</h2>`;
      if (line.startsWith("•"))
        return `<p style="font-family:sans-serif;font-size:14px;line-height:1.6;border-left:3px solid #2563eb;padding-left:12px;margin:12px 0;">${line.slice(1).trim()}</p>`;
      if (line.trim() === "") return "<br/>";
      return `<p style="font-family:sans-serif;font-size:14px;line-height:1.6;color:#333;">${line}</p>`;
    })
    .join("");

  const html = `
    <div style="max-width:600px;margin:0 auto;padding:24px;">
      ${htmlBrief}
      <hr style="margin-top:32px;border:none;border-top:1px solid #eee;"/>
      <p style="font-family:sans-serif;font-size:12px;color:#999;">Roll-Up Radar · Daily industrial platform intelligence</p>
    </div>
  `;

  await transporter.sendMail({
    from: `"Roll-Up Radar" <${process.env.GMAIL_USER}>`,
    to: process.env.RECIPIENT_EMAIL,
    subject: `Roll-Up Radar — ${dateStr}`,
    text: brief,
    html,
  });
}

runAgent().catch((err) => {
  console.error("Agent failed:", err);
  process.exit(1);
});
