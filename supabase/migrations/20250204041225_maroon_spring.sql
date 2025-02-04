/*
  # Add archived field to places table

  1. Changes
    - Add `archived` boolean field to places table with default false
    - This allows users to archive their trips and start new ones
    - Archived places won't show up in the main view

  2. Security
    - No changes to RLS policies needed as the existing policies cover the new field
*/

ALTER TABLE places ADD COLUMN IF NOT EXISTS archived boolean DEFAULT false;

-- Update existing records to have archived = false
UPDATE places SET archived = false WHERE archived IS NULL;