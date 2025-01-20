/*
  # Add trigger for score calculation

  1. New Trigger
    - Automatically calculates submission scores
*/

-- Create trigger for score calculation
CREATE TRIGGER calculate_score_trigger
  BEFORE INSERT ON submissions
  FOR EACH ROW
  EXECUTE FUNCTION calculate_submission_score();