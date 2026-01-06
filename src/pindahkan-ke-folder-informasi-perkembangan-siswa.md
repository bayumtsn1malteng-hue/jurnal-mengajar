---
goal: Implement Student Monitoring Feature and Standardize UI/UX
version: 1.0
date_created: 2026-01-06
owner: Jurnal Mengajar Team
status: 'Planned'
tags: [feature, refactor, ui, architecture, migration]
---

# Introduction

![Status: Planned](https://img.shields.io/badge/status-Planned-blue)

This plan outlines the implementation of the "Student Behavior and Development Monitoring" feature and the standardization of the UI/UX across the application. It includes migrating toast notifications to `sonner`, replacing native browser alerts with custom Tailwind modals, ensuring ESLint compliance, and establishing the data structure for student tracking.

## 1. Requirements & Constraints

- **REQ-001**: All toast notifications must utilize the `sonner` library. `react-hot-toast` must be completely removed or unused.
- **REQ-002**: Native browser `alert()` and `confirm()` are strictly prohibited. Use custom Tailwind CSS modals (`ConfirmationModal`) for all user confirmations.
- **REQ-003**: UI must strictly follow "Clean/Flat Design" principles: `rounded-2xl` for containers, `rounded-xl` for buttons/inputs, and consistent padding.
- **REQ-004**: The Monitoring feature must implement the "Response to Intervention" (RTI) flow: Data -> Analysis -> Intervention -> Result.
- **REQ-005**: All code must pass ESLint validation without errors (warnings are acceptable if justified).
- **CON-001**: Implementation must rely on `Dexie.js` for local storage; no external backend dependencies for this phase.
- **GUD-001**: Use `lucide-react` for all icons, ensuring consistency in stroke width and style.

## 2. Implementation Steps

### Implementation Phase 1: UI Standardization & Library Migration

- GOAL-001: Standardize feedback mechanisms (Toasts/Modals) and remove inconsistent UI elements.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-001 | Install `sonner` and remove `react-hot-toast` dependencies. Update `src/App.jsx` to replace `<Toaster />` with Sonner's implementation (`richColors` enabled). | | |
| TASK-002 | Create a reusable `ConfirmationModal` component in `src/components/ui/ConfirmationModal.jsx` using Tailwind CSS and Headless UI (or custom state logic) to replace native `confirm()`. | | |
| TASK-003 | Perform a global find-and-replace to update all imports from `react-hot-toast` to `sonner` in all `.jsx` and `.js` files. Ensure named import `{ toast }` is used. | | |
| TASK-004 | Refactor `src/pages/PengaturanPage.jsx`, `src/pages/Kelas.jsx`, and `src/pages/KelasDetail.jsx` to replace any `window.confirm()` calls with the new `ConfirmationModal` component. | | |
| TASK-005 | Run ESLint check and fix any `no-unused-vars` or import errors resulting from the migration. | | |

### Implementation Phase 2: Database & Logic Layer

- GOAL-002: Establish the data structure and analysis logic for Student Monitoring.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-006 | Update `src/db.js` to include two new stores: `student_behaviors` (id, studentId, date, type, category, description, points) and `interventions` (id, studentId, startDate, trigger, problemSummary, actionPlan, status, resultNotes, followUpDate). | | |
| TASK-007 | Create `src/services/monitoringService.js`. Implement `getStudentRiskProfile(studentId)` which calculates risk levels (Green/Yellow/Red) based on attendance (<75%, <90%), grades, and negative behavior count. | | |
| TASK-008 | Implement helper functions in `src/services/monitoringService.js`: `addBehaviorLog`, `createIntervention`, `resolveIntervention`, and `getActiveInterventions`. | | |

### Implementation Phase 3: Monitoring Dashboard & Nudge System

- GOAL-003: Implement the "Big Picture" view and proactive notification system.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-009 | Create `src/pages/MonitoringPage.jsx`. Implement a list view filtering students by Risk Level (Red/Yellow). Display active interventions. | | |
| TASK-010 | Update `src/pages/Dashboard.jsx`. Replace the static menu item logic to include a dynamic "Nudge" component that counts students requiring action (returned by `monitoringService`). | | |
| TASK-011 | Update `src/App.jsx` router to include the `/monitoring` route pointing to `MonitoringPage.jsx`. | | |
| TASK-012 | Refactor `src/pages/Dashboard.jsx` menu grid to include "Perkembangan Siswa" linked to `/monitoring`. | | |

### Implementation Phase 4: Student Detail Integration (360 View)

- GOAL-004: Integrate monitoring inputs directly into the Class/Student workflow.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-013 | Update `src/pages/KelasDetail.jsx`. Add a new tab or section for "Monitoring & Perilaku". | | |
| TASK-014 | Implement a "Log Behavior" form in `src/pages/KelasDetail.jsx` using `sonner` for success feedback. | | |
| TASK-015 | Implement a "Timeline/History" view in `src/pages/KelasDetail.jsx` showing chronological behaviors and interventions. | | |
| TASK-016 | Apply conditional styling to student rows in `src/pages/KelasDetail.jsx` (e.g., yellow/red border or indicator) based on their risk status fetched from `monitoringService`. | | |

## 3. Alternatives

- **ALT-001**: Using `SweetAlert2` for modals. *Rejected*: Inconsistent with the minimalist Tailwind design language and adds unnecessary bundle size.
- **ALT-002**: Separate "Behavior" and "Grades" pages. *Rejected*: Hybrid approach chosen to provide a 360-degree view of the student in one context.

## 4. Dependencies

- **DEP-001**: `sonner` (npm package) for toast notifications.
- **DEP-002**: `lucide-react` for iconography.
- **DEP-003**: `dexie` for local database management.

## 5. Files

- `src/App.jsx`
- `src/db.js`
- `src/components/ui/ConfirmationModal.jsx` (New)
- `src/services/monitoringService.js` (New)
- `src/pages/MonitoringPage.jsx` (New)
- `src/pages/Dashboard.jsx`
- `src/pages/KelasDetail.jsx`
- `src/pages/PengaturanPage.jsx`

## 6. Testing

- **TEST-001**: Verify `window.confirm` is not triggered anywhere in the app; the custom modal appears instead.
- **TEST-002**: Trigger a "Red" risk level by manually inputting >3 negative behaviors for a student, ensure Nudge appears on Dashboard.
- **TEST-003**: Create an intervention for a risky student, ensure Nudge count decreases.
- **TEST-004**: Verify Sonner toasts appear with correct styling (Green for success, Red for error) and Lucide icons.

## 7. Risks & Assumptions

- **RISK-001**: "Alert Fatigue" if the risk algorithm is too sensitive. *Mitigation*: The threshold is set to <75% attendance or >3 negative behaviors to prevent spam.
- **ASSUMPTION-001**: Users will access the monitoring features primarily through the Dashboard Nudge or the specific Class view.

## 8. Related Specifications / Further Reading

- [Dexie.js Documentation](https://dexie.org/)
- [Sonner Documentation](https://sonner.emilkowal.ski/)
