/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Users,
  UserCheck,
  Clock,
  TrendingUp,
  TrendingDown,
  Activity,
  RefreshCw,
  Globe,
  Target,
  Zap,
  AlertTriangle,
  Download,
  Calendar,
  BarChart3,
  PieChart,
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
} from "recharts";
import { useTheme } from "@/components/ThemeProvider";
import {
  getUserAnalytics,
  clearError,
} from "@/features/adminSlice/adminAnalytics";

const UserAnalytics = () => {
  const { theme } = useTheme();
  const dispatch = useDispatch();
  const adminAnalyticsState = useSelector(
    (state) => state.adminAnalytics || {}
  );

  const { userAnalytics, error, loading, userAnalyticsLoading } =
    adminAnalyticsState;

  const [selectedPeriod, setSelectedPeriod] = useState("30d");
  const [selectedGroupBy, setSelectedGroupBy] = useState("day");
  const [selectedSegment, setSelectedSegment] = useState("all");

  const loadUserAnalytics = useCallback(() => {
    const params = {
      period: selectedPeriod,
      groupBy: selectedGroupBy,
      segment: selectedSegment,
    };
    dispatch(getUserAnalytics(params));
  }, [dispatch, selectedPeriod, selectedGroupBy, selectedSegment]);

  useEffect(() => {
    dispatch(clearError());
    loadUserAnalytics();
  }, [dispatch, loadUserAnalytics]);

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  const handleRefresh = () => {
    loadUserAnalytics();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const StatCard = ({
    title,
    value,
    icon: IconComponent,
    subtitle,
    loading,
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
            </div>
            {subtitle && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
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
        <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border border-white/50 dark:border-slate-700/50 rounded-xl p-3 shadow-lg">
          <p className="text-slate-800 dark:text-white font-medium">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (!adminAnalyticsState) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50/80 via-indigo-50/80 to-cyan-50/80 dark:from-slate-900/80 dark:via-slate-800/80 dark:to-gray-900/80 backdrop-blur-xl flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 dark:text-indigo-400 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-300">
            Loading user analytics...
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
                User Analytics
              </h1>
              <p className="text-slate-600 dark:text-slate-300 mt-1 text-center md:text-left">
                Comprehensive user behavior and engagement insights
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
            <div className="flex items-center space-x-2">
              <Label className="text-sm text-slate-600 dark:text-slate-300">
                Group by:
              </Label>
              <Select
                value={selectedGroupBy}
                onValueChange={setSelectedGroupBy}
              >
                <SelectTrigger className="w-32 bg-white/30 dark:bg-slate-700/30 backdrop-blur-sm border border-white/50 dark:border-slate-700/50 rounded-xl">
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
              <Label className="text-sm text-slate-600 dark:text-slate-300">
                Segment:
              </Label>
              <Select
                value={selectedSegment}
                onValueChange={setSelectedSegment}
              >
                <SelectTrigger className="w-32 bg-white/30 dark:bg-slate-700/30 backdrop-blur-sm border border-white/50 dark:border-slate-700/50 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 rounded-xl">
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="students">Students</SelectItem>
                  <SelectItem value="instructors">Instructors</SelectItem>
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
            title="Avg Days to Purchase"
            value={
              userAnalytics?.lifecycle?.averageDaysToFirstPurchase
                ? userAnalytics.lifecycle.averageDaysToFirstPurchase.toFixed(1)
                : "0"
            }
            icon={Clock}
            loading={userAnalyticsLoading}
            subtitle="Time to first enrollment"
          />
          <StatCard
            title="Conversion Rate"
            value={`${userAnalytics?.lifecycle?.conversionRate || 0}%`}
            icon={Target}
            loading={userAnalyticsLoading}
            subtitle="Users who enrolled"
          />
          <StatCard
            title="Avg Enrollments"
            value={userAnalytics?.lifecycle?.averageEnrollmentsPerUser || "0"}
            icon={UserCheck}
            loading={userAnalyticsLoading}
            subtitle="Per user"
          />
          <StatCard
            title="Avg Spending"
            value={formatCurrency(
              userAnalytics?.lifecycle?.averageSpendingPerUser || 0
            )}
            icon={TrendingUp}
            loading={userAnalyticsLoading}
            subtitle="Per user"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="bg-white/30 dark:bg-slate-700/30 backdrop-blur-sm border border-white/50 dark:border-slate-700/50 shadow-lg rounded-xl">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-800 dark:text-white flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400" />
                User Growth Over Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              {userAnalyticsLoading ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-600 dark:text-indigo-400" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={userAnalytics?.growth || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={formatDate}
                      stroke="#64748b"
                    />
                    <YAxis stroke="#64748b" />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="total"
                      stackId="1"
                      stroke="#6366f1"
                      fill="#6366f1"
                      fillOpacity={0.6}
                      name="Total Users"
                    />
                    <Area
                      type="monotone"
                      dataKey="students"
                      stackId="1"
                      stroke="#8b5cf6"
                      fill="#8b5cf6"
                      fillOpacity={0.6}
                      name="Students"
                    />
                    <Area
                      type="monotone"
                      dataKey="instructors"
                      stackId="1"
                      stroke="#06b6d4"
                      fill="#06b6d4"
                      fillOpacity={0.6}
                      name="Instructors"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white/30 dark:bg-slate-700/30 backdrop-blur-sm border border-white/50 dark:border-slate-700/50 shadow-lg rounded-xl">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-800 dark:text-white flex items-center">
                <PieChart className="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400" />
                User Segmentation
              </CardTitle>
            </CardHeader>
            <CardContent>
              {userAnalyticsLoading ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-600 dark:text-indigo-400" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={userAnalytics?.segmentation || []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ segment, percent }) =>
                        `${segment} ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="userCount"
                    >
                      {(userAnalytics?.segmentation || []).map(
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="bg-white/30 dark:bg-slate-700/30 backdrop-blur-sm border border-white/50 dark:border-slate-700/50 shadow-lg rounded-xl">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-800 dark:text-white flex items-center">
                <Globe className="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400" />
                Geographic Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              {userAnalyticsLoading ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-600 dark:text-indigo-400" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={userAnalytics?.geographic || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="country" stroke="#64748b" />
                    <YAxis stroke="#64748b" />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar
                      dataKey="totalUsers"
                      fill="#6366f1"
                      name="Total Users"
                    />
                    <Bar dataKey="students" fill="#8b5cf6" name="Students" />
                    <Bar
                      dataKey="instructors"
                      fill="#06b6d4"
                      name="Instructors"
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white/30 dark:bg-slate-700/30 backdrop-blur-sm border border-white/50 dark:border-slate-700/50 shadow-lg rounded-xl">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-800 dark:text-white flex items-center">
                <Activity className="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400" />
                User Engagement by Role
              </CardTitle>
            </CardHeader>
            <CardContent>
              {userAnalyticsLoading ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-600 dark:text-indigo-400" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={userAnalytics?.engagement || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="role" stroke="#64748b" />
                    <YAxis stroke="#64748b" />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar
                      dataKey="totalUsers"
                      fill="#6366f1"
                      name="Total Users"
                    />
                    <Bar
                      dataKey="weeklyActiveUsers"
                      fill="#10b981"
                      name="Weekly Active"
                    />
                    <Bar
                      dataKey="activeSessions"
                      fill="#f59e0b"
                      name="Active Sessions"
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="bg-white/30 dark:bg-slate-700/30 backdrop-blur-sm border border-white/50 dark:border-slate-700/50 shadow-lg rounded-xl">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-800 dark:text-white flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400" />
                Cohort Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              {userAnalyticsLoading ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-600 dark:text-indigo-400" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={userAnalytics?.cohorts || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                      dataKey="cohortMonth"
                      tickFormatter={formatDate}
                      stroke="#64748b"
                    />
                    <YAxis stroke="#64748b" />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="cohortSize"
                      stroke="#6366f1"
                      strokeWidth={2}
                      name="Cohort Size"
                    />
                    <Line
                      type="monotone"
                      dataKey="activeUsers"
                      stroke="#10b981"
                      strokeWidth={2}
                      name="Active Users"
                    />
                    <Line
                      type="monotone"
                      dataKey="retentionRate"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      name="Retention Rate %"
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white/30 dark:bg-slate-700/30 backdrop-blur-sm border border-white/50 dark:border-slate-700/50 shadow-lg rounded-xl">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-800 dark:text-white flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400" />
                Churn Risk Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              {userAnalyticsLoading ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-600 dark:text-indigo-400" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={userAnalytics?.churnAnalysis || []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ risk, percent }) =>
                        `${risk} Risk ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="userCount"
                    >
                      {(userAnalytics?.churnAnalysis || []).map(
                        (entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={
                              entry.risk === "High"
                                ? "#ef4444"
                                : entry.risk === "Medium"
                                ? "#f59e0b"
                                : "#10b981"
                            }
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white/30 dark:bg-slate-700/30 backdrop-blur-sm border border-white/50 dark:border-slate-700/50 shadow-lg rounded-xl">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-800 dark:text-white flex items-center">
                <Zap className="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400" />
                User Journey
              </CardTitle>
            </CardHeader>
            <CardContent>
              {userAnalyticsLoading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-600 dark:text-indigo-400" />
                </div>
              ) : (
                <div className="space-y-4">
                  {(userAnalytics?.journey || []).map((stage, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-white/20 dark:bg-slate-800/30 backdrop-blur-sm rounded-xl border border-white/30 dark:border-slate-600/30"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-800 dark:text-white">
                          {stage.stage
                            .replace(/_/g, " ")
                            .replace(/\b\w/g, (l) => l.toUpperCase())}
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-300">
                          {stage.userCount} users
                        </p>
                      </div>
                      <Badge className="bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded-lg">
                        {stage.averageDays} days
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white/30 dark:bg-slate-700/30 backdrop-blur-sm border border-white/50 dark:border-slate-700/50 shadow-lg rounded-xl">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-800 dark:text-white flex items-center">
                <Download className="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400" />
                Acquisition Channels
              </CardTitle>
            </CardHeader>
            <CardContent>
              {userAnalyticsLoading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-600 dark:text-indigo-400" />
                </div>
              ) : (
                <div className="space-y-4">
                  {(userAnalytics?.acquisition || []).map((channel, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-white/20 dark:bg-slate-800/30 backdrop-blur-sm rounded-xl border border-white/30 dark:border-slate-600/30"
                    >
                      <span className="text-sm font-medium text-slate-800 dark:text-white">
                        {channel.source}
                      </span>
                      <Badge className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-lg">
                        {channel.count}
                      </Badge>
                    </div>
                  ))}
                  {(!userAnalytics?.acquisition ||
                    userAnalytics.acquisition.length === 0) && (
                    <div className="text-center py-8 text-slate-600 dark:text-slate-300">
                      No acquisition data available
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white/30 dark:bg-slate-700/30 backdrop-blur-sm border border-white/50 dark:border-slate-700/50 shadow-lg rounded-xl">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-800 dark:text-white flex items-center">
                <Users className="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400" />
                Segment Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              {userAnalyticsLoading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-600 dark:text-indigo-400" />
                </div>
              ) : (
                <div className="space-y-4">
                  {(userAnalytics?.segmentation || []).map((segment, index) => (
                    <div
                      key={index}
                      className="p-3 bg-white/20 dark:bg-slate-800/30 backdrop-blur-sm rounded-xl border border-white/30 dark:border-slate-600/30"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-800 dark:text-white">
                          {segment.segment}
                        </span>
                        <Badge className="bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-white rounded-lg">
                          {segment.userCount}
                        </Badge>
                      </div>
                      <div className="flex justify-between text-xs text-slate-600 dark:text-slate-300">
                        <span>
                          Avg Spending: {formatCurrency(segment.avgSpending)}
                        </span>
                        <span>Avg Progress: {segment.avgProgress}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="text-center text-sm text-slate-600 dark:text-slate-300">
          Last updated:{" "}
          {userAnalytics?.lastUpdated
            ? new Date(userAnalytics.lastUpdated).toLocaleString()
            : "Never"}
        </div>
      </div>
    </div>
  );
};

export default UserAnalytics;
