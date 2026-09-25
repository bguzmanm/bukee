# AGENTS.md

Desktop app for managing a personal EPUB library. **Tauri 2 (Rust) + Next.js 16 (App Router) + React 19 + Tailwind v4 + Shadcn UI, bundled with Bun.** UI copy is Spanish — keep new user-facing strings in Spanish (code comments too).

## Commands

- `bun install` — package manager is Bun (`bun.lock`).
- `bun run tauri dev` — the real dev loop: runs `next dev --turbopack` and opens the Tauri window.
- `bun run build` — Next build with `output: "export"`; static files land in `out/`, which is Tauri's `frontendDist`. `next start` is **not** supported here.
- Lint is **broken**: `bun run lint` fails because Next 16 removed `next lint`. Use `bunx eslint .` instead. Pre-existing errors exist (`no-explicit-any` in `lib/db.ts`).
- Rust: no tests in the repo. Iterate with `cargo check`/`cargo build` inside `src-tauri/`. Requires standard Tauri system prerequisites.

## Architecture (things you'd get wrong)

- SQLite via `tauri-plugin-sql` (`sqlite:bukee.db`), migrations defined **in Rust** (`src-tauri/src/lib.rs`, `create_initial_tables`). If the schema drifts or a stale DB blocks startup, delete the app's `bukee.db` — the migration only runs if the table is missing.
- Data flow: `lib/db.ts` (`BookRepository`), `lib/tauri.ts` (Tauri `invoke` bridge), `hooks/useBooks.ts`. Types live in `types/index.ts`.
- There are **two EPUB parsers** and only one is live: `app/page.tsx` uses client-side `parseEpub` (epubjs, `lib/epub.ts`). The Rust command `parse_epub_metadata` (`lib/tauri.ts`) is currently **unused by the UI**; it also writes copies to the repo's `public/books/` using a fragile `current_exe()` parent-path climb.
- `app/page.tsx` top-level imports `@tauri-apps/api/event` and `plugin-fs`, so the frontend only runs inside the Tauri window — not in a plain browser tab.
- Tailwind v4 is CSS-first: theme tokens live in `app/globals.css` (`@theme`/oklch). `tailwind.config.ts` is largely vestigial — don't add tokens there expecting them to apply.
- Shadcn components: `components/` + `components/ui/` (New York style, lucide icons, aliases via `@/*`).

## CI

PRs to `main` and the manual `Release.yml` both run full 4-platform Tauri release builds via `tauri-action` (tag `v__VERSION__`, draft releases). Builds are slow — don't rely on CI for quick feedback.