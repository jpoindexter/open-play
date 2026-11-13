# Shared preparation must refresh current consumers

**Context:** Several tracks and decks can share one AudioBuffer and one profile-ready subscription.
**Dead ends:** Capturing the first track misses later aliases; globally redrawing visits unrelated or replaced decks. Controlled callbacks and a real four-deck probe expose the extra visits.
**What worked:** At completion, resolve current visible tracks by the subscribed buffer identity, deduplicate tracks and reuse the target renderer. Rejection handling and explicit global refresh remain intact.
**Why:** Subscription identity belongs to the shared resource, while its current consumers can change during preparation.
**Rule:** Resolve current consumers by resource identity when a shared asynchronous subscription completes.
