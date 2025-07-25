/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Shield,
  Flag,
  Users,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ArrowUp,
  TrendingUp,
  TrendingDown,
  Activity,
  RefreshCw,
  BarChart3,
  PieChart,
  Calendar,
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
  Pie,
} from "recharts";
import { useTheme } from "@/components/ThemeProvider";
import {
  getModerationStats,
  clearError,
} from "@/features/adminSlice/adminModeration";

const ModerationStats = () => {
  const { theme } = useTheme();
  const dispatch = useDispatch();

  const moderationStats = useSelector(
    (state) => state.adminModeration?.moderationStats
  );
  const error = useSelector((state) => state.adminModeration?.error);
  const loading = useSelector(
    (state) => state.adminModeration?.loading || false
  );
  const moderationStatsLoading = useSelector(
    (state) => state.adminModeration?.moderationStatsLoading || false
  );

  const [selectedPeriod, setSelectedPeriod] = useState("30d");

  const loadModerationStats = useCallback(() => {
    const params = {
      period: selectedPeriod,
    };
    dispatch(getModerationStats(params));
  }, [dispatch, selectedPeriod]);

  useEffect(() => {
    dispatch(clearError());
    loadModerationStats();
  }, [dispatch, loadModerationStats]);

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  const handleRefresh = () => {
    loadModerationStats();
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num?.toString() || "0";
  };

  const StatCard = ({
    title,
    value,
    icon: IconComponent,
    subtitle,
    trend,
    color = "indigo",
  }) => (
    <Card className="bg-white/30 dark:bg-slate-700/30 backdrop-blur-sm border border-white/50 dark:border-slate-700/50 shadow-lg rounded-xl">
      <CardContent className="p-3 sm:p-4 lg:p-6">
        {moderationStatsLoading ? (
          <div className="flex items-center justify-center h-12 sm:h-16">
            <Loader2 className="w-4 h-4 sm:w-6 sm:h-6 animate-spin text-indigo-600 dark:text-indigo-400" />
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div
                  className={`p-1.5 sm:p-2 bg-gradient-to-br from-${color}-500 to-${color}-600 rounded-lg sm:rounded-xl shadow-sm`}
                >
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
              {trend && (
                <div
                  className={`flex items-center space-x-1 ${
                    trend > 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {trend > 0 ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  <span className="text-sm font-medium">
                    {Math.abs(trend)}%
                  </span>
                </div>
              )}
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

  const getReportsByTypeData = () => {
    if (!moderationStats?.reportsByType) return [];
    return Object.entries(moderationStats.reportsByType).map(
      ([key, value]) => ({
        name: key.replace("_", " ").toUpperCase(),
        value: value,
      })
    );
  };

  const getReportsByStatusData = () => {
    if (!moderationStats?.reportsByStatus) return [];
    return Object.entries(moderationStats.reportsByStatus).map(
      ([key, value]) => ({
        name: key.charAt(0).toUpperCase() + key.slice(1),
        count: value,
      })
    );
  };

  const getModerationActionsData = () => {
    if (!moderationStats?.moderationActions) return [];
    const actions = moderationStats.moderationActions;
    return [
      { name: "Approve", count: actions.actionApprove || 0 },
      { name: "Remove", count: actions.actionRemove || 0 },
      { name: "Warn", count: actions.actionWarn || 0 },
      { name: "Escalate", count: actions.actionEscalate || 0 },
    ].filter((item) => item.count > 0);
  };

  const getViolationData = () => {
    if (!moderationStats?.violations) return [];
    const violations = moderationStats.violations;
    return [
      { name: "Content Violations", count: violations.contentViolations || 0 },
      { name: "Content Warnings", count: violations.contentWarnings || 0 },
      { name: "User Warnings", count: violations.userWarnings || 0 },
      { name: "User Suspensions", count: violations.userSuspensions || 0 },
      { name: "User Bans", count: violations.userBans || 0 },
    ].filter((item) => item.count > 0);
  };

  if (loading && !moderationStats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50/80 via-indigo-50/80 to-cyan-50/80 dark:from-slate-900/80 dark:via-slate-800/80 dark:to-gray-900/80 backdrop-blur-xl flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-indigo-600 dark:text-indigo-400 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base">
            Loading moderation statistics...
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
                Moderation Statistics
              </h1>
              <p className="text-slate-600 dark:text-slate-300 mt-1 text-sm sm:text-base">
                Comprehensive insights into moderation activities and
                performance
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

          <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="flex items-center space-x-2">
              <Label className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 whitespace-nowrap">
                Period:
              </Label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-24 sm:w-32 bg-white/30 dark:bg-slate-700/30 backdrop-blur-sm border border-white/50 dark:border-slate-700/50 rounded-xl text-xs sm:text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 rounded-xl">
                  <SelectItem value="24h">24 Hours</SelectItem>
                  <SelectItem value="7d">7 Days</SelectItem>
                  <SelectItem value="30d">30 Days</SelectItem>
                  <SelectItem value="90d">90 Days</SelectItem>
                  <SelectItem value="all">All Time</SelectItem>
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
            title="Total Reports"
            value={formatNumber(moderationStats?.overview?.totalReports || 0)}
            icon={Flag}
            subtitle="All time reports"
            color="blue"
          />
          <StatCard
            title="Pending Reports"
            value={formatNumber(moderationStats?.overview?.pendingReports || 0)}
            icon={AlertTriangle}
            subtitle="Awaiting review"
            color="yellow"
          />
          <StatCard
            title="Resolution Rate"
            value={`${moderationStats?.overview?.resolutionRate || 0}%`}
            icon={CheckCircle}
            subtitle="Reports resolved"
            color="green"
          />
          <StatCard
            title="Active Users"
            value={formatNumber(moderationStats?.overview?.activeUsers || 0)}
            icon={Users}
            subtitle="Platform users"
            color="indigo"
          />
          <StatCard
            title="Total Violations"
            value={formatNumber(
              moderationStats?.violations?.totalViolations || 0
            )}
            icon={Shield}
            subtitle="Policy violations"
            color="red"
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card className="bg-white/30 dark:bg-slate-700/30 backdrop-blur-sm border border-white/50 dark:border-slate-700/50 shadow-lg rounded-xl">
            <CardHeader className="pb-2 sm:pb-4">
              <CardTitle className="text-base sm:text-lg font-semibold text-slate-800 dark:text-white flex items-center">
                <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-indigo-600 dark:text-indigo-400" />
                Reports by Status
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {moderationStatsLoading ? (
                <div className="flex items-center justify-center h-48 sm:h-64">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-600 dark:text-indigo-400" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={getReportsByStatusData()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                    <YAxis stroke="#64748b" fontSize={12} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" fill="#6366f1" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white/30 dark:bg-slate-700/30 backdrop-blur-sm border border-white/50 dark:border-slate-700/50 shadow-lg rounded-xl">
            <CardHeader className="pb-2 sm:pb-4">
              <CardTitle className="text-base sm:text-lg font-semibold text-slate-800 dark:text-white flex items-center">
                <PieChart className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-indigo-600 dark:text-indigo-400" />
                Reports by Type
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {moderationStatsLoading ? (
                <div className="flex items-center justify-center h-48 sm:h-64">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-600 dark:text-indigo-400" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <RechartsPieChart>
                    <Pie
                      data={getReportsByTypeData()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {getReportsByTypeData().map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
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
                <Activity className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-indigo-600 dark:text-indigo-400" />
                Moderation Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {moderationStatsLoading ? (
                <div className="flex items-center justify-center h-48 sm:h-64">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-600 dark:text-indigo-400" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={getModerationActionsData()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                    <YAxis stroke="#64748b" fontSize={12} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white/30 dark:bg-slate-700/30 backdrop-blur-sm border border-white/50 dark:border-slate-700/50 shadow-lg rounded-xl">
            <CardHeader className="pb-2 sm:pb-4">
              <CardTitle className="text-base sm:text-lg font-semibold text-slate-800 dark:text-white flex items-center">
                <Shield className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-indigo-600 dark:text-indigo-400" />
                Violation Types
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {moderationStatsLoading ? (
                <div className="flex items-center justify-center h-48 sm:h-64">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-600 dark:text-indigo-400" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={getViolationData()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                    <YAxis stroke="#64748b" fontSize={12} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card className="bg-white/30 dark:bg-slate-700/30 backdrop-blur-sm border border-white/50 dark:border-slate-700/50 shadow-lg rounded-xl">
            <CardHeader className="pb-2 sm:pb-4">
              <CardTitle className="text-base sm:text-lg font-semibold text-slate-800 dark:text-white flex items-center">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-indigo-600 dark:text-indigo-400" />
                Performance Metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {moderationStatsLoading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-600 dark:text-indigo-400" />
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  <div className="p-3 bg-white/20 dark:bg-slate-800/30 backdrop-blur-sm rounded-xl border border-white/30 dark:border-slate-600/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs sm:text-sm font-medium text-slate-800 dark:text-white">
                        Avg Resolution Time
                      </span>
                      <Badge className="bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs">
                        {moderationStats?.performance?.averageResolutionTime ||
                          "N/A"}
                      </Badge>
                    </div>
                  </div>
                  <div className="p-3 bg-white/20 dark:bg-slate-800/30 backdrop-blur-sm rounded-xl border border-white/30 dark:border-slate-600/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs sm:text-sm font-medium text-slate-800 dark:text-white">
                        Moderator Efficiency
                      </span>
                      <Badge className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-lg text-xs">
                        {moderationStats?.performance?.moderatorEfficiency || 0}
                        %
                      </Badge>
                    </div>
                  </div>
                  <div className="p-3 bg-white/20 dark:bg-slate-800/30 backdrop-blur-sm rounded-xl border border-white/30 dark:border-slate-600/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs sm:text-sm font-medium text-slate-800 dark:text-white">
                        False Positive Rate
                      </span>
                      <Badge className="bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 rounded-lg text-xs">
                        {moderationStats?.performance?.falsePositiveRate ||
                          "N/A"}
                      </Badge>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white/30 dark:bg-slate-700/30 backdrop-blur-sm border border-white/50 dark:border-slate-700/50 shadow-lg rounded-xl">
            <CardHeader className="pb-2 sm:pb-4">
              <CardTitle className="text-base sm:text-lg font-semibold text-slate-800 dark:text-white flex items-center">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-indigo-600 dark:text-indigo-400" />
                User Statistics
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {moderationStatsLoading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-600 dark:text-indigo-400" />
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  <div className="p-3 bg-white/20 dark:bg-slate-800/30 backdrop-blur-sm rounded-xl border border-white/30 dark:border-slate-600/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs sm:text-sm font-medium text-slate-800 dark:text-white">
                        Banned Users
                      </span>
                      <Badge className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-lg text-xs">
                        {formatNumber(
                          moderationStats?.overview?.bannedUsers || 0
                        )}
                      </Badge>
                    </div>
                  </div>
                  <div className="p-3 bg-white/20 dark:bg-slate-800/30 backdrop-blur-sm rounded-xl border border-white/30 dark:border-slate-600/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs sm:text-sm font-medium text-slate-800 dark:text-white">
                        Suspended Users
                      </span>
                      <Badge className="bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 rounded-lg text-xs">
                        {formatNumber(
                          moderationStats?.overview?.suspendedUsers || 0
                        )}
                      </Badge>
                    </div>
                  </div>
                  <div className="p-3 bg-white/20 dark:bg-slate-800/30 backdrop-blur-sm rounded-xl border border-white/30 dark:border-slate-600/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs sm:text-sm font-medium text-slate-800 dark:text-white">
                        Total Users
                      </span>
                      <Badge className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-lg text-xs">
                        {formatNumber(
                          moderationStats?.overview?.totalUsers || 0
                        )}
                      </Badge>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white/30 dark:bg-slate-700/30 backdrop-blur-sm border border-white/50 dark:border-slate-700/50 shadow-lg rounded-xl">
            <CardHeader className="pb-2 sm:pb-4">
              <CardTitle className="text-base sm:text-lg font-semibold text-slate-800 dark:text-white flex items-center">
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-indigo-600 dark:text-indigo-400" />
                Recent Trends
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {moderationStatsLoading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-600 dark:text-indigo-400" />
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  <div className="p-3 bg-white/20 dark:bg-slate-800/30 backdrop-blur-sm rounded-xl border border-white/30 dark:border-slate-600/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs sm:text-sm font-medium text-slate-800 dark:text-white">
                        Weekly Change
                      </span>
                      <Badge className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-xs">
                        {moderationStats?.trends?.weeklyChange || "0%"}
                      </Badge>
                    </div>
                  </div>
                  <div className="p-3 bg-white/20 dark:bg-slate-800/30 backdrop-blur-sm rounded-xl border border-white/30 dark:border-slate-600/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs sm:text-sm font-medium text-slate-800 dark:text-white">
                        Monthly Change
                      </span>
                      <Badge className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-xs">
                        {moderationStats?.trends?.monthlyChange || "0%"}
                      </Badge>
                    </div>
                  </div>
                  <div className="p-3 bg-white/20 dark:bg-slate-800/30 backdrop-blur-sm rounded-xl border border-white/30 dark:border-slate-600/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs sm:text-sm font-medium text-slate-800 dark:text-white">
                        Satisfaction Rate
                      </span>
                      <Badge className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-lg text-xs">
                        {moderationStats?.performance?.userSatisfactionRate ||
                          "N/A"}
                      </Badge>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="text-center text-xs sm:text-sm text-slate-600 dark:text-slate-300">
          Last updated:{" "}
          {moderationStats?.lastUpdated
            ? new Date(moderationStats.lastUpdated).toLocaleString()
            : new Date().toLocaleString()}
        </div>
      </div>
    </div>
  );
};

export default ModerationStats;
