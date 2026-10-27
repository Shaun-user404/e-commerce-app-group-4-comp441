\# D06: Risk-Based Test Prioritisation



\## 1. Purpose



The purpose of test prioritisation is to identify which parts of the e-commerce application should be tested first. Testing is prioritised according to the potential impact of a failure, the likelihood of the failure occurring, and the security or business risks involved.



\## 2. Prioritisation Approach



A risk-based approach is used to rank test areas as Critical, High, Medium, or Low priority. Authentication, authorisation, payment processing, and data integrity receive the highest priority because failures in these areas could expose private information, allow unauthorised actions, or cause incorrect transactions.



This document records the proposed testing priorities. The rankings are based on the risks associated with each feature and do not imply that every listed test has already been executed.



\## 3. Test Priority Ranking



| Priority | Test area | Main risks | Reason for priority |

|---|---|---|---|

| 1 — Critical | Authentication and authorisation | Unauthenticated access, incorrect access permissions, or users accessing another user's resources | Security failures could expose protected functionality and user information. |

| 2 — Critical | Payments and payment webhooks | Invalid payment events being accepted or payment status being incorrectly updated | Failures could affect transaction accuracy and financial integrity. |

| 3 — High | Cart and order management | Incorrect order totals, unauthorised order access, or inconsistent order data | These failures could affect purchases and customer records. |

| 4 — High | Product creation, updates, and deletion | Invalid product data or unauthorised changes to product records | Product errors could affect catalogue accuracy and application behaviour. |

| 5 — High | User account and profile operations | Unauthorised profile access or changes to another user's information | Account data must remain private and protected. |

| 6 — Medium | OAuth login and callback handling | Failed authentication flows or incorrect handling of authentication errors | Failures could prevent users from logging in or create security weaknesses. |

| 7 — Medium | Input validation and error handling | Missing required fields, invalid values, and unhandled errors | Validation reduces incorrect data and improves application reliability. |

| 8 — Low | Health checks and general read-only endpoints | Incorrect status responses or failures when retrieving non-sensitive information | These features matter for monitoring and usability but generally have lower direct business impact. |



\## 4. Mutation Testing Priorities



Mutation testing should focus first on changes that could weaken security or alter important business rules. Priority mutation targets include:



1\. Removing or changing authentication checks.

2\. Changing user identity or resource ownership comparisons.

3\. Removing required-field or input-validation conditions.

4\. Changing payment verification or transaction-status conditions.

5\. Changing cart and order calculations or validation rules.

6\. Removing error-handling and not-found conditions.



For each surviving mutant, the tester should identify the changed behaviour, explain why the existing tests did not detect it, and design a specific test that distinguishes the original implementation from the mutated implementation.



\## 5. Test Execution Order



The recommended execution order is:



1\. Run authentication and authorisation tests.

2\. Test ownership restrictions and attempts to access another user's resources.

3\. Test payment verification and order integrity.

4\. Test product and account operations, including invalid inputs.

5\. Test error handling, missing resources, and exceptional conditions.

6\. Run lower-risk health checks and general read-only endpoint tests.



This order directs testing effort toward failures with the greatest potential impact before spending time on lower-risk functionality.



\## 6. Limitations



The priorities in this document are risk-based recommendations, not measured failure probabilities. Actual test results, application-specific risks, and mutation-testing reports should be used to refine the ranking. This prioritisation plan does not replace the requirement to document the actual surviving mutants from the first mutation-testing run and the specific manual tests used to kill them.



\## 7. Conclusion



Risk-based prioritisation helps focus testing on security, financial integrity, access control, and core e-commerce operations. Mutation testing can then help identify weaknesses in the existing tests and guide the development of additional test cases. The priorities should be reviewed as further test evidence becomes available.

