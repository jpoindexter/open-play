# One Open Play design system

## Outcome and authority

User direction: remove legacy overrides and hardcoded styling, unify icon size/fonts, retain every layout/control/library preview, and push verified changes. One canonical system can have focused modules; a giant stylesheet is not the goal. No new audio engine, desktop rebuild or public release is required for this migration.

## Now

Consolidate typography/icons: one CSS owner, canonical type/leading/weight/icon tokens, actual installed Lucide icons, shared canvas text roles and a style-ownership guard. Replace font-zero pseudo-label tricks with real Cue/key text and accessible hidden level labels. Keep library text-size customization functional.

## Next

1. Inventory every remaining authored runtime declaration and its owner. Remove obsolete/repeated patch rules before moving anything; preserve dynamic control geometry, keyboard focus and error states.
2. Separate shared component presentation from layout geometry. Layout selection controls placement/density/orientation, never an alternative palette/type/button system. Shared standard controls continue to use actual Astryx; DJ controls remain custom.
3. Consolidate palette/spacing/radius/focus/elevation into semantic/component contracts. Raw visual values belong in the token source. Do not create a token for every historical accident or suppress a guard to pass it.
4. Remove all remaining authored `!important` and conflicting ownership, then retire the old adapter imports. Replace exceptional behavior with explicit component variants/states, preserving all six geometries.
5. Extend the guard to the complete runtime graph and provide a real component/state reference. Verify one focused UI path per ownership boundary, including 2/4 decks and H/V; no broad DSP reruns.

## Later

Exact current-source native delivery, owner visual acceptance and broader zoom/reflow/assistive-technology checks. Core Sync/recovery/hardware/beta gates retain their independent evidence and priorities.

## Re-entry and observable Done

Continue from the current ownership inventory and the actual paused workspace; preserve loaded references/positions. Done requires one canonical token source/stylesheet entry, one owner per component, no authored override patches/`!important` or unexplained visual literals, retained controls/previews across the affected views, exact Trello readback and a pushed revision. A generated concatenation or per-literal variable wrapper does not meet this criterion.

## Skill search

`skills find design-system` returned no match; `skills find "design systems"` returned several candidates, including design-system-patterns. The installed design-system-patterns, DEC design-system-depth/CSS-architecture, design-tokens, typography-system and iconography-and-imagery already cover this task. Use those local instructions with the installed Astryx/Lucide packages; do not add another UI framework merely because it appears in search results.

UI-DS-01 remains the existing tracking card. All-style unification is not complete at this checkpoint.
