# Mown

### A GitHub-powered download interface

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://www.typescriptlang.org)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/mr-meshky/mown/pulls)

[فارسی](README.md) | English

---

> **Goal:** Mown uses GitHub Actions as a download proxy — ideal for regions where GitHub is accessible but other sites (like YouTube) are blocked. Download files at full speed without a VPN.

---

## ✨ Features

- **YouTube downloader** — quality selection (360p → 4K), video (MP4/WebM) or audio (MP3)
- **Direct URL download** — fetch any public file via `curl`
- **Webpage snapshot** — save a full offline copy of any page as a single HTML file (via [monolith](https://github.com/Y2Z/monolith))
- **Auto file splitting** — files over 95 MB are automatically split into ZIP chunks
- **Download history** — track all downloads with preview, multi-part merge instructions, and direct links
- **Encrypted cookie storage** — YouTube cookies are sealed with libsodium and stored as a GitHub Actions secret
- **Onboarding wizard** — step-by-step setup guide for new users
- **RTL + i18n** — full Persian (Farsi) and English UI with `next-intl`
- **Dark / Light theme**
- **No server required** — runs entirely on GitHub's free infrastructure

---

## 🏗️ How It Works

```
User submits URL
      │
      ▼
Mown (Next.js app)
  ├─ Stores token & config in localStorage (never sent to any server)
  ├─ Calls GitHub API (via Octokit) to dispatch a workflow
  │
  ▼
GitHub Actions (in your own repo)
  ├─ youtube-download.yml  →  yt-dlp + ffmpeg
  ├─ direct-download.yml   →  curl
  └─ snapshot.yml          →  monolith (Rust)
      │
      ▼
  Artifact uploaded (1-day retention) + committed to your repo
      │
      ▼
Mown polls run status → shows logs → serves download link
```

Your GitHub token and YouTube cookies **never leave your browser** — they go directly to the GitHub API.

---

## 📦 Tech Stack

| Layer           | Technology                               |
| --------------- | ---------------------------------------- |
| Framework       | Next.js 16 (App Router)                  |
| Language        | TypeScript 5.7                           |
| UI              | Tailwind CSS v4 + Radix UI + shadcn/ui   |
| GitHub API      | `@octokit/rest`                          |
| Crypto          | `libsodium-wrappers` (cookie encryption) |
| i18n            | `next-intl`                              |
| Package manager | pnpm                                     |

---

## 📝 Prerequisites

1. A **GitHub account** (free tier is enough)
2. A **Chromium-based browser** (Chrome, Edge, Brave, …) — only needed for exporting YouTube cookies

---

## 🚀 Setup Guide

### Step 1 — Create a GitHub Personal Access Token

1. Go to [github.com](https://github.com) and sign in
2. Click your profile picture → **Settings**
3. Left sidebar → **Developer settings** → **Personal access tokens** → **Tokens (classic)**
4. Click **Generate new token (classic)**
5. Give it a name like `mown`
6. ⚠️ Enable the **`repo`** and **`workflow`** scopes
7. Click **Generate token** and copy it — you won't see it again

> Keep your token private. Treat it like a password.

---

### Step 2 — Get YouTube Cookies (optional, for age-restricted videos)

1. Install the [Get cookies.txt LOCALLY](https://chromewebstore.google.com/detail/cclelndahbckbenkjhflpdbgdldlbecc) extension
2. Go to [youtube.com](https://youtube.com) and sign in
3. Click the extension icon → **Export**
4. Paste the content of `cookies.txt` into Mown's settings

---

### Step 3 — Initialize Your Repository

1. Open the Mown app
2. Enter your GitHub token in the settings panel
3. Click **Initialize Repository** — Mown will automatically:
   - Create a private `mown-downloads` repo in your account
   - Push the three workflow files (`.github/workflows/`)
   - Store your YouTube cookies as an encrypted Actions secret

---

## 📖 Usage

### Downloading a video

1. Paste a YouTube URL into the input field
2. Choose quality (`Best`, `1080p`, `720p`, `480p`, …) and format (`MP4` / `MP3`)
3. Click **Start Download**
4. Track progress in real time — logs stream from the GitHub Actions run
5. When complete, find your file in the **History** page with download links

### Large files (> 95 MB)

Files exceeding 95 MB are automatically split into numbered ZIP chunks.  
The History page shows all parts with download instructions:

- **Command Line:** Download all parts and merge with `cat`
- **Using the App:** Go to the Merge page, drop all parts, and click Merge

### Download History

Open **History** to:

- Download any file directly from GitHub
- View all parts of split files with merge instructions
- Browse snapshots and mirrored websites
- Filter by type: YouTube, SoundCloud, Direct, or Snapshot

---

## 🛠️ Running Locally (Development)

```bash
# Clone the repo
git clone https://github.com/mr-meshky/mown.git
cd mown

# Install dependencies
pnpm install

# Start the dev server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### Build for production

```bash
pnpm build
pnpm start
```

### Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/mr-meshky/mown)

> No environment variables are required — all configuration is stored client-side.

---

## 🛡️ Security

| What             | Where it lives                                   | Who can see it             |
| ---------------- | ------------------------------------------------ | -------------------------- |
| GitHub token     | Your browser's `localStorage`                    | Only you                   |
| YouTube cookies  | GitHub Actions secret (encrypted with libsodium) | GitHub Actions runner only |
| Downloaded files | Your private GitHub repo + temporary artifact    | Only you                   |

**Best practices:**

- Never share your token or cookie file
- If you suspect a token leak, revoke it immediately in GitHub Settings → Developer settings
- Only use Mown on your own device

---

## 🔧 Troubleshooting

| Problem                     | Fix                                                                              |
| --------------------------- | -------------------------------------------------------------------------------- |
| Download doesn't start      | Check that the token has `repo` + `workflow` scopes and the repo was initialized |
| `cookies.txt not found`     | Re-export cookies from your browser and paste them in Settings                   |
| `Rate limited`              | GitHub allows ~1,000 workflow dispatches/hour — wait a few minutes               |
| Large file not reassembling | Make sure you downloaded **all** numbered parts before extracting                |
| Snapshot workflow slow      | `cargo install monolith` compiles from source — first run takes ~3 minutes       |

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repo and create a feature branch (`git checkout -b feat/my-feature`)
2. Run `pnpm lint` and `pnpm format:check` before committing
3. Open a pull request — describe what you changed and why

For bug reports or feature requests, open an [Issue](https://github.com/mr-meshky/mown/issues).  
For questions and discussion, use [Discussions](https://github.com/mr-meshky/mown/discussions).

---

## 📄 License

Released under the [MIT License](LICENSE).  
© 2026 [MrMeshky](https://github.com/mr-meshky)
