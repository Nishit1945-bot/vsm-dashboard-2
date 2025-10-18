-- Add project_name column to chats table
ALTER TABLE chats ADD COLUMN IF NOT EXISTS project_name TEXT;

-- Update existing chats to have a default project name
UPDATE chats SET project_name = 'Untitled Project' WHERE project_name IS NULL;
