/*
  # Fix submissions RLS policy

  1. Changes
    - Drop all existing submission policies
    - Create new simplified policy for public submissions
    - Add policy for admin access
    - Remove JSON validation to fix submission issues

  2. Security
    - Maintain basic email validation
    - Ensure quiz is current
    - Allow admin access to all submissions
*/

-- Drop existing policies
DROP POLICY IF EXISTS "allow_public_quiz_submissions" ON submissions;
DROP POLICY IF EXISTS "allow_admin_view_submissions" ON submissions;
DROP POLICY IF EXISTS "Public can submit answers" ON submissions;

-- Create new simplified policy for public submissions
CREATE POLICY "public_submit_answers"
  ON submissions
  FOR INSERT
  TO anon
  WITH CHECK (
    -- Only allow submissions for current month's quiz
    quiz_id IN (
      SELECT id 
      FROM quizzes 
      WHERE date_trunc('month', month) = date_trunc('month', CURRENT_DATE)
    )
    AND
    -- Basic email validation
    email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  );

-- Admin access policy
CREATE POLICY "admin_manage_submissions"
  ON submissions
  FOR ALL
  TO authenticated
  USING (
    auth.uid() IN (SELECT id FROM admins)
  )
  WITH CHECK (
    auth.uid() IN (SELECT id FROM admins)
  );