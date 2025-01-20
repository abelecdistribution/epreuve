/*
  # Ajout de la contrainte unique email par épreuve

  1. Modifications
    - Suppression des doublons existants (garde la soumission la plus récente)
    - Ajout d'une contrainte unique combinant quiz_id et email
    
  2. Sécurité
    - Préserve les données les plus récentes
    - Empêche les futures soumissions multiples
*/

-- Supprimer les doublons en gardant l'entrée la plus récente
WITH duplicates AS (
  SELECT DISTINCT ON (quiz_id, email) 
    id,
    created_at
  FROM submissions
  ORDER BY quiz_id, email, created_at DESC
)
DELETE FROM submissions
WHERE id NOT IN (SELECT id FROM duplicates);

-- Ajouter la contrainte unique
ALTER TABLE submissions
ADD CONSTRAINT unique_email_per_quiz UNIQUE (quiz_id, email);