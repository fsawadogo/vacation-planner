/*
  # Add archived column to places table

  1. Changes
    - Add `archived` column to `places` table with default value of false
    - Update existing records to set archived = false
    - Add index on archived column for better query performance

  2. Notes
    - Non-destructive change that maintains existing data
    - Adds ability to archive places for completed trips
*/

-- Add archived column if it doesn't exist
ALTER TABLE places ADD COLUMN IF NOT EXISTS archived boolean DEFAULT false;

-- Update existing records to have archived = false
UPDATE places SET archived = false WHERE archived IS NULL;

-- Add index for better query performance since we'll filter by archived status
CREATE INDEX IF NOT EXISTS idx_places_archived ON places(archived);

-- Update RLS policy to include archived status
DROP POLICY IF EXISTS "Users can manage their own places" ON places;
CREATE POLICY "Users can manage their own places"
  ON places
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);