# AI Interview Prep Kit

React + Vite + Express + MongoDB implementation of the Trao Full-Stack Engineering Assessment.

## Current implementation

The application implements the assessment flow end to end: React/Vite UI, Express API, MongoDB persistence, cookie-based authentication, JD requirement extraction, bounded company crawling, public interview-discussion research, staged LLM generation, deterministic coverage and schedule allocation, second-pass gap filling, editable/regenerable kit sections, flashcard practice with confidence tracking, a weak-spots report, structure validation, and the required batch evaluator.

## Why React instead of Next.js?

The assessment permits equivalent technologies when justified. React + Vite gives us a lightweight client-side dashboard while Express remains a separate, independently testable API service. This keeps the long-running retrieval/generation pipeline out of the browser and preserves a clean frontend/backend boundary.

## Run

```bash
npm install
npm --prefix client install
npm --prefix server install
cp .env.example server/.env
npm run dev
```

Frontend: http://localhost:5173
Backend: http://localhost:5000/api/health

## Required final evaluator command

```bash
npm run evaluate -- --input cases.json --output kits.json
```


## Evaluation and reliability

The required batch entry point is available from the repository root:

```bash
npm run evaluate -- --input cases.json --output kits.json
```

The evaluator uses the same generation pipeline as the application, processes cases independently, records per-case failures, and cleans up temporary kit records. Input identity is hashed with SHA-256 from the job description and company URL.

LLM category generation is deliberately sequential rather than issuing four concurrent requests. This reduces burst pressure against free-tier token/request limits while keeping the research and generation stages explicit. The Gemini client retries transient 429/5xx responses with exponential backoff.

## Known limitations

- Public interview research uses a lightweight public search endpoint and can legitimately return no results.
- Site crawling is intentionally bounded to a small number of relevant same-origin pages.
- The application does not invent requirements when the JD is thin; it produces a smaller kit instead.
- Localhost/private URL research is disabled by default and only enabled for the evaluator with `ALLOW_LOCAL_RESEARCH=true`.
