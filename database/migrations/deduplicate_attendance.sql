-- 1. Create a temporary table to hold the duplicates we want to keep (the most recent one)
CREATE TEMP TABLE attendance_dedup AS
SELECT DISTINCT ON (student_id, date) *
FROM attendance
ORDER BY student_id, date, created_at DESC;

-- 2. Delete all records from the attendance table
TRUNCATE TABLE attendance;

-- 3. Insert the deduplicated records back into the attendance table
INSERT INTO attendance
SELECT * FROM attendance_dedup;

-- 4. Now that duplicates are gone, add the unique constraint
ALTER TABLE attendance ADD CONSTRAINT unique_student_date UNIQUE (student_id, date);

-- 5. Drop the temporary table just to be clean
DROP TABLE attendance_dedup;
