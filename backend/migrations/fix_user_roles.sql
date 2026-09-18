-- Fix user roles migration
-- This script updates all users with empty or NULL roles to have 'user' role

-- Update existing users with NULL or empty roles
UPDATE users SET role = 'user' WHERE role IS NULL OR role = '';

-- Update users who are doctors to have 'doctor' role
UPDATE users SET role = 'doctor' 
WHERE id IN (
    SELECT user_id FROM doctors WHERE user_id IS NOT NULL
);

-- Set default value for the role column (if not already set)
ALTER TABLE users ALTER COLUMN role SET DEFAULT 'user';

-- Make sure the role column is NOT NULL
ALTER TABLE users ALTER COLUMN role SET NOT NULL;

-- Verify the changes
SELECT id, email, role FROM users WHERE role IS NULL OR role = '';
