# Analysis results should refresh current owners

**Context:** Real worker analysis completed while four decks were mixing.
**Dead ends:** The baseline rebuilt every deck and mixer after each result; a real-worker preservation assertion failed even though transport and measurement succeeded.
**What worked:** Resolve visible owners when the asynchronous result commits and reuse the existing target renderer only for those decks; keep library refresh, persistence and gain deferral intact.
**Why:** A metadata result belongs to a track, while the decks displaying that track can change during the job.
**Rule:** Resolve current visible owners after asynchronous metadata work and refresh only those owners.
