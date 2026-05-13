# Pixelrunner Shared Agent Guide

`shared` is the common TypeScript package consumed by the admin, controller,
proxy, and applets projects. It contains shared interfaces, JSON-RPC/WebSocket
types, utility functions, room ID helpers, and backend-only process/path helpers.

## Project Structure

- `index.ts` - Browser-safe public exports.
- `index.backend-only.ts` - Node/backend-only exports.
- `lib/interfaces/` - Shared domain interfaces.
- `lib/interfaces/standard/` - JSON-RPC and WebSocket contracts.
- `lib/interfaces/ws-api/` - Method handler contracts.
- `lib/utils/TrysteroRoomId.ts` - Shared room ID and public IP resolution.
- `lib/utils/StringUtils.ts` - Browser-safe string helpers.
- `lib/utils/PathUtils.ts` - Backend-only path helpers.
- `lib/ChildManager.ts` - Backend-only child process manager.
- `lib/Logger.ts` - Backend-only logger.
- `dist/` - Built package output used by package consumers.

## Commands

Run from `shared/`.

```bash
npm install
npm run build
npm run type-check
npm run clean
npm test
```

`npm test` currently has no real test suite. Add tests before expanding shared
logic with behavior that can regress.

## Export Rules

- Keep `index.ts` browser-safe. Do not export Node-only modules, filesystem
  access, process managers, or Winston logger from the main entrypoint.
- Put Node-only exports in `index.backend-only.ts` and consume them through
  `pixelrunner-shared/backend`.
- When adding a new public type or utility, export it from the correct entrypoint
  and run `npm run build` so `dist/` and `.d.ts` output stay aligned.
- `package.json` exports must match the built files in `dist/`.

## Code Rules

- Treat this package as a contract. Changes can break admin, controller, proxy,
  and applets at once.
- Keep interfaces backward compatible unless the caller updates are part of the
  same change.
- Room ID helpers must remain deterministic across browser and Node runtimes.
- Do not put secrets in shared constants. Shared code may define defaults and
  algorithms, not production credentials.
- Validate inputs in shared helpers and return useful errors. Avoid silent
  fallback unless the caller explicitly opts into it.
- Prefer dependency-free utilities. Adding dependencies here multiplies install
  cost across every consumer.
- Preserve ESM imports with `.js` specifiers in TypeScript source when they point
  to built output.

## Testing Notes

- Run `npm run type-check` after interface or export changes.
- Run `npm run build` before packaging or when consumers need updated `dist/`.
- For `TrysteroRoomId` changes, test both browser and Node-compatible code paths:
  configured room ID, public IP room derivation, private/invalid IP rejection,
  timeout/error fallback, and password/app ID changes.
- After changing exported contracts, run focused checks in affected consumers.
