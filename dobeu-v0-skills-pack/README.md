# Dobeu Tech Solutions — v0 Skills Pack

Curated agent skills for v0.app and Cursor, maintained by Dobeu Tech Solutions LLC.

Install via pack: `npx skills add https://skills.sh/p/<pack-id>` (after pack creation — see PACK-SETUP.md)
Or install this repo: `npx skills add dobeutech/dobeu-v0-skills-pack`
Or install into Cursor globally: `python3 tools/install_to_cursor.py`

## Included skills (42)

- **access-protected-vercel-deployment** — Access and test Vercel deployments protected by Vercel Authentication, SSO, or Deployment Protection. Use when curl, agent-browser, Playwright, or another autom
- **ai-gateway** — Vercel AI Gateway expert guidance. Use when configuring model routing, provider failover, cost tracking, or managing multiple AI providers through a unified API
- **ai-sdk** — Vercel AI SDK expert guidance. Use when building AI-powered features — chat interfaces, text generation, structured output, tool calling, agents, MCP integratio
- **auth0** — Use when adding, fixing, or improving authentication in any app — login, logout, signup, route protection, JWT/access token validation, refresh token rotation, 
- **brainstorming** — You MUST use this before any creative work - creating features, building components, adding functionality, or modifying behavior. Explores user intent, requirem
- **brand-guidelines** — Applies Anthropic's official brand colors and typography to any sort of artifact that may benefit from having Anthropic's look-and-feel. Use it when brand color
- **canvas-design** — Create beautiful visual art in .png and .pdf documents using design philosophy. You should use this skill when the user asks to create a poster, piece of art, d
- **ce-handoff** — Create a session handoff for another agent, or resume, find, and read any user-selected continuity source. Use when work or conversation must continue without a
- **ce-test-browser** — Run browser tests for pages affected by the current branch or PR.
- **chat-sdk** — Vercel Chat SDK expert guidance. Use when building multi-platform chat bots — Slack, Telegram, Microsoft Teams, Discord, Google Chat, GitHub, Linear — with a si
- **cli-for-agents** — Designs or reviews CLIs so coding agents can run them reliably: non-interactive flags, layered --help with examples, stdin/pipelines, fast actionable errors, id
- **control-cli** — Build or adapt a local harness to drive, inspect, and profile an interactive CLI or TUI without external services. Use for CLI UX checks, startup regressions, m
- **control-ui** — Build or adapt a local browser/CDP harness to drive and inspect a web, IDE, or Electron UI. Use for local UI verification, screenshots, accessibility snapshots,
- **create-plugin-scaffold** — Create a new Cursor plugin scaffold with a valid manifest, component directories, and marketplace wiring. Use when starting a new plugin or adding a plugin to a
- **ddsetup** — First-time initialization of the Datadog MCP server `plugin-datadog-datadog`. When fulfilling requests that involve Datadog, use MCP tools from `plugin-datadog-
- **deslop** — Remove AI-generated code slop and clean up code style
- **doc-coauthoring** — Guide users through a structured workflow for co-authoring documentation. Use when user wants to write documentation, proposals, technical specs, decision docs,
- **docs-canvas** — Render a documentation-style Cursor Canvas that organizes architecture notes, API references, walkthroughs, and how-tos into a navigable layout with sections, t
- **finishing-a-development-branch** — Use when implementation is complete, all tests pass, and you need to decide how to integrate the work - guides completion of development work by presenting stru
- **fix-merge-conflicts** — Resolve merge conflicts non-interactively, validate build and tests, and finalize conflict resolution
- **frontend-design** — Create distinctive, production-grade frontend interfaces with high design quality. Use this skill when the user asks to build web components, pages, artifacts, 
- **make-pr-easy-to-review** — Prepare PRs for review by cleaning noisy history, improving PR descriptions, and adding reviewer guidance without changing code behavior. Use for "make this eas
- **marketplace** — Vercel Marketplace expert guidance — discovering, installing, and managing third-party integrations via the `vercel integration` CLI. Use when building any app 
- **microfrontends** — Guide for building, configuring, and deploying microfrontends on Vercel. Use this skill when the user mentions microfrontends, multi-zones, splitting an app acr
- **next-cache-components** — Next.js 16 Cache Components guidance — PPR, use cache directive, cacheLife, cacheTag, updateTag, and migration from unstable_cache. Use when implementing partia
- **nextjs** — Next.js App Router expert guidance. Use when building, debugging, or architecting Next.js applications — routing, Server Components, Server Actions, Cache Compo
- **pr-review-canvas** — Generate an interactive PR review walkthrough as an HTML page. Fetches PR data via gh API, categorizes files into core vs mechanical changes, adds reviewer anno
- **react-best-practices** — React best-practices reviewer for TSX files. Triggers after editing multiple TSX components to run a condensed quality checklist covering component structure, h
- **receiving-code-review** — Use when receiving code review feedback, before implementing suggestions, especially if feedback seems unclear or technically questionable - requires technical 
- **review-plugin-submission** — Audit a Cursor plugin for marketplace readiness. Use when validating manifests, component metadata, discovery paths, and submission quality before publishing.
- **runtime-cache** — Vercel Runtime Cache API guidance — ephemeral per-region key-value cache with tag-based invalidation. Shared across Functions, Routing Middleware, and Builds. U
- **theme-factory** — Toolkit for styling artifacts with a theme. These artifacts can be slides, docs, reportings, HTML landing pages, etc. There are 10 pre-set themes with colors/fo
- **turbopack** — Turbopack expert guidance. Use when configuring the Next.js bundler, optimizing HMR, debugging build issues, or understanding the Turbopack vs Webpack differenc
- **vercel-agent** — Vercel Agent guidance — AI-powered code review, incident investigation, and SDK installation. Automates PR analysis and anomaly debugging. Use when configuring 
- **vercel-cli** — Vercel CLI expert guidance. Use when deploying, managing environment variables, linking projects, viewing logs, querying metrics, managing domains, or interacti
- **vercel-connect** — Vercel Connect expert guidance — securely obtain scoped OAuth tokens for third-party services (Slack, GitHub, MCP servers, OAuth, Snowflake) on behalf of apps o
- **vercel-firewall** — Vercel Firewall expert guidance — automatic DDoS mitigation, the Vercel WAF (custom rules, IP blocking, managed rulesets, rate limiting), Attack Mode, system by
- **vercel-functions** — Vercel Functions expert guidance — Serverless Functions, Edge Functions, Fluid Compute, streaming, Cron Jobs, and runtime configuration. Use when configuring, d
- **vercel-services** — Configure and troubleshoot Vercel Services for multiple frontends and backends in one project. Use when composing a polyglot or multi-service application on one
- **verification** — Full-story verification — infers what the user is building, then verifies the complete flow end-to-end: browser → API → data → response. Triggers on dev server 
- **verification-before-completion** — Use when about to claim work is complete, fixed, or passing, before committing or creating PRs - requires running verification commands and confirming output be
- **xlsx** — Comprehensive spreadsheet creation, editing, and analysis with support for formulas, formatting, data analysis, and visualization. When Claude needs to work wit

## Format
Each skill is a folder with a `SKILL.md` (YAML frontmatter: `name`, `description`).
Validated with `python3 tools/validate.py skills/`. See NOTICE.md for attribution.
