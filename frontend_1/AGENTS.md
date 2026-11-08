<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Rules
- All backend calls go through `src/lib/api/services.ts` (typed, FastAPI is source of truth); never call AI providers from the browser. Why: backend routes AI via Prune.
- Demo data lives only in `src/lib/api/demo-data.ts` and is used when `VITE_API_BASE_URL` is unset. Why: keep fake data isolated from real responses.
- Proposed endpoint contracts are documented in `docs/API_CONTRACTS.md`; update it when wiring real endpoints.
