-- Fix role column in users table
-- This ensures the role column has a default value and is not null

-- First, update any existing NULL roles to 'user'
UPDATE users SET role = 'user' WHERE role IS NULL OR role = '';

-- Then alter the column to have a default value
ALTER TABLE users ALTER COLUMN role SET DEFAULT 'user';
ALTER TABLE users ALTER COLUMN role SET NOT NULL;
