/*
  # Add user settings table
  
  1. New Tables
    - `user_settings`
      - `user_id` (uuid, primary key)
      - `destination` (text)
      - `base_location` (text)
      - `start_date` (date)
      - `end_date` (date)
      - `distance_unit` (text)
      - `dark_mode` (boolean)
      - `language` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS on `user_settings` table
    - Add policy for authenticated users to manage their own settings
*/

CREATE TABLE IF NOT EXISTS user_settings (
  user_id uuid PRIMARY KEY REFERENCES auth.users,
  destination text,
  base_location text,
  start_date date,
  end_date date,
  distance_unit text CHECK (distance_unit IN ('km', 'mi')),
  dark_mode boolean DEFAULT false,
  language text CHECK (language IN ('en', 'fr')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
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