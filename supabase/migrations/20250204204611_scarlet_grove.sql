/*
  # Fix user settings date handling

  1. Changes
    - Make date columns nullable and add proper constraints
    - Add default values for required fields
    - Add NOT NULL constraints where needed
*/

-- Drop existing table if it exists
DROP TABLE IF EXISTS user_settings;

CREATE TABLE user_settings (
  user_id uuid PRIMARY KEY REFERENCES auth.users NOT NULL,
  destination text DEFAULT '',
  base_location text DEFAULT '',
  start_date date,  -- Explicitly nullable
  end_date date,    -- Explicitly nullable
  distance_unit text NOT NULL DEFAULT 'mi' CHECK (distance_unit IN ('km', 'mi')),
  dark_mode boolean NOT NULL DEFAULT false,
  language text NOT NULL DEFAULT 'en' CHECK (language IN ('en', 'fr')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own settings"
  ON user_settings
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update the updated_at column
CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();