# AcadX — Academic Intelligence Platform

AcadX is a MERN-based institution-wide academic management and intelligence platform for Admin, Faculty and Student roles.

## Stack

- React + Vite
- Tailwind CSS
- React Router
- Axios
- Recharts
- Node.js + Express
- MongoDB + Mongoose
- JWT + bcrypt
- Multer
- XLSX
- Ollama + Gemma 3 4B

## Core capabilities

- Controlled authentication; no public student/faculty registration
- Admin-managed students and faculty
- Excel student import
- Departments, semesters, sections and courses
- Faculty course assignment
- Learning materials
- Assignments, submissions and grading
- Quizzes and attempts
- Attendance
- Academic records
- Academic intelligence and risk indicators
- Student AI analysis
- AI study assistant
- Faculty class insights
- AI quiz generator
- Discussion forum
- Notifications
- Responsive desktop/mobile UI
- Collapsible desktop sidebar and mobile drawer

## Setup

1. Extract the ZIP.
2. Open a terminal in the project root.
3. Create `server/.env` using `.env.example` as the template.
4. Add your MongoDB URI and JWT secret.
5. Install dependencies:

```bash
npm install
```

6. Seed demo data:

```bash
npm run seed
```

7. Start development:

```bash
npm run dev
```

- React: http://localhost:5173
- API: http://localhost:3000

For a production-style single server:

```bash
npm run build
npm start
```

Then open http://localhost:3000

## Demo credentials after seeding

Admin:
- Email: `admin@acadx.edu`
- Password: `Admin@123`

Faculty:
- Email: `faculty@acadx.edu`
- Password: `Faculty@123`

Student:
- Email: `student@acadx.edu`
- Password: `Student@123`

Change demo credentials before institutional deployment.

## Ollama

Install Ollama separately and make sure it is running locally. Pull the configured model:

```bash
ollama pull gemma3:4b
```

If Ollama is unavailable, the AI endpoints return a helpful fallback message rather than exposing AI configuration to the browser.

## Excel import

The admin student import accepts `.xlsx` or `.xls` files with these columns:

- Register Number
- Student Name
- Email
- Initial Password
- Semester
- Department
- Section

Column names are matched case-insensitively.

## Security notes

- Keep `server/.env` private.
- AI requests are made by the Express backend.
- Student/faculty accounts are created by admins.
- Backend role middleware protects administrative routes.
- Production deployments should use HTTPS and secure cookie settings.

# AcadX Updated Configuration

## What was fixed

1. **AcadX AI**
   - Production AI uses the Gemini REST API instead of requiring local Ollama.
   - Students can ask academic, programming, DSA, exam and project doubts.
   - Follow-up questions use recent chat history.
   - The AI receives the student's own course/academic context when appropriate.
   - Ollama remains an optional local fallback.
   - Set `GEMINI_API_KEY` in Render/server environment variables.

2. **Permanent MongoDB user storage**
   - Excel imports create real MongoDB `User` documents.
   - Records remain available across restarts/deployments as long as the configured MongoDB database is retained.
   - Admin access control uses the persistent `active` flag. Disabled users cannot log in.
   - Duplicate email/register numbers are rejected rather than creating temporary accounts.

3. **Fixed passwords**
   - Imported and manually created students: `student123`
   - Imported and manually created faculty: `faculty123`
   - Passwords are stored hashed with bcrypt, never as plain text.

4. **Student Excel format**
   Required first five columns:
   `Reg No | Email ID | Student Name | Dept | Semester`
   An optional `Section` column may follow. If omitted, section defaults to `A`.

5. **Faculty Excel import**
   Supports:
   `Department | Faculty Name | Email ID | Courses`
   Optional Faculty ID, Semester and Sections columns are also accepted.
   Multiple courses can be separated by semicolons, pipes or new lines.
   Existing courses are linked to the imported faculty automatically.

6. **Full course content**
   Courses now store description, objectives, prerequisites, units/topics/content, reference books and outcomes in MongoDB.
   Admins can enter the complete syllabus while creating a course.
   Students can view the stored course syllabus and units from My Courses.
   AcadX AI can use this course content when answering related questions.

7. **Performance/reliability**
   - MongoDB connection pooling is enabled.
   - AI requests use bounded context/output and parallel database reads.
   - Course/user indexes were added for common queries.
   - Frontend AI chat keeps a short conversation history to avoid oversized requests.

## Run locally

```bash
npm install
npm --workspace=client install
cp .env.example .env
# Fill MONGO_URI, JWT_SECRET and GEMINI_API_KEY
npm run dev
```

For production:

```bash
npm install
npm run build
npm start
```

Do **not** commit `.env` or real API keys to GitHub.
