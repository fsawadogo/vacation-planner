/*
  # Create places table for Miami Trip Planner

  1. New Tables
    - `places`
      - `id` (uuid, primary key)
      - `name` (text) - Name of the place
      - `type` (text) - Restaurant or Activity
      - `address` (text) - Full address
      - `distance` (numeric) - Distance from Airbnb in miles
      - `notes` (text) - Additional notes
      - `visited` (boolean) - Track if visited
      - `rating` (integer) - Rating out of 5
      - `created_at` (timestamp)
      - `user_id` (uuid) - Reference to auth.users
  
  2. Security
    - Enable RLS
    - Add policies for authenticated users to manage their places
*/

CREATE TABLE places (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('restaurant', 'activity')),
  address text NOT NULL,
  distance numeric NOT NULL DEFAULT 0,
  notes text,
  visited boolean DEFAULT false,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users NOT NULL
);

ALTER TABLE places ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own places"
  ON places
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);