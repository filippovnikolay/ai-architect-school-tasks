# Improper output handling — scenario test matrix

Rows measure whether model output (vulnerable: raw; mitigated: after JSON parse + HTML escape) still matches unsafe-sink heuristics.

Generated: `2026-05-12T15:09:51.414Z`

| Scenario Id | Vulnerable sink unsafe | Mitigated sink unsafe |
| --- | --- | --- |
| ioh-1 | yes | no |
| ioh-2 | yes | no |
| ioh-3 | yes | no |
| ioh-4 | no | no |
| ioh-5 | yes | no |
