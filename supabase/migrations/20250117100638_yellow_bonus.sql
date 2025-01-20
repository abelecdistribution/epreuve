/*
  # Fix admin policies final version

  1. Changes
    - Drop all existing admin policies
    - Create simpler policies without recursion
    - Allow first admin creation without auth
    - Allow admin reads for authenticated users
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Allow initial admin signup" ON admins;
DROP POLICY IF EXISTS "Admins can read admins" ON admins;
DROP POLICY IF EXISTS "Allow admin signup when no admins exist" ON admins;

-- Create new simplified policies
CREATE POLICY "Allow first admin creation"
  ON admins
  FOR INSERT
  TO anon
  WITH CHECK (
    NOT EXISTS (
      SELECT 1 FROM admins
      LIMIT 1
    )
  );

CREATE POLICY "Allow admin reads"
  ON admins
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM admins
    )
  );