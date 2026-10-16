# Development model routing

Checked 2026-10-16. These are recommendations, not executed benchmarks or account-entitlement claims. Models are development tools, not dependencies of the DJ application.

| Profile | Codex | Claude Code | Reason |
|---|---|---|---|
| D | `gpt-6-luna` / medium | `claude-sonnet-5` / low | Bounded evidence formatting; small scope and deterministic checks. |
| U | `gpt-6.1-sol` / high | `claude-sonnet-5` / medium | UI and library workflows need state consistency and executed interaction checks. |
| S | `gpt-6.1-sol` / xhigh | `claude-opus-5` / high | Architecture and persistence require reasoning across failure and concurrency boundaries. |
| A | `gpt-6-astra` / high | `claude-opus-5` / high | DSP and transport require numerical reasoning backed by measurements. |
| H | `gpt-6-astra` / xhigh | `claude-opus-5` / xhigh | Hardware protocols and binary evidence need careful competing hypotheses. |
| M | `gpt-6.1-sol` / high | `claude-sonnet-5` / high | Model evaluation needs reproducible benchmarks, license evidence and resource accounting. |
| V | `gpt-6.1-sol` / xhigh | `claude-opus-5` / high | Independent acceptance review must challenge claims against actual workflows. |

Local Claude Code is 2.1.222 and exposes `--effort`. Pinned Sonnet 5 / Opus 5 recommendations follow the official version history for this installed generation. Current 5.5 documentation requires newer CLI releases. No update or model invocation was performed. Provider routing and account access must be checked before execution. [Official configuration](https://code.claude.com/docs/en/model-config).

Codex identifiers/settings come from this host session catalog. Identically named effort levels across vendors are not equivalent compute budgets. Select the lowest cost configuration that passes the task, using measured token/time/cost when available. Pricing and account budgets are unknown.

Default primary: Codex. Claude Code is an alternative or independent reviewer only when execution is authorized. Escalate after two different failed approaches by first gathering evidence, then increasing one model/effort tier if necessary. Never spend more inference to replace missing physical tests. Each feature inherits its explicit pair in the machine-readable registry and its Trello card.
