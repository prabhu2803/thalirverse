# ThalirVerse — Design System & Screen Alignment Guide

> **Source of truth**: All specs derived from the 13 desktop screens in the Stitch project `4570722798405498089`. Every page in the codebase must match these screens. No hardcoded/demo data is permitted — all values must come from Supabase in real time.

---

## 1. Design System Tokens

### Colors
| Token | Value | Usage |
|---|---|---|
| `orange-500` | `#FF9933` | Primary brand, CTAs, active states |
| `orange-600` | `#ea580c` | Hover state for CTAs |
| `orange-50` | `#fff7ed` | Icon backgrounds, badge fills |
| `neutral-900` | `#171717` | Primary text |
| `neutral-500` | `#737373` | Secondary text, placeholders |
| `neutral-100` | `#f5f5f5` | Card borders, dividers |
| `neutral-50` | `#fafafa` | Input backgrounds, table headers |
| `white` | `#ffffff` | Page background, card fills |
| `green-500` | `#22c55e` | Completed states, success |
| `red-500` | `#ef4444` | Error states, failed |
| `blue-600` | `#2563eb` | Informational accents |

### Typography
| Role | Font | Weight | Size |
|---|---|---|---|
| Display / Headline | Inter (`--font-headline`) | 900 (black) | 24–60px |
| Body | Inter (`--font-body`) | 400–500 | 14–18px |
| Label / Badge | Public Sans (`--font-label`) | 600–700 | 10–12px uppercase |

### Spacing
- Base unit: `4px`
- Section padding: `px-6 py-16` (desktop), `px-4 py-10` (mobile)
- Card internal padding: `p-6`
- Gap between cards: `gap-6`

### Border Radius
| Usage | Class | Value |
|---|---|---|
| Buttons | `rounded-xl` | 12px |
| Cards | `rounded-3xl` | 24px |
| Badge pills | `rounded-full` | 9999px |
| Icon containers | `rounded-2xl` | 16px |
| Input fields | `rounded-xl` | 12px |

### Shadows
- Cards: `shadow-sm border border-neutral-100`
- Primary CTA: `shadow-[0_8px_15px_-3px_rgba(255,153,51,0.3)]`
- Modals: `shadow-2xl`

### Shared Components

#### Navbar (Authenticated)
- Fixed/sticky top, `h-16`, `bg-white border-b border-neutral-100 shadow-sm`
- Left: ThalirVerse logo (school icon + brand name in `text-orange-500 font-headline font-black`)
- Center: nav links — Home, Explore, My Learning, Achievements, Community
- Right: notification bell (links to `/notifications`), user avatar/name, sign out button
- Active link: `text-orange-500 font-bold`, inactive: `text-neutral-500 hover:text-orange-500`

#### Navbar (Public)
- Same height and structure
- Right: `Sign In` (ghost) + `Join Now` (orange CTA button)

#### Loading State
```tsx
<div className="flex justify-center items-center min-h-screen bg-white">
  <div className="text-orange-500 font-bold flex flex-col items-center gap-2">
    <span className="animate-spin text-4xl">⏳</span>
    <span>Loading...</span>
  </div>
</div>
```

#### Stat Card
```
bg-white p-6 rounded-3xl border border-neutral-100 shadow-sm
Label: text-xs font-label font-bold text-neutral-400 uppercase tracking-widest
Value: text-4xl font-black font-headline
Trend badge: text-xs font-bold text-green-500 (positive) / text-red-500 (negative)
```

#### Primary Button
```
bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 px-6 rounded-xl
shadow-[0_8px_15px_-3px_rgba(255,153,51,0.3)]
hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all
```

#### Ghost Button
```
bg-transparent border-2 border-slate-200 text-neutral-700
hover:border-orange-500 hover:text-orange-500
font-bold py-3.5 px-6 rounded-xl transition-all
```

---

## 2. Page Inventory & Gap Analysis

### Page 01 — Landing Page
**Route**: `/`
**Stitch Screen**: `c34ae1afe3f64d4caa8e3de3eb3f46eb` (ThalirVerse Landing Page - Desktop Version)
**Current file**: [src/app/page.tsx](src/app/page.tsx)

#### Design Spec (from screen)
- **Navbar**: Logo + navigation links (Home, Explore, Learning, Mentors) + Sign In + Join Now CTA
- **Hero**: "Learn. Lead. Grow." headline, sub-copy, "Register Now" + "Explore Courses" CTAs, social proof ("50k+ students" avatars + 4.9/5 star rating)
- **Features Strip**: 4-column grid — Interactive Learning, Smart Quizzes, Global Certificates, Achievement Badges — with Material icons
- **Courses Section**: Card grid — each course with module count, category tag, arrow — **data from DB**
- **How It Works**: 4 steps numbered with orange circles
- **Benefits Section**: 60/40 split — image left, 3 benefit bullets right
- **Footer**: Logo + links (Privacy, Terms, Support) + copyright

#### Current State
- ✅ Navbar (logo + login/register only — missing full nav links)
- ✅ Hero section with CTAs
- ✅ Category cards (4 static arrays — must be made dynamic)
- ✅ How It Works (4 steps)
- ✅ Benefits section
- ✅ Footer

#### Gaps
| Gap | Priority |
|---|---|
| Navbar missing nav links: Explore, Learning, Mentors | Medium |
| Missing social proof stats banner (student count + rating) | Medium |
| Missing Features Strip (Interactive Learning, Smart Quizzes, etc.) | Medium |
| Course cards are **static arrays** — must pull from `modules` table | **High** |
| `lessonsCount` is hardcoded — must be dynamic from `lessons` JOIN | **High** |

#### Dynamic Data Requirements
- Course cards: `SELECT id, title, description FROM modules WHERE is_published = true ORDER BY order_index`
- Lesson count per card: JOIN with `lessons` table
- Student count stat: `SELECT count(*) FROM profiles WHERE role = 'STUDENT'`

---

### Page 02 — Login
**Route**: `/login`
**Stitch Screen**: `aa74297c42254f31b911a43231c9edfa` (ThalirVerse Login & Register - Desktop Version)
**Current file**: [src/app/login/page.tsx](src/app/login/page.tsx)

#### Design Spec
- **Layout**: 50/50 split — left panel (hero image + "Empower Your Learning Journey" + stat badge), right panel (form)
- **Form**: Email, Password (visibility toggle), Remember Me, Forgot Password, Sign In button
- **Footer of form**: "Don't have an account? Register here"

#### Current State
- ✅ 50/50 layout with hero image
- ✅ Full form with visibility toggle, remember me, forgot password
- ✅ Dynamic auth via `dataService.login()` with role-based redirect
- ✅ Error handling

#### Gaps
| Gap | Priority |
|---|---|
| Left panel tagline says "Learn. Lead. Grow." — design says "Empower Your Learning Journey" | Low |
| Missing "10k+ active learners today" stat badge on left panel (dynamic) | Low |

#### Dynamic Data Requirements
- Active learner count: `SELECT count(*) FROM profiles WHERE role = 'STUDENT'`

---

### Page 03 — Register
**Route**: `/register`
**Stitch Screen**: `aa74297c42254f31b911a43231c9edfa` (shares screen with Login)
**Current file**: [src/app/register/page.tsx](src/app/register/page.tsx)

#### Design Spec
- Same 50/50 split as Login
- Form: First Name, Last Name, Email, Password, Terms acceptance, Create Account button

#### Gaps
| Gap | Priority |
|---|---|
| Verify all fields (full name, school, standard, section, district) are collected | **High** |
| No demo/placeholder data in any field | **High** |
| All values must persist to `profiles` table with no null columns | **High** |

---

### Page 04 — Student Dashboard
**Route**: `/dashboard`
**Stitch Screen**: `a912836db6a846aca5322f77d99fcf0b` (Student Dashboard - Desktop Version)
**Current file**: [src/app/dashboard/page.tsx](src/app/dashboard/page.tsx)

#### Design Spec
- **Navbar**: Full authenticated nav (Home, Explore, My Learning, Achievements, Community) + user avatar/name/tier + logout
- **Welcome Header**: "Welcome back, [Name]!" + student metadata (school, standard)
- **Streak & Credits Cards**: Two stat cards — "🔥 Streak: X Days" (computed) and "💰 Credits: X XP" (from `profiles.xp`)
- **Course Progress Section**: Title + total %, "X of Y modules completed", progress bar
- **Course Cards**: Each with title, description, "Resume Learning" button, progress % + module position
- **Enrolled Courses List**: Each course — title, status (Completed / In Progress / Pending), "View Certificate" if passed
- **Upcoming Deadlines**: Incomplete modules with priority label and arrow
- **Achievements Section**: Badge cards (icon, title, description, locked/unlocked)

#### Current State
- ✅ Navbar (simplified)
- ✅ Welcome header, progress ring, active module card
- ✅ Course overview grid with progress
- ✅ Badges section
- ✅ All data from Supabase

#### Gaps
| Gap | Priority |
|---|---|
| Navbar missing: Explore, My Learning, Achievements, Community links | Medium |
| Missing Streak card — compute from `progress.completed_at` consecutive days | Medium |
| Missing XP/Credits stat card — read from `profiles.xp` | **High** |
| Missing "Enrolled Courses" list view with Completed/Pending/In Progress rows | Medium |
| Missing "View Certificate" link on completed courses | Medium |
| Missing Upcoming Deadlines section (derive from incomplete modules) | Low |
| Achievement badge cards missing description text | Low |

#### Dynamic Data Requirements
- All data from Supabase — zero static values
- Streak: count consecutive days with at least one `progress.completed_at` entry
- XP: `profiles.xp` field (add to DB schema if absent)
- Module completion: JOIN `progress` + `lessons` + `modules`
- Quiz pass: `quiz_attempts WHERE student_id = [id] AND passed = true`

---

### Page 05 — Course View
**Route**: `/courses/[id]`
**Stitch Screen**: `6c597b66222548929c2c00140a29ab1a` (Entrepreneurship 101 - Course View Desktop)
**Current file**: [src/app/courses/[id]/page.tsx](src/app/courses/[id]/page.tsx)

#### Design Spec
- **Layout**: Two-column on desktop — left: sidebar icon nav; right: main content
- **Breadcrumb**: "My Courses > [Category] > [Course Title]"
- **Main Content**: Large video player, lesson title, action row (Download, Mark Complete), tab bar (Overview | Notes | Discussions | Reviews)
- **Module List**: Lessons with completed (check), current (play, highlighted), locked (lock) states and duration display
- **Course Progress**: Top progress bar

#### Current State
- ✅ YouTube player with 90% watch tracking + auto-completion
- ✅ Lesson list with states
- ✅ Progress bar
- ✅ Quiz unlock
- ✅ All data from Supabase

#### Gaps
| Gap | Priority |
|---|---|
| **Single-column layout — needs two-column on desktop (≥1024px)** | **High** |
| Missing sidebar icon navigation | Medium |
| Missing breadcrumb navigation | Medium |
| Missing tab bar (Overview, Notes, Discussions, Reviews) | Medium |
| Missing lesson duration display (needs `duration_seconds` in `lessons` table) | Low |

#### Dynamic Data Requirements
- Module + lessons: `SELECT * FROM modules WHERE id = [id]` + `SELECT * FROM lessons WHERE module_id = [id] ORDER BY order_index`
- Progress: `SELECT * FROM progress WHERE student_id = [uid]`
- Quiz: `SELECT * FROM quizzes JOIN questions JOIN answers WHERE module_id = [id]`
- Video: YouTube IFrame API using `lessons.content_url`

---

### Page 06 — Quiz Question
**Route**: `/quiz/[id]`
**Stitch Screen**: `56303a433fc14d08810819ba77d8ecaa` (Quiz Question Interface - Desktop Version)
**Current file**: [src/app/quiz/[id]/page.tsx](src/app/quiz/[id]/page.tsx)

#### Design Spec
- **Header**: Logo, "Save & Finish" button, timer "24:15"
- **Question Navigator**: Horizontal numbered dots (1–N), colored by state (default / current orange / answered green / review-later yellow)
- **Status Legend**: Answered | Current Question | Not Visited | Review Later
- **Question Card**: Type badge ("Multiple Choice"), question text, optional image/diagram
- **Answer Options**: Lettered A–D, selected = orange border + fill, check_circle indicator
- **Bottom Nav**: "← Previous" / "bookmark Save & Next →"

#### Current State
- ✅ Timer, progress bar, question card, A–D options, Previous/Next
- ✅ Score calculation and submission to `quiz_attempts`
- ✅ All data from Supabase

#### Gaps
| Gap | Priority |
|---|---|
| Replace linear progress bar with horizontal numbered dot navigator | Medium |
| Dots reflect: not-visited / current / answered states | Medium |
| Status legend below navigator | Low |
| "Save & Next" label + bookmark icon (instead of "Next") | Low |
| Question type badge ("Multiple Choice") | Low |

#### Dynamic Data Requirements
- Quiz + questions + answers: `quizzes JOIN questions JOIN answers WHERE module_id = [id]`
- Pass threshold: `quizzes.pass_percentage`
- Submission: `INSERT INTO quiz_attempts (student_id, quiz_id, score, passed, attempted_at)`

---

### Page 07 — Quiz Results
**Route**: `/quiz/[id]/results`
**Stitch Screen**: `74aed98321c349b783a85e8b0f525f40` (Quiz Results & Achievements - Desktop Version)
**Current file**: [src/app/quiz/[id]/results/page.tsx](src/app/quiz/[id]/results/page.tsx)

#### Design Spec
- **Hero Banner**: "QUIZ COMPLETED!" in orange + "Outstanding performance, [Name]!"
- **Metrics**: Score % (large), "X / Y Correct", time taken, "+X XP Earned"
- **Badge Unlock Card**: Badge name, criteria, "View Trophy Room" link
- **Performance Breakdown Table**: Per-question — question number, user answer vs correct answer, ✓/✗, XP per question
- **Actions**: "Continue to Next Lesson →", "Review Answers 👁", share options

#### Current State
- ✅ Score, correct/total, time taken displayed
- ✅ Pass/fail badge card
- ✅ Continue/Retry buttons
- ✅ Confetti on pass

#### Gaps
| Gap | Priority |
|---|---|
| XP is hardcoded (+100 / +0) — must compute from `score × questionsCount × xpPerQuestion` | **High** |
| After pass: `UPDATE profiles SET xp = xp + earnedXP WHERE id = [studentId]` | **High** |
| "QUIZ COMPLETED!" hero banner with student name | Medium |
| Per-question performance breakdown table | Medium |
| Store per-question answers in sessionStorage (quiz page must write these) | Medium |
| Share buttons (native Share API / clipboard) | Low |

#### Dynamic Data Requirements
- Quiz result: `sessionStorage.getItem('quiz_result_[id]')` (set by quiz page)
- Per-question breakdown: quiz page stores `{questionId, userAnswerId, correctAnswerId}[]` in sessionStorage
- XP award: `UPDATE profiles SET xp = xp + earnedXP WHERE id = [studentId]` on pass
- Student name: `getActiveStudent()`

---

### Page 08 — Certificate Verification
**Route**: `/certificate/[id]`
**Stitch Screen**: `ed661584b9e9462cb1bd6338c4bd8c6b` (Certificate Verification Success - Desktop)
**Current file**: [src/app/certificate/[id]/page.tsx](src/app/certificate/[id]/page.tsx)

#### Design Spec
- **Verification Status**: Green `check_circle` animation, "Verification Successful" heading
- **Student Card**: Profile image, student full name, student ID, course title, achievement grade (star icons), issue date, blockchain-style hash, copy icon
- **Certificate Preview**: Full rendered certificate image
- **Actions**: Download PDF, Share Verification Link

#### Current State
- ✅ Green checkmark animation
- ✅ "Certificate Verified" heading
- ✅ Issue date (server-rendered)
- ✅ Download/Share buttons
- ❌ "Issued To" shows raw credential ID string — must show student's full name from DB
- ❌ No hash generation
- ❌ No achievement grade

#### Gaps
| Gap | Priority |
|---|---|
| **Fetch student name from DB**: `SELECT full_name FROM profiles WHERE id = [id]` | **High** |
| Show student full name in "Issued To" field | **High** |
| Verify all modules are complete before showing success — redirect if not graduate | **High** |
| Generate deterministic hash from student ID (simple hex encoding) | Medium |
| Achievement grade: derive from average quiz score across passed attempts | Low |

#### Dynamic Data Requirements
- Student: `SELECT full_name, school, created_at FROM profiles WHERE id = [certificateId]`
- Graduate check: all `modules` must have a passed `quiz_attempts` record for this student
- Issue date: `MIN(completed_at)` from progress or `MIN(attempted_at)` from passed quiz_attempts
- Hash: deterministic from `Buffer.from(studentId).toString('hex').slice(0, 40)` or similar

---

### Page 09 — Student Profile
**Route**: `/profile`
**Stitch Screen**: `466177a9307d4683b2658636fb024dcf` (Student Profile & Achievements - Desktop)
**Current file**: [src/app/profile/page.tsx](src/app/profile/page.tsx)

#### Design Spec
- **Layout**: Two-column — fixed left sidebar + scrollable right main content
- **Left Sidebar**: Large circular avatar (initials), student name + verified badge, title, school, stats row (XP | Courses | Badges), Edit Profile button, nav links (Dashboard, My Learning, Badges, My Profile active, Community)
- **Main Content**:
  - Badges Showcase: 4 cards (unlocked = coloured, locked = grey/grayscale), badge title + description
  - Certificates Section: per-module certificate cards (course name, completion date, PDF download)
  - Activity Feed: timeline (completed courses, started courses, events with timestamps)
  - Current Goal Widget: next milestone with progress bar

#### Current State
- ✅ Student info, school, standard, section, district
- ✅ Badges grid (per module, locked/unlocked)
- ✅ Graduation certificate with lock/unlock logic
- ✅ Edit Profile modal (all fields + password change)
- ✅ All data from Supabase

#### Gaps
| Gap | Priority |
|---|---|
| **Redesign to two-column layout**: left sidebar (avatar + stats + nav) + right main | **High** |
| **Add XP stat** to sidebar (from `profiles.xp`) | **High** |
| Add "Courses Completed" count to sidebar stats | Medium |
| Per-module certificate cards (one per passed module quiz) with download link | Medium |
| Activity feed: ordered list from `progress` + `quiz_attempts` by `created_at DESC` | Medium |
| Current goal widget: next incomplete module | Low |

#### Dynamic Data Requirements
- Student: `getActiveStudent()` + `profiles` table
- XP: `profiles.xp` field
- Module completion: JOIN `progress` + `lessons`
- Quiz passes: `quiz_attempts WHERE student_id = [id] AND passed = true`
- Activity feed: `progress ORDER BY completed_at DESC LIMIT 20`

---

### Page 10 — Course Builder CMS (Admin)
**Route**: `/admin/modules`
**Stitch Screen**: `1dcd6b5566f549268b0930ef39dce295` (Course Builder CMS Dashboard - Desktop)
**Current file**: [src/app/admin/modules/page.tsx](src/app/admin/modules/page.tsx)

#### Design Spec
- **Stats Row**: Total Courses | Active Students | Completion Rate | Average Score
- **Course Table**: Course info (thumbnail + title) | Status (Published/Draft) | Structure (modules × lessons) | Performance (enrolled, avg grade) | Actions (edit, toggle, delete)
- **Controls**: Create New Course button, filter by status, search
- **Layout**: Admin sidebar + main content

#### Current State
- ✅ Module list (card layout)
- ✅ Create module (multi-step wizard)
- ✅ Publish/draft toggle, edit, delete
- ✅ Lesson list per module

#### Gaps
| Gap | Priority |
|---|---|
| **Add stats row** at top (Total Courses, Active Students, Completion Rate, Avg Score) | **High** |
| Convert card layout to table with columns | Medium |
| Add search/filter controls | Medium |

#### Dynamic Data Requirements
- Total courses: `SELECT count(*) FROM modules`
- Active students: `SELECT count(*) FROM profiles WHERE role = 'STUDENT'`
- Completion rate: compute from `progress` + `lessons` + `modules`
- Avg score: `SELECT AVG(score) FROM quiz_attempts WHERE passed = true`

---

### Page 11 — Course Content Manager (Admin Edit)
**Route**: `/admin/edit-module/[id]`
**Stitch Screen**: `31b0db86ccb747ca9f9abb0f98c25f3f` (Course Builder - Content Manager Desktop)
**Current file**: [src/app/admin/edit-module/[id]/page.tsx](src/app/admin/edit-module/[id]/page.tsx)

#### Design Spec
- **Module Cards** (expandable/collapsible): module number, title, lesson count, duration, status badge
- **Nested lessons**: drag handle, video icon, title, runtime, status badge, edit/delete
- **Course Stats Bar**: total modules | total duration | video count | learner count
- **Add Lesson / Add Module** buttons

#### Gaps
| Gap | Priority |
|---|---|
| Expandable/collapsible module structure (expand_less / expand_more) | **High** |
| Course stats bar at top of page | Medium |
| Drag-to-reorder (use up/down arrows as accessible fallback) | Low |

#### Dynamic Data Requirements
- Module + lessons: `SELECT * FROM modules WHERE id = [id]` + lessons JOIN
- Lesson reorder: `UPDATE lessons SET order_index = [n] WHERE id = [lessonId]`
- Learner count: `SELECT count(distinct student_id) FROM progress WHERE module_id = [id]`

---

### Page 12 — Admin Quiz Builder
**Route**: `/admin/modules` (Step 3 of creation wizard) or `/admin/quizzes/[moduleId]`
**Stitch Screen**: `5babfdb5ed874bb5b3302d066c109e29` (Admin Quiz Builder - Desktop)
**Current file**: [src/app/admin/modules/page.tsx](src/app/admin/modules/page.tsx)

#### Design Spec
- **Two-panel layout**: left (question list sidebar with drag handles) + right (question editor)
- **Question editor**: type selector, optional image, answer options (A/B/C) with correct toggle, add option
- **Quiz Settings Panel**: points, pass %, time limit, max attempts, shuffle/show-answers toggles
- **Auto-save** indicator in footer
- **Publish / Save Draft** status strip

#### Current State
- ✅ Step 3 wizard: quiz title, pass %, questions, answers, correct toggle
- ✅ Saves to Supabase via `saveQuiz()`

#### Gaps
| Gap | Priority |
|---|---|
| Time limit and max attempts stored and used in `quizzes` table | Medium |
| Shuffle questions flag on `quizzes` table | Low |
| Two-panel dedicated quiz editor (post-MVP) | Low |

#### Dynamic Data Requirements
- Quiz: upsert to `quizzes` with `time_limit_seconds`, `max_attempts`, `shuffle_questions`
- Questions: upsert to `questions` with `order_index`
- Answers: upsert to `answers` with `is_correct`

---

### Page 13 — Organizer Analytics Dashboard (Admin)
**Route**: `/admin/analytics`
**Stitch Screen**: `bbc49c8ea8ae4fd99076bfadfc16ea10` (Organizer Analytics Dashboard - Desktop)
**Current file**: [src/app/admin/analytics/page.tsx](src/app/admin/analytics/page.tsx)

#### Design Spec
- **Metric Cards**: Total Students | Active Users | Completion Rate | Graduation Rate (with trend arrows)
- **Module Completion Chart**: Horizontal bars, modules M1–MN with % completion
- **Student Status Distribution**: Donut chart — Active / In Progress / Not Started
- **Recent Activity Table**: Student name + avatar, course module, progress %, status, last access, action menu
- **Controls**: Date range ("Last 30 Days"), Export Report, Create New Course

#### Current State
- ✅ Summary stats cards
- ✅ Module completion bars
- ✅ Region + District + School breakdowns
- ✅ All data from Supabase

#### Gaps
| Gap | Priority |
|---|---|
| Add Recent Activity table (student rows with last access timestamp) | Medium |
| Replace Revenue card with Graduation Rate card | Medium |
| Student status donut chart (Active / In Progress / Not Started counts) | Medium |
| Export CSV button (currently on `/admin`, move or duplicate here) | Low |

#### Dynamic Data Requirements
- Recent activity: JOIN `progress` + `profiles` ORDER BY `progress.updated_at DESC` LIMIT 20
- Student status segments: Active (all modules done), In Progress (some done), Not Started (0)
- Graduation rate: `graduates.length / students.length × 100`

---

### Page 14 — Notification Center *(NEW — must be created)*
**Route**: `/notifications`
**Stitch Screen**: `ecbcf4d21326403d84af8b67e96b535a` (Notification Center - Desktop)
**Current file**: **Does not exist**

#### Design Spec
- **Header**: "Notification Center" title + tagline "Stay updated with your learning progress and achievements."
- **Filter Tabs**: All (badge count) | Achievements | Reminders | Modules
- **"Mark all as read"** button (top-right of list)
- **Sections**: "Recent" and "Yesterday" group headers
- **Notification Items**:
  - Coloured icon (workspace_premium / check_circle / alarm / rocket_launch / star)
  - Title (bold), relative timestamp ("2m ago", "1h ago"), body text
  - CTAs: "Download PDF", "Share Achievement", "Continue Learning"
  - Unread dot (orange) on unread items
- **Weekly Goal Widget**: "X% of your targets" progress bar at bottom

#### Notification Types (derive from DB events)
| Type | Trigger | Icon | CTA |
|---|---|---|---|
| Achievement | `quiz_attempts WHERE passed = true` — badge earned | workspace_premium | View Trophy Room |
| Module Completed | All lessons in a module done | check_circle | View Certificate |
| Course Started | First `progress` entry for a module | rocket_launch | Continue Learning |
| Certificate Ready | All modules complete | star | Download PDF |

#### Implementation Plan
```
Route:     /notifications
Auth:      Protected — redirect to /login if no session
Layout:    Authenticated layout with full navbar
```

- **Option A (preferred)**: Add `notifications` table: `(id, student_id, type, title, body, read, created_at, action_url)`. Trigger inserts via Supabase DB triggers or in app code at quiz completion / lesson completion points.
- **Option B (fallback)**: Generate notification feed on-the-fly from `progress` + `quiz_attempts` ordered by `created_at DESC`, map each record to a notification shape.

#### Dynamic Data Requirements
- Read notifications: `SELECT * FROM notifications WHERE student_id = [id] ORDER BY created_at DESC`
- Unread count: `SELECT count(*) FROM notifications WHERE student_id = [id] AND read = false`
- Mark as read: `UPDATE notifications SET read = true WHERE id = [notificationId]`
- Mark all read: `UPDATE notifications SET read = true WHERE student_id = [id]`
- Weekly goal: count completed modules / total modules × 100

---

## 3. Page Status Summary

| Page | Route | Exists | Priority Gaps |
|---|---|---|---|
| Landing | `/` | ✅ | Dynamic course cards |
| Login | `/login` | ✅ | Minor polish only |
| Register | `/register` | ✅ | Verify DB writes |
| Dashboard | `/dashboard` | ✅ | XP card, enrolled list |
| Course View | `/courses/[id]` | ✅ | Two-column desktop layout |
| Quiz | `/quiz/[id]` | ✅ | Dot navigator |
| Quiz Results | `/quiz/[id]/results` | ✅ | Dynamic XP + DB update |
| Certificate | `/certificate/[id]` | ✅ | Fetch student name from DB |
| Profile | `/profile` | ✅ | Two-column layout, XP stat |
| Admin Dashboard | `/admin` | ✅ | Functional |
| Admin Analytics | `/admin/analytics` | ✅ | Recent activity, donut chart |
| Course Builder | `/admin/modules` | ✅ | Stats row |
| Edit Module | `/admin/edit-module/[id]` | ✅ | Expandable structure |
| **Notifications** | `/notifications` | ❌ **MISSING** | Full page to create |

---

## 4. Global Dynamic Data Rules

1. **No static arrays in page components.** Every list of courses, students, quizzes, or badges must be fetched from Supabase at runtime.
2. **Student names, scores, XP, progress** — always from `profiles`, `progress`, `quiz_attempts` tables.
3. **Loading states** — every page shows the loading spinner while fetching.
4. **Auth guard** — every protected page calls `dataService.getActiveStudent()` and redirects to `/login` if null.
5. **Error boundaries** — wrap all data calls in try/catch; show user-friendly error if fetch fails.
6. **No `Math.random()` for meaningful data** — confetti particles are fine; XP values, scores, streaks must be computed from real DB records.
7. **No demo usernames** (e.g., "Arjun Sharma", "Aditya") — only `student.fullName` from the authenticated session.

---

## 5. Supabase Schema Additions Needed

| Table | Column | Type | Purpose |
|---|---|---|---|
| `profiles` | `xp` | `integer DEFAULT 0` | Cumulative XP points |
| `profiles` | `avatar_url` | `text` | Optional profile photo URL |
| `lessons` | `duration_seconds` | `integer` | For duration display in course view |
| `questions` | `image_url` | `text` | Optional diagram/image per question |
| `quizzes` | `time_limit_seconds` | `integer DEFAULT 300` | Timer duration |
| `quizzes` | `max_attempts` | `integer DEFAULT 3` | Retry limit |
| `quizzes` | `shuffle_questions` | `boolean DEFAULT false` | Shuffle flag |
| `notifications` | `id, student_id, type, title, body, read, created_at, action_url` | various | Notification center |

---

## 6. Implementation Priority Order

### Phase 1 — Data accuracy (critical)
1. Certificate page: fetch real student name + graduate check from DB
2. Landing page: dynamic course cards from `modules` table
3. Quiz results: dynamic XP calculation + `profiles.xp` update in Supabase
4. Dashboard: add `profiles.xp` reads + streak computation

### Phase 2 — Layout alignment (desktop design match)
5. Course view: two-column desktop layout (sidebar + content)
6. Profile page: two-column layout with left sidebar stats + XP
7. Admin modules: stats row at top

### Phase 3 — New functionality
8. Create `/notifications` page (Option B fallback first)
9. Quiz: question dot navigator
10. Quiz results: per-question breakdown table

### Phase 4 — Polish
11. Notification bell in navbar with unread count badge
12. Admin analytics: Recent Activity table
13. Admin analytics: Student status donut chart
14. Full navbar links on authenticated pages
