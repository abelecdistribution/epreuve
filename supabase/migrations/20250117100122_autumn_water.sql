/*
  # Fix Admin Signup Policy

  1. Changes
    - Add policy to allow admin signup when no admins exist
    - Ensure new admin can only set their own ID

  2. Security
    - Only allows insertion if no other admins exist
    - Enforces that the new admin ID matches their auth ID
*/

-- Drop existing insert policy if it exists
DROP POLICY IF EXISTS "Allow admin signup when no admins exist" ON admins;

-- Create new policy for admin signup
CREATE POLICY "Allow admin signup when no admins exist"
  ON admins
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Ensure no other admins exist
    NOT EXISTS (SELECT 1 FROM admins)
    -- Ensure the new admin ID matches their auth ID
    AND id = auth.uid()
  );