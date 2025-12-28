# CHANGE LOG 2025 DECEMBER 29TH
Major improvements and refactoring for better maintainability and UX:

1. Architecture & Refactoring:
   - Extracted DB logic from UI components to `src/services/` (`attendanceService`, `syllabusService`, `dataService`).
   - Moved Excel generation logic to `src/utils/excelGenerator.js`.
   - Implemented "Green Coding" principles by optimizing local DB queries.

2. User Experience (UX):
   - Replaced native browser alerts/confirms with `react-hot-toast` and custom `ConfirmModal`.
   - Updated `MainLayout` navigation with a floating "Jurnal" button and reorganized menu (Absensi & Nilai).
   - Implemented "Card-to-Modal" flow in Rencana Ajar (RPP) for better inspection and editing.
   - Added Z-Index fixes for nested modals (Edit Form over Detail Modal).

3. New Features:
   - Added Excel Export for Student Grades (Rekap Nilai).
   - Added Backup & Restore data feature (JSON format).
   - Added "In-Place Editing" for practice templates (Latihan) inside the Syllabus detail view.
   - Added visual indicators for exercise counts on Syllabus cards.

4. Bug Fixes:
   - Fixed Z-index conflict where Edit form was hidden behind the Detail modal.
   - Fixed layout issues on exercise cards where buttons overlapped text on small screens.