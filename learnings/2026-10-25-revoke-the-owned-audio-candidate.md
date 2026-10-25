# Revoke the owned audio candidate

Changing public Sync state does not revoke audio that already passed alignment validation and awaits a backend ACK. Capture the candidate's controller and check exact request/track/token/controller ownership before aborting it. An enabled-mode predicate cannot establish ownership after settings have already switched Off.

Treat pending as separate from engagement: expose busy state and keep OFF accessible before the first successful Sync. Manual Seek intent must invalidate older preparation before its in-place ACK changes anchors. Preserve unrelated deck pairs, newer manual transforms and already committed audio.

For a first warped primary, retain a preparation record and check ownership after await. On revocation, roll back only its uncommitted rate without restoring OFF/reset flags or overwriting a newer owner. Source988fd31 has36controlled lifecycle cases and257total checks; these are not native/audio acceptance.

The compound probe found a separate next issue: overlapping Sync requests can inherit an uncommitted predecessor's nominal rate as rollback basis. Current tests do not pass that case. Preserve nominal ownership; warped source-local audible rate is not interchangeable with nominal tempo.
