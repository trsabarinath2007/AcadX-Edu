# AcadX Excel Import Formats

## Student Excel

The first five columns **must** be in this order:

| Reg No | Email ID | Student Name | Dept | Semester |
|---|---|---|---|---|
| 310624104253 | student@example.com | Student Name | CSE | 5 |

Optional sixth column:

| Section |
|---|
| A |

If Section is omitted, AcadX stores `A`.

Every imported student receives the initial password `student123`.

## Faculty Excel

Recommended columns:

| Department | Faculty Name | Email ID | Courses | Semester | Sections |
|---|---|---|---|---|---|
| CSE | Faculty Name | faculty@example.com | CS501 - Data Structures and Algorithms; CS502 - DBMS | 5 | A,B |

Faculty ID is optional. Course entries can be separated with semicolons, pipes or new lines.

Every imported faculty member receives the initial password `faculty123`.

### Persistence

The import creates MongoDB user documents. They remain available after server restarts and deployments as long as the same MongoDB database is configured. Admin access can be disabled using the user's persistent `active` status.
