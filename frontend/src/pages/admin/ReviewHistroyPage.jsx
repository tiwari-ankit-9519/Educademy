import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";
import {
  getAllCoursesWithHistory,
  getCourseReviewHistory,
  clearError,
} from "@/features/adminSlice/adminCourse";
import {
  History,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Users,
  RefreshCw,
  X,
  FileText,
  User,
  MessageSquare,
  ArrowRight,
  BookOpen,
  Zap,
  Target,
  Info,
  Calendar,
  Eye,
} from "lucide-react";

const ReviewHistoryPage = () => {
  const dispatch = useDispatch();
  const {
    courseReviewHistory,
    coursesWithHistory,
    courseReviewHistoryLoading,
    coursesWithHistoryLoading,
    error,
  } = useSelector((state) => state.adminCourse);

  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedReview, setSelectedReview] = useState(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [hasInitialLoaded, setHasInitialLoaded] = useState(false);

  useEffect(() => {
    if (!hasInitialLoaded) {
      dispatch(getAllCoursesWithHistory());
      setHasInitialLoaded(true);
    }
  }, [dispatch, hasInitialLoaded]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const handleCourseSelect = (courseId) => {
    setSelectedCourseId(courseId);
    if (courseId) {
      dispatch(getCourseReviewHistory(courseId));
    }
  };

  const loadCoursesWithHistory = () => {
    dispatch(getAllCoursesWithHistory());
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
  };

  const openDetailDialog = (review) => {
    setSelectedReview(review);
    setIsDetailDialogOpen(true);
  };

  const getActionColor = (action) => {
    switch (action) {
      case "APPROVE":
      case "PUBLISHED":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      case "REJECT":
      case "REJECTED":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
      case "SUSPENDED":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300";
      case "UNDER_REVIEW":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
      case "ARCHIVED":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
      default:
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300";
    }
  };

  const getActionIcon = (action) => {
    switch (action) {
      case "APPROVE":
      case "PUBLISHED":
        return <CheckCircle className="w-3 h-3" />;
      case "REJECT":
      case "REJECTED":
        return <XCircle className="w-3 h-3" />;
      case "SUSPENDED":
        return <AlertTriangle className="w-3 h-3" />;
      case "UNDER_REVIEW":
        return <Clock className="w-3 h-3" />;
      case "ARCHIVED":
        return <FileText className="w-3 h-3" />;
      default:
        return <Zap className="w-3 h-3" />;
    }
  };

  const filteredCourses = coursesWithHistory.filter((course) => {
    const matchesSearch =
      searchTerm === "" ||
      course.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.instructorName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesAction =
      actionFilter === "all" || course.lastReviewAction === actionFilter;

    return matchesSearch && matchesAction;
  });

  const filteredReviewHistory =
    courseReviewHistory?.reviewHistory?.filter((review) => {
      const matchesSearch =
        searchTerm === "" ||
        review.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        review.instructorName
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        review.reviewerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (review.feedback &&
          review.feedback.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesAction =
        actionFilter === "all" || review.action === actionFilter;

      return matchesSearch && matchesAction;
    }) || [];

  const filteredStatusChanges =
    courseReviewHistory?.statusChanges?.filter((change) => {
      const matchesSearch =
        searchTerm === "" ||
        (change.reason &&
          change.reason.toLowerCase().includes(searchTerm.toLowerCase()));

      return matchesSearch;
    }) || [];

  if (
    (coursesWithHistoryLoading || courseReviewHistoryLoading) &&
    coursesWithHistory.length === 0
  ) {
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
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
              <History className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-800 dark:text-white">
                Review History
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Track and analyze course review activities and decisions
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={loadCoursesWithHistory}
              disabled={coursesWithHistoryLoading}
              className="rounded-xl border-white/50 dark:border-slate-700/50 bg-white/30 dark:bg-slate-800/30 backdrop-blur-sm hover:bg-white/50 dark:hover:bg-slate-700/50"
            >
              <RefreshCw
                className={cn(
                  "w-4 h-4 mr-2",
                  coursesWithHistoryLoading && "animate-spin"
                )}
              />
              Refresh
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 shadow-xl rounded-2xl">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 dark:via-slate-700/10 to-transparent rounded-2xl"></div>
            <CardContent className="p-6 relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Total Reviews
                  </p>
                  <p className="text-2xl font-bold text-slate-800 dark:text-white">
                    {courseReviewHistory?.totalReviews || 0}
                  </p>
                </div>
                <div className="p-2 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-lg shadow-lg">
                  <FileText className="w-5 h-5 text-white" />
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
                    Status Changes
                  </p>
                  <p className="text-2xl font-bold text-slate-800 dark:text-white">
                    {courseReviewHistory?.totalStatusChanges || 0}
                  </p>
                </div>
                <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg shadow-lg">
                  <ArrowRight className="w-5 h-5 text-white" />
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
                    Selected Course
                  </p>
                  <p className="text-lg font-bold text-slate-800 dark:text-white truncate">
                    {selectedCourseId
                      ? coursesWithHistory.find(
                          (c) => c.courseId === selectedCourseId
                        )?.courseName || "Course Selected"
                      : "No Selection"}
                  </p>
                </div>
                <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg shadow-lg">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 shadow-xl rounded-2xl mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 dark:via-slate-700/10 to-transparent rounded-2xl"></div>
          <CardHeader className="pb-6 relative">
            <div className="flex flex-col space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                <CardTitle className="text-slate-800 dark:text-white">
                  Available Courses ({filteredCourses.length}
                  {filteredCourses.length !== coursesWithHistory.length
                    ? ` of ${coursesWithHistory.length}`
                    : ""}
                  )
                </CardTitle>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-700 dark:text-slate-300">
                    Search Courses
                  </Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <Input
                      placeholder="Search courses, reviews, instructors..."
                      value={searchTerm}
                      onChange={(e) => handleSearch(e.target.value)}
                      className="pl-10 rounded-xl bg-white/70 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-700 dark:text-slate-300">
                    Filter by Action
                  </Label>
                  <Select value={actionFilter} onValueChange={setActionFilter}>
                    <SelectTrigger className="rounded-xl bg-white/70 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-lg border border-white/50 dark:border-slate-700/50">
                      <SelectItem value="all">All Actions</SelectItem>
                      <SelectItem value="APPROVE">Approved</SelectItem>
                      <SelectItem value="REJECT">Rejected</SelectItem>
                      <SelectItem value="SUSPENDED">Suspended</SelectItem>
                      <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchTerm("");
                      setActionFilter("all");
                      setSelectedCourseId("");
                    }}
                    className="w-full rounded-xl border-slate-200 dark:border-slate-600 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Clear All
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="relative">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCourses.length > 0 ? (
                filteredCourses.map((course) => (
                  <Card
                    key={course.courseId}
                    className={cn(
                      "cursor-pointer transition-all duration-200 border border-slate-200 dark:border-slate-700 hover:shadow-lg",
                      selectedCourseId === course.courseId
                        ? "ring-2 ring-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/20"
                        : "bg-white/50 dark:bg-slate-800/50 hover:bg-white/70 dark:hover:bg-slate-700/70"
                    )}
                    onClick={() => handleCourseSelect(course.courseId)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-medium text-slate-800 dark:text-white text-sm line-clamp-2 flex-1 mr-2">
                          {course.courseName}
                        </h3>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-white/50 dark:hover:bg-slate-600/50"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Info className="w-4 h-4" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-80 p-0" align="end">
                            <div className="p-4 space-y-4">
                              <div className="flex items-center space-x-2 pb-2 border-b border-slate-200 dark:border-slate-700">
                                <BookOpen className="w-4 h-4 text-indigo-600" />
                                <h4 className="font-semibold text-slate-800 dark:text-white">
                                  Course Details
                                </h4>
                              </div>

                              <div className="space-y-3">
                                <div>
                                  <Label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                                    Course Name
                                  </Label>
                                  <p className="text-sm text-slate-800 dark:text-white mt-1">
                                    {course.courseName}
                                  </p>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <Label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                                      Instructor
                                    </Label>
                                    <p className="text-sm text-slate-800 dark:text-white mt-1">
                                      {course.instructorName}
                                    </p>
                                  </div>
                                  <div>
                                    <Label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                                      Email
                                    </Label>
                                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                                      {course.instructorEmail}
                                    </p>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <Label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                                      Total Reviews
                                    </Label>
                                    <p className="text-sm text-slate-800 dark:text-white mt-1">
                                      {course.totalReviews}
                                    </p>
                                  </div>
                                  <div>
                                    <Label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                                      Status Changes
                                    </Label>
                                    <p className="text-sm text-slate-800 dark:text-white mt-1">
                                      {course.totalStatusChanges}
                                    </p>
                                  </div>
                                </div>

                                <div>
                                  <Label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                                    Last Review
                                  </Label>
                                  <div className="flex items-center justify-between mt-1">
                                    <p className="text-sm text-slate-800 dark:text-white">
                                      {formatDistanceToNow(
                                        new Date(course.lastReviewDate)
                                      )}{" "}
                                      ago
                                    </p>
                                    <Badge
                                      className={cn(
                                        "text-xs",
                                        getActionColor(course.lastReviewAction)
                                      )}
                                    >
                                      {getActionIcon(course.lastReviewAction)}
                                      <span className="ml-1">
                                        {course.lastReviewAction}
                                      </span>
                                    </Badge>
                                  </div>
                                </div>

                                <div>
                                  <Label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                                    Last Reviewer
                                  </Label>
                                  <p className="text-sm text-slate-800 dark:text-white mt-1">
                                    {course.lastReviewerName}
                                  </p>
                                </div>
                              </div>

                              <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                                <Button
                                  size="sm"
                                  className="w-full rounded-lg bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600"
                                  onClick={() =>
                                    handleCourseSelect(course.courseId)
                                  }
                                >
                                  <Eye className="w-3 h-3 mr-2" />
                                  View Full History
                                </Button>
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-600 dark:text-slate-400">
                            Instructor:
                          </span>
                          <span className="text-slate-800 dark:text-white truncate ml-2">
                            {course.instructorName}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-600 dark:text-slate-400">
                            Reviews:
                          </span>
                          <span className="text-slate-800 dark:text-white">
                            {course.totalReviews}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-600 dark:text-slate-400">
                            Changes:
                          </span>
                          <span className="text-slate-800 dark:text-white">
                            {course.totalStatusChanges}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-600 dark:text-slate-400">
                            Last Action:
                          </span>
                          <Badge
                            className={cn(
                              "text-xs",
                              getActionColor(course.lastReviewAction)
                            )}
                          >
                            {getActionIcon(course.lastReviewAction)}
                            <span className="ml-1">
                              {course.lastReviewAction}
                            </span>
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : coursesWithHistory.length > 0 ? (
                <div className="col-span-full text-center py-8">
                  <Search className="w-12 h-12 mx-auto text-slate-400 mb-4 opacity-50" />
                  <p className="text-slate-600 dark:text-slate-400">
                    No courses match your search criteria
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => {
                      setSearchTerm("");
                      setActionFilter("all");
                    }}
                  >
                    Clear Filters
                  </Button>
                </div>
              ) : (
                <div className="col-span-full text-center py-8">
                  <BookOpen className="w-12 h-12 mx-auto text-slate-400 mb-4 opacity-50" />
                  <p className="text-slate-600 dark:text-slate-400">
                    No courses with review history found
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {selectedCourseId && courseReviewHistory && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 shadow-xl rounded-2xl">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 dark:via-slate-700/10 to-transparent rounded-2xl"></div>
              <CardHeader className="pb-4 relative">
                <CardTitle className="text-slate-800 dark:text-white flex items-center">
                  <MessageSquare className="w-5 h-5 mr-2 text-indigo-600" />
                  Review History
                </CardTitle>
              </CardHeader>
              <CardContent className="relative">
                <ScrollArea className="h-[500px]">
                  {filteredReviewHistory.length > 0 ? (
                    <div className="space-y-3">
                      {filteredReviewHistory.map((review, index) => (
                        <div
                          key={index}
                          className="p-4 bg-white/30 dark:bg-slate-700/30 rounded-lg hover:bg-white/50 dark:hover:bg-slate-700/50 transition-all duration-200 cursor-pointer"
                          onClick={() => openDetailDialog(review)}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <Badge
                              className={cn(
                                "rounded-lg",
                                getActionColor(review.action)
                              )}
                            >
                              {getActionIcon(review.action)}
                              <span className="ml-1">{review.action}</span>
                            </Badge>
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              {formatDistanceToNow(new Date(review.reviewedAt))}{" "}
                              ago
                            </span>
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-slate-800 dark:text-white">
                              {review.courseName}
                            </p>
                            <p className="text-xs text-slate-600 dark:text-slate-400">
                              Reviewer: {review.reviewerName}
                            </p>
                            {review.feedback && (
                              <p className="text-xs text-slate-500 dark:text-slate-500 truncate">
                                {review.feedback}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <MessageSquare className="w-12 h-12 mx-auto text-slate-400 mb-4 opacity-50" />
                      <p className="text-slate-600 dark:text-slate-400">
                        No review history found
                      </p>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 shadow-xl rounded-2xl">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 dark:via-slate-700/10 to-transparent rounded-2xl"></div>
              <CardHeader className="pb-4 relative">
                <CardTitle className="text-slate-800 dark:text-white flex items-center">
                  <ArrowRight className="w-5 h-5 mr-2 text-indigo-600" />
                  Status Changes
                </CardTitle>
              </CardHeader>
              <CardContent className="relative">
                <ScrollArea className="h-[500px]">
                  {filteredStatusChanges.length > 0 ? (
                    <div className="space-y-3">
                      {filteredStatusChanges.map((change, index) => (
                        <div
                          key={index}
                          className="p-4 bg-white/30 dark:bg-slate-700/30 rounded-lg"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded-lg">
                                {change.previousStatus}
                              </Badge>
                              <ArrowRight className="w-4 h-4 text-slate-400" />
                              <Badge
                                className={cn(
                                  "rounded-lg",
                                  getActionColor(change.newStatus)
                                )}
                              >
                                {change.newStatus}
                              </Badge>
                            </div>
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              {formatDistanceToNow(new Date(change.changedAt))}{" "}
                              ago
                            </span>
                          </div>
                          {change.reason && (
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              {change.reason}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <ArrowRight className="w-12 h-12 mx-auto text-slate-400 mb-4 opacity-50" />
                      <p className="text-slate-600 dark:text-slate-400">
                        No status changes found
                      </p>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        )}

        {!selectedCourseId && coursesWithHistory.length > 0 && (
          <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 shadow-xl rounded-2xl">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 dark:via-slate-700/10 to-transparent rounded-2xl"></div>
            <CardContent className="p-12 text-center relative">
              <Eye className="w-16 h-16 mx-auto text-slate-400 mb-6 opacity-50" />
              <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-2">
                Select a Course
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                Click on any course card above to view its detailed review
                history and status changes.
              </p>
            </CardContent>
          </Card>
        )}

        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 shadow-xl rounded-2xl max-w-2xl">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 dark:via-slate-700/10 to-transparent rounded-2xl"></div>
            {selectedReview && (
              <div className="relative z-10">
                <DialogHeader>
                  <DialogTitle className="text-slate-800 dark:text-white">
                    Review Details
                  </DialogTitle>
                  <DialogDescription className="text-slate-600 dark:text-slate-400">
                    {selectedReview.courseName}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        Action Taken
                      </Label>
                      <Badge
                        className={cn(
                          "rounded-lg w-fit",
                          getActionColor(selectedReview.action)
                        )}
                      >
                        {getActionIcon(selectedReview.action)}
                        <span className="ml-1">{selectedReview.action}</span>
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        Review Date
                      </Label>
                      <p className="text-sm text-slate-800 dark:text-white">
                        {format(
                          new Date(selectedReview.reviewedAt),
                          "PPP 'at' p"
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        Reviewer
                      </Label>
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-slate-500" />
                        <span className="text-sm text-slate-800 dark:text-white">
                          {selectedReview.reviewerName}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        Instructor
                      </Label>
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4 text-slate-500" />
                        <span className="text-sm text-slate-800 dark:text-white">
                          {selectedReview.instructorName}
                        </span>
                      </div>
                    </div>
                  </div>

                  {selectedReview.feedback && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        Feedback
                      </Label>
                      <div className="bg-white/30 dark:bg-slate-700/30 backdrop-blur-sm rounded-xl p-4">
                        <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                          {selectedReview.feedback}
                        </p>
                      </div>
                    </div>
                  )}

                  {selectedReview.qualityNotes && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        Quality Notes
                      </Label>
                      <div className="bg-white/30 dark:bg-slate-700/30 backdrop-blur-sm rounded-xl p-4">
                        <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                          {selectedReview.qualityNotes}
                        </p>
                      </div>
                    </div>
                  )}

                  {selectedReview.suggestions &&
                    Array.isArray(selectedReview.suggestions) &&
                    selectedReview.suggestions.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-600 dark:text-slate-400">
                          Suggestions
                        </Label>
                        <div className="bg-white/30 dark:bg-slate-700/30 backdrop-blur-sm rounded-xl p-4">
                          <ul className="text-sm text-slate-700 dark:text-slate-300 space-y-1">
                            {selectedReview.suggestions.map(
                              (suggestion, index) => (
                                <li
                                  key={index}
                                  className="flex items-start space-x-2"
                                >
                                  <Target className="w-3 h-3 mt-1 text-slate-500 flex-shrink-0" />
                                  <span>{suggestion}</span>
                                </li>
                              )
                            )}
                          </ul>
                        </div>
                      </div>
                    )}
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsDetailDialogOpen(false)}
                    className="rounded-xl border-slate-200 dark:border-slate-600"
                  >
                    Close
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default ReviewHistoryPage;
