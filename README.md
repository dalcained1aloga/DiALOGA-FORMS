# DiALOGA Forms

Convert Excel, Word, PDF, and text drafts into beautiful, bilingual (English/Spanish) print-optimized webforms with custom branding, logos, and watermarks.

## Run Locally

**Prerequisites:** Node.js 18+

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env` and set your Gemini API key:
   ```bash
   cp .env.example .env
   ```
3. Start the dev server (Express + Vite):
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000)

## Deploy to Vercel

This app is configured for Vercel Hobby (60-second function limit).

1. Push the repository to GitHub and import it in [Vercel](https://vercel.com/new).
2. Set environment variables in **Project Settings → Environment Variables**:
   - `GEMINI_API_KEY` — your [Google AI Studio](https://aistudio.google.com/apikey) API key (required)
   - `ENABLE_QA_AUDIT` — set to `true` to enable a second-pass QA audit (optional, adds latency; default OFF)
3. Deploy. Vercel will:
   - Build the Vite SPA to `dist/`
   - Serve static assets with SPA fallback (`index.html` for client routes)
   - Route `/api/convert` to the serverless function in `api/convert.ts`

### Vercel configuration

`vercel.json` enables Fluid Compute, sets `maxDuration: 60` on the convert function, and routes `/api/*` to serverless while serving the built SPA for all other paths.

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GEMINI_API_KEY` | Yes | — | Google Gemini API key for form conversion |
| `ENABLE_QA_AUDIT` | No | `false` | Run a second Gemini pass to audit completeness |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Local dev server (Express + Vite HMR) |
| `npm run build` | Build Vite SPA + bundle Express server for self-hosting |
| `npm run start` | Run production Express server locally |
| `npm run lint` | TypeScript type check (`tsc --noEmit`) |

## PDF Export

Use **Export PDF** or **Print** in the form preview. Both open the browser print dialog — choose "Save as PDF" to export. Fill-mode answers are included when "Print FILLED Form" is selected in Form Controls.
