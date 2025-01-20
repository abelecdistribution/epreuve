/*
  # Add quiz dates

  1. Changes
    - Add start_date and end_date columns to quizzes table
    - Update existing quizzes to have default dates
*/

-- Add date columns to quizzes table
ALTER TABLE quizzes
ADD COLUMN start_date timestamptz NOT NULL DEFAULT now(),
ADD COLUMN end_date timestamptz NOT NULL DEFAULT (now() + interval '1 month');

-- Update public quiz access policy to check dates
DROP POLICY IF EXISTS "Public can read current quiz" ON quizzes;
CREATE POLICY "Public can read active quiz"
ON quizzes FOR SELECT
TO anon
USING (
  CURRENT_TIMESTAMP BETWEEN start_date AND end_date
);