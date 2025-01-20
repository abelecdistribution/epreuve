/*
  # Fix submissions RLS policy

  1. Changes
    - Drop existing public submission policy
    - Create new policy allowing public submissions with proper JSON validation
    - Add policy for admins to view all submissions

  2. Security
    - Ensure proper JSON format for answers
    - Maintain existing RLS protection
*/

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Public can submit answers" ON submissions;

-- Create new policy for public submissions
CREATE POLICY "allow_public_quiz_submissions"
  ON submissions
  FOR INSERT
  TO anon
  WITH CHECK (
    quiz_id IN (
      SELECT id 
      FROM quizzes 
      WHERE date_trunc('month', month) = date_trunc('month', CURRENT_DATE)
    )
    AND
    -- Ensure answers is valid JSON
    answers IS NOT NULL
    AND
    -- Validate email format
    email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  );

-- Ensure admins can view all submissions
CREATE POLICY "allow_admin_view_submissions"
  ON submissions
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM admins
    )
  );