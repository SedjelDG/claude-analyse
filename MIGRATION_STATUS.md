# Native Desktop Status

Last updated: 2026-04-10  
Workspace: `C:\Users\Administrator\Documents\Playground\codex take`

## Done
- Desktop runtime is now Tauri-only in source (`src/lib/desktop-runtime.ts`).
- Legacy desktop shell files were removed.
- Legacy bridge helpers/types were removed.
- `package.json` cleaned:
  - removed `main` entry that pointed at legacy shell
  - removed legacy shell scripts
  - removed legacy shell dependency
  - added/kept desktop-native scripts:
    - `npm run desktop:dev`
    - `npm run desktop:build`
    - `npm run tauri:dev`
    - `npm run tauri:build`
- Lock/dependency state refreshed with `npm install`.
- Native build artifacts verified:
  - `src-tauri/target/release/bundle/msi/Antigravity POS_0.1.0_x64_en-US.msi`
  - `src-tauri/target/release/bundle/nsis/Antigravity POS_0.1.0_x64-setup.exe`

## Remaining
- Run full manual cashier parity pass on native desktop app only.
- Remove fallback localStorage writes once parity is fully signed off.
- Expand tests around persistence edge cases and shift lifecycle.

## How To Run
1. Development shell (native desktop): `npm run desktop:dev`
2. Production installer build: `npm run desktop:build`
