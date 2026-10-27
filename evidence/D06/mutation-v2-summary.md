\# D06: Mutation Testing v2 Summary



\## 1. Tool and Configuration



\- Tool: Stryker Mutator 10.1.1

\- Target file: `middleware/authMiddleware.js`

\- Test suite: `test/baseline-ai/authMiddleware.ai.test.js`

\- Test runner: Mocha

\- Coverage analysis: per-test

\- Command: `npx stryker run`



\## 2. Results



\- Total mutants: 37

\- Mutants killed: 37

\- Mutants survived: 0

\- Timed-out mutants: 0

\- Mutants without coverage: 0

\- Errors: 0

\- Mutation score: 100%



The updated run executed nine AI baseline tests. All 37 generated mutants were killed.



\## 3. Improvement from v1



The original v1 run used eight tests and achieved a mutation score of 97.30%, with 36 mutants killed and one surviving.



The surviving mutant changed optional chaining in `requireSameUser` from `req.user?.id` to `req.user.id`. An additional test was added to check the behaviour when the authenticated user is missing.



The updated test passed against the original implementation and killed the surviving mutant during mutation testing. The updated run achieved a 100% mutation score.



\## 4. Evidence Files



\- `mutation-v2.json` — machine-readable Stryker results.

\- `mutation-v2.html` — HTML mutation report.

\- `mutation-v1-original.json` — preserved original v1 results.

\- `mutation-v1-original.html` — preserved original v1 HTML report.



\## 5. Remaining D06 Work



The current mutation run targets only `middleware/authMiddleware.js`. The results demonstrate strong mutation coverage for this file, but do not establish coverage of the entire application.



The required surviving-mutant case studies and risk-based test-priority order must be completed and documented separately.

