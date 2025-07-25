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
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import {
  getPendingCourses,
  reviewCourse,
  bulkCourseActions,
  setPendingCoursesFilters,
  resetPendingCoursesFilters,
  clearError,
} from "@/features/adminSlice/adminCourse";
import {
  BookOpen,
  Search,
  MoreVertical,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Users,
  RefreshCw,
  Filter,
  X,
  Loader2,
  Activity,
  Timer,
  TrendingUp,
  Star,
  Play,
  DollarSign,
  Globe,
  Award,
  Target,
} from "lucide-react";

const PendingCourseReviewPage = () => {
  const dispatch = useDispatch();
  const {
    pendingCourses,
    pendingCoursesPagination,
    pendingCoursesFilters,
    pendingCoursesSummary,
    pendingCoursesLoading,
    reviewCourseLoading,
    bulkActionsLoading,
    error,
  } = useSelector((state) => state.adminCourse);

  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [isBulkActionDialogOpen, setIsBulkActionDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [hasInitialLoaded, setHasInitialLoaded] = useState(false);
  const [bulkAction, setBulkAction] = useState("");

  const [reviewFormData, setReviewFormData] = useState({
    action: "",
    feedback: "",
    qualityNotes: "",
    suggestions: "",
    priorityFeedback: "",
    reason: "",
  });

  const [bulkFormData, setBulkFormData] = useState({
    reason: "",
  });

  useEffect(() => {
    if (!hasInitialLoaded) {
      dispatch(
        getPendingCourses({
          page: 1,
          limit: 20,
        })
      );
      setHasInitialLoaded(true);
    }
  }, [dispatch, hasInitialLoaded]);

  useEffect(() => {
    setSearchTerm(pendingCoursesFilters.search || "");
  }, [pendingCoursesFilters.search]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const handleFilterChange = (key, value) => {
    const newFilters = { ...pendingCoursesFilters, [key]: value };
    dispatch(setPendingCoursesFilters({ [key]: value }));

    if (hasInitialLoaded) {
      setTimeout(() => {
        dispatch(
          getPendingCourses({
            ...newFilters,
            page: 1,
            limit: pendingCoursesPagination.limit,
          })
        );
      }, 100);
    }
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
    const newFilters = { ...pendingCoursesFilters, search: value };
    dispatch(setPendingCoursesFilters({ search: value }));

    if (hasInitialLoaded) {
      setTimeout(() => {
        dispatch(
          getPendingCourses({
            ...newFilters,
            page: 1,
            limit: pendingCoursesPagination.limit,
          })
        );
      }, 300);
    }
  };

  const loadPendingCourses = () => {
    dispatch(
      getPendingCourses({
        ...pendingCoursesFilters,
        page: pendingCoursesPagination.page,
        limit: pendingCoursesPagination.limit,
      })
    );
  };

  const resetReviewForm = () => {
    setReviewFormData({
      action: "",
      feedback: "",
      qualityNotes: "",
      suggestions: "",
      priorityFeedback: "",
      reason: "",
    });
  };

  const resetBulkForm = () => {
    setBulkFormData({
      reason: "",
    });
  };

  const handleReviewCourse = async () => {
    try {
      await dispatch(
        reviewCourse({
          courseId: selectedCourse.id,
          reviewData: reviewFormData,
        })
      ).unwrap();
      setIsReviewDialogOpen(false);
      setSelectedCourse(null);
      resetReviewForm();
    } catch (error) {
      toast.error(error.message || "Failed to review course");
    }
  };

  const handleBulkAction = async () => {
    try {
      await dispatch(
        bulkCourseActions({
          courseIds: selectedCourses,
          action: bulkAction,
          reason: bulkFormData.reason,
        })
      ).unwrap();
      setIsBulkActionDialogOpen(false);
      setSelectedCourses([]);
      setBulkAction("");
      resetBulkForm();
    } catch (error) {
      toast.error(error.message || "Failed to execute bulk action");
    }
  };

  const openReviewDialog = (course, action) => {
    setSelectedCourse(course);
    setReviewFormData({
      ...reviewFormData,
      action,
    });
    setIsReviewDialogOpen(true);
  };

  const openBulkActionDialog = (action) => {
    setBulkAction(action);
    setIsBulkActionDialogOpen(true);
  };

  const handleSelectCourse = (courseId) => {
    setSelectedCourses((prev) =>
      prev.includes(courseId)
        ? prev.filter((id) => id !== courseId)
        : [...prev, courseId]
    );
  };

  const handleSelectAll = () => {
    setSelectedCourses(
      selectedCourses.length === pendingCourses.length
        ? []
        : pendingCourses.map((course) => course.id)
    );
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "HIGH":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
      case "LOW":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
    }
  };

  const getLevelColor = (level) => {
    switch (level) {
      case "BEGINNER":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      case "INTERMEDIATE":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
      case "ADVANCED":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case "HIGH":
        return <AlertTriangle className="w-3 h-3" />;
      case "MEDIUM":
        return <Clock className="w-3 h-3" />;
      case "LOW":
        return <CheckCircle className="w-3 h-3" />;
      default:
        return <Timer className="w-3 h-3" />;
    }
  };

  if (pendingCoursesLoading && pendingCourses.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-cyan-50 dark:from-slate-900 dark:via-slate-800 dark:to-gray-900">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-16 left-16 w-24 h-24 bg-indigo-300/20 dark:bg-indigo-500/10 rounded-full"></div>
          <div className="absolute top-32 right-24 w-32 h-32 bg-blue-300/20 dark:bg-blue-500/10 rounded-2xl"></div>
          <div className="absolute bottom-24 left-24 w-28 h-28 bg-cyan-300/20 dark:bg-cyan-500/10 rounded-full"></div>
          <div className="absolute bottom-16 right-16 w-20 h-20 bg-violet-300/20 dark:bg-violet-500/10 rounded-2xl"></div>
        </div>
        <div className="container mx-auto px-4 py-8 max-w-7xl relative">
          <div className="space-y-6">
            <Skeleton className="h-12 w-64 rounded-xl" />
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-2xl" />
              ))}
            </div>
            <Skeleton className="h-96 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-cyan-50 dark:from-slate-900 dark:via-slate-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-7xl relative">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div className="flex items-center space-x-4 mb-4 lg:mb-0">
            <div className="p-3 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-2xl shadow-lg shadow-indigo-300/30 dark:shadow-indigo-500/20">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-800 dark:text-white">
                Pending Course Reviews
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Review and manage courses waiting for approval
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {selectedCourses.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="rounded-xl border-indigo-200 dark:border-indigo-700 bg-indigo-50/50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300"
                  >
                    Bulk Actions ({selectedCourses.length})
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="rounded-xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 shadow-lg"
                >
                  <DropdownMenuItem
                    onClick={() => openBulkActionDialog("APPROVE")}
                    className="rounded-lg text-green-600 dark:text-green-400"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve Selected
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => openBulkActionDialog("REJECT")}
                    className="rounded-lg text-red-600 dark:text-red-400"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject Selected
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => openBulkActionDialog("SUSPEND")}
                    className="rounded-lg text-orange-600 dark:text-orange-400"
                  >
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Suspend Selected
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            <Button
              variant="outline"
              onClick={loadPendingCourses}
              disabled={pendingCoursesLoading}
              className="rounded-xl border-white/50 dark:border-slate-700/50 bg-white/30 dark:bg-slate-800/30 backdrop-blur-sm hover:bg-white/50 dark:hover:bg-slate-700/50"
            >
              <RefreshCw
                className={cn(
                  "w-4 h-4 mr-2",
                  pendingCoursesLoading && "animate-spin"
                )}
              />
              Refresh
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 shadow-xl rounded-2xl">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 dark:via-slate-700/10 to-transparent rounded-2xl"></div>
            <CardContent className="p-6 relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Total Pending
                  </p>
                  <p className="text-2xl font-bold text-slate-800 dark:text-white">
                    {pendingCoursesSummary.totalPending || 0}
                  </p>
                </div>
                <div className="p-2 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-lg shadow-lg">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 shadow-xl rounded-2xl">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 dark:via-slate-700/10 to-transparent rounded-2xl"></div>
            <CardContent className="p-6 relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    High Priority
                  </p>
                  <p className="text-2xl font-bold text-red-600">
                    {pendingCoursesSummary.highPriority || 0}
                  </p>
                </div>
                <div className="p-2 bg-gradient-to-br from-red-500 to-red-600 rounded-lg shadow-lg">
                  <AlertTriangle className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 shadow-xl rounded-2xl">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 dark:via-slate-700/10 to-transparent rounded-2xl"></div>
            <CardContent className="p-6 relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Medium Priority
                  </p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {pendingCoursesSummary.mediumPriority || 0}
                  </p>
                </div>
                <div className="p-2 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg shadow-lg">
                  <Clock className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 shadow-xl rounded-2xl">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 dark:via-slate-700/10 to-transparent rounded-2xl"></div>
            <CardContent className="p-6 relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Low Priority
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {pendingCoursesSummary.lowPriority || 0}
                  </p>
                </div>
                <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg shadow-lg">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 shadow-xl rounded-2xl">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 dark:via-slate-700/10 to-transparent rounded-2xl"></div>
            <CardContent className="p-6 relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Overdue
                  </p>
                  <p className="text-2xl font-bold text-orange-600">
                    {pendingCoursesSummary.overdue || 0}
                  </p>
                </div>
                <div className="p-2 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg shadow-lg">
                  <Timer className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 shadow-xl rounded-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 dark:via-slate-700/10 to-transparent rounded-2xl"></div>
          <CardHeader className="pb-6 relative">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <CardTitle className="text-slate-800 dark:text-white">
                Courses Pending Review
              </CardTitle>

              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input
                    placeholder="Search courses..."
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-10 w-64 rounded-xl bg-white/70 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600"
                  />
                </div>

                <Select
                  value={pendingCoursesFilters.category || "all"}
                  onValueChange={(value) =>
                    handleFilterChange("category", value === "all" ? "" : value)
                  }
                >
                  <SelectTrigger className="w-32 rounded-xl bg-white/70 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-lg border border-white/50 dark:border-slate-700/50">
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="programming">Programming</SelectItem>
                    <SelectItem value="design">Design</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={pendingCoursesFilters.level || "all"}
                  onValueChange={(value) =>
                    handleFilterChange("level", value === "all" ? "" : value)
                  }
                >
                  <SelectTrigger className="w-32 rounded-xl bg-white/70 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600">
                    <SelectValue placeholder="Level" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-lg border border-white/50 dark:border-slate-700/50">
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="BEGINNER">Beginner</SelectItem>
                    <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
                    <SelectItem value="ADVANCED">Advanced</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={pendingCoursesFilters.priority || "all"}
                  onValueChange={(value) =>
                    handleFilterChange(
                      "priority",
                      value === "all" ? "all" : value
                    )
                  }
                >
                  <SelectTrigger className="w-32 rounded-xl bg-white/70 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-lg border border-white/50 dark:border-slate-700/50">
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="LOW">Low</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  onClick={() => {
                    dispatch(resetPendingCoursesFilters());
                    setSearchTerm("");
                    dispatch(
                      getPendingCourses({
                        page: 1,
                        limit: pendingCoursesPagination.limit,
                      })
                    );
                  }}
                  className="rounded-xl border-slate-200 dark:border-slate-600 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm"
                >
                  <X className="w-4 h-4 mr-2" />
                  Clear
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="relative">
            <ScrollArea className="h-[600px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={
                          selectedCourses.length === pendingCourses.length &&
                          pendingCourses.length > 0
                        }
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead className="text-slate-700 dark:text-slate-300">
                      Course
                    </TableHead>
                    <TableHead className="text-slate-700 dark:text-slate-300">
                      Instructor
                    </TableHead>
                    <TableHead className="text-slate-700 dark:text-slate-300">
                      Level
                    </TableHead>
                    <TableHead className="text-slate-700 dark:text-slate-300">
                      Priority
                    </TableHead>
                    <TableHead className="text-slate-700 dark:text-slate-300">
                      Price
                    </TableHead>
                    <TableHead className="text-slate-700 dark:text-slate-300">
                      Submitted
                    </TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingCourses.map((course) => (
                    <TableRow
                      key={course.id}
                      className="hover:bg-white/50 dark:hover:bg-slate-700/30 transition-all duration-200"
                    >
                      <TableCell>
                        <Checkbox
                          checked={selectedCourses.includes(course.id)}
                          onCheckedChange={() => handleSelectCourse(course.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          {course.thumbnail && (
                            <img
                              src={course.thumbnail}
                              alt={course.title}
                              className="w-12 h-8 object-cover rounded-lg"
                            />
                          )}
                          <div className="flex flex-col">
                            <span className="font-medium text-slate-800 dark:text-white">
                              {course.title}
                            </span>
                            <span className="text-sm text-slate-500 dark:text-slate-400">
                              {course.category?.name}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center">
                            <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-slate-800 dark:text-white">
                              {course.instructor?.name}
                            </span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              {course.instructor?.totalCourses} courses
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={cn(
                            "rounded-lg shadow-sm",
                            getLevelColor(course.level)
                          )}
                        >
                          {course.level}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={cn(
                            "rounded-lg shadow-sm",
                            getPriorityColor(course.metrics?.priorityLevel)
                          )}
                        >
                          {getPriorityIcon(course.metrics?.priorityLevel)}
                          <span className="ml-1">
                            {course.metrics?.priorityLevel}
                          </span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <DollarSign className="w-4 h-4 text-green-600 mr-1" />
                          <span className="font-medium text-slate-800 dark:text-white">
                            ${course.price}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-slate-600 dark:text-slate-400">
                        {formatDistanceToNow(
                          new Date(course.reviewSubmittedAt)
                        )}{" "}
                        ago
                        <div className="text-xs text-slate-500 dark:text-slate-500">
                          {course.metrics?.daysSinceSubmission} days
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-white/50 dark:hover:bg-slate-700/50 rounded-lg"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="rounded-xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 shadow-lg"
                          >
                            <DropdownMenuItem
                              onClick={() => openReviewDialog(course, "VIEW")}
                              className="rounded-lg"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              Review Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() =>
                                openReviewDialog(course, "APPROVE")
                              }
                              className="rounded-lg text-green-600 dark:text-green-400"
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Approve
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => openReviewDialog(course, "REJECT")}
                              className="rounded-lg text-red-600 dark:text-red-400"
                            >
                              <XCircle className="w-4 h-4 mr-2" />
                              Reject
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {pendingCourses.length === 0 && !pendingCoursesLoading && (
                <div className="text-center py-12">
                  <BookOpen className="w-12 h-12 mx-auto text-slate-400 mb-4 opacity-50" />
                  <p className="text-slate-600 dark:text-slate-400">
                    No pending courses found
                  </p>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
          <DialogContent className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 shadow-xl rounded-2xl max-w-2xl">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 dark:via-slate-700/10 to-transparent rounded-2xl"></div>
            <div className="relative z-10">
              <DialogHeader>
                <DialogTitle className="text-slate-800 dark:text-white">
                  {reviewFormData.action === "VIEW"
                    ? "Course Review Details"
                    : `${reviewFormData.action} Course`}
                </DialogTitle>
                <DialogDescription className="text-slate-600 dark:text-slate-400">
                  {selectedCourse?.title}
                </DialogDescription>
              </DialogHeader>

              {selectedCourse && (
                <div className="grid gap-6 py-4">
                  <div className="bg-white/30 dark:bg-slate-700/30 backdrop-blur-sm rounded-xl p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-slate-600 dark:text-slate-400">
                          Instructor
                        </Label>
                        <p className="text-slate-800 dark:text-white">
                          {selectedCourse.instructor?.name}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-slate-600 dark:text-slate-400">
                          Category
                        </Label>
                        <p className="text-slate-800 dark:text-white">
                          {selectedCourse.category?.name}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-slate-600 dark:text-slate-400">
                          Level
                        </Label>
                        <Badge
                          className={cn(
                            "rounded-lg",
                            getLevelColor(selectedCourse.level)
                          )}
                        >
                          {selectedCourse.level}
                        </Badge>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-slate-600 dark:text-slate-400">
                          Priority
                        </Label>
                        <Badge
                          className={cn(
                            "rounded-lg",
                            getPriorityColor(
                              selectedCourse.metrics?.priorityLevel
                            )
                          )}
                        >
                          {selectedCourse.metrics?.priorityLevel}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {reviewFormData.action !== "VIEW" && (
                    <>
                      <div className="space-y-2">
                        <Label
                          htmlFor="action"
                          className="text-slate-700 dark:text-slate-300"
                        >
                          Action
                        </Label>
                        <Select
                          value={reviewFormData.action}
                          onValueChange={(value) =>
                            setReviewFormData({
                              ...reviewFormData,
                              action: value,
                            })
                          }
                        >
                          <SelectTrigger className="rounded-xl bg-white/70 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-lg border border-white/50 dark:border-slate-700/50">
                            <SelectItem value="APPROVE">Approve</SelectItem>
                            <SelectItem value="REJECT">Reject</SelectItem>
                            <SelectItem value="SUSPENDED">Suspend</SelectItem>
                            <SelectItem value="UNDER_REVIEW">
                              Keep Under Review
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label
                          htmlFor="feedback"
                          className="text-slate-700 dark:text-slate-300"
                        >
                          Feedback
                        </Label>
                        <Textarea
                          id="feedback"
                          value={reviewFormData.feedback}
                          onChange={(e) =>
                            setReviewFormData({
                              ...reviewFormData,
                              feedback: e.target.value,
                            })
                          }
                          placeholder="Provide feedback for the instructor..."
                          className="rounded-xl min-h-[100px] bg-white/70 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label
                          htmlFor="qualityNotes"
                          className="text-slate-700 dark:text-slate-300"
                        >
                          Quality Notes (Optional)
                        </Label>
                        <Textarea
                          id="qualityNotes"
                          value={reviewFormData.qualityNotes}
                          onChange={(e) =>
                            setReviewFormData({
                              ...reviewFormData,
                              qualityNotes: e.target.value,
                            })
                          }
                          placeholder="Internal quality assessment notes..."
                          className="rounded-xl bg-white/70 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600"
                        />
                      </div>
                    </>
                  )}
                </div>
              )}

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsReviewDialogOpen(false);
                    setSelectedCourse(null);
                    resetReviewForm();
                  }}
                  className="rounded-xl border-slate-200 dark:border-slate-600"
                >
                  {reviewFormData.action === "VIEW" ? "Close" : "Cancel"}
                </Button>
                {reviewFormData.action !== "VIEW" && (
                  <Button
                    onClick={handleReviewCourse}
                    disabled={
                      reviewCourseLoading ||
                      !reviewFormData.action ||
                      !reviewFormData.feedback
                    }
                    className={cn(
                      "rounded-xl shadow-md",
                      reviewFormData.action === "APPROVE"
                        ? "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                        : "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                    )}
                  >
                    {reviewCourseLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : reviewFormData.action === "APPROVE" ? (
                      <CheckCircle className="w-4 h-4 mr-2" />
                    ) : (
                      <XCircle className="w-4 h-4 mr-2" />
                    )}
                    {reviewFormData.action} Course
                  </Button>
                )}
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>

        <AlertDialog
          open={isBulkActionDialogOpen}
          onOpenChange={setIsBulkActionDialogOpen}
        >
          <AlertDialogContent className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 shadow-xl rounded-2xl">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 dark:via-slate-700/10 to-transparent rounded-2xl"></div>
            <div className="relative z-10">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-slate-800 dark:text-white">
                  {bulkAction} Selected Courses
                </AlertDialogTitle>
                <AlertDialogDescription className="text-slate-600 dark:text-slate-400">
                  Are you sure you want to {bulkAction.toLowerCase()}{" "}
                  {selectedCourses.length} selected course(s)? This action will
                  affect multiple courses at once.
                </AlertDialogDescription>
              </AlertDialogHeader>

              <div className="space-y-4 my-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="bulkReason"
                    className="text-slate-700 dark:text-slate-300"
                  >
                    Reason
                  </Label>
                  <Textarea
                    id="bulkReason"
                    value={bulkFormData.reason}
                    onChange={(e) =>
                      setBulkFormData({
                        ...bulkFormData,
                        reason: e.target.value,
                      })
                    }
                    placeholder="Provide a reason for this bulk action..."
                    className="rounded-xl min-h-[80px] bg-white/70 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600"
                  />
                </div>
              </div>

              <AlertDialogFooter>
                <AlertDialogCancel
                  onClick={() => {
                    setIsBulkActionDialogOpen(false);
                    setBulkAction("");
                    resetBulkForm();
                  }}
                  className="rounded-xl border-slate-200 dark:border-slate-600"
                >
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleBulkAction}
                  disabled={bulkActionsLoading || !bulkFormData.reason}
                  className={cn(
                    "rounded-xl shadow-md",
                    bulkAction === "APPROVE"
                      ? "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                      : "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                  )}
                >
                  {bulkActionsLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4 mr-2" />
                  )}
                  {bulkAction} Courses
                </AlertDialogAction>
              </AlertDialogFooter>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default PendingCourseReviewPage;
