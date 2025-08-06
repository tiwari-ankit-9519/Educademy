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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  getStudentAnalytics,
  getStudentEngagement,
  exportStudentData,
  setStudentsFilters,
  resetStudentsFilters,
  clearError,
} from "@/features/instructor/instructorStudentSlice";
import { getCourses } from "@/features/instructor/instructorCourseSlice";
import {
  BarChart3,
  TrendingUp,
  Users,
  GraduationCap,
  Clock,
  Target,
  Activity,
  Calendar,
  Download,
  RefreshCw,
  Filter,
  X,
  Loader2,
  Eye,
  PlayCircle,
  BookOpen,
  Award,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

const StudentAnalyticsPage = () => {
  const dispatch = useDispatch();
  const {
    studentAnalytics,
    studentEngagement,
    getStudentAnalyticsLoading,
    exportStudentDataLoading,
    error,
  } = useSelector((state) => state.instructorStudent);

  const { courses, getCoursesLoading } = useSelector(
    (state) => state.instructorCourse
  );

  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [hasCoursesLoaded, setHasCoursesLoaded] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState("month");
  const [selectedCourseId, setSelectedCourseId] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDateRange, setSelectedDateRange] = useState("month");
  const [analyticsInitialized, setAnalyticsInitialized] = useState(false);

  const [exportFormData, setExportFormData] = useState({
    format: "csv",
    includeCharts: false,
    timeRange: "month",
  });

  const COLORS = [
    "#3B82F6",
    "#10B981",
    "#F59E0B",
    "#EF4444",
    "#8B5CF6",
    "#F97316",
  ];

  useEffect(() => {
    if (!hasCoursesLoaded) {
      dispatch(getCourses({ status: "PUBLISHED", limit: 50 }));
      setHasCoursesLoaded(true);
    }
  }, [dispatch, hasCoursesLoaded]);

  useEffect(() => {
    if (
      courses &&
      courses.length > 0 &&
      selectedCourseId === "all" &&
      !analyticsInitialized
    ) {
      const firstCourseId = courses[0].id;
      setSelectedCourseId(firstCourseId);

      dispatch(
        getStudentAnalytics({
          courseId: firstCourseId,
          timeframe: "month",
          metrics: "all",
        })
      );
      dispatch(
        getStudentEngagement({
          courseId: firstCourseId,
          timeframe: "month",
        })
      );
      setAnalyticsInitialized(true);
    }
  }, [courses, selectedCourseId, analyticsInitialized, dispatch]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const getTimeframeForRange = (range) => {
    switch (range) {
      case "7d":
        return "week";
      case "30d":
        return "month";
      case "90d":
        return "quarter";
      case "1y":
        return "year";
      case "month":
        return "month";
      default:
        return "month";
    }
  };

  const handleTimeRangeChange = (range) => {
    setSelectedTimeRange(range);
    const timeframe = getTimeframeForRange(range);
    dispatch(setStudentsFilters({ timeframe }));
    loadAnalytics(selectedCourseId, timeframe);
  };

  const handleCourseChange = (value) => {
    setSelectedCourseId(value);
    const courseId = value === "all" ? "" : value;
    const timeframe = getTimeframeForRange(selectedTimeRange);
    dispatch(setStudentsFilters({ courseId }));
    loadAnalytics(courseId, timeframe);
  };

  const loadAnalytics = (courseId, timeframe) => {
    const analyticsParams = {
      courseId,
      timeframe,
      metrics: "all",
    };

    const engagementParams = {
      courseId,
      timeframe,
    };

    dispatch(getStudentAnalytics(analyticsParams));
    dispatch(getStudentEngagement(engagementParams));
  };

  const handleRefresh = () => {
    const timeframe = getTimeframeForRange(selectedTimeRange);
    const courseId = selectedCourseId === "all" ? "" : selectedCourseId;
    loadAnalytics(courseId, timeframe);
  };

  const handleExportData = async () => {
    try {
      await dispatch(
        exportStudentData({
          courseId: selectedCourseId === "all" ? undefined : selectedCourseId,
          format: exportFormData.format,
          includeCharts: exportFormData.includeCharts,
          timeframe: getTimeframeForRange(exportFormData.timeRange),
        })
      ).unwrap();
      setIsExportDialogOpen(false);
      setExportFormData({
        format: "csv",
        includeCharts: false,
        timeRange: "month",
      });
      toast.success("Data exported successfully!");
    } catch (error) {
      toast.error(error.message || "Failed to export analytics data");
    }
  };

  const handleResetFilters = () => {
    setSelectedTimeRange("month");
    if (courses && courses.length > 0) {
      setSelectedCourseId(courses[0].id);
    } else {
      setSelectedCourseId("all");
    }
    setSearchTerm("");
    setSelectedDateRange("month");
    dispatch(resetStudentsFilters());
    const firstCourseId = courses && courses.length > 0 ? courses[0].id : "";
    loadAnalytics(firstCourseId, "month");
  };

  const handleDateRangeFilter = () => {
    const timeframe = getTimeframeForRange(selectedDateRange);
    const courseId = selectedCourseId === "all" ? "" : selectedCourseId;
    setSelectedTimeRange(selectedDateRange);
    dispatch(setStudentsFilters({ timeframe }));
    loadAnalytics(courseId, timeframe);
  };

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M";
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return num.toString();
  };

  const filteredTopStudents =
    studentAnalytics?.topPerformers?.filter(
      (student) =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.courseTitle.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

  const filteredAtRiskStudents =
    studentAnalytics?.strugglingStudents?.filter(
      (student) =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.courseTitle.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

  if ((getStudentAnalyticsLoading && !studentAnalytics) || getCoursesLoading) {
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
              <BarChart3 className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-800 dark:text-white">
                Student Analytics
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Detailed insights into student performance and engagement
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="rounded-xl border-white/50 dark:border-slate-700/50 bg-white/30 dark:bg-slate-800/30 backdrop-blur-sm hover:bg-white/50 dark:hover:bg-slate-700/50"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>

            <Select
              value={selectedTimeRange}
              onValueChange={handleTimeRangeChange}
            >
              <SelectTrigger className="w-32 rounded-xl border-white/50 dark:border-slate-700/50 bg-white/30 dark:bg-slate-800/30 backdrop-blur-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="1y">Last year</SelectItem>
                <SelectItem value="month">This month</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedCourseId} onValueChange={handleCourseChange}>
              <SelectTrigger className="w-40 rounded-xl border-white/50 dark:border-slate-700/50 bg-white/30 dark:bg-slate-800/30 backdrop-blur-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Dialog
              open={isExportDialogOpen}
              onOpenChange={setIsExportDialogOpen}
            >
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="rounded-xl border-white/50 dark:border-slate-700/50 bg-white/30 dark:bg-slate-800/30 backdrop-blur-sm hover:bg-white/50 dark:hover:bg-slate-700/50"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center">
                    <Award className="w-5 h-5 mr-2" />
                    Export Analytics Data
                  </DialogTitle>
                  <DialogDescription>
                    Export student analytics data in your preferred format.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Format</Label>
                    <Select
                      value={exportFormData.format}
                      onValueChange={(value) =>
                        setExportFormData({ ...exportFormData, format: value })
                      }
                    >
                      <SelectTrigger className="rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="csv">CSV</SelectItem>
                        <SelectItem value="json">JSON</SelectItem>
                        <SelectItem value="pdf">PDF Report</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Time Range</Label>
                    <Select
                      value={exportFormData.timeRange}
                      onValueChange={(value) =>
                        setExportFormData({
                          ...exportFormData,
                          timeRange: value,
                        })
                      }
                    >
                      <SelectTrigger className="rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7d">Last 7 days</SelectItem>
                        <SelectItem value="30d">Last 30 days</SelectItem>
                        <SelectItem value="90d">Last 90 days</SelectItem>
                        <SelectItem value="1y">Last year</SelectItem>
                        <SelectItem value="month">This month</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="includeCharts"
                      checked={exportFormData.includeCharts}
                      onChange={(e) =>
                        setExportFormData({
                          ...exportFormData,
                          includeCharts: e.target.checked,
                        })
                      }
                      className="rounded"
                    />
                    <Label htmlFor="includeCharts">Include chart images</Label>
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsExportDialogOpen(false)}
                    className="rounded-xl"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                  <Button
                    onClick={handleExportData}
                    disabled={exportStudentDataLoading}
                    className="rounded-xl"
                  >
                    {exportStudentDataLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4 mr-2" />
                    )}
                    Export
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={getStudentAnalyticsLoading}
              className="rounded-xl border-white/50 dark:border-slate-700/50 bg-white/30 dark:bg-slate-800/30 backdrop-blur-sm hover:bg-white/50 dark:hover:bg-slate-700/50"
            >
              <RefreshCw
                className={cn(
                  "w-4 h-4 mr-2",
                  getStudentAnalyticsLoading && "animate-spin"
                )}
              />
              Refresh
            </Button>
          </div>
        </div>

        {showFilters && (
          <Card className="mb-8 bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 shadow-xl rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Filter className="w-5 h-5 mr-2" />
                  Advanced Filters
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFilters(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="search">Search Students</Label>
                  <Input
                    id="search"
                    placeholder="Search by name or course..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Custom Date Range</Label>
                  <Select
                    value={selectedDateRange}
                    onValueChange={setSelectedDateRange}
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7d">Last 7 days</SelectItem>
                      <SelectItem value="30d">Last 30 days</SelectItem>
                      <SelectItem value="90d">Last 90 days</SelectItem>
                      <SelectItem value="month">This month</SelectItem>
                      <SelectItem value="1y">Last year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end space-x-2">
                  <Button
                    onClick={handleDateRangeFilter}
                    className="rounded-xl"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Apply Date
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleResetFilters}
                    className="rounded-xl"
                  >
                    Reset
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 shadow-xl rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Total Students
                  </p>
                  <p className="text-2xl font-bold text-slate-800 dark:text-white">
                    {formatNumber(
                      studentAnalytics?.overview?.totalEnrollments || 0
                    )}
                  </p>
                  <p className="text-xs text-green-600 flex items-center mt-1">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    Active learners
                  </p>
                </div>
                <div className="p-2 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-lg shadow-lg">
                  <Users className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 shadow-xl rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Completion Rate
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {studentAnalytics?.overview?.completionRate || 0}%
                  </p>
                  <p className="text-xs text-blue-600 flex items-center mt-1">
                    <Target className="w-3 h-3 mr-1" />
                    Course progress
                  </p>
                </div>
                <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg shadow-lg">
                  <GraduationCap className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 shadow-xl rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Avg Study Time
                  </p>
                  <p className="text-2xl font-bold text-blue-600">
                    {Math.round(
                      (studentAnalytics?.engagement?.averageLessonTime || 0) /
                        60
                    )}
                    h
                  </p>
                  <p className="text-xs text-purple-600 flex items-center mt-1">
                    <Clock className="w-3 h-3 mr-1" />
                    Per student
                  </p>
                </div>
                <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg shadow-lg">
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
                    Active Students
                  </p>
                  <p className="text-2xl font-bold text-purple-600">
                    {studentAnalytics?.overview?.activeStudents || 0}
                  </p>
                  <p className="text-xs text-orange-600 flex items-center mt-1">
                    <Activity className="w-3 h-3 mr-1" />
                    Engaged learners
                  </p>
                </div>
                <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg shadow-lg">
                  <Activity className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 shadow-xl rounded-2xl">
            <CardHeader>
              <CardTitle className="text-slate-800 dark:text-white flex items-center">
                <TrendingUp className="w-5 h-5 mr-2" />
                Progress Over Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                {studentAnalytics?.dailyActivity &&
                studentAnalytics.dailyActivity.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={studentAnalytics.dailyActivity}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis
                        dataKey="date"
                        stroke="#64748b"
                        fontSize={12}
                        tickFormatter={(value) =>
                          format(new Date(value), "MMM dd")
                        }
                      />
                      <YAxis stroke="#64748b" fontSize={12} />
                      <Tooltip
                        labelFormatter={(value) =>
                          format(new Date(value), "MMM dd, yyyy")
                        }
                        formatter={(value) => [value, "Completions"]}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="lessonCompletions"
                        stroke="#3B82F6"
                        strokeWidth={3}
                        dot={{ fill: "#3B82F6", r: 4 }}
                        name="Lesson Completions"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <PlayCircle className="w-12 h-12 mx-auto text-slate-400 mb-2 opacity-50" />
                      <p className="text-slate-600 dark:text-slate-400">
                        No progress data available
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 shadow-xl rounded-2xl">
            <CardHeader>
              <CardTitle className="text-slate-800 dark:text-white flex items-center">
                <Activity className="w-5 h-5 mr-2" />
                Daily Engagement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                {studentEngagement?.dailyActivity &&
                studentEngagement.dailyActivity.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={studentEngagement.dailyActivity}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis
                        dataKey="date"
                        stroke="#64748b"
                        fontSize={12}
                        tickFormatter={(value) =>
                          format(new Date(value), "MMM dd")
                        }
                      />
                      <YAxis stroke="#64748b" fontSize={12} />
                      <Tooltip
                        labelFormatter={(value) =>
                          format(new Date(value), "MMM dd, yyyy")
                        }
                        formatter={(value) => [value, "Active Students"]}
                      />
                      <Area
                        type="monotone"
                        dataKey="uniqueActiveStudents"
                        stroke="#10B981"
                        fill="#10B981"
                        fillOpacity={0.3}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <Activity className="w-12 h-12 mx-auto text-slate-400 mb-2 opacity-50" />
                      <p className="text-slate-600 dark:text-slate-400">
                        No engagement data available
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 shadow-xl rounded-2xl">
            <CardHeader>
              <CardTitle className="text-slate-800 dark:text-white flex items-center">
                <Target className="w-5 h-5 mr-2" />
                Progress Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                {studentAnalytics?.progressDistribution &&
                studentAnalytics.progressDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={studentAnalytics.progressDistribution}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="count"
                        label={({ range, percent }) =>
                          `${range} (${(percent * 100).toFixed(0)}%)`
                        }
                      >
                        {studentAnalytics.progressDistribution.map(
                          (entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          )
                        )}
                      </Pie>
                      <Tooltip formatter={(value) => [value, "Students"]} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <Target className="w-12 h-12 mx-auto text-slate-400 mb-2 opacity-50" />
                      <p className="text-slate-600 dark:text-slate-400">
                        No distribution data available
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2 bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 shadow-xl rounded-2xl">
            <CardHeader>
              <CardTitle className="text-slate-800 dark:text-white flex items-center">
                <BookOpen className="w-5 h-5 mr-2" />
                Performance Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      {
                        metric: "Quiz Score",
                        value: parseFloat(
                          studentAnalytics?.performance?.averageQuizScore || 0
                        ),
                      },
                      {
                        metric: "Assignment Score",
                        value: parseFloat(
                          studentAnalytics?.performance
                            ?.averageAssignmentScore || 0
                        ),
                      },
                      {
                        metric: "Quiz Pass Rate",
                        value: parseFloat(
                          studentAnalytics?.performance?.quizPassRate || 0
                        ),
                      },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="metric" stroke="#64748b" fontSize={12} />
                    <YAxis stroke="#64748b" fontSize={12} />
                    <Tooltip formatter={(value) => [`${value}%`, "Score"]} />
                    <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 shadow-xl rounded-2xl">
            <CardHeader>
              <CardTitle className="text-slate-800 dark:text-white flex items-center">
                <Eye className="w-5 h-5 mr-2" />
                Top Performing Students
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                <div className="space-y-3">
                  {filteredTopStudents.length > 0 ? (
                    filteredTopStudents.map((student, index) => (
                      <div
                        key={student.studentId}
                        className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                            {index + 1}
                          </div>
                          <div>
                            <h4 className="font-semibold text-slate-800 dark:text-white">
                              {student.name}
                            </h4>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              {student.courseTitle}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600">
                            {student.progress}%
                          </p>
                          <p className="text-xs text-slate-500">
                            {Math.round((student.totalTimeSpent || 0) / 60)}h
                            studied
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Users className="w-8 h-8 mx-auto text-slate-400 mb-2 opacity-50" />
                      <p className="text-slate-600 dark:text-slate-400">
                        No student data available
                      </p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 shadow-xl rounded-2xl">
            <CardHeader>
              <CardTitle className="text-slate-800 dark:text-white flex items-center">
                <AlertCircle className="w-5 h-5 mr-2" />
                Students At Risk
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                <div className="space-y-3">
                  {filteredAtRiskStudents.length > 0 ? (
                    filteredAtRiskStudents.map((student) => (
                      <div
                        key={student.studentId}
                        className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white">
                            <AlertCircle className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-slate-800 dark:text-white">
                              {student.name}
                            </h4>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              {student.daysSinceLastAccess
                                ? `${student.daysSinceLastAccess} days inactive`
                                : "Never accessed"}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-red-600">
                            {student.progress}%
                          </p>
                          <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 text-xs">
                            At Risk
                          </Badge>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <CheckCircle className="w-8 h-8 mx-auto text-green-400 mb-2" />
                      <p className="text-slate-600 dark:text-slate-400">
                        All students on track!
                      </p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default StudentAnalyticsPage;
