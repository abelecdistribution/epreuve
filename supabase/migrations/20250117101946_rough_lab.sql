/*
  # Add banner URL to quizzes

  1. Changes
    - Add banner_url column to quizzes table
*/

ALTER TABLE quizzes
ADD COLUMN IF NOT EXISTS banner_url text;