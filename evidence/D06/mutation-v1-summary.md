\# D06: Mutation Testing v1 Summary



\## 1. Tool and Configuration



\- \*\*Tool:\*\* Stryker Mutator

\- \*\*Version:\*\* 10.1.1

\- \*\*Target file:\*\* `middleware/authMiddleware.js`

\- \*\*Test suite:\*\* `test/baseline-ai/authMiddleware.ai.test.js`

\- \*\*Test runner:\*\* Mocha

\- \*\*Coverage analysis:\*\* Per-test

\- \*\*Command executed:\*\* `npx stryker run`



\## 2. Results



The initial mutation testing run completed successfully. Stryker generated 37 mutants and ran the 8 AI baseline tests.



| Metric | Result |

|---|---:|

| Total mutants | 37 |

| Mutants killed | 36 |

| Mutants survived | 1 |

| Mutants timed out | 0 |

| Mutants with no coverage | 0 |

| Errors | 0 |

| Mutation score | 97.30% |



\## 3. Surviving Mutant



Stryker reported one surviving optional-chaining mutant in `middleware/authMiddleware.js`:



Original code:



`const authUserId = Number(req.user?.id);`



Mutated code:



`const authUserId = Number(req.user.id);`



The mutation removes optional chaining when accessing the authenticated user's ID. The existing tests did not distinguish the original statement from the mutated statement for the tested scenarios.



A further test should examine the behaviour when `req.user` is missing, and the expected behaviour should be established before deciding whether to change the implementation or the test suite.



\## 4. Evidence Files



\- `mutation-v1.json` — raw Stryker JSON report.

\- `mutation-v1.html` — HTML mutation testing report.

\- `mutation-v1-summary.md` — summary of the initial run.



\## 5. Limitation and Follow-up



This initial run produced one surviving mutant, not the eight surviving-mutant case studies required by the project guide. Further mutation analysis and documented case studies are therefore still needed. No additional surviving mutants are claimed in this summary.

