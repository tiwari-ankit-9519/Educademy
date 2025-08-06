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
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";
import {
  getCourseReviews,
  replyToReview,
  updateReply,
  deleteReply,
  getCommunityOverview,
  setReviewsFilters,
  resetReviewsFilters,
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
  TrendingUp,
  BarChart3,
  Star,
  Heart,
  Reply,
  AlertCircle,
  BookOpen,
  Eye,
  Calendar,
  ThumbsUp,
} from "lucide-react";

const ReviewsAndCommunityPage = () => {
  const dispatch = useDispatch();
  const {
    reviews,
    reviewsPagination,
    reviewsFilters,
    reviewsStats,
    communityOverview,
    getCourseReviewsLoading,
    replyToReviewLoading,
    updateReplyLoading,
    deleteReplyLoading,
    getCommunityOverviewLoading,
    error,
  } = useSelector((state) => state.instructorCommunity);

  const { courses, getCoursesLoading } = useSelector(
    (state) => state.instructorCourse
  );

  const [isReplyDialogOpen, setIsReplyDialogOpen] = useState(false);
  const [isEditReplyDialogOpen, setIsEditReplyDialogOpen] = useState(false);
  const [isDeleteReplyDialogOpen, setIsDeleteReplyDialogOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);
  const [replyToDelete, setReplyToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [hasInitialLoaded, setHasInitialLoaded] = useState(false);
  const [hasCoursesLoaded, setHasCoursesLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const [replyFormData, setReplyFormData] = useState({
    content: "",
  });

  const [editReplyFormData, setEditReplyFormData] = useState({
    content: "",
  });

  useEffect(() => {
    if (!hasInitialLoaded) {
      dispatch(getCommunityOverview());
      dispatch(getCourseReviews({ page: 1, limit: 20 }));
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
    setSearchTerm(reviewsFilters.search || "");
  }, [reviewsFilters.search]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === "overview") {
      dispatch(getCommunityOverview());
    } else if (tab === "reviews") {
      dispatch(getCourseReviews({ page: 1, limit: 20 }));
    }
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...reviewsFilters, [key]: value };
    dispatch(setReviewsFilters({ [key]: value }));

    if (hasInitialLoaded) {
      setTimeout(() => {
        dispatch(
          getCourseReviews({
            ...newFilters,
            page: 1,
            limit: reviewsPagination.limit,
          })
        );
      }, 100);
    }
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
    const newFilters = { ...reviewsFilters, search: value };
    dispatch(setReviewsFilters({ search: value }));

    if (hasInitialLoaded) {
      setTimeout(() => {
        dispatch(
          getCourseReviews({
            ...newFilters,
            page: 1,
            limit: reviewsPagination.limit,
          })
        );
      }, 300);
    }
  };

  const loadReviews = () => {
    if (activeTab === "overview") {
      dispatch(getCommunityOverview());
    }
    dispatch(
      getCourseReviews({
        page: 1,
        limit: 20,
        ...(reviewsFilters.search && { search: reviewsFilters.search }),
        ...(reviewsFilters.rating && { rating: reviewsFilters.rating }),
        ...(reviewsFilters.hasReply !== undefined && {
          hasReply: reviewsFilters.hasReply,
        }),
        sortBy: reviewsFilters.sortBy || "createdAt",
        sortOrder: reviewsFilters.sortOrder || "desc",
      })
    );
  };

  const handleReplyToReview = async () => {
    try {
      await dispatch(
        replyToReview({
          reviewId: selectedReview.id,
          replyData: replyFormData,
        })
      ).unwrap();
      setIsReplyDialogOpen(false);
      setSelectedReview(null);
      setReplyFormData({ content: "" });
      loadReviews();
    } catch (error) {
      toast.error(error.message || "Failed to reply to review");
    }
  };

  const handleUpdateReply = async () => {
    try {
      await dispatch(
        updateReply({
          replyId: selectedReview.myReply.id,
          updateData: editReplyFormData,
        })
      ).unwrap();
      setIsEditReplyDialogOpen(false);
      setSelectedReview(null);
      loadReviews();
    } catch (error) {
      toast.error(error.message || "Failed to update reply");
    }
  };

  const handleDeleteReply = async () => {
    if (!replyToDelete) return;

    try {
      await dispatch(deleteReply(replyToDelete.id)).unwrap();
      setIsDeleteReplyDialogOpen(false);
      setReplyToDelete(null);
      loadReviews();
    } catch (error) {
      toast.error(error.message || "Failed to delete reply");
    }
  };

  const openReplyDialog = (review) => {
    setSelectedReview(review);
    setReplyFormData({ content: "" });
    setIsReplyDialogOpen(true);
  };

  const openEditReplyDialog = (review) => {
    setSelectedReview(review);
    setEditReplyFormData({
      content: review.myReply?.content || "",
    });
    setIsEditReplyDialogOpen(true);
  };

  const openDeleteReplyDialog = (review) => {
    setReplyToDelete(review.myReply);
    setIsDeleteReplyDialogOpen(true);
  };

  const getRatingBgColor = (rating) => {
    if (rating >= 4)
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
    if (rating >= 3)
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
    return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={cn(
          "w-4 h-4",
          i < rating
            ? "fill-yellow-400 text-yellow-400"
            : "text-gray-300 dark:text-gray-600"
        )}
      />
    ));
  };

  const getLatestReview = () => {
    if (!reviews || reviews.length === 0) return null;
    return reviews.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    )[0];
  };

  if (
    (getCourseReviewsLoading || getCommunityOverviewLoading) &&
    activeTab === "overview" &&
    !communityOverview
  ) {
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

  const latestReview = getLatestReview();

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
                Community & Reviews
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Manage student reviews and monitor community engagement
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex items-center bg-white/30 dark:bg-slate-800/30 backdrop-blur-sm rounded-xl border border-white/50 dark:border-slate-700/50">
              <Button
                variant={activeTab === "overview" ? "default" : "ghost"}
                onClick={() => handleTabChange("overview")}
                className="rounded-l-xl"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Overview
              </Button>
              <Button
                variant={activeTab === "reviews" ? "default" : "ghost"}
                onClick={() => handleTabChange("reviews")}
                className="rounded-r-xl"
              >
                <Star className="w-4 h-4 mr-2" />
                Reviews
              </Button>
            </div>

            <Button
              variant="outline"
              onClick={loadReviews}
              disabled={getCourseReviewsLoading || getCommunityOverviewLoading}
              className="rounded-xl border-white/50 dark:border-slate-700/50 bg-white/30 dark:bg-slate-800/30 backdrop-blur-sm hover:bg-white/50 dark:hover:bg-slate-700/50"
            >
              <RefreshCw
                className={cn(
                  "w-4 h-4 mr-2",
                  (getCourseReviewsLoading || getCommunityOverviewLoading) &&
                    "animate-spin"
                )}
              />
              Refresh
            </Button>
          </div>
        </div>

        {activeTab === "overview" && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 shadow-xl rounded-2xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        Total Reviews
                      </p>
                      <p className="text-2xl font-bold text-slate-800 dark:text-white">
                        {reviewsStats.totalReviews || 0}
                      </p>
                    </div>
                    <div className="p-2 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-lg shadow-lg">
                      <Star className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 shadow-xl rounded-2xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        Replied Reviews
                      </p>
                      <p className="text-2xl font-bold text-green-600">
                        {reviewsStats.repliedReviews || 0}
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
                        Pending Replies
                      </p>
                      <p className="text-2xl font-bold text-orange-600">
                        {reviewsStats.unrepliedReviews || 0}
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
                        Reply Rate
                      </p>
                      <p className="text-2xl font-bold text-purple-600">
                        {reviewsStats.replyRate || 0}%
                      </p>
                    </div>
                    <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg shadow-lg">
                      <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* {communityOverview &&
                communityOverview.pendingActions &&
                communityOverview.pendingActions.reviews?.length > 0 && (
                  <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 shadow-xl rounded-2xl">
                    <CardHeader>
                      <CardTitle className="text-slate-800 dark:text-white flex items-center">
                        <Star className="w-5 h-5 mr-2" />
                        Pending Review Replies (
                        {communityOverview.pendingActions.reviews.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {communityOverview.pendingActions.reviews
                          .slice(0, 3)
                          .map((review) => (
                            <div
                              key={review.id}
                              className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg"
                            >
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2 mb-2">
                                    <div className="flex items-center">
                                      {renderStars(review.rating)}
                                    </div>
                                    <Badge
                                      className={cn(
                                        "text-xs",
                                        getRatingBgColor(review.rating)
                                      )}
                                    >
                                      {review.rating}/5
                                    </Badge>
                                    <span className="text-sm text-slate-600 dark:text-slate-400">
                                      by {review.author.name}
                                    </span>
                                  </div>
                                  <h4 className="font-medium text-slate-800 dark:text-white text-sm mb-1">
                                    {review.title}
                                  </h4>
                                  <p className="text-xs text-slate-600 dark:text-slate-400">
                                    {review.course.title}
                                  </p>
                                </div>
                                {review.needsAttention && (
                                  <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">
                                    <AlertCircle className="w-3 h-3 mr-1" />
                                    Low Rating
                                  </Badge>
                                )}
                              </div>
                            </div>
                          ))}
                      </div>
                    </CardContent>
                  </Card>
                )} */}

              {latestReview && (
                <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 shadow-xl rounded-2xl">
                  <CardHeader>
                    <CardTitle className="text-slate-800 dark:text-white flex items-center">
                      <MessageSquare className="w-5 h-5 mr-2" />
                      Latest Review
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="flex items-center">
                          {renderStars(latestReview.rating)}
                        </div>
                        <Badge
                          className={cn(
                            "text-xs",
                            getRatingBgColor(latestReview.rating)
                          )}
                        >
                          {latestReview.rating}/5
                        </Badge>
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          by {latestReview.author?.name || "Anonymous"}
                        </span>
                      </div>
                      <h4 className="font-semibold text-slate-800 dark:text-white">
                        {latestReview.title || "Review"}
                      </h4>
                      <p className="text-slate-600 dark:text-slate-400 text-sm line-clamp-3">
                        {latestReview.content}
                      </p>
                      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                        <span>{latestReview.course?.title}</span>
                        <span>
                          {formatDistanceToNow(
                            new Date(latestReview.createdAt)
                          )}{" "}
                          ago
                        </span>
                      </div>
                      {!latestReview.hasMyReply && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openReplyDialog(latestReview)}
                          className="w-full rounded-lg text-white"
                        >
                          <Reply className="w-4 h-4 mr-1" />
                          Reply to Review
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* {communityOverview &&
              communityOverview.topCourses &&
              communityOverview.topCourses.length > 0 && (
                <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 shadow-xl rounded-2xl mb-8">
                  <CardHeader>
                    <CardTitle className="text-slate-800 dark:text-white flex items-center">
                      <TrendingUp className="w-5 h-5 mr-2" />
                      Top Engaging Courses
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {communityOverview.topCourses
                        .slice(0, 3)
                        .map((course) => (
                          <div
                            key={course.id}
                            className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <BookOpen className="w-6 h-6 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold text-slate-800 dark:text-white text-sm truncate">
                                    {course.title}
                                  </h4>
                                  <p className="text-xs text-slate-600 dark:text-slate-400">
                                    Engagement Score:{" "}
                                    {course.engagement?.score || 0}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-4 text-xs">
                                <div className="text-center">
                                  <p className="font-medium text-slate-800 dark:text-white">
                                    {course.engagement?.reviews || 0}
                                  </p>
                                  <p className="text-slate-600 dark:text-slate-400">
                                    Reviews
                                  </p>
                                </div>
                                <div className="text-center">
                                  <p className="font-medium text-slate-800 dark:text-white">
                                    {course.engagement?.questions || 0}
                                  </p>
                                  <p className="text-slate-600 dark:text-slate-400">
                                    Questions
                                  </p>
                                </div>
                                <div className="text-center">
                                  <p className="font-medium text-slate-800 dark:text-white">
                                    {course.engagement?.enrollments || 0}
                                  </p>
                                  <p className="text-slate-600 dark:text-slate-400">
                                    Students
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              )} */}

            {communityOverview &&
              communityOverview.tips &&
              communityOverview.tips.length > 0 && (
                <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-700 shadow-xl rounded-2xl">
                  <CardHeader>
                    <CardTitle className="text-blue-800 dark:text-blue-300 flex items-center">
                      <Eye className="w-5 h-5 mr-2" />
                      Community Tips
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {communityOverview.tips.map((tip, index) => (
                        <div
                          key={index}
                          className="flex items-start space-x-3 p-3 bg-white/50 dark:bg-slate-800/50 rounded-lg"
                        >
                          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-white text-xs font-bold">
                              {index + 1}
                            </span>
                          </div>
                          <p className="text-sm text-slate-700 dark:text-slate-300">
                            {tip}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
          </>
        )}

        {activeTab === "reviews" && (
          <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 shadow-xl rounded-2xl">
            <CardHeader className="pb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                <CardTitle className="text-slate-800 dark:text-white">
                  Student Reviews
                </CardTitle>

                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <Input
                      placeholder="Search reviews..."
                      value={searchTerm}
                      onChange={(e) => handleSearch(e.target.value)}
                      className="pl-10 w-64 rounded-xl bg-white/70 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600"
                    />
                  </div>

                  <Select
                    value={reviewsFilters.courseId || "all"}
                    onValueChange={(value) =>
                      handleFilterChange(
                        "courseId",
                        value === "all" ? "" : value
                      )
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
                    value={reviewsFilters.rating || "all"}
                    onValueChange={(value) =>
                      handleFilterChange("rating", value === "all" ? "" : value)
                    }
                  >
                    <SelectTrigger className="w-32 rounded-xl bg-white/70 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600">
                      <SelectValue placeholder="Rating" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="all">All Ratings</SelectItem>
                      <SelectItem value="5">5 Stars</SelectItem>
                      <SelectItem value="4">4 Stars</SelectItem>
                      <SelectItem value="3">3 Stars</SelectItem>
                      <SelectItem value="2">2 Stars</SelectItem>
                      <SelectItem value="1">1 Star</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={reviewsFilters.hasReply || "all"}
                    onValueChange={(value) =>
                      handleFilterChange(
                        "hasReply",
                        value === "all" ? "" : value
                      )
                    }
                  >
                    <SelectTrigger className="w-32 rounded-xl bg-white/70 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600">
                      <SelectValue placeholder="Reply Status" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="all">All Reviews</SelectItem>
                      <SelectItem value="true">Replied</SelectItem>
                      <SelectItem value="false">Unreplied</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    variant="outline"
                    onClick={() => {
                      dispatch(resetReviewsFilters());
                      setSearchTerm("");
                      dispatch(
                        getCourseReviews({
                          page: 1,
                          limit: reviewsPagination.limit,
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
              <div className="space-y-6">
                {reviews.map((review) => (
                  <div
                    key={review.id}
                    className="p-6 rounded-xl border bg-white/50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 hover:bg-white/70 dark:hover:bg-slate-700/70 transition-all duration-200"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="flex items-center space-x-2">
                            <div className="flex items-center">
                              {renderStars(review.rating)}
                            </div>
                            <Badge
                              className={cn(
                                "text-xs",
                                getRatingBgColor(review.rating)
                              )}
                            >
                              {review.rating}/5
                            </Badge>
                          </div>
                          {review.isVerified && (
                            <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Verified
                            </Badge>
                          )}
                        </div>

                        <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">
                          {review.title || "Review"}
                        </h3>

                        <p className="text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
                          {review.content}
                        </p>

                        {(review.pros || review.cons) && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            {review.pros && (
                              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                <h5 className="font-medium text-green-800 dark:text-green-300 mb-1 flex items-center">
                                  <ThumbsUp className="w-4 h-4 mr-1" />
                                  Pros
                                </h5>
                                <p className="text-sm text-green-700 dark:text-green-400">
                                  {review.pros}
                                </p>
                              </div>
                            )}
                            {review.cons && (
                              <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                                <h5 className="font-medium text-red-800 dark:text-red-300 mb-1 flex items-center">
                                  <AlertCircle className="w-4 h-4 mr-1" />
                                  Cons
                                </h5>
                                <p className="text-sm text-red-700 dark:text-red-400">
                                  {review.cons}
                                </p>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="flex items-center space-x-6 text-sm text-slate-500 dark:text-slate-400 mb-4">
                          <div className="flex items-center space-x-1">
                            <Users className="w-4 h-4" />
                            <span>{review.author?.name || "Anonymous"}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <BookOpen className="w-4 h-4" />
                            <span>{review.course?.title || "Course"}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Heart className="w-4 h-4" />
                            <span>{review.helpfulCount || 0} helpful</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>
                              {formatDistanceToNow(new Date(review.createdAt))}{" "}
                              ago
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>
                              {format(
                                new Date(review.createdAt),
                                "MMM dd, yyyy"
                              )}
                            </span>
                          </div>
                        </div>

                        {review.myReply && (
                          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700 mb-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-blue-800 dark:text-blue-300 flex items-center">
                                <Reply className="w-4 h-4 mr-1" />
                                Your Reply
                              </span>
                              <span className="text-xs text-blue-600 dark:text-blue-400">
                                {formatDistanceToNow(
                                  new Date(review.myReply.createdAt)
                                )}{" "}
                                ago
                              </span>
                            </div>
                            <p className="text-blue-700 dark:text-blue-300 text-sm leading-relaxed">
                              {review.myReply.content}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center space-x-2 ml-4">
                        {review.hasMyReply ? (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditReplyDialog(review)}
                              disabled={updateReplyLoading}
                              className="rounded-lg"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openDeleteReplyDialog(review)}
                              disabled={deleteReplyLoading}
                              className="rounded-lg text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openReplyDialog(review)}
                            className="rounded-lg text-white"
                          >
                            <Reply className="w-4 h-4 mr-1" />
                            Reply
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {reviews.length === 0 && !getCourseReviewsLoading && (
                  <div className="text-center py-12">
                    <Star className="w-12 h-12 mx-auto text-slate-400 mb-4 opacity-50" />
                    <p className="text-slate-600 dark:text-slate-400">
                      No reviews found
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <Dialog open={isReplyDialogOpen} onOpenChange={setIsReplyDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>Reply to Review</DialogTitle>
              <DialogDescription>
                Respond to this student's review professionally.
              </DialogDescription>
            </DialogHeader>

            <ScrollArea className="max-h-[calc(90vh-200px)]">
              <div className="space-y-4 py-4 pr-6">
                {selectedReview && (
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="flex items-center">
                        {renderStars(selectedReview.rating)}
                      </div>
                      <span className="font-semibold text-slate-800 dark:text-white">
                        {selectedReview.title || "Review"}
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 text-sm">
                      {selectedReview.content}
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Your Reply</Label>
                  <Textarea
                    value={replyFormData.content}
                    onChange={(e) =>
                      setReplyFormData({
                        ...replyFormData,
                        content: e.target.value,
                      })
                    }
                    placeholder="Type your reply here..."
                    className="rounded-xl min-h-[120px]"
                  />
                </div>
              </div>
            </ScrollArea>

            <DialogFooter className="border-t pt-4">
              <Button
                variant="outline"
                onClick={() => setIsReplyDialogOpen(false)}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button
                onClick={handleReplyToReview}
                disabled={
                  replyToReviewLoading ||
                  !replyFormData.content ||
                  replyFormData.content.length < 10
                }
                className="rounded-xl"
              >
                {replyToReviewLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Post Reply
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={isEditReplyDialogOpen}
          onOpenChange={setIsEditReplyDialogOpen}
        >
          <DialogContent className="max-w-2xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>Edit Reply</DialogTitle>
              <DialogDescription>
                Update your reply to this review.
              </DialogDescription>
            </DialogHeader>

            <ScrollArea className="max-h-[calc(90vh-200px)]">
              <div className="space-y-4 py-4 pr-6">
                <div className="space-y-2">
                  <Label>Your Reply</Label>
                  <Textarea
                    value={editReplyFormData.content}
                    onChange={(e) =>
                      setEditReplyFormData({
                        ...editReplyFormData,
                        content: e.target.value,
                      })
                    }
                    placeholder="Type your reply here..."
                    className="rounded-xl min-h-[120px]"
                  />
                </div>
              </div>
            </ScrollArea>

            <DialogFooter className="border-t pt-4">
              <Button
                variant="outline"
                onClick={() => setIsEditReplyDialogOpen(false)}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateReply}
                disabled={
                  updateReplyLoading ||
                  !editReplyFormData.content ||
                  editReplyFormData.content.length < 10
                }
                className="rounded-xl"
              >
                {updateReplyLoading ? (
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
          open={isDeleteReplyDialogOpen}
          onOpenChange={setIsDeleteReplyDialogOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Reply</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete your reply? This action cannot
                be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteReply}
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

export default ReviewsAndCommunityPage;
