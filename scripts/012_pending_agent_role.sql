-- Add pending_agent to user_role enum
-- Required because TypeScript UserRole type includes 'pending_agent' but DB enum did not.
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'pending_agent';
