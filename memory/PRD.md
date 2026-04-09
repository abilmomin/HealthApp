# Healthmax Tracking - PRD

## Problem Statement
Build an improved Health and Fitness Tracker web application called "Healthmax Tracking" based on the existing Vercel-deployed site. Must demonstrate 7 competencies: Next.js Fundamentals, UI/UX Design, Authentication, Full-Stack API Development, Third-Party Database, RESTful API Integration, and Deployment.

## Architecture
- **Frontend**: React 19 + Tailwind CSS + Recharts + Lucide React
- **Backend**: FastAPI (Python) + MongoDB
- **Auth**: Firebase Authentication (Email/Password + Google Sign-in)
- **External APIs**: CalorieNinja (nutrition search), ExerciseDB (exercise library with fallback)
- **Exercise Library**: Built-in database of 43 exercises + ExerciseDB API integration

## Design
- **Theme**: Green/olive nature theme matching original Vercel site
- **Background**: Forest green gradient (#2d5a27 → #4a7c42)
- **Cards**: Dark navy (#162618)
- **Primary**: Green (#5b9a3c)
- **Accent**: Olive/lime (#8bc34a, #c0c86a)
- **Fonts**: Barlow Condensed (headings), Manrope (body)
- **Icon**: Leaf branding

## What's Been Implemented (Jan 2026)
- [x] Firebase Authentication (Email/Password + Google)
- [x] Protected routes with Firebase token verification
- [x] Dashboard with metric cards and charts (Recharts)
- [x] Workout logger with exercise library (43 exercises + ExerciseDB API)
- [x] Nutrition logger with CalorieNinja API search
- [x] Goal setting with progress tracking bars
- [x] Social features (follow, share, feed)
- [x] Achievements page with streaks and 9 badges
- [x] Profile page with weight logging
- [x] Green/olive theme matching original site
- [x] Responsive sidebar navigation
- [x] All tests passing 100% (iteration 3)

## Prioritized Backlog
### P1
- Workout edit/update, workout templates
- Nutrition daily/weekly summary charts
- More data visualization

### P2
- Exercise demo images/videos
- Meal planning
- CSV export, dark/light toggle
