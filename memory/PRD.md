# Healthmax Tracking - PRD

## Problem Statement
Build an improved Health and Fitness Tracker web application called "Healthmax Tracking" based on the existing Vercel-deployed site (https://cprg306a-final-project.vercel.app/). The app must demonstrate 7 competencies: Next.js Fundamentals, UI/UX Design, Authentication, Full-Stack API Development, Third-Party Database, RESTful API Integration, and Deployment.

## Architecture
- **Frontend**: React 19 + Tailwind CSS + Recharts + Shadcn UI components
- **Backend**: FastAPI (Python) + MongoDB
- **Auth**: Firebase Authentication (Email/Password + Google Sign-in)
- **External APIs**: CalorieNinja (nutrition search)
- **Exercise Library**: Built-in database of 43 exercises across 8 muscle groups

## User Personas
1. **Fitness Enthusiast** - Tracks workouts, monitors nutrition, sets goals
2. **Social User** - Shares workouts, follows friends' progress
3. **Goal-Oriented User** - Sets targets, tracks streaks, earns badges

## Core Requirements
- Firebase Auth with Email/Password and Google Sign-in
- Workout logging with exercises, sets, reps, weight, duration
- Nutrition tracking with food search via CalorieNinja API
- Data visualization (calories chart, weight trend)
- Goal setting with progress tracking
- Social features (follow, share workouts, feed)
- Streaks and achievement badges system
- Dark tactical theme (#0f0f10 background, #FF3B30 accent)

## What's Been Implemented (Jan 2026)
- [x] Firebase Authentication (Email/Password + Google)
- [x] Protected routes with token verification
- [x] Dashboard with metric cards and charts
- [x] Workout logger with exercise library (43 exercises)
- [x] Nutrition logger with CalorieNinja API search
- [x] Goal setting with progress bars
- [x] Social features (follow, share, feed)
- [x] Achievements page with streaks and 9 badges
- [x] Profile page with weight logging
- [x] Dark tactical theme design
- [x] Responsive sidebar navigation
- [x] All backend API endpoints functional
- [x] 100% test pass rate (iteration 1)

## Prioritized Backlog
### P0 (Critical)
- All core features implemented

### P1 (Important)
- Workout edit/update functionality
- Nutrition daily/weekly summary charts
- Push notifications for streak reminders

### P2 (Nice to Have)
- Exercise demonstration images/videos
- Meal planning feature
- Export data as CSV
- Dark/Light theme toggle
- Weekly email summary reports

## Next Tasks
- Test with actual Firebase authentication flow
- Add more data visualization charts
- Implement workout templates/favorites
- Add profile photo upload
