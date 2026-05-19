# Roll-Up Radar

Daily email brief tracking early-stage PE-backed industrial roll-up platforms. Fires every morning at 8am ET via GitHub Actions.

## Setup (5 minutes)

### 1. Add GitHub Secrets
Go to your repo → **Settings → Secrets and variables → Actions → New repository secret**

| Secret | Value |
|---|---|
| `ANTHROPIC_API_KEY` | From [console.anthropic.com](https://console.anthropic.com) |
| `GMAIL_USER` | Your Gmail address |
| `GMAIL_APP_PASSWORD` | Gmail App Password (see below) |
| `RECIPIENT_EMAIL` | Where to send the daily brief |

### 2. Get a Gmail App Password
1. Go to [myaccount.google.com](https://myaccount.google.com) → Security
2. Under "2-Step Verification" → scroll to **App Passwords**
3. Create one named "Roll-Up Radar"
4. Copy the 16-character code → paste as `GMAIL_APP_PASSWORD`

### 3. Test it
Go to **Actions tab → Daily Roll-Up Radar → Run workflow → Run workflow**

Email arrives in ~60 seconds.

## What it tracks
- New PE-backed platform formations in industrial services
- Capital raises and recapitalizations
- Acquisition announcements
- Executive hires at roll-up platforms
- Named companies: Pave America, Groundworks, QXO, Kodiak, Apex Service Partners, and peers

## Cost
~$0.05–0.10/day on the Anthropic API. GitHub Actions is free.
