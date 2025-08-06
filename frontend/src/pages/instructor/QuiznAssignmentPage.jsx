import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  getCourseSections,
  getSectionQuizzes,
  createQuiz,
  updateQuiz,
  deleteQuiz,
  addQuizQuestions,
  updateQuizQuestion,
  deleteQuizQuestion,
  reorderQuizQuestions,
  getQuizQuestions,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  getAllAssignments,
  getContentStats,
  clearError,
} from "@/features/instructor/contentManagementSlice";
import {
  ClipboardList,
  FileText,
  Plus,
  Search,
  RefreshCw,
  Edit,
  Trash2,
  Save,
  X,
  Loader2,
  Clock,
  Users,
  CheckCircle,
  AlertCircle,
  BookOpen,
  GripVertical,
  ChevronDown,
  ChevronUp,
  Target,
  Calendar,
  Upload,
  File,
  HelpCircle,
  CheckSquare,
  Circle,
  Square,
  Type,
  Hash,
  ToggleLeft,
  Shuffle,
  Eye,
  EyeOff,
  Award,
  Percent,
  Timer,
  ListOrdered,
} from "lucide-react";

const QuizAssignmentPage = () => {
  const dispatch = useDispatch();
  const { courseId } = useParams();
  const navigate = useNavigate();

  const {
    sections,
    quizzes,
    questions,
    assignments,
    contentStats,
    getSectionQuizzesLoading,
    createQuizLoading,
    updateQuizLoading,
    addQuizQuestionsLoading,
    updateQuizQuestionLoading,
    getQuizQuestionsLoading,
    createAssignmentLoading,
    updateAssignmentLoading,
    getAllAssignmentsLoading,
    error,
  } = useSelector((state) => state.contentManagement);

  const [activeTab, setActiveTab] = useState("quizzes");
  const [selectedSection, setSelectedSection] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateQuizDialogOpen, setIsCreateQuizDialogOpen] = useState(false);
  const [isEditQuizDialogOpen, setIsEditQuizDialogOpen] = useState(false);
  const [isDeleteQuizDialogOpen, setIsDeleteQuizDialogOpen] = useState(false);
  const [isQuestionsDialogOpen, setIsQuestionsDialogOpen] = useState(false);
  const [isAddQuestionDialogOpen, setIsAddQuestionDialogOpen] = useState(false);
  const [isEditQuestionDialogOpen, setIsEditQuestionDialogOpen] =
    useState(false);
  const [isDeleteQuestionDialogOpen, setIsDeleteQuestionDialogOpen] =
    useState(false);
  const [isCreateAssignmentDialogOpen, setIsCreateAssignmentDialogOpen] =
    useState(false);
  const [isEditAssignmentDialogOpen, setIsEditAssignmentDialogOpen] =
    useState(false);
  const [isDeleteAssignmentDialogOpen, setIsDeleteAssignmentDialogOpen] =
    useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [draggedQuestion, setDraggedQuestion] = useState(null);
  const [assignmentFiles, setAssignmentFiles] = useState([]);

  const [quizFormData, setQuizFormData] = useState({
    title: "",
    description: "",
    instructions: "",
    duration: "",
    passingScore: "",
    maxAttempts: "1",
    isRequired: true,
    isRandomized: false,
    showResults: true,
    allowReview: true,
  });

  const [questionFormData, setQuestionFormData] = useState({
    content: "",
    type: "MULTIPLE_CHOICE",
    points: "1",
    options: ["", "", "", ""],
    correctAnswer: "",
    explanation: "",
    hints: [""],
    difficulty: "MEDIUM",
    tags: [],
  });

  const [assignmentFormData, setAssignmentFormData] = useState({
    title: "",
    description: "",
    instructions: "",
    dueDate: "",
    totalPoints: "",
    rubric: "",
    allowLateSubmission: false,
    latePenalty: "",
  });

  useEffect(() => {
    if (courseId) {
      dispatch(getCourseSections({ courseId, params: { limit: 50 } }));
      dispatch(getContentStats(courseId));
    }
  }, [dispatch, courseId]);

  useEffect(() => {
    if (selectedSection) {
      if (activeTab === "quizzes") {
        dispatch(getSectionQuizzes({ sectionId: selectedSection, params: {} }));
      } else {
        dispatch(getAllAssignments(selectedSection));
      }
    }
  }, [dispatch, selectedSection, activeTab]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const handleCreateQuiz = async () => {
    if (!selectedSection) {
      toast.error("Please select a section first");
      return;
    }

    try {
      await dispatch(
        createQuiz({
          sectionId: selectedSection,
          quizData: quizFormData,
        })
      ).unwrap();
      setIsCreateQuizDialogOpen(false);
      setQuizFormData({
        title: "",
        description: "",
        instructions: "",
        duration: "",
        passingScore: "",
        maxAttempts: "1",
        isRequired: true,
        isRandomized: false,
        showResults: true,
        allowReview: true,
      });
      dispatch(getSectionQuizzes({ sectionId: selectedSection, params: {} }));
    } catch (error) {
      toast.error(error.message || "Failed to create quiz");
    }
  };

  const handleUpdateQuiz = async () => {
    try {
      await dispatch(
        updateQuiz({
          quizId: selectedQuiz.id,
          updateData: quizFormData,
        })
      ).unwrap();
      setIsEditQuizDialogOpen(false);
      setSelectedQuiz(null);
      dispatch(getSectionQuizzes({ sectionId: selectedSection, params: {} }));
    } catch (error) {
      toast.error(error.message || "Failed to update quiz");
    }
  };

  const handleDeleteQuiz = async () => {
    try {
      await dispatch(deleteQuiz(selectedQuiz.id)).unwrap();
      setIsDeleteQuizDialogOpen(false);
      setSelectedQuiz(null);
      dispatch(getSectionQuizzes({ sectionId: selectedSection, params: {} }));
    } catch (error) {
      toast.error(error.message || "Failed to delete quiz");
    }
  };

  const handleAddQuestion = async () => {
    try {
      const questionsToAdd = [
        {
          ...questionFormData,
          options:
            questionFormData.type === "MULTIPLE_CHOICE" ||
            questionFormData.type === "SINGLE_CHOICE"
              ? questionFormData.options.filter((opt) => opt.trim() !== "")
              : null,
        },
      ];

      await dispatch(
        addQuizQuestions({
          quizId: selectedQuiz.id,
          questions: questionsToAdd,
        })
      ).unwrap();
      setIsAddQuestionDialogOpen(false);
      setQuestionFormData({
        content: "",
        type: "MULTIPLE_CHOICE",
        points: "1",
        options: ["", "", "", ""],
        correctAnswer: "",
        explanation: "",
        hints: [""],
        difficulty: "MEDIUM",
        tags: [],
      });
      dispatch(getQuizQuestions({ quizId: selectedQuiz.id, params: {} }));
    } catch (error) {
      toast.error(error.message || "Failed to add question");
    }
  };

  const handleUpdateQuestion = async () => {
    try {
      await dispatch(
        updateQuizQuestion({
          questionId: selectedQuestion.id,
          updateData: questionFormData,
        })
      ).unwrap();
      setIsEditQuestionDialogOpen(false);
      setSelectedQuestion(null);
      dispatch(getQuizQuestions({ quizId: selectedQuiz.id, params: {} }));
    } catch (error) {
      toast.error(error.message || "Failed to update question");
    }
  };

  const handleDeleteQuestion = async () => {
    try {
      await dispatch(deleteQuizQuestion(selectedQuestion.id)).unwrap();
      setIsDeleteQuestionDialogOpen(false);
      setSelectedQuestion(null);
      dispatch(getQuizQuestions({ quizId: selectedQuiz.id, params: {} }));
    } catch (error) {
      toast.error(error.message || "Failed to delete question");
    }
  };

  const handleReorderQuestions = async (questionIds) => {
    try {
      await dispatch(
        reorderQuizQuestions({
          quizId: selectedQuiz.id,
          questionIds,
        })
      ).unwrap();
      dispatch(getQuizQuestions({ quizId: selectedQuiz.id, params: {} }));
    } catch (error) {
      toast.error(error.message || "Failed to reorder questions");
    }
  };

  const handleCreateAssignment = async () => {
    if (!selectedSection) {
      toast.error("Please select a section first");
      return;
    }

    try {
      const formData = {
        ...assignmentFormData,
        resources: assignmentFiles,
      };

      await dispatch(
        createAssignment({
          sectionId: selectedSection,
          assignmentData: formData,
        })
      ).unwrap();
      setIsCreateAssignmentDialogOpen(false);
      setAssignmentFormData({
        title: "",
        description: "",
        instructions: "",
        dueDate: "",
        totalPoints: "",
        rubric: "",
        allowLateSubmission: false,
        latePenalty: "",
      });
      setAssignmentFiles([]);
      dispatch(getAllAssignments(selectedSection));
    } catch (error) {
      toast.error(error.message || "Failed to create assignment");
    }
  };

  const handleUpdateAssignment = async () => {
    try {
      await dispatch(
        updateAssignment({
          assignmentId: selectedAssignment.id,
          updateData: assignmentFormData,
        })
      ).unwrap();
      setIsEditAssignmentDialogOpen(false);
      setSelectedAssignment(null);
      dispatch(getAllAssignments(selectedSection));
    } catch (error) {
      toast.error(error.message || "Failed to update assignment");
    }
  };

  const handleDeleteAssignment = async () => {
    try {
      await dispatch(deleteAssignment(selectedAssignment.id)).unwrap();
      setIsDeleteAssignmentDialogOpen(false);
      setSelectedAssignment(null);
      dispatch(getAllAssignments(selectedSection));
    } catch (error) {
      toast.error(error.message || "Failed to delete assignment");
    }
  };

  const openEditQuizDialog = (quiz) => {
    setSelectedQuiz(quiz);
    setQuizFormData({
      title: quiz.title,
      description: quiz.description || "",
      instructions: quiz.instructions || "",
      duration: quiz.duration?.toString() || "",
      passingScore: quiz.passingScore?.toString() || "",
      maxAttempts: quiz.maxAttempts?.toString() || "1",
      isRequired: quiz.isRequired !== false,
      isRandomized: quiz.isRandomized || false,
      showResults: quiz.showResults !== false,
      allowReview: quiz.allowReview !== false,
    });
    setIsEditQuizDialogOpen(true);
  };

  const openQuestionsDialog = (quiz) => {
    setSelectedQuiz(quiz);
    dispatch(getQuizQuestions({ quizId: quiz.id, params: {} }));
    setIsQuestionsDialogOpen(true);
  };

  const openEditQuestionDialog = (question) => {
    setSelectedQuestion(question);
    setQuestionFormData({
      content: question.content,
      type: question.type,
      points: question.points?.toString() || "1",
      options: question.options || ["", "", "", ""],
      correctAnswer: question.correctAnswer || "",
      explanation: question.explanation || "",
      hints: question.hints || [""],
      difficulty: question.difficulty || "MEDIUM",
      tags: question.tags || [],
    });
    setIsEditQuestionDialogOpen(true);
  };

  const openEditAssignmentDialog = (assignment) => {
    setSelectedAssignment(assignment);
    setAssignmentFormData({
      title: assignment.title,
      description: assignment.description || "",
      instructions: assignment.instructions || "",
      dueDate: assignment.dueDate
        ? format(new Date(assignment.dueDate), "yyyy-MM-dd'T'HH:mm")
        : "",
      totalPoints: assignment.totalPoints?.toString() || "",
      rubric: assignment.rubric || "",
      allowLateSubmission: assignment.allowLateSubmission || false,
      latePenalty: assignment.latePenalty?.toString() || "",
    });
    setIsEditAssignmentDialogOpen(true);
  };

  const handleDragStart = (e, question) => {
    setDraggedQuestion(question);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, targetQuestion) => {
    e.preventDefault();
    if (!draggedQuestion || draggedQuestion.id === targetQuestion.id) return;

    const currentQuestions = questions.filter(
      (q) => q.quizId === selectedQuiz.id
    );
    const draggedIndex = currentQuestions.findIndex(
      (q) => q.id === draggedQuestion.id
    );
    const targetIndex = currentQuestions.findIndex(
      (q) => q.id === targetQuestion.id
    );

    const newOrder = [...currentQuestions];
    newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, draggedQuestion);

    handleReorderQuestions(newOrder.map((q) => q.id));
    setDraggedQuestion(null);
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setAssignmentFiles(files);
  };

  const getQuestionTypeIcon = (type) => {
    switch (type) {
      case "MULTIPLE_CHOICE":
        return <CheckSquare className="w-4 h-4" />;
      case "SINGLE_CHOICE":
        return <Circle className="w-4 h-4" />;
      case "TRUE_FALSE":
        return <ToggleLeft className="w-4 h-4" />;
      case "SHORT_ANSWER":
        return <Type className="w-4 h-4" />;
      case "FILL_IN_BLANK":
        return <Square className="w-4 h-4" />;
      default:
        return <HelpCircle className="w-4 h-4" />;
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case "EASY":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
      case "HARD":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
    }
  };

  const filteredQuizzes = quizzes.filter(
    (quiz) =>
      searchTerm === "" ||
      quiz.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredAssignments = assignments.filter(
    (assignment) =>
      searchTerm === "" ||
      assignment.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const quizQuestions = questions.filter((q) => q.quizId === selectedQuiz?.id);

  if (!courseId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-cyan-50 dark:from-slate-900 dark:via-slate-800 dark:to-gray-900 flex items-center justify-center">
        <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 shadow-xl rounded-2xl p-8">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-center text-slate-800 dark:text-white">
            No course selected
          </p>
          <Button
            onClick={() => navigate("/instructor/courses")}
            className="w-full mt-4 rounded-xl"
          >
            Go to Courses
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-cyan-50 dark:from-slate-900 dark:via-slate-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div className="flex items-center space-x-4 mb-4 lg:mb-0">
            <div className="p-3 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-2xl shadow-lg">
              <ClipboardList className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-800 dark:text-white">
                Quizzes & Assignments
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Manage course assessments and assignments
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Select value={selectedSection} onValueChange={setSelectedSection}>
              <SelectTrigger className="w-64 rounded-xl border-white/50 dark:border-slate-700/50 bg-white/30 dark:bg-slate-800/30 backdrop-blur-sm">
                <SelectValue placeholder="Select a section" />
              </SelectTrigger>
              <SelectContent>
                {sections.map((section) => (
                  <SelectItem key={section.id} value={section.id}>
                    {section.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => {
                if (selectedSection) {
                  if (activeTab === "quizzes") {
                    dispatch(
                      getSectionQuizzes({
                        sectionId: selectedSection,
                        params: {},
                      })
                    );
                  } else {
                    dispatch(getAllAssignments(selectedSection));
                  }
                }
              }}
              disabled={
                !selectedSection ||
                getSectionQuizzesLoading ||
                getAllAssignmentsLoading
              }
              className="rounded-xl border-white/50 dark:border-slate-700/50 bg-white/30 dark:bg-slate-800/30 backdrop-blur-sm hover:bg-white/50 dark:hover:bg-slate-700/50"
            >
              <RefreshCw
                className={cn(
                  "w-4 h-4",
                  (getSectionQuizzesLoading || getAllAssignmentsLoading) &&
                    "animate-spin"
                )}
              />
            </Button>
          </div>
        </div>

        {contentStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 shadow-xl rounded-2xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                      Total Quizzes
                    </p>
                    <p className="text-2xl font-bold text-slate-800 dark:text-white">
                      {contentStats.quizzes?.total || 0}
                    </p>
                  </div>
                  <div className="p-2 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-lg shadow-lg">
                    <ClipboardList className="w-5 h-5 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 shadow-xl rounded-2xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                      Total Assignments
                    </p>
                    <p className="text-2xl font-bold text-slate-800 dark:text-white">
                      {contentStats.assignments?.total || 0}
                    </p>
                  </div>
                  <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg shadow-lg">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 shadow-xl rounded-2xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                      Sections
                    </p>
                    <p className="text-2xl font-bold text-slate-800 dark:text-white">
                      {contentStats.sections?.total || 0}
                    </p>
                  </div>
                  <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg shadow-lg">
                    <BookOpen className="w-5 h-5 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 shadow-xl rounded-2xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                      Total Lessons
                    </p>
                    <p className="text-2xl font-bold text-slate-800 dark:text-white">
                      {contentStats.lessons?.total || 0}
                    </p>
                  </div>
                  <div className="p-2 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg shadow-lg">
                    <BookOpen className="w-5 h-5 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 shadow-xl rounded-2xl">
          <CardHeader className="pb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
              >
                <div className="flex items-center justify-between">
                  <TabsList className="bg-white/50 dark:bg-slate-800/50 rounded-xl">
                    <TabsTrigger value="quizzes" className="rounded-lg">
                      <ClipboardList className="w-4 h-4 mr-2" />
                      Quizzes
                    </TabsTrigger>
                    <TabsTrigger value="assignments" className="rounded-lg">
                      <FileText className="w-4 h-4 mr-2" />
                      Assignments
                    </TabsTrigger>
                  </TabsList>

                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <Input
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 w-64 rounded-xl bg-white/70 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600"
                      />
                    </div>

                    {activeTab === "quizzes" ? (
                      <Dialog
                        open={isCreateQuizDialogOpen}
                        onOpenChange={setIsCreateQuizDialogOpen}
                      >
                        <DialogTrigger asChild>
                          <Button
                            disabled={!selectedSection}
                            className="rounded-xl bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-white"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Create Quiz
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[90vh]">
                          <DialogHeader>
                            <DialogTitle>Create New Quiz</DialogTitle>
                            <DialogDescription>
                              Create a new quiz for the selected section.
                            </DialogDescription>
                          </DialogHeader>

                          <ScrollArea className="max-h-[calc(90vh-200px)]">
                            <div className="space-y-4 py-4 pr-6">
                              <div className="space-y-2">
                                <Label>Title</Label>
                                <Input
                                  value={quizFormData.title}
                                  onChange={(e) =>
                                    setQuizFormData({
                                      ...quizFormData,
                                      title: e.target.value,
                                    })
                                  }
                                  placeholder="Quiz title"
                                  className="rounded-xl"
                                />
                              </div>

                              <div className="space-y-2">
                                <Label>Description</Label>
                                <Textarea
                                  value={quizFormData.description}
                                  onChange={(e) =>
                                    setQuizFormData({
                                      ...quizFormData,
                                      description: e.target.value,
                                    })
                                  }
                                  placeholder="Quiz description"
                                  className="rounded-xl min-h-[80px]"
                                />
                              </div>

                              <div className="space-y-2">
                                <Label>Instructions</Label>
                                <Textarea
                                  value={quizFormData.instructions}
                                  onChange={(e) =>
                                    setQuizFormData({
                                      ...quizFormData,
                                      instructions: e.target.value,
                                    })
                                  }
                                  placeholder="Quiz instructions"
                                  className="rounded-xl min-h-[80px]"
                                />
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label>Duration (minutes)</Label>
                                  <Input
                                    type="number"
                                    value={quizFormData.duration}
                                    onChange={(e) =>
                                      setQuizFormData({
                                        ...quizFormData,
                                        duration: e.target.value,
                                      })
                                    }
                                    placeholder="30"
                                    className="rounded-xl"
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label>Passing Score (%)</Label>
                                  <Input
                                    type="number"
                                    value={quizFormData.passingScore}
                                    onChange={(e) =>
                                      setQuizFormData({
                                        ...quizFormData,
                                        passingScore: e.target.value,
                                      })
                                    }
                                    placeholder="70"
                                    className="rounded-xl"
                                  />
                                </div>
                              </div>

                              <div className="space-y-2">
                                <Label>Max Attempts</Label>
                                <Input
                                  type="number"
                                  value={quizFormData.maxAttempts}
                                  onChange={(e) =>
                                    setQuizFormData({
                                      ...quizFormData,
                                      maxAttempts: e.target.value,
                                    })
                                  }
                                  placeholder="1"
                                  className="rounded-xl"
                                />
                              </div>

                              <div className="space-y-4">
                                <div className="flex items-center space-x-2">
                                  <Switch
                                    checked={quizFormData.isRequired}
                                    onCheckedChange={(checked) =>
                                      setQuizFormData({
                                        ...quizFormData,
                                        isRequired: checked,
                                      })
                                    }
                                  />
                                  <Label>Required</Label>
                                </div>

                                <div className="flex items-center space-x-2">
                                  <Switch
                                    checked={quizFormData.isRandomized}
                                    onCheckedChange={(checked) =>
                                      setQuizFormData({
                                        ...quizFormData,
                                        isRandomized: checked,
                                      })
                                    }
                                  />
                                  <Label>Randomize Questions</Label>
                                </div>

                                <div className="flex items-center space-x-2">
                                  <Switch
                                    checked={quizFormData.showResults}
                                    onCheckedChange={(checked) =>
                                      setQuizFormData({
                                        ...quizFormData,
                                        showResults: checked,
                                      })
                                    }
                                  />
                                  <Label>Show Results</Label>
                                </div>

                                <div className="flex items-center space-x-2">
                                  <Switch
                                    checked={quizFormData.allowReview}
                                    onCheckedChange={(checked) =>
                                      setQuizFormData({
                                        ...quizFormData,
                                        allowReview: checked,
                                      })
                                    }
                                  />
                                  <Label>Allow Review</Label>
                                </div>
                              </div>
                            </div>
                          </ScrollArea>

                          <DialogFooter className="border-t pt-4">
                            <Button
                              variant="outline"
                              onClick={() => setIsCreateQuizDialogOpen(false)}
                              className="rounded-xl"
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={handleCreateQuiz}
                              disabled={
                                createQuizLoading ||
                                !quizFormData.title ||
                                !quizFormData.duration ||
                                !quizFormData.passingScore
                              }
                              className="rounded-xl"
                            >
                              {createQuizLoading ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              ) : (
                                <Save className="w-4 h-4 mr-2" />
                              )}
                              Create Quiz
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    ) : (
                      <Dialog
                        open={isCreateAssignmentDialogOpen}
                        onOpenChange={setIsCreateAssignmentDialogOpen}
                      >
                        <DialogTrigger asChild>
                          <Button
                            disabled={!selectedSection}
                            className="rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Create Assignment
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[90vh]">
                          <DialogHeader>
                            <DialogTitle>Create New Assignment</DialogTitle>
                            <DialogDescription>
                              Create a new assignment for the selected section.
                            </DialogDescription>
                          </DialogHeader>

                          <ScrollArea className="max-h-[calc(90vh-200px)]">
                            <div className="space-y-4 py-4 pr-6">
                              <div className="space-y-2">
                                <Label>Title</Label>
                                <Input
                                  value={assignmentFormData.title}
                                  onChange={(e) =>
                                    setAssignmentFormData({
                                      ...assignmentFormData,
                                      title: e.target.value,
                                    })
                                  }
                                  placeholder="Assignment title"
                                  className="rounded-xl"
                                />
                              </div>

                              <div className="space-y-2">
                                <Label>Description</Label>
                                <Textarea
                                  value={assignmentFormData.description}
                                  onChange={(e) =>
                                    setAssignmentFormData({
                                      ...assignmentFormData,
                                      description: e.target.value,
                                    })
                                  }
                                  placeholder="Assignment description"
                                  className="rounded-xl min-h-[80px]"
                                />
                              </div>

                              <div className="space-y-2">
                                <Label>Instructions</Label>
                                <Textarea
                                  value={assignmentFormData.instructions}
                                  onChange={(e) =>
                                    setAssignmentFormData({
                                      ...assignmentFormData,
                                      instructions: e.target.value,
                                    })
                                  }
                                  placeholder="Assignment instructions"
                                  className="rounded-xl min-h-[100px]"
                                />
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label>Due Date</Label>
                                  <Input
                                    type="datetime-local"
                                    value={assignmentFormData.dueDate}
                                    onChange={(e) =>
                                      setAssignmentFormData({
                                        ...assignmentFormData,
                                        dueDate: e.target.value,
                                      })
                                    }
                                    className="rounded-xl"
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label>Total Points</Label>
                                  <Input
                                    type="number"
                                    value={assignmentFormData.totalPoints}
                                    onChange={(e) =>
                                      setAssignmentFormData({
                                        ...assignmentFormData,
                                        totalPoints: e.target.value,
                                      })
                                    }
                                    placeholder="100"
                                    className="rounded-xl"
                                  />
                                </div>
                              </div>

                              <div className="space-y-2">
                                <Label>Rubric</Label>
                                <Textarea
                                  value={assignmentFormData.rubric}
                                  onChange={(e) =>
                                    setAssignmentFormData({
                                      ...assignmentFormData,
                                      rubric: e.target.value,
                                    })
                                  }
                                  placeholder="Grading rubric"
                                  className="rounded-xl min-h-[80px]"
                                />
                              </div>

                              <div className="space-y-2">
                                <Label>Resources</Label>
                                <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-4">
                                  <input
                                    type="file"
                                    multiple
                                    onChange={handleFileSelect}
                                    className="hidden"
                                    id="file-upload"
                                  />
                                  <label
                                    htmlFor="file-upload"
                                    className="flex flex-col items-center cursor-pointer"
                                  >
                                    <Upload className="w-8 h-8 text-slate-400 mb-2" />
                                    <span className="text-sm text-slate-600 dark:text-slate-400">
                                      Click to upload files
                                    </span>
                                  </label>
                                  {assignmentFiles.length > 0 && (
                                    <div className="mt-4 space-y-2">
                                      {assignmentFiles.map((file, index) => (
                                        <div
                                          key={index}
                                          className="flex items-center space-x-2"
                                        >
                                          <File className="w-4 h-4 text-slate-400" />
                                          <span className="text-sm">
                                            {file.name}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="space-y-4">
                                <div className="flex items-center space-x-2">
                                  <Switch
                                    checked={
                                      assignmentFormData.allowLateSubmission
                                    }
                                    onCheckedChange={(checked) =>
                                      setAssignmentFormData({
                                        ...assignmentFormData,
                                        allowLateSubmission: checked,
                                      })
                                    }
                                  />
                                  <Label>Allow Late Submission</Label>
                                </div>

                                {assignmentFormData.allowLateSubmission && (
                                  <div className="space-y-2">
                                    <Label>Late Penalty (%)</Label>
                                    <Input
                                      type="number"
                                      value={assignmentFormData.latePenalty}
                                      onChange={(e) =>
                                        setAssignmentFormData({
                                          ...assignmentFormData,
                                          latePenalty: e.target.value,
                                        })
                                      }
                                      placeholder="10"
                                      className="rounded-xl"
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          </ScrollArea>

                          <DialogFooter className="border-t pt-4">
                            <Button
                              variant="outline"
                              onClick={() =>
                                setIsCreateAssignmentDialogOpen(false)
                              }
                              className="rounded-xl"
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={handleCreateAssignment}
                              disabled={
                                createAssignmentLoading ||
                                !assignmentFormData.title ||
                                !assignmentFormData.instructions ||
                                !assignmentFormData.totalPoints
                              }
                              className="rounded-xl"
                            >
                              {createAssignmentLoading ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              ) : (
                                <Save className="w-4 h-4 mr-2" />
                              )}
                              Create Assignment
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </div>

                <TabsContent value="quizzes" className="mt-6">
                  <div className="space-y-4">
                    {filteredQuizzes.map((quiz) => (
                      <div
                        key={quiz.id}
                        className="p-6 rounded-xl border bg-white/50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 hover:bg-white/70 dark:hover:bg-slate-700/70 transition-all duration-200"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
                                {quiz.title}
                              </h3>
                              {quiz.isRequired && (
                                <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                                  Required
                                </Badge>
                              )}
                              {quiz.isRandomized && (
                                <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                                  <Shuffle className="w-3 h-3 mr-1" />
                                  Randomized
                                </Badge>
                              )}
                            </div>

                            {quiz.description && (
                              <p className="text-slate-600 dark:text-slate-400 mb-3">
                                {quiz.description}
                              </p>
                            )}

                            <div className="flex items-center space-x-6 text-sm text-slate-500 dark:text-slate-400">
                              <div className="flex items-center space-x-1">
                                <Timer className="w-4 h-4" />
                                <span>{quiz.duration} min</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Target className="w-4 h-4" />
                                <span>{quiz.passingScore}% to pass</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <ListOrdered className="w-4 h-4" />
                                <span>
                                  {quiz.stats?.questionsCount || 0} questions
                                </span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Users className="w-4 h-4" />
                                <span>
                                  {quiz.stats?.attemptsCount || 0} attempts
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center space-x-4 mt-3">
                              {quiz.showResults && (
                                <Badge variant="outline" className="text-xs">
                                  <Eye className="w-3 h-3 mr-1" />
                                  Show Results
                                </Badge>
                              )}
                              {quiz.allowReview && (
                                <Badge variant="outline" className="text-xs">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Allow Review
                                </Badge>
                              )}
                              <Badge variant="outline" className="text-xs">
                                Max {quiz.maxAttempts} attempts
                              </Badge>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2 ml-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openQuestionsDialog(quiz)}
                              className="rounded-lg"
                            >
                              <ListOrdered className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditQuizDialog(quiz)}
                              className="rounded-lg"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedQuiz(quiz);
                                setIsDeleteQuizDialogOpen(true);
                              }}
                              className="rounded-lg text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}

                    {filteredQuizzes.length === 0 &&
                      !getSectionQuizzesLoading && (
                        <div className="text-center py-12">
                          <ClipboardList className="w-12 h-12 mx-auto text-slate-400 mb-4 opacity-50" />
                          <p className="text-slate-600 dark:text-slate-400">
                            {selectedSection
                              ? "No quizzes found"
                              : "Please select a section"}
                          </p>
                        </div>
                      )}
                  </div>
                </TabsContent>

                <TabsContent value="assignments" className="mt-6">
                  <div className="space-y-4">
                    {filteredAssignments.map((assignment) => (
                      <div
                        key={assignment.id}
                        className="p-6 rounded-xl border bg-white/50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 hover:bg-white/70 dark:hover:bg-slate-700/70 transition-all duration-200"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
                                {assignment.title}
                              </h3>
                              {assignment.allowLateSubmission && (
                                <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
                                  Late Allowed
                                </Badge>
                              )}
                            </div>

                            {assignment.description && (
                              <p className="text-slate-600 dark:text-slate-400 mb-3">
                                {assignment.description}
                              </p>
                            )}

                            <div className="flex items-center space-x-6 text-sm text-slate-500 dark:text-slate-400">
                              <div className="flex items-center space-x-1">
                                <Award className="w-4 h-4" />
                                <span>{assignment.totalPoints} points</span>
                              </div>
                              {assignment.dueDate && (
                                <div className="flex items-center space-x-1">
                                  <Calendar className="w-4 h-4" />
                                  <span>
                                    Due:{" "}
                                    {format(
                                      new Date(assignment.dueDate),
                                      "MMM dd, yyyy"
                                    )}
                                  </span>
                                </div>
                              )}
                              {assignment.resources &&
                                assignment.resources.length > 0 && (
                                  <div className="flex items-center space-x-1">
                                    <File className="w-4 h-4" />
                                    <span>
                                      {assignment.resources.length} resources
                                    </span>
                                  </div>
                                )}
                            </div>

                            {assignment.latePenalty && (
                              <div className="mt-3">
                                <Badge variant="outline" className="text-xs">
                                  <Percent className="w-3 h-3 mr-1" />
                                  {assignment.latePenalty}% late penalty
                                </Badge>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center space-x-2 ml-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                openEditAssignmentDialog(assignment)
                              }
                              className="rounded-lg"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedAssignment(assignment);
                                setIsDeleteAssignmentDialogOpen(true);
                              }}
                              className="rounded-lg text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}

                    {filteredAssignments.length === 0 &&
                      !getAllAssignmentsLoading && (
                        <div className="text-center py-12">
                          <FileText className="w-12 h-12 mx-auto text-slate-400 mb-4 opacity-50" />
                          <p className="text-slate-600 dark:text-slate-400">
                            {selectedSection
                              ? "No assignments found"
                              : "Please select a section"}
                          </p>
                        </div>
                      )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </CardHeader>
        </Card>

        <Dialog
          open={isQuestionsDialogOpen}
          onOpenChange={setIsQuestionsDialogOpen}
        >
          <DialogContent className="max-w-4xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span>Manage Questions - {selectedQuiz?.title}</span>
                <Button
                  size="sm"
                  onClick={() => setIsAddQuestionDialogOpen(true)}
                  className="rounded-xl"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Question
                </Button>
              </DialogTitle>
              <DialogDescription>
                Manage quiz questions and their order.
              </DialogDescription>
            </DialogHeader>

            <ScrollArea className="max-h-[calc(90vh-200px)]">
              <div className="space-y-4 py-4 pr-6">
                {getQuizQuestionsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin" />
                  </div>
                ) : quizQuestions.length > 0 ? (
                  quizQuestions.map((question, index) => (
                    <div
                      key={question.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, question)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, question)}
                      className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-move"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1">
                          <GripVertical className="w-5 h-5 text-slate-400 mt-1" />
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <span className="font-semibold">
                                Q{index + 1}.
                              </span>
                              {getQuestionTypeIcon(question.type)}
                              <Badge
                                className={cn(
                                  "text-xs",
                                  getDifficultyColor(question.difficulty)
                                )}
                              >
                                {question.difficulty}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {question.points} points
                              </Badge>
                            </div>
                            <p className="text-slate-700 dark:text-slate-300 mb-2">
                              {question.content}
                            </p>
                            {question.options && (
                              <div className="space-y-1 ml-4">
                                {question.options.map((option, optIndex) => (
                                  <div
                                    key={optIndex}
                                    className="flex items-center space-x-2"
                                  >
                                    <span className="text-sm text-slate-600 dark:text-slate-400">
                                      {String.fromCharCode(65 + optIndex)}.{" "}
                                      {option}
                                    </span>
                                    {option === question.correctAnswer && (
                                      <CheckCircle className="w-4 h-4 text-green-500" />
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                            {question.explanation && (
                              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                                Explanation: {question.explanation}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditQuestionDialog(question)}
                            className="rounded-lg"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedQuestion(question);
                              setIsDeleteQuestionDialogOpen(true);
                            }}
                            className="rounded-lg text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <HelpCircle className="w-12 h-12 mx-auto text-slate-400 mb-4 opacity-50" />
                    <p className="text-slate-600 dark:text-slate-400">
                      No questions added yet
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>

            <DialogFooter className="border-t pt-4">
              <Button
                variant="outline"
                onClick={() => setIsQuestionsDialogOpen(false)}
                className="rounded-xl"
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={isAddQuestionDialogOpen}
          onOpenChange={setIsAddQuestionDialogOpen}
        >
          <DialogContent className="max-w-2xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>Add Question</DialogTitle>
              <DialogDescription>
                Add a new question to the quiz.
              </DialogDescription>
            </DialogHeader>

            <ScrollArea className="max-h-[calc(90vh-200px)]">
              <div className="space-y-4 py-4 pr-6">
                <div className="space-y-2">
                  <Label>Question Type</Label>
                  <Select
                    value={questionFormData.type}
                    onValueChange={(value) =>
                      setQuestionFormData({ ...questionFormData, type: value })
                    }
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MULTIPLE_CHOICE">
                        Multiple Choice
                      </SelectItem>
                      <SelectItem value="SINGLE_CHOICE">
                        Single Choice
                      </SelectItem>
                      <SelectItem value="TRUE_FALSE">True/False</SelectItem>
                      <SelectItem value="SHORT_ANSWER">Short Answer</SelectItem>
                      <SelectItem value="FILL_IN_BLANK">
                        Fill in the Blank
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Question</Label>
                  <Textarea
                    value={questionFormData.content}
                    onChange={(e) =>
                      setQuestionFormData({
                        ...questionFormData,
                        content: e.target.value,
                      })
                    }
                    placeholder="Enter your question"
                    className="rounded-xl min-h-[80px]"
                  />
                </div>

                {(questionFormData.type === "MULTIPLE_CHOICE" ||
                  questionFormData.type === "SINGLE_CHOICE") && (
                  <div className="space-y-2">
                    <Label>Options</Label>
                    {questionFormData.options.map((option, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <span className="w-8">
                          {String.fromCharCode(65 + index)}.
                        </span>
                        <Input
                          value={option}
                          onChange={(e) => {
                            const newOptions = [...questionFormData.options];
                            newOptions[index] = e.target.value;
                            setQuestionFormData({
                              ...questionFormData,
                              options: newOptions,
                            });
                          }}
                          placeholder={`Option ${index + 1}`}
                          className="rounded-xl"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {questionFormData.type === "TRUE_FALSE" && (
                  <div className="space-y-2">
                    <Label>Correct Answer</Label>
                    <RadioGroup
                      value={questionFormData.correctAnswer}
                      onValueChange={(value) =>
                        setQuestionFormData({
                          ...questionFormData,
                          correctAnswer: value,
                        })
                      }
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="true" />
                        <Label>True</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="false" />
                        <Label>False</Label>
                      </div>
                    </RadioGroup>
                  </div>
                )}

                {(questionFormData.type === "MULTIPLE_CHOICE" ||
                  questionFormData.type === "SINGLE_CHOICE") && (
                  <div className="space-y-2">
                    <Label>Correct Answer</Label>
                    <Select
                      value={questionFormData.correctAnswer}
                      onValueChange={(value) =>
                        setQuestionFormData({
                          ...questionFormData,
                          correctAnswer: value,
                        })
                      }
                    >
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="Select correct answer" />
                      </SelectTrigger>
                      <SelectContent>
                        {questionFormData.options
                          .filter((opt) => opt.trim() !== "")
                          .map((option, index) => (
                            <SelectItem key={index} value={option}>
                              {String.fromCharCode(65 + index)}. {option}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {(questionFormData.type === "SHORT_ANSWER" ||
                  questionFormData.type === "FILL_IN_BLANK") && (
                  <div className="space-y-2">
                    <Label>Correct Answer</Label>
                    <Input
                      value={questionFormData.correctAnswer}
                      onChange={(e) =>
                        setQuestionFormData({
                          ...questionFormData,
                          correctAnswer: e.target.value,
                        })
                      }
                      placeholder="Enter correct answer"
                      className="rounded-xl"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Points</Label>
                    <Input
                      type="number"
                      value={questionFormData.points}
                      onChange={(e) =>
                        setQuestionFormData({
                          ...questionFormData,
                          points: e.target.value,
                        })
                      }
                      placeholder="1"
                      className="rounded-xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Difficulty</Label>
                    <Select
                      value={questionFormData.difficulty}
                      onValueChange={(value) =>
                        setQuestionFormData({
                          ...questionFormData,
                          difficulty: value,
                        })
                      }
                    >
                      <SelectTrigger className="rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EASY">Easy</SelectItem>
                        <SelectItem value="MEDIUM">Medium</SelectItem>
                        <SelectItem value="HARD">Hard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Explanation (Optional)</Label>
                  <Textarea
                    value={questionFormData.explanation}
                    onChange={(e) =>
                      setQuestionFormData({
                        ...questionFormData,
                        explanation: e.target.value,
                      })
                    }
                    placeholder="Explain the answer"
                    className="rounded-xl min-h-[60px]"
                  />
                </div>
              </div>
            </ScrollArea>

            <DialogFooter className="border-t pt-4">
              <Button
                variant="outline"
                onClick={() => setIsAddQuestionDialogOpen(false)}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddQuestion}
                disabled={
                  addQuizQuestionsLoading ||
                  !questionFormData.content ||
                  !questionFormData.correctAnswer
                }
                className="rounded-xl"
              >
                {addQuizQuestionsLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Add Question
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={isEditQuizDialogOpen}
          onOpenChange={setIsEditQuizDialogOpen}
        >
          <DialogContent className="max-w-2xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>Edit Quiz</DialogTitle>
              <DialogDescription>Update the quiz details.</DialogDescription>
            </DialogHeader>

            <ScrollArea className="max-h-[calc(90vh-200px)]">
              <div className="space-y-4 py-4 pr-6">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    value={quizFormData.title}
                    onChange={(e) =>
                      setQuizFormData({
                        ...quizFormData,
                        title: e.target.value,
                      })
                    }
                    placeholder="Quiz title"
                    className="rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={quizFormData.description}
                    onChange={(e) =>
                      setQuizFormData({
                        ...quizFormData,
                        description: e.target.value,
                      })
                    }
                    placeholder="Quiz description"
                    className="rounded-xl min-h-[80px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Instructions</Label>
                  <Textarea
                    value={quizFormData.instructions}
                    onChange={(e) =>
                      setQuizFormData({
                        ...quizFormData,
                        instructions: e.target.value,
                      })
                    }
                    placeholder="Quiz instructions"
                    className="rounded-xl min-h-[80px]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Duration (minutes)</Label>
                    <Input
                      type="number"
                      value={quizFormData.duration}
                      onChange={(e) =>
                        setQuizFormData({
                          ...quizFormData,
                          duration: e.target.value,
                        })
                      }
                      placeholder="30"
                      className="rounded-xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Passing Score (%)</Label>
                    <Input
                      type="number"
                      value={quizFormData.passingScore}
                      onChange={(e) =>
                        setQuizFormData({
                          ...quizFormData,
                          passingScore: e.target.value,
                        })
                      }
                      placeholder="70"
                      className="rounded-xl"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Max Attempts</Label>
                  <Input
                    type="number"
                    value={quizFormData.maxAttempts}
                    onChange={(e) =>
                      setQuizFormData({
                        ...quizFormData,
                        maxAttempts: e.target.value,
                      })
                    }
                    placeholder="1"
                    className="rounded-xl"
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={quizFormData.isRequired}
                      onCheckedChange={(checked) =>
                        setQuizFormData({
                          ...quizFormData,
                          isRequired: checked,
                        })
                      }
                    />
                    <Label>Required</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={quizFormData.isRandomized}
                      onCheckedChange={(checked) =>
                        setQuizFormData({
                          ...quizFormData,
                          isRandomized: checked,
                        })
                      }
                    />
                    <Label>Randomize Questions</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={quizFormData.showResults}
                      onCheckedChange={(checked) =>
                        setQuizFormData({
                          ...quizFormData,
                          showResults: checked,
                        })
                      }
                    />
                    <Label>Show Results</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={quizFormData.allowReview}
                      onCheckedChange={(checked) =>
                        setQuizFormData({
                          ...quizFormData,
                          allowReview: checked,
                        })
                      }
                    />
                    <Label>Allow Review</Label>
                  </div>
                </div>
              </div>
            </ScrollArea>

            <DialogFooter className="border-t pt-4">
              <Button
                variant="outline"
                onClick={() => setIsEditQuizDialogOpen(false)}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateQuiz}
                disabled={
                  updateQuizLoading ||
                  !quizFormData.title ||
                  !quizFormData.duration ||
                  !quizFormData.passingScore
                }
                className="rounded-xl"
              >
                {updateQuizLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={isEditQuestionDialogOpen}
          onOpenChange={setIsEditQuestionDialogOpen}
        >
          <DialogContent className="max-w-2xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>Edit Question</DialogTitle>
              <DialogDescription>
                Update the question details.
              </DialogDescription>
            </DialogHeader>

            <ScrollArea className="max-h-[calc(90vh-200px)]">
              <div className="space-y-4 py-4 pr-6">
                <div className="space-y-2">
                  <Label>Question Type</Label>
                  <Select
                    value={questionFormData.type}
                    onValueChange={(value) =>
                      setQuestionFormData({ ...questionFormData, type: value })
                    }
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MULTIPLE_CHOICE">
                        Multiple Choice
                      </SelectItem>
                      <SelectItem value="SINGLE_CHOICE">
                        Single Choice
                      </SelectItem>
                      <SelectItem value="TRUE_FALSE">True/False</SelectItem>
                      <SelectItem value="SHORT_ANSWER">Short Answer</SelectItem>
                      <SelectItem value="FILL_IN_BLANK">
                        Fill in the Blank
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Question</Label>
                  <Textarea
                    value={questionFormData.content}
                    onChange={(e) =>
                      setQuestionFormData({
                        ...questionFormData,
                        content: e.target.value,
                      })
                    }
                    placeholder="Enter your question"
                    className="rounded-xl min-h-[80px]"
                  />
                </div>

                {(questionFormData.type === "MULTIPLE_CHOICE" ||
                  questionFormData.type === "SINGLE_CHOICE") && (
                  <div className="space-y-2">
                    <Label>Options</Label>
                    {questionFormData.options.map((option, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <span className="w-8">
                          {String.fromCharCode(65 + index)}.
                        </span>
                        <Input
                          value={option}
                          onChange={(e) => {
                            const newOptions = [...questionFormData.options];
                            newOptions[index] = e.target.value;
                            setQuestionFormData({
                              ...questionFormData,
                              options: newOptions,
                            });
                          }}
                          placeholder={`Option ${index + 1}`}
                          className="rounded-xl"
                        />
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Correct Answer</Label>
                  <Input
                    value={questionFormData.correctAnswer}
                    onChange={(e) =>
                      setQuestionFormData({
                        ...questionFormData,
                        correctAnswer: e.target.value,
                      })
                    }
                    placeholder="Enter correct answer"
                    className="rounded-xl"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Points</Label>
                    <Input
                      type="number"
                      value={questionFormData.points}
                      onChange={(e) =>
                        setQuestionFormData({
                          ...questionFormData,
                          points: e.target.value,
                        })
                      }
                      placeholder="1"
                      className="rounded-xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Difficulty</Label>
                    <Select
                      value={questionFormData.difficulty}
                      onValueChange={(value) =>
                        setQuestionFormData({
                          ...questionFormData,
                          difficulty: value,
                        })
                      }
                    >
                      <SelectTrigger className="rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EASY">Easy</SelectItem>
                        <SelectItem value="MEDIUM">Medium</SelectItem>
                        <SelectItem value="HARD">Hard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Explanation (Optional)</Label>
                  <Textarea
                    value={questionFormData.explanation}
                    onChange={(e) =>
                      setQuestionFormData({
                        ...questionFormData,
                        explanation: e.target.value,
                      })
                    }
                    placeholder="Explain the answer"
                    className="rounded-xl min-h-[60px]"
                  />
                </div>
              </div>
            </ScrollArea>

            <DialogFooter className="border-t pt-4">
              <Button
                variant="outline"
                onClick={() => setIsEditQuestionDialogOpen(false)}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateQuestion}
                disabled={
                  updateQuizQuestionLoading ||
                  !questionFormData.content ||
                  !questionFormData.correctAnswer
                }
                className="rounded-xl"
              >
                {updateQuizQuestionLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={isEditAssignmentDialogOpen}
          onOpenChange={setIsEditAssignmentDialogOpen}
        >
          <DialogContent className="max-w-2xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>Edit Assignment</DialogTitle>
              <DialogDescription>
                Update the assignment details.
              </DialogDescription>
            </DialogHeader>

            <ScrollArea className="max-h-[calc(90vh-200px)]">
              <div className="space-y-4 py-4 pr-6">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    value={assignmentFormData.title}
                    onChange={(e) =>
                      setAssignmentFormData({
                        ...assignmentFormData,
                        title: e.target.value,
                      })
                    }
                    placeholder="Assignment title"
                    className="rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={assignmentFormData.description}
                    onChange={(e) =>
                      setAssignmentFormData({
                        ...assignmentFormData,
                        description: e.target.value,
                      })
                    }
                    placeholder="Assignment description"
                    className="rounded-xl min-h-[80px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Instructions</Label>
                  <Textarea
                    value={assignmentFormData.instructions}
                    onChange={(e) =>
                      setAssignmentFormData({
                        ...assignmentFormData,
                        instructions: e.target.value,
                      })
                    }
                    placeholder="Assignment instructions"
                    className="rounded-xl min-h-[100px]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Due Date</Label>
                    <Input
                      type="datetime-local"
                      value={assignmentFormData.dueDate}
                      onChange={(e) =>
                        setAssignmentFormData({
                          ...assignmentFormData,
                          dueDate: e.target.value,
                        })
                      }
                      className="rounded-xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Total Points</Label>
                    <Input
                      type="number"
                      value={assignmentFormData.totalPoints}
                      onChange={(e) =>
                        setAssignmentFormData({
                          ...assignmentFormData,
                          totalPoints: e.target.value,
                        })
                      }
                      placeholder="100"
                      className="rounded-xl"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Rubric</Label>
                  <Textarea
                    value={assignmentFormData.rubric}
                    onChange={(e) =>
                      setAssignmentFormData({
                        ...assignmentFormData,
                        rubric: e.target.value,
                      })
                    }
                    placeholder="Grading rubric"
                    className="rounded-xl min-h-[80px]"
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={assignmentFormData.allowLateSubmission}
                      onCheckedChange={(checked) =>
                        setAssignmentFormData({
                          ...assignmentFormData,
                          allowLateSubmission: checked,
                        })
                      }
                    />
                    <Label>Allow Late Submission</Label>
                  </div>

                  {assignmentFormData.allowLateSubmission && (
                    <div className="space-y-2">
                      <Label>Late Penalty (%)</Label>
                      <Input
                        type="number"
                        value={assignmentFormData.latePenalty}
                        onChange={(e) =>
                          setAssignmentFormData({
                            ...assignmentFormData,
                            latePenalty: e.target.value,
                          })
                        }
                        placeholder="10"
                        className="rounded-xl"
                      />
                    </div>
                  )}
                </div>
              </div>
            </ScrollArea>

            <DialogFooter className="border-t pt-4">
              <Button
                variant="outline"
                onClick={() => setIsEditAssignmentDialogOpen(false)}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateAssignment}
                disabled={
                  updateAssignmentLoading ||
                  !assignmentFormData.title ||
                  !assignmentFormData.instructions ||
                  !assignmentFormData.totalPoints
                }
                className="rounded-xl"
              >
                {updateAssignmentLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog
          open={isDeleteQuizDialogOpen}
          onOpenChange={setIsDeleteQuizDialogOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Quiz</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{selectedQuiz?.title}"? This
                action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteQuiz}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog
          open={isDeleteQuestionDialogOpen}
          onOpenChange={setIsDeleteQuestionDialogOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Question</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this question? This action
                cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteQuestion}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog
          open={isDeleteAssignmentDialogOpen}
          onOpenChange={setIsDeleteAssignmentDialogOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Assignment</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{selectedAssignment?.title}"?
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteAssignment}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default QuizAssignmentPage;
