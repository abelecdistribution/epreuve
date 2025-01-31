import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { PlusCircle, Save, Trash2, LogOut, Users, FileEdit, Download, Search, ChevronDown, Calendar, Clock, Eye, Trophy } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import RichTextEditor from '../components/RichTextEditor';

interface Question {
  id?: string;
  question_text: string;
  options: string[];
  correct_answer: number;
  order: number;
}

interface Quiz {
  id?: string;
  title: string;
  description: string;
  month: string;
  start_date: string;
  end_date: string;
}

interface Submission {
  email: string;
  created_at: string;
  answers: Record<string, number>;
  score: number;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<Quiz>({
    title: '',
    description: '',
    month: new Date().toISOString().slice(0, 7) + '-01',
    start_date: new Date().toISOString().slice(0, 16),
    end_date: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().slice(0, 16),
  });
  const [questions, setQuestions] = useState<Question[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bannerUrl, setBannerUrl] = useState('');
  const [activeTab, setActiveTab] = useState<'list' | 'edit' | 'submissions'>('list');
  const [allQuizzes, setAllQuizzes] = useState<Quiz[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);
  const [quizParticipants, setQuizParticipants] = useState<Record<string, number>>({});
  const [sortConfig, setSortConfig] = useState<{
    key: 'email' | 'created_at' | 'score';
    direction: 'asc' | 'desc';
  }>({ key: 'created_at', direction: 'desc' });
  const [drawingWinner, setDrawingWinner] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [confetti, setConfetti] = useState<{ id: number; style: React.CSSProperties }[]>([]);

  // Fonction pour créer un confetti
  const createConfetti = () => {
    const colors = ['#ca231c', '#fbbf24', '#34d399', '#60a5fa', '#a78bfa'];
    const confettiCount = 50;
    const newConfetti = Array.from({ length: confettiCount }).map((_, i) => ({
      id: Date.now() + i,
      style: {
        left: `${Math.random() * 100}vw`,
        backgroundColor: colors[Math.floor(Math.random() * colors.length)],
        transform: `rotate(${Math.random() * 360}deg)`,
        animationDelay: `${Math.random() * 2}s`,
      },
    }));
    setConfetti(newConfetti);
    setTimeout(() => setConfetti([]), 4000);
  };

  // Fonction pour le tirage au sort
  const drawWinner = async () => {
    if (!selectedQuizId || drawingWinner || winner) return;

    const currentQuiz = allQuizzes.find(q => q.id === selectedQuizId);
    if (!currentQuiz) {
      toast.error('Quiz non trouvé');
      return;
    }

    setDrawingWinner(true);
    const perfectScoreSubmissions = filteredAndSortedSubmissions.filter(
      (submission) => submission.score === 5
    );

    if (perfectScoreSubmissions.length === 0) {
      toast.error('Aucun participant n\'a obtenu un score parfait');
      setDrawingWinner(false);
      return;
    }

    // Animation de sélection aléatoire
    let counter = 0;
    const totalSteps = 20;
    const interval = setInterval(async () => {
      const randomIndex = Math.floor(Math.random() * perfectScoreSubmissions.length);
      const tempWinner = perfectScoreSubmissions[randomIndex].email;
      setWinner(tempWinner);
      counter++;

      if (counter >= totalSteps) {
        clearInterval(interval);
        // Sélection finale
        const finalIndex = Math.floor(Math.random() * perfectScoreSubmissions.length);
        const finalWinner = perfectScoreSubmissions[finalIndex].email;
        setWinner(finalWinner);
        
        try {
          const { data: updatedQuiz, error: updateError } = await supabase
            .from('quizzes')
            .update({
              drawn_winner_email: finalWinner
            })
            .eq('id', selectedQuizId)
            .select()
            .single();

          if (updateError) throw updateError;

          // Mettre à jour la liste des quiz avec le nouveau gagnant
          setAllQuizzes(prevQuizzes =>
            prevQuizzes.map(quiz =>
              quiz.id === selectedQuizId
                ? { ...quiz, drawn_winner_email: finalWinner }
                : quiz
            )
          );

          setDrawingWinner(false);
          createConfetti();
          toast.success('Le gagnant a été tiré au sort !');
        } catch (error) {
          console.error('Error saving winner:', error);
          toast.error('Erreur lors de la sauvegarde du gagnant');
          setDrawingWinner(false);
          setWinner(null);
        }
      }
    }, 500);
  };

  useEffect(() => {
    loadQuizzes();
  }, []);

  useEffect(() => {
    if (allQuizzes.length > 0) {
      loadAllParticipantsCounts();
    }
  }, [allQuizzes]);

  const loadAllParticipantsCounts = async () => {
    try {
      const { data, error } = await supabase
        .from('submissions')
        .select('quiz_id')
        .in('quiz_id', allQuizzes.map(quiz => quiz.id || ''));

      if (error) throw error;

      const counts: Record<string, number> = {};
      data.forEach(submission => {
        counts[submission.quiz_id] = (counts[submission.quiz_id] || 0) + 1;
      });
      setQuizParticipants(counts);
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error loading participants counts:', error.message);
      }
    }
  };

  const loadQuizzes = async () => {
    try {
      const { data: quizzes, error } = await supabase
        .from('quizzes')
        .select('*')
        .order('start_date', { ascending: false });

      if (error) throw error;
      setAllQuizzes(quizzes || []);
    } catch (error) {
      console.error('Error loading quizzes:', error);
      toast.error('Erreur lors du chargement des quiz');
    }
  };

  const handleCreateNewQuiz = () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    setQuiz({
      title: '',
      description: '',
      month: startOfMonth.toISOString().slice(0, 10),
      start_date: startOfMonth.toISOString().slice(0, 16),
      end_date: endOfMonth.toISOString().slice(0, 16),
    });
    setQuestions([]);
    setBannerUrl('');
    setActiveTab('edit');
  };

  const handleEditQuiz = async (quizId: string) => {
    try {
      const { data: currentQuiz, error: checkError } = await supabase
        .from('quizzes')
        .select('*')
        .eq('id', quizId)
        .single();

      if (checkError) throw checkError;

      if (!currentQuiz) {
        toast.error('Quiz non trouvé');
        return;
      }

      // Avertissement si le quiz est en cours
      const now = new Date();
      const isActive = now >= new Date(currentQuiz.start_date) && now <= new Date(currentQuiz.end_date);
      
      if (isActive) {
        const confirm = window.confirm(
          'ATTENTION : Ce quiz est actuellement en cours. ' +
          'La modification pourrait affecter les participants actuels. ' +
          'Voulez-vous vraiment continuer ?'
        );
        
        if (!confirm) return;
        
        toast.warning(
          'Vous modifiez un quiz en cours. Les changements seront immédiatement visibles pour les participants.',
          { duration: 5000 }
        );
      }

      // Formater les dates pour l'input datetime-local
      setQuiz({
        ...currentQuiz,
        start_date: new Date(currentQuiz.start_date).toISOString().slice(0, 16),
        end_date: new Date(currentQuiz.end_date).toISOString().slice(0, 16)
      });
      setBannerUrl(currentQuiz.banner_url || '');

      const { data: questionsData } = await supabase
        .from('questions')
        .select('*')
        .eq('quiz_id', quizId)
        .order('order');

      if (questionsData) {
        setQuestions(questionsData);
      }

      setActiveTab('edit');
    } catch (error) {
      console.error('Error loading quiz:', error);
      toast.error('Erreur lors du chargement du quiz');
    }
  };

  const handleDeleteQuiz = async (quizId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce quiz ?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('quizzes')
        .delete()
        .eq('id', quizId);

      if (error) throw error;

      toast.success('Quiz supprimé avec succès');
      loadQuizzes();
    } catch (error) {
      console.error('Error deleting quiz:', error);
      toast.error('Erreur lors de la suppression du quiz');
    }
  };

  const loadCurrentQuiz = async () => {
    try {
      const { data: quizData, error: quizError } = await supabase
        .from('quizzes')
        .select('*')
        .eq('month', new Date().toISOString().slice(0, 7) + '-01')
        .maybeSingle();

      if (quizData) {
        setQuiz(quizData);
        setBannerUrl(quizData.banner_url || '');

        const { data: questionsData } = await supabase
          .from('questions')
          .select('*')
          .eq('quiz_id', quizData.id)
          .order('order');

        if (questionsData) {
          setQuestions(questionsData);
        }

        const { data: submissionsData } = await supabase
          .from('submissions')
          .select('*')
          .eq('quiz_id', quizData.id)
          .order('created_at', { ascending: false });

        if (submissionsData) {
          setSubmissions(submissionsData);
        }
      }
    } catch (error) {
      console.error('Error loading quiz:', error);
      toast.error('Une erreur est survenue lors du chargement du quiz');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error during logout:', error);
    }
    navigate('/');
  };

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        question_text: '',
        options: ['', ''],
        correct_answer: 0,
        order: questions.length,
      },
    ]);
  };

  const updateQuestion = (index: number, field: keyof Question, value: any) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    setQuestions(newQuestions);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const saveQuiz = async () => {
    if (questions.length !== 5) {
      toast.error('Le quiz doit contenir exactement 5 questions');
      return;
    }

    if (new Date(quiz.end_date) <= new Date(quiz.start_date)) {
      toast.error('La date de fin doit être postérieure à la date de début');
      return;
    }

    const startDate = new Date(quiz.start_date);
    const endDate = new Date(quiz.end_date);

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Utilisateur non authentifié');
      }

      let quizId = quiz.id;

      // Formater les dates correctement pour PostgreSQL
      const quizData = {
        ...quiz,
        admin_id: user.id,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        month: new Date(startDate.getFullYear(), startDate.getMonth(), 1).toISOString().split('T')[0],
        banner_url: bannerUrl || null
      };

      if (!quizId) {
        // Vérifier si un quiz existe déjà pour ce mois
        const { data: existingQuiz } = await supabase
          .from('quizzes')
          .select('id')
          .eq('month', quizData.month)
          .maybeSingle();

        if (existingQuiz) {
          throw { code: '23505', message: 'Un quiz existe déjà pour ce mois' };
        }

        const { data: newQuiz, error: quizError } = await supabase
          .from('quizzes')
          .insert(quizData)
          .select()
          .single();

        if (quizError) throw quizError;
        if (!newQuiz) {
          throw new Error('Erreur lors de la création du quiz');
        }
        quizId = newQuiz.id;
      } else {
        const { error: updateError } = await supabase
          .from('quizzes')
          .update({
            ...quizData,
            admin_id: user.id
          })
          .eq('id', quizId);

        if (updateError) throw updateError;
      }

      // Supprimer les anciennes questions
      if (quiz.id) {
        const { error: deleteError } = await supabase
          .from('questions')
          .delete()
          .eq('quiz_id', quiz.id);
        
        if (deleteError) throw deleteError;
      }

      // Insérer les nouvelles questions
      const { error: questionsError } = await supabase
        .from('questions')
        .insert(questions.map((q) => ({
          ...q,
          quiz_id: quizId,
          options: q.options.filter(option => option !== '')
        })));

      if (questionsError) throw questionsError;

      toast.success('Quiz enregistré avec succès');
      loadQuizzes();
      setActiveTab('list');
    } catch (error) {
      console.error('Error saving quiz:', error);
      if (error?.code === '23505') {
        toast.error('Un quiz existe déjà pour ce mois');
      } else if (error?.message === 'Utilisateur non authentifié') {
        toast.error('Vous devez être connecté pour créer un quiz');
        navigate('/admin/login');
      } else {
        toast.error('Erreur lors de l\'enregistrement du quiz');
      }
    } finally {
      setSaving(false);
    }
  };

  const loadQuizSubmissions = async (quizId: string) => {
    try {
      // Charger les soumissions et les informations du quiz
      const [submissionsResponse, quizResponse] = await Promise.all([
        supabase
          .from('submissions')
          .select('*')
          .eq('quiz_id', quizId)
          .order('created_at', { ascending: false }),
        supabase
          .from('quizzes')
          .select('drawn_winner_email')
          .eq('id', quizId)
          .single()
      ]);

      if (submissionsResponse.error) throw submissionsResponse.error;
      if (quizResponse.error) throw quizResponse.error;

      setSubmissions(submissionsResponse.data || []);
      setSelectedQuizId(quizId);
      setWinner(quizResponse.data.drawn_winner_email);
      setActiveTab('submissions');
    } catch (error) {
      console.error('Error loading submissions:', error);
      toast.error('Erreur lors du chargement des réponses');
    }
  };

  const handleSort = (key: 'email' | 'created_at' | 'score') => {
    setSortConfig({
      key,
      direction:
        sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc',
    });
  };

  const filteredAndSortedSubmissions = submissions
    .filter((submission) =>
      submission.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const direction = sortConfig.direction === 'asc' ? 1 : -1;
      if (sortConfig.key === 'email') {
        return direction * a.email.localeCompare(b.email);
      }
      if (sortConfig.key === 'created_at') {
        return direction * (new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      }
      return direction * (a.score - b.score);
    });

  const exportToCSV = () => {
    const headers = ['Email', 'Date', 'Score'];
    const data = filteredAndSortedSubmissions.map((submission) => [
      submission.email,
      new Date(submission.created_at).toLocaleDateString(),
      `${submission.score}/5`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...data.map((row) => row.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `submissions-${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">
                Administration des Épreuves
              </h1>
            </div>
            <div className="flex items-center">
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('list')}
              className="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center border-[#ca231c] text-[#ca231c]"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Liste des Épreuves
            </button>
          </nav>
        </div>

        <div className="px-4 py-6 sm:px-0">
          {activeTab === 'list' && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-medium text-gray-900">Épreuves disponibles</h2>
                <button
                  onClick={handleCreateNewQuiz}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[#ca231c] hover:bg-[#b01e18]"
                >
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Créer une nouvelle épreuve
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Titre
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Début
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fin
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Statut
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Participants
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {allQuizzes.map((quiz) => {
                      const now = new Date();
                      const startDate = new Date(quiz.start_date);
                      const endDate = new Date(quiz.end_date);
                      let status = 'À venir';
                      let statusColor = 'bg-yellow-100 text-yellow-800';
                      
                      if (now >= startDate && now <= endDate) {
                        status = 'En cours';
                        statusColor = 'bg-green-100 text-green-800';
                      } else if (now > endDate) {
                        status = 'Terminé';
                        statusColor = 'bg-gray-100 text-gray-800';
                      }

                      return (
                        <tr key={quiz.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {quiz.title}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(quiz.start_date).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(quiz.end_date).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColor}`}>
                              {status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {quizParticipants[quiz.id!] || 0}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => handleEditQuiz(quiz.id!)}
                              className={`text-[#ca231c] hover:text-[#b01e18] mr-4 ${
                                now >= new Date(quiz.start_date) && now <= new Date(quiz.end_date)
                                  ? 'animate-pulse'
                                  : ''
                              }`}
                              title="Modifier"
                            >
                              <FileEdit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => loadQuizSubmissions(quiz.id!)}
                              className="text-blue-600 hover:text-blue-700 mr-4"
                              title="Voir les réponses"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteQuiz(quiz.id!)}
                              className="text-red-600 hover:text-red-900"
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {confetti.map((c) => (
                <div
                  key={c.id}
                  className="confetti"
                  style={c.style}
                />
              ))}
            </div>
          )}

          {activeTab === 'edit' && (
            <div className="bg-white rounded-lg shadow p-6">
            <div className="mb-8">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Informations de l'Épreuve
              </h2>
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Titre
                  </label>
                  <input
                    type="text"
                    value={quiz.title}
                    onChange={(e) => setQuiz({ ...quiz, title: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Date de début
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Clock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="datetime-local"
                        value={quiz.start_date}
                        onChange={(e) =>
                          setQuiz({ ...quiz, start_date: e.target.value })
                        }
                        className="focus:ring-[#ca231c] focus:border-[#ca231c] block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Date de fin
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Clock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="datetime-local"
                        value={quiz.end_date}
                        onChange={(e) =>
                          setQuiz({ ...quiz, end_date: e.target.value })
                        }
                        className="focus:ring-[#ca231c] focus:border-[#ca231c] block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <RichTextEditor
                    value={quiz.description}
                    onChange={(value) => setQuiz({ ...quiz, description: value })}
                  />
                </div>
              </div>
            </div>

            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-gray-900">Questions</h2>
                <button
                  onClick={addQuestion}
                  disabled={questions.length >= 5}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300"
                >
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Ajouter une question
                </button>
              </div>

              <div className="space-y-6">
                {questions.map((question, index) => (
                  <div
                    key={index}
                    className="bg-gray-50 p-6 rounded-lg relative"
                  >
                    <button
                      onClick={() => removeQuestion(index)}
                      className="absolute top-4 right-4 text- right-4 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>

                    <div className="grid grid-cols-1 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Question {index + 1}
                        </label>
                        <input
                          type="text"
                          value={question.question_text}
                          onChange={(e) =>
                            updateQuestion(index, 'question_text', e.target.value)
                          }
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Options
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            const newOptions = [...question.options, ''];
                            updateQuestion(index, 'options', newOptions);
                          }}
                          disabled={question.options.length >= 4}
                          className="mb-4 text-sm text-blue-600 hover:text-blue-700 disabled:text-gray-400"
                        >
                          + Ajouter une option
                        </button>
                        <div className="space-y-2">
                          {question.options.filter(option => option !== undefined).map((option, optionIndex) => (
                            <div key={optionIndex} className="flex items-center">
                              <input
                                type="radio"
                                checked={question.correct_answer === optionIndex}
                                onChange={() =>
                                  updateQuestion(
                                    index,
                                    'correct_answer',
                                    optionIndex
                                  )
                                }
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                              />
                              <div className="flex-1 flex items-center ml-2">
                                <input
                                  type="text"
                                  value={option}
                                  onChange={(e) => {
                                    const newOptions = [...question.options];
                                    newOptions[optionIndex] = e.target.value;
                                    updateQuestion(index, 'options', newOptions);
                                  }}
                                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                  placeholder={`Option ${optionIndex + 1}`}
                                />
                                {question.options.length > 2 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newOptions = question.options.filter((_, i) => i !== optionIndex);
                                      updateQuestion(index, 'options', newOptions);
                                    }}
                                    className="ml-2 text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={saveQuiz}
                disabled={saving || new Date(quiz.end_date) <= new Date(quiz.start_date)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[#ca231c] hover:bg-[#b01e18]"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Enregistrement...' : 'Enregistrer l\'épreuve'}
              </button>
            </div>
            {new Date(quiz.end_date) <= new Date(quiz.start_date) && (
              <p className="mt-2 text-sm text-red-600">
                La date de fin doit être postérieure à la date de début
              </p>
            )}
          </div>
          )}

          {activeTab === 'submissions' && (
            <div className="mt-8 bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-medium text-gray-900 flex items-center">
                  <Users className="w-5 h-5 text-gray-500 mr-2" />
                  {selectedQuizId ? (
                    <div className="flex items-center">
                      Réponses pour : {allQuizzes.find(q => q.id === selectedQuizId)?.title}
                      <button
                        onClick={() => setActiveTab('list')}
                        className="ml-4 text-sm text-gray-500 hover:text-gray-700"
                      >
                        (Changer de quiz)
                      </button>
                    </div>
                  ) : (
                    'Sélectionnez un quiz pour voir les réponses'
                  )}
                </h2>
                {selectedQuizId && allQuizzes && (
                  <div className="flex space-x-4">
                    {new Date() > new Date(allQuizzes.find(q => q.id === selectedQuizId)?.end_date || '') && (
                      <button
                        onClick={drawWinner}
                        disabled={drawingWinner || winner !== null}
                        className={`inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${
                          drawingWinner || winner !== null
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-[#ca231c] hover:bg-[#b01e18]'
                        }`}
                      >
                        <Trophy className={`w-4 h-4 mr-2 ${drawingWinner ? 'animate-spin' : ''}`} />
                        {drawingWinner ? 'Tirage en cours...' : 'Tirer au sort'}
                      </button>
                    )}
                    <button
                      onClick={exportToCSV}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Exporter en CSV
                    </button>
                  </div>
                )}
              </div>

              {!selectedQuizId && (
                <div className="text-center py-12">
                  <Users className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune épreuve sélectionnée</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Sélectionnez une épreuve dans la liste pour voir ses réponses
                  </p>
                  <div className="mt-6">
                    <button
                      onClick={() => setActiveTab('list')}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#ca231c] hover:bg-[#b01e18]"
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      Voir la liste des épreuves
                    </button>
                  </div>
                </div>
              )}

              {selectedQuizId && (
                <>
              <div className="mb-4">
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="focus:ring-[#ca231c] focus:border-[#ca231c] block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                    placeholder="Rechercher par email..."
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('email')}
                      >
                        <div className="flex items-center">
                        Email
                          <ChevronDown
                            className={`w-4 h-4 ml-1 transform ${
                              sortConfig.key === 'email' &&
                              sortConfig.direction === 'desc'
                                ? 'rotate-180'
                                : ''
                            }`}
                          />
                        </div>
                      </th>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('created_at')}
                      >
                        <div className="flex items-center">
                        Date
                          <ChevronDown
                            className={`w-4 h-4 ml-1 transform ${
                              sortConfig.key === 'created_at' &&
                              sortConfig.direction === 'desc'
                                ? 'rotate-180'
                                : ''
                            }`}
                          />
                        </div>
                      </th>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('score')}
                      >
                        <div className="flex items-center">
                        Score
                          <ChevronDown
                            className={`w-4 h-4 ml-1 transform ${
                              sortConfig.key === 'score' &&
                              sortConfig.direction === 'desc'
                                ? 'rotate-180'
                                : ''
                            }`}
                          />
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredAndSortedSubmissions.map((submission, index) => (
                      <tr 
                        key={index}
                        className={`${
                          submission.email === winner
                            ? 'bg-red-50 animate-[winner-highlight_1s_ease-in-out]'
                            : ''
                        }`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center">
                            {submission.email}
                            {submission.email === winner && (
                              <Trophy className="w-4 h-4 ml-2 text-[#ca231c]" />
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(submission.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {submission.score}/5
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td colSpan={2} className="px-6 py-3 text-sm text-gray-500">
                        Total des participations
                      </td>
                      <td className="px-6 py-3 text-sm font-medium text-gray-900">
                        {filteredAndSortedSubmissions.length}
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={2} className="px-6 py-3 text-sm text-gray-500">
                        Score moyen
                      </td>
                      <td className="px-6 py-3 text-sm font-medium text-gray-900">
                        {(
                          filteredAndSortedSubmissions.reduce(
                            (acc, curr) => acc + curr.score,
                            0
                          ) / filteredAndSortedSubmissions.length || 0
                        ).toFixed(1)}
                        /5
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
