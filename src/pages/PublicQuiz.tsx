import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Loader2, Send, Lock, ChevronLeft, Star, ArrowRight, Mail, Clock, Info, Book } from 'lucide-react';
import toast from 'react-hot-toast';

interface Question {
  id: string;
  question_text: string;
  options: string[];
  order: number;
}

interface Quiz {
  id: string;
  title: string;
  description: string;
}

const PublicQuiz = () => {
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [step, setStep] = useState<'welcome' | 'email' | 'quiz' | 'review'>('welcome');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const GOOGLE_REVIEW_URL = 'https://www.google.com/search?q=ABELEC+DISTRIBUTION&sca_esv=8ac8d9f2846f5353&rlz=1C1GCEA_enFR1120FR1120&hl=fr-FR&udm=1&sa=X&ved=2ahUKEwj3usenouiKAxV_bKQEHQIBB-IQjGp6BAgmEAE&biw=1920&bih=911&dpr=1';
  const [activeTab, setActiveTab] = useState<'quiz' | 'info'>('quiz');

  const renderInfo = () => (
    <div className="bg-white rounded-lg shadow-lg p-8">
      <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Book className="w-8 h-8 text-[#ca231c]" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 text-center mb-4">
        À propos de l'Épreuve d'ABELEC
      </h2>
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="w-8 h-8 bg-[#ca231c] text-white rounded-full flex items-center justify-center mr-3 flex-shrink-0">1</span>
            Le Concept
          </h3>
          <p className="text-gray-600 mb-4">
            L'Épreuve d'ABELEC est un test de connaissances mensuel composé de 5 questions soigneusement sélectionnées pour tester vos connaissances dans le domaine de l'électricité.
          </p>
          <div className="ml-11">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Les questions portent sur :</h4>
            <ul className="list-disc list-inside space-y-1 text-gray-600">
              <li>L'électricité et ses applications</li>
              <li>Les normes électriques en vigueur</li>
              <li>L'histoire de l'électricité</li>
              <li>La culture générale du domaine</li>
            </ul>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="w-8 h-8 bg-[#ca231c] text-white rounded-full flex items-center justify-center mr-3 flex-shrink-0">2</span>
            Récompenses
          </h3>
          <p className="text-gray-600 ml-11">
            À la fin de chaque mois, un tirage au sort est effectué parmi tous les participants ayant obtenu un score parfait de 5/5. Le gagnant remporte une récompense exceptionnelle !
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="w-8 h-8 bg-[#ca231c] text-white rounded-full flex items-center justify-center mr-3 flex-shrink-0">3</span>
            Règles de Participation
          </h3>
          <ul className="space-y-3 ml-11 text-gray-600">
            <li className="flex items-start">
              <span className="w-1.5 h-1.5 bg-[#ca231c] rounded-full mt-2 mr-2 flex-shrink-0"></span>
              Une seule participation est autorisée par personne et par épreuve mensuelle
            </li>
            <li className="flex items-start">
              <span className="w-1.5 h-1.5 bg-[#ca231c] rounded-full mt-2 mr-2 flex-shrink-0"></span>
              Vous devez répondre à toutes les questions pour valider votre participation
            </li>
            <li className="flex items-start">
              <span className="w-1.5 h-1.5 bg-[#ca231c] rounded-full mt-2 mr-2 flex-shrink-0"></span>
              Pour maximiser vos chances de gagner, nous vous recommandons de laisser un avis sur l'une de nos agences
            </li>
          </ul>
        </div>
      </div>
    </div>
  );

  const renderWelcome = () => (
    <div className="bg-white rounded-lg shadow-lg p-8 text-center">
      <h1 className="text-3xl font-bold text-[#ca231c] mb-4">{quiz?.title}</h1>
      
      <div 
        className="text-gray-600 mb-4 prose max-w-none prose-img:my-0 prose-img:mx-auto"
        dangerouslySetInnerHTML={{ __html: quiz?.description || '' }}
      />
      <div className="bg-red-50 border border-red-100 rounded-lg p-4 mb-4">
        <h2 className="text-xl font-semibold text-gray-900 mb-3">
          Une nouvelle épreuve est disponible !
        </h2>
        <p className="text-gray-600 mb-4">
          Testez vos connaissances et tentez de gagner des récompenses exceptionnelles.
          Le test comporte {questions.length} questions à choix unique.
        </p>
      </div>
      <button
        onClick={() => setStep('email')}
        className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-[#ca231c] hover:bg-[#b01e18] transition-colors duration-200 shadow-sm"
      >
        Tester mes connaissances
        <ArrowRight className="w-5 h-5 ml-2" />
      </button>
    </div>
  );

  const renderEmailStep = () => (
    <div className="bg-white rounded-lg shadow-lg p-8">
      {quiz?.banner_url && (
        <div className="rounded-lg overflow-hidden mb-4">
          <img
            src={quiz.banner_url}
            alt="Quiz banner"
            className="w-full h-48 object-cover"
          />
        </div>
      )}
      <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Mail className="w-8 h-8 text-[#ca231c]" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 text-center mb-4">
        Commençons l'épreuve
      </h2>
      <p className="text-gray-600 text-center mb-4">
        Entrez votre adresse email pour participer à l'épreuve
      </p>
      <div className="max-w-md mx-auto">
        <div className="mb-4">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Votre email
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-[#ca231c] focus:border-[#ca231c]"
            placeholder="exemple@email.com"
            required
          />
        </div>
        <button
          onClick={async () => {
            if (!email) {
              toast.error('Veuillez saisir votre email');
              return;
            }
            
            setCheckingEmail(true);
            try {
              const { data: existingSubmission } = await supabase
                .from('submissions')
                .select('id')
                .eq('quiz_id', quiz?.id)
                .eq('email', email)
                .maybeSingle();

              if (existingSubmission) {
                toast.error('Vous avez déjà participé à cette épreuve');
                return;
              }

              setStep('quiz');
            } catch (error) {
              console.error('Error checking email:', error);
              toast.error('Une erreur est survenue lors de la vérification de l\'email');
            } finally {
              setCheckingEmail(false);
            }
          }}
          disabled={checkingEmail}
          className="w-full inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-[#ca231c] hover:bg-[#b01e18] transition-colors duration-200"
        >
          {checkingEmail ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Vérification...
            </>
          ) : (
            <>
              Commencer l'épreuve
              <ArrowRight className="w-5 h-5 ml-2" />
            </>
          )}
        </button>
      </div>
    </div>
  );

  useEffect(() => {
    loadCurrentQuiz();
  }, []);

  const handleAnswerSelect = (questionId: string, answerIndex: number) => {
    setAnswers({ ...answers, [questionId]: answerIndex });
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const loadCurrentQuiz = async () => {
    try {
      const { data: quizData, error: quizError } = await supabase
        .from('quizzes')
        .select('*')
        .gte('end_date', new Date().toISOString())
        .lte('start_date', new Date().toISOString())
        .maybeSingle();

      if (!quizData) {
        setLoading(false);
        return;
      }
      
      if (quizError) throw quizError;

      setQuiz(quizData);

      const { data: questionsData, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .eq('quiz_id', quizData.id)
        .order('order');

      if (questionsError) throw questionsError;
      setQuestions(questionsData);
    } catch (error) {
      console.error('Error loading quiz:', error);
      toast.error('Erreur lors du chargement du quiz');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quiz) return;
    
    if (!email) {
      toast.error('Veuillez saisir votre email');
      return;
    }

    if (Object.keys(answers).length !== questions.length) {
      toast.error('Veuillez répondre à toutes les questions');
      return;
    }

    try {
      // Convertir l'objet answers en chaîne JSON
      const answersString = JSON.stringify(answers);

      const { error } = await supabase.from('submissions').insert({
        quiz_id: quiz.id,
        email,
        answers: answersString,
        score: 0, // Le score sera calculé côté serveur
      });

      if (error) throw error;
      setStep('review');
      setSubmitted(true);
      toast.success('Épreuve soumise avec succès !');
    } catch (error) {
      console.error('Error submitting test:', error);
      if (error.code === '23505') {
        toast.error('Vous avez déjà participé à cette épreuve');
      } else {
        toast.error('Erreur lors de la soumission de l\'épreuve');
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#ca231c]" />
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="fixed bottom-4 right-4">
          <button
            onClick={() => navigate('/admin/login')}
            className="hidden md:flex items-center gap-2 px-3 py-1.5 text-white hover:text-gray-200 text-sm bg-black/50 hover:bg-black/70 rounded-md shadow-sm backdrop-blur-sm transition-all duration-200"
          >
            <Lock className="w-3.5 h-3.5" />
            Administration
          </button>
        </div>
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-xs mx-auto mb-8">
            <img
              src="https://i.ibb.co/5K8VFLb/Quiz-1.png"
              alt="Quiz Logo"
              className="w-full h-auto"
            />
          </div>
          <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md mx-auto">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Clock className="w-8 h-8 text-[#ca231c]" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            Aucune épreuve disponible
          </h1>
          <p className="text-gray-600 mb-2">
            Il n'y a pas de quiz actif pour le moment.
          </p>
          <p className="text-gray-500 text-sm">
            Revenez plus tard pour participer au prochain quiz !
          </p>
          </div>
        </div>
      </div>
    );
  }

  const renderQuestion = () => {
    const currentQuestion = questions[currentQuestionIndex];
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 relative">
        {quiz?.banner_url && (
          <div className="rounded-lg overflow-hidden mb-4">
            <img
              src={quiz.banner_url}
              alt="Quiz banner"
              className="w-full h-48 object-cover"
            />
          </div>
        )}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">
              Question {currentQuestionIndex + 1} sur {questions.length}
            </h2>
            <span className="text-sm text-gray-500">
              {Math.round(((currentQuestionIndex + 1) / questions.length) * 100)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-[#ca231c] h-2 rounded-full transition-all duration-300"
              style={{
                width: `${((currentQuestionIndex + 1) / questions.length) * 100}%`,
              }}
            />
          </div>
        </div>

        <h3 className="text-xl font-medium text-gray-900 mb-4">
          {currentQuestion.question_text}
        </h3>
        <div className="space-y-3">
          {currentQuestion.options.filter(option => option !== '').map((option, optionIndex) => (
            <label
              key={optionIndex}
              className="flex items-center space-x-3 p-4 bg-white rounded-md border border-gray-200 cursor-pointer hover:bg-red-50 transition-colors duration-200"
            >
              <input
                type="radio"
                name={currentQuestion.id}
                value={optionIndex}
                checked={answers[currentQuestion.id] === optionIndex}
                onChange={() => handleAnswerSelect(currentQuestion.id, optionIndex)}
                className="h-4 w-4 text-[#ca231c] focus:ring-[#ca231c]"
              />
              <span className="text-gray-700">{option}</span>
            </label>
          ))}
        </div>

        <div className="mt-4 flex justify-between items-center">
          <button
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Question précédente
          </button>
          {currentQuestionIndex === questions.length - 1 && (
            <button
              onClick={handleSubmit}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-[#ca231c] hover:bg-[#b01e18]"
            >
              <Send className="w-5 h-5 mr-2" />
              Valider l'épreuve
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderReview = () => (
    <div className="bg-white rounded-lg shadow-lg p-8 text-center">
      <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Star className="w-8 h-8 text-[#ca231c]" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        Merci pour votre participation !
      </h2>
      <p className="text-gray-600 mb-4">
        Pour confirmer votre participation et avoir une chance de gagner, 
        laissez-nous un avis sur Google en cliquant sur le bouton ci-dessous.
      </p>
      <a
        href={GOOGLE_REVIEW_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-[#ca231c] hover:bg-[#b01e18] transition-colors duration-200"
      >
        <Star className="w-5 h-5 mr-2" />
        Laisser un avis sur Google
      </a>
    </div>
  );

  if (submitted) {
    return renderReview();
  }

  return (
    <div className="min-h-screen bg-gray-50 py-2.5">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="max-w-xs mx-auto mb-2.5">
          <img
            src="https://i.ibb.co/5K8VFLb/Quiz-1.png"
            alt="Quiz Logo"
            className="w-full h-auto"
          />
        </div>
        <div className="fixed bottom-4 right-4">
          <button
            onClick={() => navigate('/admin/login')}
            className="hidden md:flex items-center gap-2 px-3 py-1.5 text-white hover:text-gray-200 text-sm bg-black/50 hover:bg-black/70 rounded-md shadow-sm backdrop-blur-sm transition-all duration-200"
          >
            <Lock className="w-3.5 h-3.5" />
            Administration
          </button>
        </div>
        <div className="max-w-3xl mx-auto">
          <div className="mb-2.5 flex justify-center space-x-4">
            <button
              onClick={() => setActiveTab('quiz')}
              className={`px-4 py-2 rounded-md flex items-center transition-colors duration-200 ${
                activeTab === 'quiz'
                  ? 'bg-[#ca231c] text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Star className="w-4 h-4 mr-2" />
              L'Épreuve
            </button>
            <button
              onClick={() => setActiveTab('info')}
              className={`px-4 py-2 rounded-md flex items-center transition-colors duration-200 ${
                activeTab === 'info'
                  ? 'bg-[#ca231c] text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Info className="w-4 h-4 mr-2" />
              Informations
            </button>
          </div>
          
          {activeTab === 'info' && renderInfo()}
          {activeTab === 'quiz' && (
            <>
              {step === 'welcome' && renderWelcome()}
              {step === 'email' && renderEmailStep()}
              {step === 'quiz' && renderQuestion()}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PublicQuiz;
