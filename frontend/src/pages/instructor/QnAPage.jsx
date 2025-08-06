import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
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
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";
import {
  getQnAQuestions,
  answerQuestion,
  updateAnswer,
  deleteAnswer,
  bulkAnswerQuestions,
  markQuestionAsResolved,
  setQnAFilters,
  resetQnAFilters,
  clearError,
} from "@/features/instructor/communitySlice";
import { getCourses } from "@/features/instructor/instructorCourseSlice";
import {
  MessageSquare,
  Search,
  RefreshCw,
  Users,
  Clock,
  CheckCircle,
  Edit,
  Trash2,
  Save,
  X,
  Loader2,
  Eye,
  BookOpen,
  Reply,
  Check,
  AlertCircle,
  MessageCircle,
} from "lucide-react";

const QnAPage = () => {
  const dispatch = useDispatch();
  const {
    qnaQuestions,
    qnaPagination,
    qnaFilters,
    qnaStats,
    getQnAQuestionsLoading,
    answerQuestionLoading,
    updateAnswerLoading,
    deleteAnswerLoading,
    bulkAnswerQuestionsLoading,
    markQuestionAsResolvedLoading,
    error,
  } = useSelector((state) => state.instructorCommunity);

  const { courses, getCoursesLoading } = useSelector(
    (state) => state.instructorCourse
  );

  const [isAnswerDialogOpen, setIsAnswerDialogOpen] = useState(false);
  const [isEditAnswerDialogOpen, setIsEditAnswerDialogOpen] = useState(false);
  const [isDeleteAnswerDialogOpen, setIsDeleteAnswerDialogOpen] =
    useState(false);
  const [isBulkAnswerDialogOpen, setIsBulkAnswerDialogOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [answerToDelete, setAnswerToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [hasInitialLoaded, setHasInitialLoaded] = useState(false);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [hasCoursesLoaded, setHasCoursesLoaded] = useState(false);

  const [answerFormData, setAnswerFormData] = useState({
    content: "",
    markAsAccepted: false,
  });

  const [editAnswerFormData, setEditAnswerFormData] = useState({
    content: "",
    markAsAccepted: false,
  });

  const [bulkAnswerData, setBulkAnswerData] = useState({
    answers: [],
  });

  useEffect(() => {
    if (!hasInitialLoaded) {
      dispatch(getQnAQuestions({ page: 1, limit: 20 }));
      setHasInitialLoaded(true);
    }
  }, [dispatch, hasInitialLoaded]);

  useEffect(() => {
    if (!hasCoursesLoaded) {
      dispatch(getCourses({ status: "PUBLISHED", limit: 50 }));
      setHasCoursesLoaded(true);
    }
  }, [dispatch, hasCoursesLoaded]);

  useEffect(() => {
    setSearchTerm(qnaFilters.search || "");
  }, [qnaFilters.search]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const handleFilterChange = (key, value) => {
    const newFilters = { ...qnaFilters, [key]: value };
    dispatch(setQnAFilters({ [key]: value }));

    if (hasInitialLoaded) {
      setTimeout(() => {
        dispatch(
          getQnAQuestions({
            ...newFilters,
            page: 1,
            limit: qnaPagination.limit,
          })
        );
      }, 100);
    }
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
    const newFilters = { ...qnaFilters, search: value };
    dispatch(setQnAFilters({ search: value }));

    if (hasInitialLoaded) {
      setTimeout(() => {
        dispatch(
          getQnAQuestions({
            ...newFilters,
            page: 1,
            limit: qnaPagination.limit,
          })
        );
      }, 300);
    }
  };

  const loadQuestions = () => {
    dispatch(
      getQnAQuestions({
        page: 1,
        limit: 20,
        ...(qnaFilters.search && { search: qnaFilters.search }),
        ...(qnaFilters.status && { status: qnaFilters.status }),
        ...(qnaFilters.isResolved !== undefined &&
          qnaFilters.isResolved !== "" && {
            isResolved: qnaFilters.isResolved,
          }),
        sortBy: qnaFilters.sortBy || "createdAt",
        sortOrder: qnaFilters.sortOrder || "desc",
      })
    );
  };

  const handleAnswerQuestion = async () => {
    try {
      await dispatch(
        answerQuestion({
          questionId: selectedQuestion.id,
          answerData: answerFormData,
        })
      ).unwrap();
      setIsAnswerDialogOpen(false);
      setSelectedQuestion(null);
      setAnswerFormData({
        content: "",
        markAsAccepted: false,
      });
      loadQuestions();
    } catch (error) {
      toast.error(error.message || "Failed to answer question");
    }
  };

  const handleUpdateAnswer = async () => {
    try {
      await dispatch(
        updateAnswer({
          answerId: selectedQuestion.myAnswer.id,
          updateData: editAnswerFormData,
        })
      ).unwrap();
      setIsEditAnswerDialogOpen(false);
      setSelectedQuestion(null);
      loadQuestions();
    } catch (error) {
      toast.error(error.message || "Failed to update answer");
    }
  };

  const handleDeleteAnswer = async () => {
    if (!answerToDelete) return;

    try {
      await dispatch(deleteAnswer(answerToDelete.id)).unwrap();
      setIsDeleteAnswerDialogOpen(false);
      setAnswerToDelete(null);
      loadQuestions();
    } catch (error) {
      toast.error(error.message || "Failed to delete answer");
    }
  };

  const handleBulkAnswer = async () => {
    if (selectedQuestions.length === 0) return;

    try {
      const answersArray = selectedQuestions.map((questionId) => ({
        questionId,
        content:
          bulkAnswerData.answers.find((a) => a.questionId === questionId)
            ?.content ||
          "Thank you for your question. This has been addressed.",
        markAsAccepted: false,
      }));

      await dispatch(bulkAnswerQuestions({ answers: answersArray })).unwrap();
      setIsBulkAnswerDialogOpen(false);
      setSelectedQuestions([]);
      setBulkAnswerData({ answers: [] });
      loadQuestions();
    } catch (error) {
      toast.error(error.message || "Failed to answer questions");
    }
  };

  const handleMarkAsResolved = async (questionId, isResolved) => {
    try {
      await dispatch(
        markQuestionAsResolved({ questionId, isResolved })
      ).unwrap();
      loadQuestions();
    } catch (error) {
      toast.error(error.message || "Failed to update question status");
    }
  };

  const openAnswerDialog = (question) => {
    setSelectedQuestion(question);
    setAnswerFormData({
      content: "",
      markAsAccepted: false,
    });
    setIsAnswerDialogOpen(true);
  };

  const openEditAnswerDialog = (question) => {
    setSelectedQuestion(question);
    const existingAnswer = question.myAnswer;
    setEditAnswerFormData({
      content: existingAnswer?.content || "",
      markAsAccepted: existingAnswer?.isAccepted || false,
    });
    setIsEditAnswerDialogOpen(true);
  };

  const openDeleteAnswerDialog = (question) => {
    setAnswerToDelete(question.myAnswer);
    setIsDeleteAnswerDialogOpen(true);
  };

  const handleSelectQuestion = (questionId) => {
    setSelectedQuestions((prev) =>
      prev.includes(questionId)
        ? prev.filter((id) => id !== questionId)
        : [...prev, questionId]
    );
  };

  const handleSelectAllQuestions = () => {
    if (selectedQuestions.length === qnaQuestions.length) {
      setSelectedQuestions([]);
    } else {
      setSelectedQuestions(qnaQuestions.map((q) => q.id));
    }
  };

  const getStatusColor = (isResolved) => {
    return isResolved
      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
      : "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300";
  };

  const getUrgencyColor = (views, createdAt) => {
    const daysSinceCreated =
      (new Date() - new Date(createdAt)) / (1000 * 60 * 60 * 24);
    const isUrgent = views > 10 || daysSinceCreated > 2;

    return isUrgent
      ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
      : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
  };

  if (getQnAQuestionsLoading && qnaQuestions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-cyan-50 dark:from-slate-900 dark:via-slate-800 dark:to-gray-900">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="animate-pulse space-y-6">
            <div className="h-12 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="h-32 bg-slate-200 dark:bg-slate-700 rounded-2xl"
                ></div>
              ))}
            </div>
            <div className="h-96 bg-slate-200 dark:bg-slate-700 rounded-2xl"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-cyan-50 dark:from-slate-900 dark:via-slate-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div className="flex items-center space-x-4 mb-4 lg:mb-0">
            <div className="p-3 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-2xl shadow-lg">
              <MessageSquare className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-800 dark:text-white">
                Q&A Management
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Answer student questions and manage course discussions
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {selectedQuestions.length > 0 && (
              <Dialog
                open={isBulkAnswerDialogOpen}
                onOpenChange={setIsBulkAnswerDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="rounded-xl border-white/50 dark:border-slate-700/50 bg-white/30 dark:bg-slate-800/30 backdrop-blur-sm hover:bg-white/50 dark:hover:bg-slate-700/50"
                  >
                    <Reply className="w-4 h-4 mr-2" />
                    Answer Selected ({selectedQuestions.length})
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh]">
                  <DialogHeader>
                    <DialogTitle>Bulk Answer Questions</DialogTitle>
                    <DialogDescription>
                      Provide answers for {selectedQuestions.length} selected
                      questions.
                    </DialogDescription>
                  </DialogHeader>

                  <ScrollArea className="max-h-[calc(90vh-200px)]">
                    <div className="space-y-4 py-4 pr-6">
                      <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                        <h4 className="font-medium text-slate-800 dark:text-white mb-2">
                          Selected Questions ({selectedQuestions.length})
                        </h4>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {qnaQuestions
                            .filter((q) => selectedQuestions.includes(q.id))
                            .map((question) => (
                              <div
                                key={question.id}
                                className="text-sm text-slate-600 dark:text-slate-400"
                              >
                                • {question.title}
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>
                  </ScrollArea>

                  <DialogFooter className="border-t pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setIsBulkAnswerDialogOpen(false)}
                      className="rounded-xl"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleBulkAnswer}
                      disabled={bulkAnswerQuestionsLoading}
                      className="rounded-xl"
                    >
                      {bulkAnswerQuestionsLoading ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      Answer All Questions
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}

            <Button
              variant="outline"
              onClick={loadQuestions}
              disabled={getQnAQuestionsLoading}
              className="rounded-xl border-white/50 dark:border-slate-700/50 bg-white/30 dark:bg-slate-800/30 backdrop-blur-sm hover:bg-white/50 dark:hover:bg-slate-700/50"
            >
              <RefreshCw
                className={cn(
                  "w-4 h-4 mr-2",
                  getQnAQuestionsLoading && "animate-spin"
                )}
              />
              Refresh
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 shadow-xl rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Total Questions
                  </p>
                  <p className="text-2xl font-bold text-slate-800 dark:text-white">
                    {qnaStats.totalQuestions || 0}
                  </p>
                </div>
                <div className="p-2 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-lg shadow-lg">
                  <MessageSquare className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 shadow-xl rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Answered
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {qnaStats.answeredQuestions || 0}
                  </p>
                </div>
                <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg shadow-lg">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 shadow-xl rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Pending
                  </p>
                  <p className="text-2xl font-bold text-orange-600">
                    {qnaStats.unansweredQuestions || 0}
                  </p>
                </div>
                <div className="p-2 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-lg shadow-lg">
                  <Clock className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 shadow-xl rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Response Rate
                  </p>
                  <p className="text-2xl font-bold text-purple-600">
                    {qnaStats.responseRate || 0}%
                  </p>
                </div>
                <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg shadow-lg">
                  <Eye className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 shadow-xl rounded-2xl">
          <CardHeader className="pb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <CardTitle className="text-slate-800 dark:text-white">
                Student Questions
              </CardTitle>

              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input
                    placeholder="Search questions..."
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-10 w-64 rounded-xl bg-white/70 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600"
                  />
                </div>

                <Select
                  value={qnaFilters.courseId || "all"}
                  onValueChange={(value) =>
                    handleFilterChange("courseId", value === "all" ? "" : value)
                  }
                >
                  <SelectTrigger className="w-40 rounded-xl bg-white/70 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600">
                    <SelectValue placeholder="Course" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="all">
                      {getCoursesLoading ? "Loading..." : "All Courses"}
                    </SelectItem>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={qnaFilters.status || "all"}
                  onValueChange={(value) =>
                    handleFilterChange("status", value === "all" ? "" : value)
                  }
                >
                  <SelectTrigger className="w-32 rounded-xl bg-white/70 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="unresolved">Unresolved</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  onClick={() => {
                    dispatch(resetQnAFilters());
                    setSearchTerm("");
                    dispatch(
                      getQnAQuestions({
                        page: 1,
                        limit: qnaPagination.limit,
                      })
                    );
                  }}
                  className="rounded-xl"
                >
                  <X className="w-4 h-4 mr-2" />
                  Clear
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {qnaQuestions.length > 0 && (
              <div className="flex items-center space-x-2 mb-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <input
                  type="checkbox"
                  checked={selectedQuestions.length === qnaQuestions.length}
                  onChange={handleSelectAllQuestions}
                  className="rounded"
                />
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  Select All ({selectedQuestions.length} selected)
                </span>
              </div>
            )}

            <div className="space-y-4">
              {qnaQuestions.map((question) => (
                <div
                  key={question.id}
                  className="p-6 rounded-xl border bg-white/50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 hover:bg-white/70 dark:hover:bg-slate-700/70 transition-all duration-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        checked={selectedQuestions.includes(question.id)}
                        onChange={() => handleSelectQuestion(question.id)}
                        className="mt-1 rounded"
                      />
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
                            {question.title}
                          </h3>
                          <Badge
                            className={cn(
                              "text-xs",
                              getStatusColor(question.isResolved)
                            )}
                          >
                            {question.isResolved ? (
                              <CheckCircle className="w-3 h-3 mr-1" />
                            ) : (
                              <Clock className="w-3 h-3 mr-1" />
                            )}
                            {question.isResolved ? "Resolved" : "Pending"}
                          </Badge>
                          {(question.views > 10 ||
                            (new Date() - new Date(question.createdAt)) /
                              (1000 * 60 * 60 * 24) >
                              2) && (
                            <Badge
                              className={cn(
                                "text-xs",
                                getUrgencyColor(
                                  question.views,
                                  question.createdAt
                                )
                              )}
                            >
                              <AlertCircle className="w-3 h-3 mr-1" />
                              Urgent
                            </Badge>
                          )}
                        </div>

                        <p className="text-slate-600 dark:text-slate-400 mb-3 line-clamp-2">
                          {question.content}
                        </p>

                        <div className="flex items-center space-x-6 text-sm text-slate-500 dark:text-slate-400 mb-3">
                          <div className="flex items-center space-x-1">
                            <Users className="w-4 h-4" />
                            <span>{question.student.name}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <BookOpen className="w-4 h-4" />
                            <span>{question.course.title}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Eye className="w-4 h-4" />
                            <span>{question.views} views</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <MessageCircle className="w-4 h-4" />
                            <span>{question.totalAnswers} answers</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>
                              {formatDistanceToNow(
                                new Date(question.createdAt)
                              )}{" "}
                              ago
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <span>
                              {format(
                                new Date(question.createdAt),
                                "MMM dd, yyyy"
                              )}
                            </span>
                          </div>
                        </div>

                        {question.myAnswer && (
                          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700 mb-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-blue-800 dark:text-blue-300">
                                Your Answer
                              </span>
                              {question.myAnswer.isAccepted && (
                                <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                                  <Check className="w-3 h-3 mr-1" />
                                  Accepted
                                </Badge>
                              )}
                            </div>
                            <p className="text-blue-700 dark:text-blue-300 text-sm">
                              {question.myAnswer.content}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleMarkAsResolved(
                            question.id,
                            !question.isResolved
                          )
                        }
                        disabled={markQuestionAsResolvedLoading}
                        className="rounded-lg"
                      >
                        {question.isResolved
                          ? "Mark Unresolved"
                          : "Mark Resolved"}
                      </Button>
                      {question.hasMyAnswer ? (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditAnswerDialog(question)}
                            disabled={updateAnswerLoading}
                            className="rounded-lg"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDeleteAnswerDialog(question)}
                            disabled={deleteAnswerLoading}
                            className="rounded-lg text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openAnswerDialog(question)}
                          className="rounded-lg text-white"
                        >
                          <Reply className="w-4 h-4 mr-1" />
                          Answer
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {qnaQuestions.length === 0 && !getQnAQuestionsLoading && (
                <div className="text-center py-12">
                  <MessageSquare className="w-12 h-12 mx-auto text-slate-400 mb-4 opacity-50" />
                  <p className="text-slate-600 dark:text-slate-400">
                    No questions found
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Dialog open={isAnswerDialogOpen} onOpenChange={setIsAnswerDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>Answer Question</DialogTitle>
              <DialogDescription>
                Provide a helpful answer to the student's question.
              </DialogDescription>
            </DialogHeader>

            <ScrollArea className="max-h-[calc(90vh-200px)]">
              <div className="space-y-4 py-4 pr-6">
                {selectedQuestion && (
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <h4 className="font-semibold text-slate-800 dark:text-white mb-2">
                      {selectedQuestion.title}
                    </h4>
                    <p className="text-slate-600 dark:text-slate-400 text-sm">
                      {selectedQuestion.content}
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Your Answer</Label>
                  <Textarea
                    value={answerFormData.content}
                    onChange={(e) =>
                      setAnswerFormData({
                        ...answerFormData,
                        content: e.target.value,
                      })
                    }
                    placeholder="Type your answer here..."
                    className="rounded-xl min-h-[120px]"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={answerFormData.markAsAccepted}
                    onCheckedChange={(checked) =>
                      setAnswerFormData({
                        ...answerFormData,
                        markAsAccepted: checked,
                      })
                    }
                  />
                  <Label>Mark as accepted solution</Label>
                </div>
              </div>
            </ScrollArea>

            <DialogFooter className="border-t pt-4">
              <Button
                variant="outline"
                onClick={() => setIsAnswerDialogOpen(false)}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAnswerQuestion}
                disabled={
                  answerQuestionLoading ||
                  !answerFormData.content ||
                  answerFormData.content.length < 10
                }
                className="rounded-xl"
              >
                {answerQuestionLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Post Answer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={isEditAnswerDialogOpen}
          onOpenChange={setIsEditAnswerDialogOpen}
        >
          <DialogContent className="max-w-2xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>Edit Answer</DialogTitle>
              <DialogDescription>
                Update your answer to this question.
              </DialogDescription>
            </DialogHeader>

            <ScrollArea className="max-h-[calc(90vh-200px)]">
              <div className="space-y-4 py-4 pr-6">
                <div className="space-y-2">
                  <Label>Your Answer</Label>
                  <Textarea
                    value={editAnswerFormData.content}
                    onChange={(e) =>
                      setEditAnswerFormData({
                        ...editAnswerFormData,
                        content: e.target.value,
                      })
                    }
                    placeholder="Type your answer here..."
                    className="rounded-xl min-h-[120px]"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={editAnswerFormData.markAsAccepted}
                    onCheckedChange={(checked) =>
                      setEditAnswerFormData({
                        ...editAnswerFormData,
                        markAsAccepted: checked,
                      })
                    }
                  />
                  <Label>Mark as accepted solution</Label>
                </div>
              </div>
            </ScrollArea>

            <DialogFooter className="border-t pt-4">
              <Button
                variant="outline"
                onClick={() => setIsEditAnswerDialogOpen(false)}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateAnswer}
                disabled={
                  updateAnswerLoading ||
                  !editAnswerFormData.content ||
                  editAnswerFormData.content.length < 10
                }
                className="rounded-xl"
              >
                {updateAnswerLoading ? (
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
          open={isDeleteAnswerDialogOpen}
          onOpenChange={setIsDeleteAnswerDialogOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Answer</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete your answer? This action cannot
                be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteAnswer}
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

export default QnAPage;
