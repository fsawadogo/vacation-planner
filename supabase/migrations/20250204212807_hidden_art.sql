/*
  # Add trips table and update places table

  1. New Tables
    - `trips`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `name` (text)
      - `start_date` (date)
      - `end_date` (date)
      - `archived` (boolean)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Changes
    - Add `trip_id` column to `places` table
    - Add foreign key constraint from `places.trip_id` to `trips.id`
    - Update RLS policies for both tables

  3. Security
    - Enable RLS on `trips` table
    - Add policies for authenticated users to manage their own trips
*/

-- Create trips table
CREATE TABLE IF NOT EXISTS trips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  name text NOT NULL,
  start_date date,
  end_date date,
  archived boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Add trip_id to places
ALTER TABLE places 
ADD COLUMN IF NOT EXISTS trip_id uuid REFERENCES trips(id);

-- Enable RLS on trips
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;

-- Create policy for trips
CREATE POLICY "Users can manage their own trips"
  ON trips
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_trips_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update the updated_at column
CREATE TRIGGER update_trips_updated_at
  BEFORE UPDATE ON trips
  FOR EACH ROW
  EXECUTE FUNCTION update_trips_updated_at_column();

-- Update places RLS policy to include trip access
DROP POLICY IF EXISTS "Users can manage their own places" ON places;
CREATE POLICY "Users can manage their own places"
  ON places
  FOR ALL
  TO authenticated
  USING (
    auth.uid() = user_id OR 
    auth.uid() = (SELECT user_id FROM trips WHERE id = trip_id)
  )
  WITH CHECK (
    auth.uid() = user_id OR 
    auth.uid() = (SELECT user_id FROM trips WHERE id = trip_id)
  );

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_places_trip_id ON places(trip_id);
CREATE INDEX IF NOT EXISTS idx_trips_archived ON trips(archived);
CREATE INDEX IF NOT EXISTS idx_trips_user_id ON trips(user_id);