import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { getCourseStats, clearError } from "@/features/adminSlice/adminCourse";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  BookOpen,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Star,
  Users,
  Activity,
  RefreshCw,
  Calendar,
  Award,
  Target,
  Timer,
  Archive,
  Pause,
  Eye,
} from "lucide-react";

const CourseStatsPage = () => {
  const dispatch = useDispatch();
  const { courseStats, courseStatsLoading, error } = useSelector(
    (state) => state.adminCourse
  );

  const [selectedPeriod, setSelectedPeriod] = useState("30d");
  const [hasInitialLoaded, setHasInitialLoaded] = useState(false);

  useEffect(() => {
    if (!hasInitialLoaded) {
      dispatch(getCourseStats({ period: selectedPeriod }));
      setHasInitialLoaded(true);
    }
  }, [dispatch, hasInitialLoaded, selectedPeriod]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const handlePeriodChange = (period) => {
    setSelectedPeriod(period);
    dispatch(getCourseStats({ period }));
  };

  const loadStats = () => {
    dispatch(getCourseStats({ period: selectedPeriod }));
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

  const getStatusIcon = (status) => {
    switch (status) {
      case "published":
        return <CheckCircle className="w-5 h-5 text-white" />;
      case "pending":
        return <Clock className="w-5 h-5 text-white" />;
      case "rejected":
        return <XCircle className="w-5 h-5 text-white" />;
      case "suspended":
        return <Pause className="w-5 h-5 text-white" />;
      case "archived":
        return <Archive className="w-5 h-5 text-white" />;
      default:
        return <BookOpen className="w-5 h-5 text-white" />;
    }
  };

  if (courseStatsLoading && !courseStats) {
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-2xl" />
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-80 rounded-2xl" />
              ))}
            </div>
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
              <BarChart3 className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-800 dark:text-white">
                Course Statistics
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Comprehensive analytics and insights for course management
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
              <SelectTrigger className="w-32 rounded-xl bg-white/70 dark:bg-slate-800/50 border border-white/50 dark:border-slate-700/50 backdrop-blur-sm">
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-lg border border-white/50 dark:border-slate-700/50">
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={loadStats}
              disabled={courseStatsLoading}
              className="rounded-xl border-white/50 dark:border-slate-700/50 bg-white/30 dark:bg-slate-800/30 backdrop-blur-sm hover:bg-white/50 dark:hover:bg-slate-700/50"
            >
              <RefreshCw
                className={cn(
                  "w-4 h-4 mr-2",
                  courseStatsLoading && "animate-spin"
                )}
              />
              Refresh
            </Button>
          </div>
        </div>

        {courseStats && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 shadow-xl rounded-2xl">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 dark:via-slate-700/10 to-transparent rounded-2xl"></div>
                <CardContent className="p-6 relative">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        Total Courses
                      </p>
                      <p className="text-2xl font-bold text-slate-800 dark:text-white">
                        {courseStats.overview?.totalCourses || 0}
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
                        Published
                      </p>
                      <p className="text-2xl font-bold text-green-600">
                        {courseStats.overview?.publishedCourses || 0}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {courseStats.overview?.approvalRate || 0}% approval rate
                      </p>
                    </div>
                    <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg shadow-lg">
                      {getStatusIcon("published")}
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
                        Pending Review
                      </p>
                      <p className="text-2xl font-bold text-yellow-600">
                        {courseStats.overview?.pendingCourses || 0}
                      </p>
                    </div>
                    <div className="p-2 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg shadow-lg">
                      {getStatusIcon("pending")}
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
                        Quality Score
                      </p>
                      <p className="text-2xl font-bold text-purple-600">
                        {courseStats.qualityMetrics?.averageQualityScore || 0}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Average rating
                      </p>
                    </div>
                    <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg shadow-lg">
                      <Star className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 shadow-xl rounded-2xl">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 dark:via-slate-700/10 to-transparent rounded-2xl"></div>
                <CardHeader className="pb-4 relative">
                  <CardTitle className="text-slate-800 dark:text-white flex items-center">
                    <Target className="w-5 h-5 mr-2 text-indigo-600" />
                    Course Status Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-slate-700 dark:text-slate-300">
                          Published
                        </span>
                      </div>
                      <span className="text-sm font-medium text-slate-800 dark:text-white">
                        {courseStats.overview?.publishedCourses || 0}
                      </span>
                    </div>
                    <Progress
                      value={
                        (courseStats.overview?.publishedCourses /
                          courseStats.overview?.totalCourses) *
                          100 || 0
                      }
                      className="h-2"
                    />

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                        <span className="text-sm text-slate-700 dark:text-slate-300">
                          Pending
                        </span>
                      </div>
                      <span className="text-sm font-medium text-slate-800 dark:text-white">
                        {courseStats.overview?.pendingCourses || 0}
                      </span>
                    </div>
                    <Progress
                      value={
                        (courseStats.overview?.pendingCourses /
                          courseStats.overview?.totalCourses) *
                          100 || 0
                      }
                      className="h-2"
                    />

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <span className="text-sm text-slate-700 dark:text-slate-300">
                          Rejected
                        </span>
                      </div>
                      <span className="text-sm font-medium text-slate-800 dark:text-white">
                        {courseStats.overview?.rejectedCourses || 0}
                      </span>
                    </div>
                    <Progress
                      value={
                        (courseStats.overview?.rejectedCourses /
                          courseStats.overview?.totalCourses) *
                          100 || 0
                      }
                      className="h-2"
                    />

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                        <span className="text-sm text-slate-700 dark:text-slate-300">
                          Suspended
                        </span>
                      </div>
                      <span className="text-sm font-medium text-slate-800 dark:text-white">
                        {courseStats.overview?.suspendedCourses || 0}
                      </span>
                    </div>
                    <Progress
                      value={
                        (courseStats.overview?.suspendedCourses /
                          courseStats.overview?.totalCourses) *
                          100 || 0
                      }
                      className="h-2"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 shadow-xl rounded-2xl">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 dark:via-slate-700/10 to-transparent rounded-2xl"></div>
                <CardHeader className="pb-4 relative">
                  <CardTitle className="text-slate-800 dark:text-white flex items-center">
                    <Users className="w-5 h-5 mr-2 text-indigo-600" />
                    Courses by Level
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative">
                  <ScrollArea className="h-64">
                    <div className="space-y-3">
                      {courseStats.byLevel?.map((level, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-white/30 dark:bg-slate-700/30 rounded-lg"
                        >
                          <div className="flex items-center space-x-3">
                            <Badge
                              className={cn(
                                "rounded-lg",
                                getLevelColor(level.level)
                              )}
                            >
                              {level.level}
                            </Badge>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-semibold text-slate-800 dark:text-white">
                              {level.count}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {(
                                (level.count /
                                  courseStats.overview?.totalCourses) *
                                100
                              ).toFixed(1)}
                              %
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 shadow-xl rounded-2xl">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 dark:via-slate-700/10 to-transparent rounded-2xl"></div>
                <CardHeader className="pb-4 relative">
                  <CardTitle className="text-slate-800 dark:text-white flex items-center">
                    <Timer className="w-5 h-5 mr-2 text-indigo-600" />
                    Review Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                          Average Review Time
                        </p>
                        <p className="text-lg font-bold text-slate-800 dark:text-white">
                          {courseStats.reviewMetrics?.averageReviewTime ||
                            "N/A"}
                        </p>
                      </div>
                      <Clock className="w-6 h-6 text-blue-600" />
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                          Total Reviews
                        </p>
                        <p className="text-lg font-bold text-slate-800 dark:text-white">
                          {courseStats.reviewMetrics?.totalReviews || 0}
                        </p>
                      </div>
                      <Eye className="w-6 h-6 text-green-600" />
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                          Recent Submissions
                        </p>
                        <p className="text-lg font-bold text-slate-800 dark:text-white">
                          {courseStats.reviewMetrics?.recentSubmissions || 0}
                        </p>
                      </div>
                      <TrendingUp className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 shadow-xl rounded-2xl">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 dark:via-slate-700/10 to-transparent rounded-2xl"></div>
                <CardHeader className="pb-4 relative">
                  <CardTitle className="text-slate-800 dark:text-white flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2 text-indigo-600" />
                    Top Categories
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative">
                  <ScrollArea className="h-80">
                    <div className="space-y-3">
                      {courseStats.byCategory?.map((category, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-4 bg-white/30 dark:bg-slate-700/30 rounded-lg hover:bg-white/50 dark:hover:bg-slate-700/50 transition-all duration-200"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                              {index + 1}
                            </div>
                            <div>
                              <p className="font-medium text-slate-800 dark:text-white">
                                {category.categoryName}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                {category.categorySlug}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-semibold text-slate-800 dark:text-white">
                              {category.count}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              courses
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 shadow-xl rounded-2xl">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 dark:via-slate-700/10 to-transparent rounded-2xl"></div>
                <CardHeader className="pb-4 relative">
                  <CardTitle className="text-slate-800 dark:text-white flex items-center">
                    <Award className="w-5 h-5 mr-2 text-indigo-600" />
                    Quality Insights
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative">
                  <div className="space-y-6">
                    <div className="text-center p-6 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-xl">
                      <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                        {courseStats.qualityMetrics?.averageQualityScore || 0}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Average Quality Score
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg">
                        <p className="text-2xl font-bold text-green-600">
                          {courseStats.qualityMetrics?.highQualityCourses || 0}
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          High Quality
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-500">
                          (4.5+ rating)
                        </p>
                      </div>

                      <div className="text-center p-4 bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 rounded-lg">
                        <p className="text-2xl font-bold text-red-600">
                          {courseStats.qualityMetrics?.lowQualityCourses || 0}
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          Needs Attention
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-500">
                          (&lt;3.0 rating)
                        </p>
                      </div>
                    </div>

                    <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg">
                      <p className="text-xl font-bold text-blue-600">
                        {courseStats.qualityMetrics?.totalRatedCourses || 0}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Total Rated Courses
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="w-4 h-4 text-green-600" />
                        <span className="text-slate-600 dark:text-slate-400">
                          Approval Rate:{" "}
                          {courseStats.overview?.approvalRate || 0}%
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <TrendingDown className="w-4 h-4 text-red-600" />
                        <span className="text-slate-600 dark:text-slate-400">
                          Rejection Rate:{" "}
                          {courseStats.overview?.rejectionRate || 0}%
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CourseStatsPage;
