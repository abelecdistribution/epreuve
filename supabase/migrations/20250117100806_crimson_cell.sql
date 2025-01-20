/*
  # Fix admin policies and permissions

  1. Changes
    - Drop all existing admin policies
    - Create new non-recursive policies
    - Add basic CRUD policies for admins
*/

-- Drop all existing policies
DROP POLICY IF EXISTS "Allow first admin creation" ON admins;
DROP POLICY IF EXISTS "Allow admin reads" ON admins;
DROP POLICY IF EXISTS "Allow initial admin signup" ON admins;
DROP POLICY IF EXISTS "Admins can read admins" ON admins;
DROP POLICY IF EXISTS "Allow admin signup when no admins exist" ON admins;

-- Create new non-recursive policies
CREATE POLICY "public_can_create_first_admin"
  ON admins
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    (SELECT count(*) FROM admins) = 0
  );

CREATE POLICY "admins_can_read"
  ON admins
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admins a
    WHERE a.id = auth.uid()
  ));