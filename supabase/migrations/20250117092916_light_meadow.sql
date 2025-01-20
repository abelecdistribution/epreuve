/*
  # Schéma de base de données pour l'application Quiz

  1. Tables
    - `admins`: Stocke les administrateurs
      - `id` (uuid, clé primaire)
      - `email` (text, unique)
      - `created_at` (timestamp)
    
    - `quizzes`: Stocke les quiz mensuels
      - `id` (uuid, clé primaire)
      - `title` (text)
      - `description` (text)
      - `month` (date)
      - `created_at` (timestamp)
      - `admin_id` (uuid, clé étrangère)

    - `questions`: Stocke les questions des quiz
      - `id` (uuid, clé primaire)
      - `quiz_id` (uuid, clé étrangère)
      - `question_text` (text)
      - `options` (jsonb)
      - `correct_answer` (integer)
      - `order` (integer)

    - `submissions`: Stocke les soumissions des utilisateurs
      - `id` (uuid, clé primaire)
      - `quiz_id` (uuid, clé étrangère)
      - `email` (text)
      - `answers` (jsonb)
      - `score` (integer)
      - `created_at` (timestamp)

  2. Sécurité
    - RLS activé sur toutes les tables
    - Politiques spécifiques pour les admins et utilisateurs
*/

-- Création de la table des administrateurs
CREATE TABLE admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Création de la table des quiz
CREATE TABLE quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  month date NOT NULL,
  created_at timestamptz DEFAULT now(),
  admin_id uuid REFERENCES admins(id) NOT NULL,
  UNIQUE (month)
);

-- Création de la table des questions
CREATE TABLE questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid REFERENCES quizzes(id) NOT NULL,
  question_text text NOT NULL,
  options jsonb NOT NULL,
  correct_answer integer NOT NULL,
  "order" integer NOT NULL,
  CHECK (correct_answer >= 0 AND correct_answer < jsonb_array_length(options))
);

-- Création de la table des soumissions
CREATE TABLE submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid REFERENCES quizzes(id) NOT NULL,
  email text NOT NULL,
  answers jsonb NOT NULL,
  score integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Activation de RLS
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- Politiques pour les admins
CREATE POLICY "Admins can read all admins"
  ON admins FOR SELECT
  TO authenticated
  USING (auth.uid() IN (SELECT id FROM admins));

CREATE POLICY "Admins can manage quizzes"
  ON quizzes FOR ALL
  TO authenticated
  USING (auth.uid() IN (SELECT id FROM admins))
  WITH CHECK (auth.uid() IN (SELECT id FROM admins));

CREATE POLICY "Admins can manage questions"
  ON questions FOR ALL
  TO authenticated
  USING (auth.uid() IN (SELECT id FROM admins))
  WITH CHECK (auth.uid() IN (SELECT id FROM admins));

CREATE POLICY "Admins can read submissions"
  ON submissions FOR SELECT
  TO authenticated
  USING (auth.uid() IN (SELECT id FROM admins));

-- Politiques pour les utilisateurs publics
CREATE POLICY "Public can read current quiz"
  ON quizzes FOR SELECT
  TO anon
  USING (date_trunc('month', month) = date_trunc('month', CURRENT_DATE));

CREATE POLICY "Public can read quiz questions"
  ON questions FOR SELECT
  TO anon
  USING (quiz_id IN (
    SELECT id FROM quizzes 
    WHERE date_trunc('month', month) = date_trunc('month', CURRENT_DATE)
  ));

CREATE POLICY "Public can submit answers"
  ON submissions FOR INSERT
  TO anon
  WITH CHECK (quiz_id IN (
    SELECT id FROM quizzes 
    WHERE date_trunc('month', month) = date_trunc('month', CURRENT_DATE)
  ));