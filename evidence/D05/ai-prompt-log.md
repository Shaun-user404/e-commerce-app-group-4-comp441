# D05: AI Baseline Testing Evidence



## 1. AI Baseline Tests



**Test file:** `test/baseline-ai/authMiddleware.ai.test.js`



**Command executed:**

```cmd

npx mocha test/baseline-ai/authMiddleware.ai.test.js

```



**Result:** 8 tests passed.



## 2. Test Coverage



**Command executed:**

```cmd

npx c8 --reporter=text --reporter=html npx mocha test/baseline-ai/authMiddleware.ai.test.js

```



**Coverage results:**

- Statements: 100%

- Branches: 100%

- Functions: 100%

- Lines: 100%



These results apply to the code measured by this isolated test run, not the entire application.



## 3. Assertion Review



The eight baseline tests use Chai assertions and Sinon stubs to check the authentication middleware's behaviour.



The assertions verify:

- HTTP status codes for rejected requests.

- JSON error messages.

- Whether the decoded user is attached to the request.

- Whether the next middleware function is called.

- Whether JWT verification receives the expected arguments.

- Whether users can access their own resources but are prevented from accessing another user's resources.

- Whether invalid user IDs are rejected.

- Whether custom route parameter names are supported.



**Review conclusion:** The tests check both successful and rejected requests. The valid-token test stubs JWT verification, so it does not independently verify real JWT cryptographic validation.



## 4. AI Prompt Log



The AI assistant was used to help develop and review the baseline test cases, identify the expected assertions, and interpret the test coverage report.



The test cases were reviewed against the middleware's expected behaviour, and the test suite was executed to confirm that all eight tests passed.



## 5. Evidence Files



- `baseline-coverage.png` — screenshot of the passing tests and coverage report.

- `authMiddleware.ai.test.js` — AI baseline test suite.

- `ai-prompt-log.md` — this testing and assertion review record.

