# REA 6.5.0 local native UI size patch

User-authorized local tooling repair, 19 October 2026. This changes only the selected executable identity-check budget from 256 to 512 MiB in `bridge/native/ReaNativeUI.swift`. It preserves digest, process identity, owner/window checks, permissions and output budgets.

Applied installation: `/Users/jasonpoindexter/.npm/_npx/ad9a3fdbcad992c6/node_modules/rea-agents`.

Minimal patch: `rea-6.5.0-native-ui-512mib.patch`. Original full helper backup and before/after SHA-256 are private in `local-evidence/rekordbox-rea-interface-208/rea-limit-patch/`. Never commit that runtime's unrelated files or credentials. A package refresh can overwrite this local patch.

To reapply to the same version, back up the helper, inspect the diff and use `patch --dry-run -p1` from the package root before applying it. To undo, use the same patch with `-R` after confirming no subsequent edits. Do not apply by blind global replacement: unrelated REA budgets must remain unchanged.

Executed regression: the original CLI `observe-native-ui` command against the 301,587,792-byte rekordbox executable now succeeds, yielding 294 nodes in Two Deck Vertical and 500 in Four Deck Vertical, both without reported gaps/truncation. Full SHA-256 and selected-window checks were executed in both successful captures. No claim of tests for arbitrary >512 MiB apps, identity-mismatch negative cases or all REA providers.

The pre-existing MCP transport's stale Hopper cleanup state is separate and unresolved. Do not patch out cleanup acknowledgement checks to clear it. Fresh standalone REA works; the existing connection needs reconnection.
