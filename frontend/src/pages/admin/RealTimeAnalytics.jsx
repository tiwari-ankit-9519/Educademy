/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Activity,
  Users,
  Clock,
  TrendingUp,
  RefreshCw,
  Bell,
  AlertTriangle,
  CheckCircle,
  XCircle,
  DollarSign,
  UserPlus,
  BookOpen,
  CreditCard,
  Shield,
  Zap,
  Eye,
  Settings,
  Loader2,
  AlertCircle,
  Info,
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/components/ThemeProvider";
import {
  getRealtimeStats,
  clearError,
} from "@/features/adminSlice/adminAnalytics";

const RealtimeAnalytics = () => {
  const { theme } = useTheme();
  const dispatch = useDispatch();
  const adminAnalyticsState = useSelector(
    (state) => state.adminAnalytics || {}
  );

  const { realtimeStats, error, loading, realtimeStatsLoading } =
    adminAnalyticsState;

  const [autoRefresh, setAutoRefresh] = useState(true);
  const intervalRef = useRef(null);

  const loadRealtimeStats = useCallback(() => {
    dispatch(getRealtimeStats());
  }, [dispatch]);

  useEffect(() => {
    dispatch(clearError());
    loadRealtimeStats();
  }, [dispatch, loadRealtimeStats]);

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(() => {
        loadRealtimeStats();
      }, 30000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoRefresh, loadRealtimeStats]);

  const handleRefresh = () => {
    loadRealtimeStats();
  };

  const handleAutoRefreshToggle = () => {
    setAutoRefresh(!autoRefresh);
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

  const formatTime = (minutes) => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours}h ${mins}m`;
    }
    return `${minutes}m`;
  };

  const getTimeAgo = (minutes) => {
    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  const getSystemStatusColor = (status) => {
    switch (status) {
      case "healthy":
        return "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300";
      case "moderate":
        return "bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300";
      case "low":
        return "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300";
      default:
        return "bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300";
    }
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case "warning":
        return (
          <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500 shrink-0" />
        );
      case "error":
        return (
          <XCircle className="w-3 h-3 sm:w-4 sm:h-4 text-red-500 shrink-0" />
        );
      case "success":
        return (
          <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 shrink-0" />
        );
      default:
        return (
          <Info className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500 shrink-0" />
        );
    }
  };

  const getAlertColor = (type) => {
    switch (type) {
      case "warning":
        return "bg-yellow-50/50 dark:bg-yellow-900/20 border-yellow-200/50 dark:border-yellow-800/50";
      case "error":
        return "bg-red-50/50 dark:bg-red-900/20 border-red-200/50 dark:border-red-800/50";
      case "success":
        return "bg-green-50/50 dark:bg-green-900/20 border-green-200/50 dark:border-green-800/50";
      default:
        return "bg-blue-50/50 dark:bg-blue-900/20 border-blue-200/50 dark:border-blue-800/50";
    }
  };

  const StatCard = ({
    title,
    value,
    icon: IconComponent,
    subtitle,
    status,
    loading,
  }) => (
    <Card className="bg-white/30 dark:bg-slate-700/30 backdrop-blur-sm border border-white/50 dark:border-slate-700/50 shadow-lg rounded-lg h-full">
      <CardContent className="p-4 h-full flex flex-col">
        {loading ? (
          <div className="flex items-center justify-center h-20">
            <Loader2 className="w-5 h-5 animate-spin text-indigo-600 dark:text-indigo-400" />
          </div>
        ) : (
          <div className="flex flex-col h-full">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center space-x-3 min-w-0 flex-1">
                <div className="p-2 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-lg shadow-sm shrink-0">
                  <IconComponent className="w-4 h-4 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 mb-1 truncate">
                    {title}
                  </p>
                  <p className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white truncate">
                    {value}
                  </p>
                </div>
              </div>
              {status && (
                <Badge
                  className={`text-xs px-2 py-1 rounded-md shrink-0 ml-2 ${getSystemStatusColor(
                    status
                  )}`}
                >
                  {status}
                </Badge>
              )}
            </div>
            {subtitle && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-auto truncate">
                {subtitle}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (!adminAnalyticsState) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50/80 via-indigo-50/80 to-cyan-50/80 dark:from-slate-900/80 dark:via-slate-800/80 dark:to-gray-900/80 backdrop-blur-xl flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 dark:text-indigo-400 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base">
            Loading realtime analytics...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/80 via-indigo-50/80 to-cyan-50/80 dark:from-slate-900/80 dark:via-slate-800/80 dark:to-gray-900/80 backdrop-blur-xl">
      <div className="w-full px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 lg:mb-8">
            <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0 mb-6">
              <div className="text-center lg:text-left">
                <h1 className="text-2xl lg:text-3xl font-bold text-slate-800 dark:text-white mb-2">
                  Real-time Analytics
                </h1>
                <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base">
                  Live system performance and activity monitoring
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-3 justify-center lg:justify-end">
                <div className="flex items-center gap-3">
                  <Label className="text-sm text-slate-600 dark:text-slate-300 whitespace-nowrap">
                    Auto-refresh
                  </Label>
                  <Button
                    onClick={handleAutoRefreshToggle}
                    variant={autoRefresh ? "default" : "outline"}
                    size="sm"
                    className={`h-9 px-4 ${
                      autoRefresh
                        ? "bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-white"
                        : "bg-white/30 dark:bg-slate-700/30 backdrop-blur-sm border border-white/50 dark:border-slate-700/50 hover:bg-white/50 dark:hover:bg-slate-700/50 text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    <Clock className="w-4 h-4 mr-2" />
                    {autoRefresh ? "ON" : "OFF"}
                  </Button>
                </div>
                <Button
                  onClick={handleRefresh}
                  disabled={loading}
                  variant="ghost"
                  size="sm"
                  className="h-9 px-4 bg-white/30 dark:bg-slate-700/30 backdrop-blur-sm border border-white/50 dark:border-slate-700/50 hover:bg-white/50 dark:hover:bg-slate-700/50 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400"
                >
                  <RefreshCw
                    className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
                  />
                  Refresh
                </Button>
              </div>
            </div>

            {error && (
              <Alert className="bg-red-50/50 dark:bg-red-900/20 border border-red-200/50 dark:border-red-800/50 backdrop-blur-sm rounded-lg mb-6">
                <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                <AlertDescription className="text-red-700 dark:text-red-400 text-sm">
                  {error}
                </AlertDescription>
              </Alert>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-6 lg:mb-8">
            <StatCard
              title="Active Users"
              value={formatNumber(realtimeStats?.live?.activeUsers || 0)}
              icon={Users}
              loading={realtimeStatsLoading}
              subtitle="Currently online"
            />
            <StatCard
              title="Active Sessions"
              value={formatNumber(realtimeStats?.live?.activeSessions || 0)}
              icon={Activity}
              loading={realtimeStatsLoading}
              subtitle="Live sessions"
            />
            <StatCard
              title="Online Instructors"
              value={formatNumber(realtimeStats?.live?.onlineInstructors || 0)}
              icon={UserPlus}
              loading={realtimeStatsLoading}
              subtitle="Available now"
            />
            <StatCard
              title="Session Duration"
              value={formatTime(realtimeStats?.live?.avgSessionDuration || 0)}
              icon={Clock}
              loading={realtimeStatsLoading}
              subtitle="Average time"
            />
            <StatCard
              title="System Status"
              value={realtimeStats?.systemHealth?.systemStatus || "unknown"}
              icon={Shield}
              loading={realtimeStatsLoading}
              status={realtimeStats?.systemHealth?.systemStatus}
              subtitle="Overall health"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 lg:mb-8">
            <StatCard
              title="New Signups"
              value={formatNumber(realtimeStats?.today?.newSignups || 0)}
              icon={UserPlus}
              loading={realtimeStatsLoading}
              subtitle="Today"
            />
            <StatCard
              title="New Enrollments"
              value={formatNumber(realtimeStats?.today?.newEnrollments || 0)}
              icon={BookOpen}
              loading={realtimeStatsLoading}
              subtitle="Today"
            />
            <StatCard
              title="Payments"
              value={formatNumber(realtimeStats?.today?.totalPayments || 0)}
              icon={CreditCard}
              loading={realtimeStatsLoading}
              subtitle="Today"
            />
            <StatCard
              title="Revenue"
              value={formatCurrency(realtimeStats?.today?.revenueToday || 0)}
              icon={DollarSign}
              loading={realtimeStatsLoading}
              subtitle="Today"
            />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6 lg:mb-8">
            <Card className="bg-white/30 dark:bg-slate-700/30 backdrop-blur-sm border border-white/50 dark:border-slate-700/50 shadow-lg rounded-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold text-slate-800 dark:text-white flex items-center">
                  <Shield className="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  System Health
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {realtimeStatsLoading ? (
                  <div className="flex items-center justify-center h-40">
                    <Loader2 className="w-6 h-6 animate-spin text-indigo-600 dark:text-indigo-400" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-4 bg-white/20 dark:bg-slate-800/30 backdrop-blur-sm rounded-lg border border-white/30 dark:border-slate-600/30">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-sm font-medium text-slate-800 dark:text-white leading-tight">
                            Pending Payments
                          </span>
                          <Badge className="bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 text-xs px-2 py-1 rounded-md shrink-0">
                            {realtimeStats?.systemHealth?.pendingPayments || 0}
                          </Badge>
                        </div>
                      </div>
                      <div className="p-4 bg-white/20 dark:bg-slate-800/30 backdrop-blur-sm rounded-lg border border-white/30 dark:border-slate-600/30">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-sm font-medium text-slate-800 dark:text-white leading-tight">
                            Failed Payments
                          </span>
                          <Badge className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 text-xs px-2 py-1 rounded-md shrink-0">
                            {realtimeStats?.systemHealth?.failedPayments || 0}
                          </Badge>
                        </div>
                      </div>
                      <div className="p-4 bg-white/20 dark:bg-slate-800/30 backdrop-blur-sm rounded-lg border border-white/30 dark:border-slate-600/30">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-sm font-medium text-slate-800 dark:text-white leading-tight">
                            Courses Under Review
                          </span>
                          <Badge className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs px-2 py-1 rounded-md shrink-0">
                            {realtimeStats?.systemHealth?.coursesUnderReview ||
                              0}
                          </Badge>
                        </div>
                      </div>
                      <div className="p-4 bg-white/20 dark:bg-slate-800/30 backdrop-blur-sm rounded-lg border border-white/30 dark:border-slate-600/30">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-sm font-medium text-slate-800 dark:text-white leading-tight">
                            Support Tickets
                          </span>
                          <Badge className="bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 text-xs px-2 py-1 rounded-md shrink-0">
                            {realtimeStats?.systemHealth?.openSupportTickets ||
                              0}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 bg-white/20 dark:bg-slate-800/30 backdrop-blur-sm rounded-lg border border-white/30 dark:border-slate-600/30">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium text-slate-800 dark:text-white leading-tight">
                          Overall System Status
                        </span>
                        <Badge
                          className={`text-xs px-2 py-1 rounded-md shrink-0 ${getSystemStatusColor(
                            realtimeStats?.systemHealth?.systemStatus
                          )}`}
                        >
                          {realtimeStats?.systemHealth?.systemStatus ||
                            "unknown"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-white/30 dark:bg-slate-700/30 backdrop-blur-sm border border-white/50 dark:border-slate-700/50 shadow-lg rounded-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold text-slate-800 dark:text-white flex items-center">
                  <Bell className="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  System Alerts
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 flex-col justify-center">
                {realtimeStatsLoading ? (
                  <div className="flex items-center justify-center h-40">
                    <Loader2 className="w-6 h-6 animate-spin text-indigo-600 dark:text-indigo-400" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {(realtimeStats?.alerts || []).map((alert, index) => (
                      <Alert
                        key={index}
                        className={`${getAlertColor(
                          alert.type
                        )} backdrop-blur-sm rounded-lg`}
                      >
                        <div className="flex flex-col items-start gap-4 w-full">
                          {getAlertIcon(alert.type)}
                          <div className="">
                            <AlertDescription className="w-sm">
                              {alert.message}
                            </AlertDescription>
                          </div>
                          <Badge
                            className={`text-xs px-2 py-1 rounded-md shrink-0 ${
                              alert.priority === "high"
                                ? "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300"
                                : alert.priority === "medium"
                                ? "bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300"
                                : "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                            }`}
                          >
                            {alert.priority}
                          </Badge>
                        </div>
                      </Alert>
                    ))}
                    {(!realtimeStats?.alerts ||
                      realtimeStats.alerts.length === 0) && (
                      <div className="text-center py-8 text-slate-600 dark:text-slate-300 text-sm flex items-center justify-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                        No active alerts
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="bg-white/30 dark:bg-slate-700/30 backdrop-blur-sm border border-white/50 dark:border-slate-700/50 shadow-lg rounded-lg mb-6 lg:mb-8">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold text-slate-800 dark:text-white flex items-center">
                <Activity className="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400 shrink-0" />
                Recent Activity
              </CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-300 text-sm">
                Live user actions and system events
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              {realtimeStatsLoading ? (
                <div className="flex items-center justify-center h-40">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-600 dark:text-indigo-400" />
                </div>
              ) : (
                <div className="space-y-4">
                  {(realtimeStats?.recentActivity || [])
                    .slice(0, 10)
                    .map((activity, index) => (
                      <div
                        key={index}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-white/20 dark:bg-slate-800/30 backdrop-blur-sm rounded-lg border border-white/30 dark:border-slate-600/30 gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg shrink-0">
                            <Eye className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-slate-800 dark:text-white leading-tight mb-1 truncate">
                              {activity.action}
                            </p>
                            <p className="text-xs text-slate-600 dark:text-slate-300 leading-tight truncate">
                              {activity.user} • {activity.role}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 shrink-0 self-start sm:self-center">
                          <Clock className="w-3 h-3" />
                          <span className="whitespace-nowrap">
                            {getTimeAgo(activity.timeAgo)}
                          </span>
                        </div>
                      </div>
                    ))}
                  {(!realtimeStats?.recentActivity ||
                    realtimeStats.recentActivity.length === 0) && (
                    <div className="text-center py-8 text-slate-600 dark:text-slate-300 text-sm">
                      No recent activity
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 lg:mb-8">
            <Card className="bg-white/30 dark:bg-slate-700/30 backdrop-blur-sm border border-white/50 dark:border-slate-700/50 shadow-lg rounded-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold text-slate-800 dark:text-white flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  Live Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {realtimeStatsLoading ? (
                  <div className="flex items-center justify-center h-40">
                    <Loader2 className="w-6 h-6 animate-spin text-indigo-600 dark:text-indigo-400" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 bg-white/20 dark:bg-slate-800/30 backdrop-blur-sm rounded-lg border border-white/30 dark:border-slate-600/30">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-sm font-medium text-slate-800 dark:text-white leading-tight">
                          Very Active Sessions
                        </span>
                        <Badge className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-xs px-2 py-1 rounded-md shrink-0">
                          {realtimeStats?.live?.veryActiveSessions || 0}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-tight">
                        Sessions active in last 5 minutes
                      </p>
                    </div>
                    <div className="p-4 bg-white/20 dark:bg-slate-800/30 backdrop-blur-sm rounded-lg border border-white/30 dark:border-slate-600/30">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-sm font-medium text-slate-800 dark:text-white leading-tight">
                          New Notifications
                        </span>
                        <Badge className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs px-2 py-1 rounded-md shrink-0">
                          {realtimeStats?.today?.newNotifications || 0}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-tight">
                        Notifications sent today
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-white/30 dark:bg-slate-700/30 backdrop-blur-sm border border-white/50 dark:border-slate-700/50 shadow-lg rounded-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold text-slate-800 dark:text-white flex items-center">
                  <Settings className="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  System Information
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {realtimeStatsLoading ? (
                  <div className="flex items-center justify-center h-40">
                    <Loader2 className="w-6 h-6 animate-spin text-indigo-600 dark:text-indigo-400" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 bg-white/20 dark:bg-slate-800/30 backdrop-blur-sm rounded-lg border border-white/30 dark:border-slate-600/30">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-sm font-medium text-slate-800 dark:text-white leading-tight">
                          Auto Refresh
                        </span>
                        <Badge
                          className={`text-xs px-2 py-1 rounded-md shrink-0 ${
                            autoRefresh
                              ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                              : "bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300"
                          }`}
                        >
                          {autoRefresh ? "ON" : "OFF"}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-tight">
                        Updates every 30 seconds
                      </p>
                    </div>
                    <div className="p-4 bg-white/20 dark:bg-slate-800/30 backdrop-blur-sm rounded-lg border border-white/30 dark:border-slate-600/30">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-sm font-medium text-slate-800 dark:text-white leading-tight">
                          Last Updated
                        </span>
                        <span className="text-xs text-slate-600 dark:text-slate-300 shrink-0">
                          {realtimeStats?.lastUpdated
                            ? new Date(
                                realtimeStats.lastUpdated
                              ).toLocaleTimeString()
                            : "Never"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-tight">
                        Data freshness indicator
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="text-center text-sm text-slate-600 dark:text-slate-300">
            Last updated:{" "}
            {realtimeStats?.lastUpdated
              ? new Date(realtimeStats.lastUpdated).toLocaleString()
              : "Never"}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealtimeAnalytics;
