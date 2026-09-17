# Frontend contributor guide

- Keep components small, typed, and accessible. Prefer native controls and clear labels.
- Keep all HTTP access in `src/lib/api.ts`; never persist bearer tokens outside session storage.
- Every new API capability should have an obvious route or action in the UI and a helpful empty/error state.
- Run `npm run check`, `npm test`, and `npm run build` before committing.

