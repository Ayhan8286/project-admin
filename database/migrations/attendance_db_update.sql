-- Based on your provided schema, the status column has an inline CHECK constraint.
-- We need to drop that constraint and add a new one that includes 'Leave'.

-- 1. Drop the old constraint. 
-- Since it was created inline defined as `CHECK (status IN ...)` without a name, Postgres assigns a default name like `attendance_status_check`.
ALTER TABLE "attendance" DROP CONSTRAINT IF EXISTS "attendance_status_check";

-- 2. Add the new constraint with the updated list of allowed statuses.
-- I included both 'Leave' (your new request) and 'Excused' (from your original schema) to be safe.
ALTER TABLE "attendance" 
ADD CONSTRAINT "attendance_status_check" 
CHECK (status IN ('Present', 'Absent', 'Late', 'Excused', 'Leave'));
