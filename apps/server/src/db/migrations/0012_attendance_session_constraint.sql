-- Drop the overly strict (classCourseId, sessionDate) unique constraint that
-- blocks courses with two timetable slots on the same day. Idempotency is now
-- enforced at the application level via findSessionByCourseDateForWrite.
ALTER TABLE "attendance_sessions" DROP CONSTRAINT IF EXISTS "uq_attendance_session_course_date";
