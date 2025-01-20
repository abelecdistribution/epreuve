/*
  # Fix answers format in submissions table

  1. Changes
    - Modify the answers column to use text instead of jsonb for better compatibility
    - Update the score calculation function to handle the new format

  2. Security
    - Maintain existing RLS policies
*/

-- Modify the submissions table to use text for answers
ALTER TABLE submissions
DROP COLUMN answers,
ADD COLUMN answers text NOT NULL;

-- Update the score calculation function
CREATE OR REPLACE FUNCTION calculate_submission_score()
RETURNS TRIGGER AS $$
DECLARE
  question_record RECORD;
  score INTEGER := 0;
  answers_object jsonb;
BEGIN
  -- Parse the answers string into jsonb
  answers_object := NEW.answers::jsonb;
  
  -- Loop through each answer in the submission
  FOR question_record IN 
    SELECT id, correct_answer 
    FROM questions 
    WHERE quiz_id = NEW.quiz_id
  LOOP
    -- Check if the answer matches the correct one
    IF (answers_object->>question_record.id::text)::integer = question_record.correct_answer THEN
      score := score + 1;
    END IF;
  END LOOP;

  -- Update the score
  NEW.score := score;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;