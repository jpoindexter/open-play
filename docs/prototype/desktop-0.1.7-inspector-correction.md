# Package inspector criterion correction

The first two executions stopped on an invalid >10,000 byte LICENSE assumption. The pinned upstream packages each ship a 284 byte MPL notice linking the full text, not the full text itself. All supplied LICENSE bytes are preserved and already hash-checked against recorded upstream files. The corrected inspector checks the actual notice plus exact staged-file hashes. No archive/package/source was changed to make this test pass. This is not a project-wide licensing or public-release clearance. The superseded test never wrote a passing receipt.
