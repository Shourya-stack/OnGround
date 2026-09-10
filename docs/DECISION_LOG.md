# TrueLine — Decision Log

Real judgment calls made during planning, in the order they were made. Each entry: what was decided, what the alternative was, and why. Add a new entry here whenever a real decision gets made during the build — not for routine implementation, only for genuine forks in the road (per `AI_INSTRUCTIONS.md`).

---

**D1 — Selected PS26122 over PS26043 and PS26229**
Compared on relevance, difficulty, novelty, impact, feasibility, testability, plus estimated competition level. PS26122 won on the best combination of low estimated competition (EPC/construction jargon filters out generalist teams) and clean, achievable scope (the PS itself specifies a bounded 2-3 format prototype). PS26043 was more feasible but too generic/crowded; PS26229 had higher raw impact but a hard fieldwork requirement (real scrap collector validation) that was a genuine risk without existing contacts.

**D2 — Database: Supabase, not SQLite**
Originally planned SQLite for zero-setup simplicity. Switched to Supabase because it provides auto-generated REST API + client SDK (reduces hand-written CRUD), built-in Auth, Storage, and Realtime — all needed anyway, and getting them "for free" from one platform fits the vibe-coding priority of minimizing boilerplate.

**D3 — Architecture: monolith, not microservices**
One FastAPI app with internal module separation (`services/`, `routes/`) rather than separate deployed services for extraction/matching/etc. Microservices would add network and deployment overhead with no real benefit at this scale — internal module boundaries give the same maintainability without the infrastructure cost.

**D4 — API surface: minimize custom FastAPI routes, prefer direct Supabase client calls**
Only 5 custom endpoints exist (upload, extract, match, confirm, reject) — everything else (reads, simple writes) goes directly from React to Supabase. Decided this once Supabase was chosen (D2): re-implementing CRUD Supabase already provides would be wasted effort.

**D5 — Sync request/response, no background job queue**
Considered Celery/Redis for async extraction/matching jobs. Rejected — at hackathon demo scale (single-digit files, extraction taking seconds), a queue solves a latency problem that doesn't exist yet, and adds real infrastructure/debugging cost.

**D6 — Matching: sentence-transformers embeddings, not LLM-based matching**
Considered asking Claude to also do the schedule matching (not just extraction). Decided to keep it as a separate embedding-similarity step — it's free, local, fast, offline-capable, and keeps the confidence score honestly measuring textual similarity rather than being an opaque LLM judgment call.

**D7 — No custom-trained models anywhere in v1**
Both extraction (LLM) and matching (pretrained sentence-transformers) use off-the-shelf models with no fine-tuning. No labeled dataset exists to fine-tune against, and building one is out of scope for a 36-hour build — flagged explicitly in `/AI/AI_SPEC.md` and `/AI/MODEL_SPEC.md` rather than silently assumed.

**D8 — RAG (institutional memory retrieval): designed but not built for v1**
Documented as a clear extension (`/AI/RAG.md`) using the same embedding infrastructure as matching, but explicitly labeled a stretch goal — a single demo project won't have enough historical data for retrieval to be meaningfully useful, and an honest "roadmap, not built" slide is more credible to judges than a thin working demo.

**D9 — Auth: Supabase Auth with two simple roles (planner, supervisor)**
Considered no auth at all (fastest) vs. full custom auth (most control). Landed on Supabase Auth's built-in system because it's minimal setup but still lets `DATABASE.md`'s RLS policies actually mean something — a demo with zero auth can't demonstrate the access-control story the product needs.

**D10 — Primavera/PMIS integration: file-export simulation only, not a live API connection in v1**
A real P6 EPPM API integration is heavy infrastructure unrelated to what the prototype needs to prove (extraction + matching quality). Documented as an explicit roadmap item (`/ENGINEERING/INTEGRATIONS.md`) rather than attempted or silently omitted.

**D11 — Free-tier LLM provider, not Claude**
EXISTING DECISION: Claude API as the extraction provider.
NEW DECISION: The TrueLine hackathon MVP will use a free-tier LLM API through a provider abstraction instead of locking the product to Claude. The project must be developed and demonstrated at zero API cost where possible. The extraction service depends on an LLM provider interface — provider/model selection is configurable through environment variables (`LLM_PROVIDER`, `LLM_MODEL`, `OPENROUTER_API_KEY`). Current preferred provider: OpenRouter free-tier/free-model routing, subject to availability at implementation time. FUTURE: Claude, Gemini, or other providers can be added without rewriting extraction business logic.

**D12 — Public hackathon deployment (GitHub + Vercel + cloud-hosted FastAPI)**
EXISTING DECISION: Demo on local machine/cloud IDE only; production deployment out of scope.
NEW DECISION: TrueLine will be deployment-ready for public hackathon demonstration. Target: GitHub + Vercel frontend + cloud-hosted FastAPI backend + Supabase. Judges should be able to access the working product through a public URL instead of relying exclusively on localhost. Scope: hackathon/demo deployment only. NOT INCLUDED: Production AWS/GCP infrastructure.

**D13 — Dual local + cloud development**
NEW DECISION: The same codebase must support local development and public cloud deployment. Environment variables control all URLs and secrets — no hardcoded environment-specific values. Local development is faster and provides a fallback if deployment fails before the demo.

**D14 — OpenRouter Free-Tier Default Model: LLaMA 3.3 70B Instruct Free**
DECISION: TrueLine defaults to `meta-llama/llama-3.3-70b-instruct:free` on OpenRouter for free-tier JSON extraction, with seamless runtime fallback to `google/gemini-2.0-flash-exp:free` or any model specified via the `LLM_MODEL` environment variable. OpenRouter provides reliable OpenAI-compatible chat completion endpoints with free access tiers.

**D15 — CSS & Styling Approach: Tokenized Native CSS Design System**
DECISION: TrueLine utilizes a custom CSS custom properties (tokens) design system in `index.css`. Provides tailored dark-mode EPC megaproject palette (`#0B0F17`, `#111827`, `#3B82F6`, `#10B981`, `#F59E0B`, `#EF4444`), glassmorphism, responsive data tables, confidence badges, and smooth micro-interactions without third-party build friction or CSS bloat.

**D16 — Backend Cloud Hosting Provider: Render (with Universal Docker Fallback)**
DECISION: TrueLine standardizes on Render for free-tier FastAPI cloud hosting (`render.yaml`), supplemented by a root `Dockerfile` and `Procfile` for universal 1-click compatibility on Railway, Fly.io, or Hugging Face Spaces. Dual local + cloud support ensures uninterrupted demonstration regardless of external network latency.



