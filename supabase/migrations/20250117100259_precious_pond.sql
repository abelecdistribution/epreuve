/*
  # Fix admin signup policy

  1. Changes
    - Drop existing policy that causes infinite recursion
    - Create new policy using a more efficient approach
    - Add policy for public signup when no admins exist
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Allow admin signup when no admins exist" ON admins;
DROP POLICY IF EXISTS "Admins can read all admins" ON admins;

-- Create new policies
CREATE POLICY "Allow initial admin signup"
  ON admins
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    NOT EXISTS (
      SELECT 1 FROM admins
      WHERE id != auth.uid()
      LIMIT 1
    )
  );

CREATE POLICY "Admins can read admins"
  ON admins
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admins
    WHERE id = auth.uid()
  ));