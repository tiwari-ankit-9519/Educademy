/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Users,
  BookOpen,
  DollarSign,
  UserCheck,
  TrendingUp,
  TrendingDown,
  Activity,
  Download,
  RefreshCw,
  Clock,
  Star,
  Award,
  Smartphone,
  Monitor,
  AlertCircle,
  CheckCircle,
  Loader2,
  Globe,
  Brain,
  Target,
  BarChart3,
  PieChart,
  Calendar,
  MessageSquare,
  Shield,
  Zap,
  Heart,
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
import { Progress } from "@/components/ui/progress";
import { useTheme } from "@/components/ThemeProvider";
import {
  getDashboardOverview,
  exportAnalyticsData,
  downloadExportedData,
  clearError,
} from "@/features/adminSlice/adminAnalytics";

const AdminDashboard = () => {
  const { theme } = useTheme();
  const dispatch = useDispatch();
  const adminAnalyticsState = useSelector(
    (state) => state.adminAnalytics || {}
  );

  const {
    dashboardData,
    exportData,
    error,
    loading,
    dashboardLoading,
    exportLoading,
    downloadLoading,
  } = adminAnalyticsState;

  const [selectedPeriod, setSelectedPeriod] = useState("30d");
  const [exportType, setExportType] = useState("dashboard");
  const [exportFormat, setExportFormat] = useState("json");
  const [autoRefresh, setAutoRefresh] = useState(false);

  const loadDashboard = useCallback(() => {
    const params = { period: selectedPeriod, refresh: "false" };
    dispatch(getDashboardOverview(params));
  }, [dispatch, selectedPeriod]);

  useEffect(() => {
    dispatch(clearError());
    loadDashboard();
  }, [dispatch, loadDashboard]);

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  useEffect(() => {
    let interval;
    if (autoRefresh) {
      interval = setInterval(() => {
        loadDashboard();
      }, 300000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, loadDashboard]);

  const handleRefresh = () => {
    loadDashboard();
  };

  const handleExport = () => {
    dispatch(
      exportAnalyticsData({
        type: exportType,
        period: selectedPeriod,
        format: exportFormat,
      })
    );
  };

  const handleDownload = () => {
    if (exportData?.exportId) {
      dispatch(
        downloadExportedData({
          exportId: exportData.exportId,
          format: exportFormat,
        })
      );
    }
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
    }).format(amount || 0);
  };

  const getGrowthIcon = (growth) => {
    if (growth > 0) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (growth < 0) return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Activity className="w-4 h-4 text-slate-500 dark:text-slate-400" />;
  };

  const getGrowthColor = (growth) => {
    if (growth > 0) return "text-green-600 dark:text-green-400";
    if (growth < 0) return "text-red-600 dark:text-red-400";
    return "text-slate-500 dark:text-slate-400";
  };

  const StatCard = ({
    title,
    value,
    icon: IconComponent,
    growth,
    loading,
    subtitle,
    trend,
  }) => (
    <Card className="bg-white/30 dark:bg-slate-700/30 backdrop-blur-sm border border-white/50 dark:border-slate-700/50 shadow-lg rounded-xl">
      <CardContent className="p-6">
        {loading ? (
          <div className="flex items-center justify-center h-16">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600 dark:text-indigo-400" />
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-xl shadow-sm">
                  <IconComponent className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                    {title}
                  </p>
                  <p className="text-2xl font-bold text-slate-800 dark:text-white">
                    {value}
                  </p>
                </div>
              </div>
              {growth !== undefined && (
                <div className="flex items-center space-x-1">
                  {getGrowthIcon(growth)}
                  <span
                    className={`text-sm font-medium ${getGrowthColor(growth)}`}
                  >
                    {growth > 0 ? "+" : ""}
                    {growth}%
                  </span>
                </div>
              )}
            </div>
            {subtitle && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                {subtitle}
              </p>
            )}
            {trend && (
              <div className="mt-3">
                <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                  <span>Trend</span>
                  <span>{trend.percentage}%</span>
                </div>
                <Progress value={trend.percentage} className="h-1" />
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );

  if (!adminAnalyticsState) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50/80 via-indigo-50/80 to-cyan-50/80 dark:from-slate-900/80 dark:via-slate-800/80 dark:to-gray-900/80 backdrop-blur-xl flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 dark:text-indigo-400 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-300">
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/80 via-indigo-50/80 to-cyan-50/80 dark:from-slate-900/80 dark:via-slate-800/80 dark:to-gray-900/80 backdrop-blur-xl">
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="md:flex flex-row items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl text-center md:text-left font-bold text-slate-800 dark:text-white">
                Analytics Dashboard
              </h1>
              <p className="text-slate-600 dark:text-slate-300 mt-1 text-center md:text-left">
                Comprehensive platform insights with advanced metrics and
                analytics
              </p>
            </div>
            <div className="flex items-center space-x-4 mt-4">
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
              <div className="flex items-center space-x-2">
                <Label className="text-sm text-slate-600 dark:text-slate-300">
                  Auto-refresh
                </Label>
                <Button
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  variant={autoRefresh ? "default" : "ghost"}
                  size="sm"
                  className={
                    autoRefresh
                      ? "bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-white rounded-xl"
                      : "bg-white/30 dark:bg-slate-700/30 backdrop-blur-sm border border-white/50 dark:border-slate-700/50 rounded-xl hover:bg-white/50 dark:hover:bg-slate-700/50 text-slate-600 dark:text-slate-300"
                  }
                >
                  <Clock className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 mb-6">
            <div className="flex items-center space-x-2">
              <Label className="text-sm text-slate-600 dark:text-slate-300">
                Period:
              </Label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-32 bg-white/30 dark:bg-slate-700/30 backdrop-blur-sm border border-white/50 dark:border-slate-700/50 rounded-xl">
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
          </div>

          {error && (
            <Alert className="bg-red-50/50 dark:bg-red-900/20 border border-red-200/50 dark:border-red-800/50 backdrop-blur-sm rounded-xl mb-6">
              <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
              <AlertDescription className="text-red-700 dark:text-red-400">
                {error}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Users"
            value={formatNumber(dashboardData?.summary?.totalUsers)}
            icon={Users}
            growth={dashboardData?.summary?.growth?.users}
            loading={dashboardLoading}
            subtitle={`Active: ${formatNumber(
              dashboardData?.summary?.activeUsers
            )}`}
          />
          <StatCard
            title="Total Courses"
            value={formatNumber(dashboardData?.summary?.totalCourses)}
            icon={BookOpen}
            growth={dashboardData?.summary?.growth?.courses}
            loading={dashboardLoading}
            subtitle={`Published courses available`}
          />
          <StatCard
            title="Total Revenue"
            value={formatCurrency(dashboardData?.summary?.totalRevenue)}
            icon={DollarSign}
            growth={dashboardData?.summary?.growth?.revenue}
            loading={dashboardLoading}
            subtitle={`Completed payments only`}
          />
          <StatCard
            title="Total Enrollments"
            value={formatNumber(dashboardData?.summary?.totalEnrollments)}
            icon={UserCheck}
            growth={dashboardData?.summary?.growth?.enrollments}
            loading={dashboardLoading}
            subtitle={`All time enrollments`}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="User Retention (7d)"
            value={`${
              dashboardData?.userAnalytics?.retention?.newUserRetention7d || 0
            }%`}
            icon={Heart}
            loading={dashboardLoading}
            subtitle={`New user retention rate`}
          />
          <StatCard
            title="Avg CLV"
            value={formatCurrency(
              dashboardData?.financialMetrics?.clv?.average
            )}
            icon={Target}
            loading={dashboardLoading}
            subtitle={`Customer Lifetime Value`}
          />
          <StatCard
            title="Churn Rate"
            value={`${dashboardData?.userAnalytics?.churn?.churnRate || 0}%`}
            icon={TrendingDown}
            loading={dashboardLoading}
            subtitle={`Monthly user churn`}
          />
          <StatCard
            title="Active Sessions"
            value={formatNumber(dashboardData?.systemHealth?.activeSessions)}
            icon={Zap}
            loading={dashboardLoading}
            subtitle={`Currently active users`}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white/30 dark:bg-slate-700/30 backdrop-blur-sm border border-white/50 dark:border-slate-700/50 shadow-lg rounded-xl">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-800 dark:text-white flex items-center">
                <Users className="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400" />
                User Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dashboardLoading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-600 dark:text-indigo-400" />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-300">
                      Daily Active
                    </span>
                    <Badge className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-lg">
                      {formatNumber(
                        dashboardData?.userAnalytics?.retention?.daily
                      )}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-300">
                      Weekly Active
                    </span>
                    <Badge className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-lg">
                      {formatNumber(
                        dashboardData?.userAnalytics?.retention?.weekly
                      )}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-300">
                      Monthly Active
                    </span>
                    <Badge className="bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-lg">
                      {formatNumber(
                        dashboardData?.userAnalytics?.retention?.monthly
                      )}
                    </Badge>
                  </div>
                  <div className="pt-2 border-t border-white/30 dark:border-slate-700/50">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-300">
                        Avg User Lifespan
                      </span>
                      <span className="text-sm font-medium text-slate-800 dark:text-white">
                        {dashboardData?.userAnalytics?.churn?.avgUserLifespan}{" "}
                        days
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white/30 dark:bg-slate-700/30 backdrop-blur-sm border border-white/50 dark:border-slate-700/50 shadow-lg rounded-xl">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-800 dark:text-white flex items-center">
                <DollarSign className="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400" />
                Financial Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dashboardLoading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-600 dark:text-indigo-400" />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-300">
                      Avg CLV
                    </span>
                    <span className="text-sm font-medium text-slate-800 dark:text-white">
                      {formatCurrency(
                        dashboardData?.financialMetrics?.clv?.average
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-300">
                      Median CLV
                    </span>
                    <span className="text-sm font-medium text-slate-800 dark:text-white">
                      {formatCurrency(
                        dashboardData?.financialMetrics?.clv?.median
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-300">
                      Cart Conversion
                    </span>
                    <span className="text-sm font-medium text-slate-800 dark:text-white">
                      {dashboardData?.conversionFunnel?.cartToPayment}%
                    </span>
                  </div>
                  <div className="pt-2 border-t border-white/30 dark:border-slate-700/50">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-300">
                        Avg Payment Amount
                      </span>
                      <span className="text-sm font-medium text-slate-800 dark:text-white">
                        {formatCurrency(
                          dashboardData?.conversionFunnel?.avgPaymentAmount
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white/30 dark:bg-slate-700/30 backdrop-blur-sm border border-white/50 dark:border-slate-700/50 shadow-lg rounded-xl">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-800 dark:text-white flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400" />
                Engagement Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dashboardLoading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-600 dark:text-indigo-400" />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-300">
                      Lesson Completion
                    </span>
                    <span className="text-sm font-medium text-slate-800 dark:text-white">
                      {dashboardData?.engagement?.lessonCompletionRate}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-300">
                      Avg Quiz Score
                    </span>
                    <div className="flex items-center space-x-1">
                      <Star className="w-3 h-3 text-yellow-500 fill-current" />
                      <span className="text-sm font-medium text-slate-800 dark:text-white">
                        {dashboardData?.engagement?.avgQuizScore}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-300">
                      Total Reviews
                    </span>
                    <span className="text-sm font-medium text-slate-800 dark:text-white">
                      {formatNumber(dashboardData?.engagement?.totalReviews)}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-white/30 dark:border-slate-700/50">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-300">
                        Avg Rating
                      </span>
                      <div className="flex items-center space-x-1">
                        <Star className="w-3 h-3 text-yellow-500 fill-current" />
                        <span className="text-sm font-medium text-slate-800 dark:text-white">
                          {dashboardData?.engagement?.avgRating}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="bg-white/30 dark:bg-slate-700/30 backdrop-blur-sm border border-white/50 dark:border-slate-700/50 shadow-lg rounded-xl">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-800 dark:text-white flex items-center">
                <Award className="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400" />
                Top Instructors
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dashboardLoading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-600 dark:text-indigo-400" />
                </div>
              ) : (
                <div className="space-y-4">
                  {dashboardData?.topInstructors
                    ?.slice(0, 5)
                    .map((instructor, index) => (
                      <div
                        key={instructor.id}
                        className="flex items-center justify-between p-3 bg-white/20 dark:bg-slate-800/30 backdrop-blur-sm rounded-xl border border-white/30 dark:border-slate-600/30"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-800 dark:text-white">
                              {instructor.name}
                            </p>
                            <p className="text-xs text-slate-600 dark:text-slate-300">
                              {instructor.totalStudents} students •{" "}
                              {instructor.totalCourses} courses
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-slate-800 dark:text-white">
                            {formatCurrency(instructor.totalRevenue)}
                          </p>
                          <div className="flex items-center justify-end space-x-1">
                            <Star className="w-3 h-3 text-yellow-500 fill-current" />
                            <span className="text-xs text-slate-600 dark:text-slate-300">
                              {instructor.rating}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  {(!dashboardData?.topInstructors ||
                    dashboardData.topInstructors.length === 0) && (
                    <div className="text-center py-8 text-slate-600 dark:text-slate-300">
                      No instructor data available
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white/30 dark:bg-slate-700/30 backdrop-blur-sm border border-white/50 dark:border-slate-700/50 shadow-lg rounded-xl">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-800 dark:text-white flex items-center">
                <PieChart className="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400" />
                Revenue by Category
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dashboardLoading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-600 dark:text-indigo-400" />
                </div>
              ) : (
                <div className="space-y-4">
                  {dashboardData?.revenueByCategory
                    ?.slice(0, 5)
                    .map((category, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-white/20 dark:bg-slate-800/30 backdrop-blur-sm rounded-xl border border-white/30 dark:border-slate-600/30"
                      >
                        <div>
                          <p className="text-sm font-medium text-slate-800 dark:text-white">
                            {category.category}
                          </p>
                          <p className="text-xs text-slate-600 dark:text-slate-300">
                            {category.enrollments} enrollments •{" "}
                            {category.totalCourses} courses
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-slate-800 dark:text-white">
                            {formatCurrency(category.revenue)}
                          </p>
                          <div className="flex items-center justify-end space-x-1">
                            <Star className="w-3 h-3 text-yellow-500 fill-current" />
                            <span className="text-xs text-slate-600 dark:text-slate-300">
                              {category.avgRating}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  {(!dashboardData?.revenueByCategory ||
                    dashboardData.revenueByCategory.length === 0) && (
                    <div className="text-center py-8 text-slate-600 dark:text-slate-300">
                      No category data available
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white/30 dark:bg-slate-700/30 backdrop-blur-sm border border-white/50 dark:border-slate-700/50 shadow-lg rounded-xl">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-800 dark:text-white flex items-center">
                <Globe className="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400" />
                Geographic Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dashboardLoading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-600 dark:text-indigo-400" />
                </div>
              ) : (
                <div className="space-y-3">
                  {dashboardData?.geographicAnalytics?.distribution
                    ?.slice(0, 5)
                    .map((location, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between"
                      >
                        <span className="text-sm text-slate-600 dark:text-slate-300">
                          {location.country || "Unknown"}
                        </span>
                        <div className="text-right">
                          <span className="text-sm font-medium text-slate-800 dark:text-white">
                            {formatNumber(location.userCount)}
                          </span>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {formatCurrency(location.revenue)}
                          </p>
                        </div>
                      </div>
                    ))}
                  {(!dashboardData?.geographicAnalytics?.distribution ||
                    dashboardData.geographicAnalytics.distribution.length ===
                      0) && (
                    <div className="text-center py-8 text-slate-600 dark:text-slate-300">
                      No geographic data available
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white/30 dark:bg-slate-700/30 backdrop-blur-sm border border-white/50 dark:border-slate-700/50 shadow-lg rounded-xl">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-800 dark:text-white flex items-center">
                <Smartphone className="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400" />
                Device Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dashboardLoading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-600 dark:text-indigo-400" />
                </div>
              ) : (
                <div className="space-y-3">
                  {dashboardData?.deviceAnalytics
                    ?.slice(0, 5)
                    .map((device, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-2">
                          <div className="p-1 bg-white/20 dark:bg-slate-800/30 backdrop-blur-sm rounded-lg">
                            {device.deviceType?.includes("desktop") ||
                            device.deviceType?.includes("Desktop") ? (
                              <Monitor className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                            ) : (
                              <Smartphone className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                            )}
                          </div>
                          <span className="text-sm text-slate-600 dark:text-slate-300 truncate max-w-32">
                            {device.deviceType || "Unknown"}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-medium text-slate-800 dark:text-white">
                            {formatNumber(device.sessionCount)}
                          </span>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {formatNumber(device.uniqueUsers)} users
                          </p>
                        </div>
                      </div>
                    ))}
                  {(!dashboardData?.deviceAnalytics ||
                    dashboardData.deviceAnalytics.length === 0) && (
                    <div className="text-center py-8 text-slate-600 dark:text-slate-300">
                      No device data available
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white/30 dark:bg-slate-700/30 backdrop-blur-sm border border-white/50 dark:border-slate-700/50 shadow-lg rounded-xl">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-800 dark:text-white flex items-center">
                <MessageSquare className="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400" />
                Support Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dashboardLoading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-600 dark:text-indigo-400" />
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-300">
                      Open Tickets
                    </span>
                    <Badge className="bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 rounded-lg">
                      {dashboardData?.operationalMetrics?.openTickets || 0}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-300">
                      Banned Users
                    </span>
                    <Badge className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-lg">
                      {dashboardData?.operationalMetrics?.bannedUsers || 0}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-300">
                      System Notifications
                    </span>
                    <span className="text-sm font-medium text-slate-800 dark:text-white">
                      {formatNumber(
                        dashboardData?.operationalMetrics?.systemNotifications
                      )}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-white/30 dark:border-slate-700/50">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-300">
                        Avg Session Duration
                      </span>
                      <span className="text-sm font-medium text-slate-800 dark:text-white">
                        {dashboardData?.operationalMetrics?.avgSessionDuration}{" "}
                        min
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="bg-white/30 dark:bg-slate-700/30 backdrop-blur-sm border border-white/50 dark:border-slate-700/50 shadow-lg rounded-xl mb-8">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-800 dark:text-white flex items-center">
              <Brain className="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400" />
              Cohort Retention Analysis
            </CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-300">
              User retention rates by signup cohorts
            </CardDescription>
          </CardHeader>
          <CardContent>
            {dashboardLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-600 dark:text-indigo-400" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {dashboardData?.userAnalytics?.cohortAnalysis
                  ?.slice(0, 6)
                  .map((cohort, index) => (
                    <div
                      key={index}
                      className="p-4 bg-white/20 dark:bg-slate-800/30 backdrop-blur-sm rounded-xl border border-white/30 dark:border-slate-600/30"
                    >
                      <p className="text-sm font-medium text-slate-800 dark:text-white mb-2">
                        Week {new Date(cohort.week).toLocaleDateString()}
                      </p>
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-600 dark:text-slate-300">
                            Cohort Size
                          </span>
                          <span className="text-slate-800 dark:text-white">
                            {cohort.cohortSize}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-600 dark:text-slate-300">
                            Retained
                          </span>
                          <span className="text-slate-800 dark:text-white">
                            {cohort.retainedUsers}
                          </span>
                        </div>
                        <div className="mt-2">
                          <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                            <span>Retention Rate</span>
                            <span>{cohort.retentionRate}%</span>
                          </div>
                          <Progress
                            value={parseFloat(cohort.retentionRate)}
                            className="h-1"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                {(!dashboardData?.userAnalytics?.cohortAnalysis ||
                  dashboardData.userAnalytics.cohortAnalysis.length === 0) && (
                  <div className="col-span-3 text-center py-8 text-slate-600 dark:text-slate-300">
                    No cohort data available
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white/30 dark:bg-slate-700/30 backdrop-blur-sm border border-white/50 dark:border-slate-700/50 shadow-lg rounded-xl mb-8">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-800 dark:text-white flex items-center">
              <Download className="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400" />
              Export Analytics Data
            </CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-300">
              Export comprehensive analytics data for external analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label className="text-sm text-slate-600 dark:text-slate-300 mb-2 block">
                  Export Type
                </Label>
                <Select value={exportType} onValueChange={setExportType}>
                  <SelectTrigger className="bg-white/30 dark:bg-slate-700/30 backdrop-blur-sm border border-white/50 dark:border-slate-700/50 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 rounded-xl">
                    <SelectItem value="dashboard">Full Dashboard</SelectItem>
                    <SelectItem value="users">User Analytics</SelectItem>
                    <SelectItem value="courses">Course Analytics</SelectItem>
                    <SelectItem value="revenue">Revenue Analytics</SelectItem>
                    <SelectItem value="engagement">Engagement</SelectItem>
                    <SelectItem value="geographic">Geographic</SelectItem>
                    <SelectItem value="cohort">Cohort Analysis</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm text-slate-600 dark:text-slate-300 mb-2 block">
                  Format
                </Label>
                <Select value={exportFormat} onValueChange={setExportFormat}>
                  <SelectTrigger className="bg-white/30 dark:bg-slate-700/30 backdrop-blur-sm border border-white/50 dark:border-slate-700/50 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 rounded-xl">
                    <SelectItem value="json">JSON</SelectItem>
                    <SelectItem value="csv">CSV</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button
                  onClick={handleExport}
                  disabled={exportLoading}
                  className="w-full h-10 bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-white rounded-xl"
                >
                  {exportLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Export Data
                    </>
                  )}
                </Button>
              </div>
              <div className="flex items-end">
                <Button
                  onClick={handleDownload}
                  disabled={downloadLoading || !exportData?.exportId}
                  variant="ghost"
                  className="w-full h-10 bg-white/30 dark:bg-slate-700/30 backdrop-blur-sm border border-white/50 dark:border-slate-700/50 rounded-xl hover:bg-white/50 dark:hover:bg-slate-700/50 text-slate-600 dark:text-slate-300"
                >
                  {downloadLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Downloading...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </>
                  )}
                </Button>
              </div>
            </div>
            {exportData && (
              <Alert className="bg-green-50/50 dark:bg-green-900/20 border border-green-200/50 dark:border-green-800/50 backdrop-blur-sm rounded-xl mt-4">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                <AlertDescription className="text-green-700 dark:text-green-400">
                  Export completed! {exportData.recordCount} records exported.
                  Export ID: {exportData.exportId}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <div className="text-center text-sm text-slate-600 dark:text-slate-300">
          Last updated:{" "}
          {dashboardData?.lastUpdated
            ? new Date(dashboardData.lastUpdated).toLocaleString()
            : "Never"}{" "}
          • Period: {selectedPeriod}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
