/*
  # Fix admin policies and permissions - Final version

  1. Changes
    - Drop all existing policies
    - Create simplified policies without recursion
    - Add function-based admin check
*/

-- Drop all existing policies
DROP POLICY IF EXISTS "public_can_create_first_admin" ON admins;
DROP POLICY IF EXISTS "admins_can_read" ON admins;

-- Create helper function for admin check
CREATE OR REPLACE FUNCTION is_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM admins
    WHERE id = user_id
  );
$$;

-- Create new simplified policies
CREATE POLICY "allow_first_admin_creation"
  ON admins
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    NOT EXISTS (
      SELECT 1
      FROM admins
      LIMIT 1
    )
  );

CREATE POLICY "allow_admin_reads"
  ON admins
  FOR SELECT
  TO authenticated
  USING (
    is_admin(auth.uid())
  );