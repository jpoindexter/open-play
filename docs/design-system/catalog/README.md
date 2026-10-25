# Installed rekordbox interface catalog

Open [the visual catalog](http://127.0.0.1:18846/docs/design-system/catalog/) with the existing local review server. Search screen/control names, filter section/evidence status, select a capture, and enable measured-region overlays on 2 Deck Horizontal.

This is a growing whole-interface inventory, **not a claim that every screen or state has been visited**. Captured, private and unvisited routes are separate. Numeric dimensions are pixel-derived with stated tolerance; REA does not provide control bounds or the vendor's original token definitions. Preference screenshots are supplemental native CUA evidence because REA rejected that dialog's ambiguous window geometry.

The tracked JSON contains sanitized labels, component role counts, capture hashes, REA IDs, measurements, adaptation notes and remaining routes. The ignored `captures/` directory contains local reference images only. Raw bundles/AX stay under ignored `local-evidence/rekordbox-catalog-2026-10-25/`. Account, Plan and Advanced images are withheld from the served catalog. No vendor source code, fonts or assets are copied into the product.

Rebuild metadata and local image copies with `python3 scripts/build_rekordbox_catalog.py`. It requires the private captures and the installed Pillow library. The builder asserts unique IDs, image presence and absence of email/local-user paths in published metadata. A fresh clone can inspect the inventory but needs the owner's private captures to show images.

Current coverage:58 screen/state captures,7 private captures,6 accessibility-only menu inventories and26 unvisited entries. All four main Performance layouts,11 View states,14 library states,26 Preferences pages/entries and the six main menus have evidence. These are inventory entries, not a count of all unique possible screens. Off/on captures intentionally retain state evidence. Library AX became visible in Split Screen; the normal main-window tree omits it.

Next capture routes: fullscreen, loaded deck/pad/grid states, library/context menus, modes, import/export dialogs and preference scroll overflow. Native window/menu navigation recovered after rebinding, but pointer/scroll input still reports `noWindowsAvailable`, and custom dropdowns do not reliably open. Resume from the running, empty Performance2DeckHorizontal screen; dark appearance, mixer on, panels off and single-window view were restored. No audio, recording, cloud, account or reset action was executed.
