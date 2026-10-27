

\# Order Model Mutation Testing — Hybrid Version (v2)



\## Results



The hybrid test suite completed successfully with 15 passing tests.



\- Total mutants: 74

\- Mutants killed: 72

\- Mutants survived: 2

\- Mutants without coverage: 0

\- Mutation score: 97.30%



The AI baseline mutation score was 58.11%. The hybrid suite improved the score by 39.19 percentage points.



\## Remaining Mutants



Two ArrayDeclaration mutants survived in models/orderModel.js:



1\. Line 71: the \[userId] query parameter array was replaced with an empty array.

2\. Line 94: the \[cart.id] query parameter array was replaced with an empty array.



These survivors indicate that the current tests do not fully detect the effect of removing those query parameters. They remain documented for further investigation.



\## Evidence



\- mutation-v1.html and mutation-v1.json: saved baseline reports

\- mutation-v2.html and mutation-v2.json: hybrid test reports

\- ai-orderModel-v1.test.js: retain the original baseline test suite if available

\- orderModel.hybrid.test.js: hybrid test suite



