/*
  # Add collapsed states to user settings

  1. Changes
    - Add restaurants_collapsed and activities_collapsed columns to user_settings
    - Set default values to false
*/

ALTER TABLE user_settings 
ADD COLUMN IF NOT EXISTS restaurants_collapsed boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS activities_collapsed boolean NOT NULL DEFAULT false;