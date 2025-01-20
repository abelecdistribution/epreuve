/*
  # Add secure function for creating first admin

  1. Changes
    - Add stored procedure for first admin creation
    - Function handles all security checks
    - Ensures atomic operation
*/

CREATE OR REPLACE FUNCTION create_first_admin(admin_id uuid, admin_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if any admin exists
  IF EXISTS (SELECT 1 FROM admins LIMIT 1) THEN
    RAISE EXCEPTION 'An admin already exists';
  END IF;

  -- Insert the first admin
  INSERT INTO admins (id, email)
  VALUES (admin_id, admin_email);
END;
$$;