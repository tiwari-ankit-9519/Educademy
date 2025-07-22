/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  BookOpen,
  Users,
  DollarSign,
  Star,
  TrendingUp,
  TrendingDown,
  Activity,
  RefreshCw,
  BarChart3,
  PieChart,
  Award,
  Target,
  BookOpenCheck,
  Calendar,
  Filter,
  Zap,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
  Pie,
  FunnelChart,
  Funnel,
} from "recharts";
import { useTheme } from "@/components/ThemeProvider";
import {
  getCourseAnalytics,
  clearError,
} from "@/features/adminSlice/adminAnalytics";

const CourseAnalytics = () => {
  const { theme } = useTheme();
  const dispatch = useDispatch();
  const adminAnalyticsState = useSelector(
    (state) => state.adminAnalytics || {}
  );

  const { courseAnalytics, error, loading, courseAnalyticsLoading } =
    adminAnalyticsState;

  const [selectedPeriod, setSelectedPeriod] = useState("30d");
  const [selectedGroupBy, setSelectedGroupBy] = useState("day");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const loadCourseAnalytics = useCallback(() => {
    const params = {
      period: selectedPeriod,
      groupBy: selectedGroupBy,
      ...(selectedCategory !== "all" && { categoryId: selectedCategory }),
    };
    dispatch(getCourseAnalytics(params));
  }, [dispatch, selectedPeriod, selectedGroupBy, selectedCategory]);

  useEffect(() => {
    dispatch(clearError());
    loadCourseAnalytics();
  }, [dispatch, loadCourseAnalytics]);

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  const handleRefresh = () => {
    loadCourseAnalytics();
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num?.toString() || "0";
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const StatCard = ({
    title,
    value,
    icon: IconComponent,
    subtitle,
    loading,
  }) => (
    <Card className="bg-white/30 dark:bg-slate-700/30 backdrop-blur-sm border border-white/50 dark:border-slate-700/50 shadow-lg rounded-xl">
      <CardContent className="p-3 sm:p-4 lg:p-6">
        {loading ? (
          <div className="flex items-center justify-center h-12 sm:h-16">
            <Loader2 className="w-4 h-4 sm:w-6 sm:h-6 animate-spin text-indigo-600 dark:text-indigo-400" />
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="p-1.5 sm:p-2 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-lg sm:rounded-xl shadow-sm">
                  <IconComponent className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 truncate">
                    {title}
                  </p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-800 dark:text-white truncate">
                    {value}
                  </p>
                </div>
              </div>
            </div>
            {subtitle && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 truncate">
                {subtitle}
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );

  const COLORS = [
    "#6366f1",
    "#8b5cf6",
    "#06b6d4",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#ec4899",
    "#84cc16",
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border border-white/50 dark:border-slate-700/50 rounded-xl p-3 shadow-lg max-w-xs">
          <p className="text-slate-800 dark:text-white font-medium text-sm truncate">
            {label}
          </p>
          {payload.map((entry, index) => (
            <p
              key={index}
              style={{ color: entry.color }}
              className="text-xs truncate"
            >
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const getTopPerformingCourses = () => {
    return courseAnalytics?.performance?.slice(0, 5) || [];
  };

  const getTotalCourses = () => {
    return courseAnalytics?.performance?.length || 0;
  };

  const getTotalRevenue = () => {
    return (
      courseAnalytics?.performance?.reduce(
        (sum, course) => sum + course.revenue,
        0
      ) || 0
    );
  };

  const getAverageRating = () => {
    const courses = courseAnalytics?.performance || [];
    if (courses.length === 0) return "0.0";
    const totalRating = courses.reduce(
      (sum, course) => sum + parseFloat(course.rating),
      0
    );
    return (totalRating / courses.length).toFixed(1);
  };

  const getTotalEnrollments = () => {
    return (
      courseAnalytics?.performance?.reduce(
        (sum, course) => sum + course.enrollments,
        0
      ) || 0
    );
  };

  if (!adminAnalyticsState) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50/80 via-indigo-50/80 to-cyan-50/80 dark:from-slate-900/80 dark:via-slate-800/80 dark:to-gray-900/80 backdrop-blur-xl flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-indigo-600 dark:text-indigo-400 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base">
            Loading course analytics...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/80 via-indigo-50/80 to-cyan-50/80 dark:from-slate-900/80 dark:via-slate-800/80 dark:to-gray-900/80 backdrop-blur-xl">
      <div className="p-3 sm:p-4 lg:p-6 max-w-7xl mx-auto">
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6">
            <div className="text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white">
                Course Analytics
              </h1>
              <p className="text-slate-600 dark:text-slate-300 mt-1 text-sm sm:text-base">
                Detailed insights into course performance and learning outcomes
              </p>
            </div>
            <div className="flex items-center justify-center sm:justify-end">
              <Button
                onClick={handleRefresh}
                disabled={loading}
                variant="ghost"
                size="sm"
                className="bg-white/30 dark:bg-slate-700/30 backdrop-blur-sm border border-white/50 dark:border-slate-700/50 rounded-xl hover:bg-white/50 dark:hover:bg-slate-700/50 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400"
              >
                <RefreshCw
                  className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
            </div>
          </div>

          <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:flex-wrap sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="flex items-center space-x-2">
              <Label className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 whitespace-nowrap">
                Period:
              </Label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-24 sm:w-32 bg-white/30 dark:bg-slate-700/30 backdrop-blur-sm border border-white/50 dark:border-slate-700/50 rounded-xl text-xs sm:text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 rounded-xl">
                  <SelectItem value="7d">7 Days</SelectItem>
                  <SelectItem value="30d">30 Days</SelectItem>
                  <SelectItem value="90d">90 Days</SelectItem>
                  <SelectItem value="1y">1 Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Label className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 whitespace-nowrap">
                Group by:
              </Label>
              <Select
                value={selectedGroupBy}
                onValueChange={setSelectedGroupBy}
              >
                <SelectTrigger className="w-24 sm:w-32 bg-white/30 dark:bg-slate-700/30 backdrop-blur-sm border border-white/50 dark:border-slate-700/50 rounded-xl text-xs sm:text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 rounded-xl">
                  <SelectItem value="day">Day</SelectItem>
                  <SelectItem value="week">Week</SelectItem>
                  <SelectItem value="month">Month</SelectItem>
                  <SelectItem value="year">Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Label className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 whitespace-nowrap">
                Category:
              </Label>
              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger className="w-32 sm:w-40 bg-white/30 dark:bg-slate-700/30 backdrop-blur-sm border border-white/50 dark:border-slate-700/50 rounded-xl text-xs sm:text-sm">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 rounded-xl">
                  <SelectItem value="all">All Categories</SelectItem>
                  {(courseAnalytics?.categoryAnalysis || []).map((category) => (
                    <SelectItem
                      key={category.category}
                      value={category.category}
                    >
                      {category.category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {error && (
            <Alert className="bg-red-50/50 dark:bg-red-900/20 border border-red-200/50 dark:border-red-800/50 backdrop-blur-sm rounded-xl mb-4 sm:mb-6">
              <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
              <AlertDescription className="text-red-700 dark:text-red-400 text-sm">
                {error}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
          <StatCard
            title="Total Courses"
            value={formatNumber(getTotalCourses())}
            icon={BookOpen}
            loading={courseAnalyticsLoading}
            subtitle="Active courses"
          />
          <StatCard
            title="Total Revenue"
            value={formatCurrency(getTotalRevenue())}
            icon={DollarSign}
            loading={courseAnalyticsLoading}
            subtitle="All time revenue"
          />
          <StatCard
            title="Total Enrollments"
            value={formatNumber(getTotalEnrollments())}
            icon={Users}
            loading={courseAnalyticsLoading}
            subtitle="Student enrollments"
          />
          <StatCard
            title="Average Rating"
            value={getAverageRating()}
            icon={Star}
            loading={courseAnalyticsLoading}
            subtitle="Course ratings"
          />
          <StatCard
            title="Instructors"
            value={formatNumber(
              courseAnalytics?.instructorAnalysis?.length || 0
            )}
            icon={Award}
            loading={courseAnalyticsLoading}
            subtitle="Active instructors"
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card className="bg-white/30 dark:bg-slate-700/30 backdrop-blur-sm border border-white/50 dark:border-slate-700/50 shadow-lg rounded-xl">
            <CardHeader className="pb-2 sm:pb-4">
              <CardTitle className="text-base sm:text-lg font-semibold text-slate-800 dark:text-white flex items-center">
                <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-indigo-600 dark:text-indigo-400" />
                Top Performing Courses
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {courseAnalyticsLoading ? (
                <div className="flex items-center justify-center h-48 sm:h-64">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-600 dark:text-indigo-400" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={getTopPerformingCourses()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                      dataKey="title"
                      stroke="#64748b"
                      tick={false}
                      fontSize={12}
                    />
                    <YAxis stroke="#64748b" fontSize={12} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar
                      dataKey="enrollments"
                      fill="#6366f1"
                      name="Enrollments"
                    />
                    <Bar dataKey="revenue" fill="#8b5cf6" name="Revenue" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white/30 dark:bg-slate-700/30 backdrop-blur-sm border border-white/50 dark:border-slate-700/50 shadow-lg rounded-xl">
            <CardHeader className="pb-2 sm:pb-4">
              <CardTitle className="text-base sm:text-lg font-semibold text-slate-800 dark:text-white flex items-center">
                <PieChart className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-indigo-600 dark:text-indigo-400" />
                Category Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {courseAnalyticsLoading ? (
                <div className="flex items-center justify-center h-48 sm:h-64">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-600 dark:text-indigo-400" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <RechartsPieChart>
                    <Pie
                      data={courseAnalytics?.categoryAnalysis || []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ category, percent }) =>
                        `${category} ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="totalRevenue"
                    >
                      {(courseAnalytics?.categoryAnalysis || []).map(
                        (entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        )
                      )}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </RechartsPieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card className="bg-white/30 dark:bg-slate-700/30 backdrop-blur-sm border border-white/50 dark:border-slate-700/50 shadow-lg rounded-xl">
            <CardHeader className="pb-2 sm:pb-4">
              <CardTitle className="text-base sm:text-lg font-semibold text-slate-800 dark:text-white flex items-center">
                <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-indigo-600 dark:text-indigo-400" />
                Pricing Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {courseAnalyticsLoading ? (
                <div className="flex items-center justify-center h-48 sm:h-64">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-600 dark:text-indigo-400" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={courseAnalytics?.pricingAnalysis || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                      dataKey="priceRange"
                      stroke="#64748b"
                      fontSize={10}
                    />
                    <YAxis stroke="#64748b" fontSize={12} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar
                      dataKey="courseCount"
                      fill="#6366f1"
                      name="Course Count"
                    />
                    <Bar
                      dataKey="avgEnrollments"
                      fill="#10b981"
                      name="Avg Enrollments"
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white/30 dark:bg-slate-700/30 backdrop-blur-sm border border-white/50 dark:border-slate-700/50 shadow-lg rounded-xl">
            <CardHeader className="pb-2 sm:pb-4">
              <CardTitle className="text-base sm:text-lg font-semibold text-slate-800 dark:text-white flex items-center">
                <Target className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-indigo-600 dark:text-indigo-400" />
                Difficulty Level Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {courseAnalyticsLoading ? (
                <div className="flex items-center justify-center h-48 sm:h-64">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-600 dark:text-indigo-400" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <RechartsPieChart>
                    <Pie
                      data={courseAnalytics?.difficultyAnalysis || []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ level, percent }) =>
                        `${level} ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="courseCount"
                    >
                      {(courseAnalytics?.difficultyAnalysis || []).map(
                        (entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        )
                      )}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </RechartsPieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card className="bg-white/30 dark:bg-slate-700/30 backdrop-blur-sm border border-white/50 dark:border-slate-700/50 shadow-lg rounded-xl">
            <CardHeader className="pb-2 sm:pb-4">
              <CardTitle className="text-base sm:text-lg font-semibold text-slate-800 dark:text-white flex items-center">
                <Award className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-indigo-600 dark:text-indigo-400" />
                Top Instructors
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {courseAnalyticsLoading ? (
                <div className="flex items-center justify-center h-48 sm:h-64">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-600 dark:text-indigo-400" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart
                    data={
                      courseAnalytics?.instructorAnalysis?.slice(0, 5) || []
                    }
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                      dataKey="name"
                      stroke="#64748b"
                      tick={false}
                      fontSize={10}
                    />
                    <YAxis stroke="#64748b" fontSize={12} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar
                      dataKey="totalRevenue"
                      fill="#6366f1"
                      name="Total Revenue"
                    />
                    <Bar
                      dataKey="totalEnrollments"
                      fill="#8b5cf6"
                      name="Total Enrollments"
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white/30 dark:bg-slate-700/30 backdrop-blur-sm border border-white/50 dark:border-slate-700/50 shadow-lg rounded-xl">
            <CardHeader className="pb-2 sm:pb-4">
              <CardTitle className="text-base sm:text-lg font-semibold text-slate-800 dark:text-white flex items-center">
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-indigo-600 dark:text-indigo-400" />
                Seasonal Trends
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {courseAnalyticsLoading ? (
                <div className="flex items-center justify-center h-48 sm:h-64">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-600 dark:text-indigo-400" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={courseAnalytics?.seasonalTrends || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                    <YAxis stroke="#64748b" fontSize={12} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="coursesCreated"
                      stroke="#6366f1"
                      strokeWidth={2}
                      name="Courses Created"
                    />
                    <Line
                      type="monotone"
                      dataKey="enrollments"
                      stroke="#10b981"
                      strokeWidth={2}
                      name="Enrollments"
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card className="bg-white/30 dark:bg-slate-700/30 backdrop-blur-sm border border-white/50 dark:border-slate-700/50 shadow-lg rounded-xl">
            <CardHeader className="pb-2 sm:pb-4">
              <CardTitle className="text-base sm:text-lg font-semibold text-slate-800 dark:text-white flex items-center">
                <Zap className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-indigo-600 dark:text-indigo-400" />
                Completion Funnel
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {courseAnalyticsLoading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-600 dark:text-indigo-400" />
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {(courseAnalytics?.completionFunnel?.slice(0, 3) || []).map(
                    (course, index) => (
                      <div
                        key={index}
                        className="p-3 bg-white/20 dark:bg-slate-800/30 backdrop-blur-sm rounded-xl border border-white/30 dark:border-slate-600/30"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs sm:text-sm font-medium text-slate-800 dark:text-white truncate flex-1 pr-2">
                            {course.title}
                          </span>
                          <Badge className="bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs">
                            {course.conversionRates.completionRate}%
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300">
                          <span>Enrolled: {course.funnel.enrolled}</span>
                          <span>Started: {course.funnel.started}</span>
                          <span>Half: {course.funnel.halfComplete}</span>
                          <span>Complete: {course.funnel.completed}</span>
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white/30 dark:bg-slate-700/30 backdrop-blur-sm border border-white/50 dark:border-slate-700/50 shadow-lg rounded-xl">
            <CardHeader className="pb-2 sm:pb-4">
              <CardTitle className="text-base sm:text-lg font-semibold text-slate-800 dark:text-white flex items-center">
                <BookOpenCheck className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-indigo-600 dark:text-indigo-400" />
                Content Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {courseAnalyticsLoading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-600 dark:text-indigo-400" />
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {(courseAnalytics?.contentAnalysis?.slice(0, 3) || []).map(
                    (course, index) => (
                      <div
                        key={index}
                        className="p-3 bg-white/20 dark:bg-slate-800/30 backdrop-blur-sm rounded-xl border border-white/30 dark:border-slate-600/30"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs sm:text-sm font-medium text-slate-800 dark:text-white truncate flex-1 pr-2">
                            {course.title}
                          </span>
                          <Badge className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-lg text-xs">
                            {course.contentCompleteness.lessons}%
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300">
                          <span>Lessons: {course.actualContent.lessons}</span>
                          <span>Quizzes: {course.actualContent.quizzes}</span>
                          <span>Duration: {course.avgLessonDuration}min</span>
                          <span>Score: {course.avgQuizScore}</span>
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white/30 dark:bg-slate-700/30 backdrop-blur-sm border border-white/50 dark:border-slate-700/50 shadow-lg rounded-xl">
            <CardHeader className="pb-2 sm:pb-4">
              <CardTitle className="text-base sm:text-lg font-semibold text-slate-800 dark:text-white flex items-center">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-indigo-600 dark:text-indigo-400" />
                Competitive Position
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {courseAnalyticsLoading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-600 dark:text-indigo-400" />
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {(
                    courseAnalytics?.competitiveAnalysis?.slice(0, 3) || []
                  ).map((course, index) => (
                    <div
                      key={index}
                      className="p-3 bg-white/20 dark:bg-slate-800/30 backdrop-blur-sm rounded-xl border border-white/30 dark:border-slate-600/30"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs sm:text-sm font-medium text-slate-800 dark:text-white truncate flex-1 pr-2">
                          {course.title}
                        </span>
                        <div className="flex items-center space-x-1">
                          <Star className="w-3 h-3 text-yellow-500 fill-current" />
                          <span className="text-xs text-slate-600 dark:text-slate-300">
                            {course.rating}
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300">
                        <span>Price: {formatCurrency(course.price)}</span>
                        <span>Enrollments: {course.enrollments}</span>
                        <span>
                          Advantage: {course.competitivePosition.priceAdvantage}
                          %
                        </span>
                        <span>
                          Rating: +{course.competitivePosition.ratingAdvantage}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="bg-white/30 dark:bg-slate-700/30 backdrop-blur-sm border border-white/50 dark:border-slate-700/50 shadow-lg rounded-xl mb-6 sm:mb-8">
          <CardHeader className="pb-2 sm:pb-4">
            <CardTitle className="text-base sm:text-lg font-semibold text-slate-800 dark:text-white flex items-center">
              <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-indigo-600 dark:text-indigo-400" />
              Course Performance Details
            </CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-300 text-sm">
              Detailed breakdown of individual course metrics
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            {courseAnalyticsLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-600 dark:text-indigo-400" />
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {(courseAnalytics?.performance || []).map((course, index) => (
                  <div
                    key={index}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-white/20 dark:bg-slate-800/30 backdrop-blur-sm rounded-xl border border-white/30 dark:border-slate-600/30 space-y-3 sm:space-y-0"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-800 dark:text-white truncate">
                            {course.title}
                          </p>
                          <p className="text-xs text-slate-600 dark:text-slate-300 truncate">
                            by {course.instructor} • {course.category}
                          </p>
                        </div>
                        <Badge
                          className={`rounded-lg text-xs whitespace-nowrap ${
                            course.level === "BEGINNER"
                              ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                              : course.level === "INTERMEDIATE"
                              ? "bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300"
                              : "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300"
                          }`}
                        >
                          {course.level}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end sm:space-x-4 lg:space-x-6 text-xs sm:text-sm">
                      <div className="text-center">
                        <p className="font-medium text-slate-800 dark:text-white">
                          {formatCurrency(course.price)}
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-300">
                          Price
                        </p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <Star className="w-3 h-3 text-yellow-500 fill-current" />
                          <p className="font-medium text-slate-800 dark:text-white">
                            {course.rating}
                          </p>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300">
                          Rating
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="font-medium text-slate-800 dark:text-white">
                          {course.enrollments}
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-300">
                          Enrollments
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="font-medium text-slate-800 dark:text-white">
                          {formatCurrency(course.revenue)}
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-300">
                          Revenue
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                {(!courseAnalytics?.performance ||
                  courseAnalytics.performance.length === 0) && (
                  <div className="text-center py-8 text-slate-600 dark:text-slate-300 text-sm">
                    No course data available
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="text-center text-xs sm:text-sm text-slate-600 dark:text-slate-300">
          Last updated:{" "}
          {courseAnalytics?.lastUpdated
            ? new Date(courseAnalytics.lastUpdated).toLocaleString()
            : "Never"}
        </div>
      </div>
    </div>
  );
};

export default CourseAnalytics;
