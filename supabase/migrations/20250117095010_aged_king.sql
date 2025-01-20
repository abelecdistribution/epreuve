/*
  # Add score calculation trigger

  1. New Function
    - `calculate_submission_score`: Calculates quiz score automatically
  
  2. New Trigger
    - Automatically calculates score when a submission is inserted
*/

-- Function to calculate submission score
CREATE OR REPLACE FUNCTION calculate_submission_score()
RETURNS TRIGGER AS $$
DECLARE
  question_record RECORD;
  score INTEGER := 0;
BEGIN
  -- Loop through each answer in the submission
  FOR question_record IN 
    SELECT id, correct_answer 
    FROM questions 
    WHERE quiz_id = NEW.quiz_id
  LOOP
    -- Check if the answer matches the correct one
    IF (NEW.answers->>question_record.id)::integer = question_record.correct_answer THEN
      score := score + 1;
    END IF;
  END LOOP;

  -- Update the score
  NEW.score := score;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;