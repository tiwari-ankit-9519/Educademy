import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import useSocket from "@/hooks/useSocket";
import { getSystemHealth, clearError } from "@/features/adminSlice/adminSystem";
import {
  Activity,
  Database,
  Server,
  Users,
  BookOpen,
  UserCheck,
  Wifi,
  Cpu,
  HardDrive,
  Clock,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Zap,
  Globe,
  Monitor,
  MemoryStick,
  Timer,
  TrendingUp,
  Shield,
  Heart,
} from "lucide-react";

const SystemHealthPage = () => {
  const dispatch = useDispatch();
  const { systemHealth, systemHealthLoading, error } = useSelector(
    (state) => state.adminSystem
  );

  const { isConnected } = useSocket();
  const [lastRefresh, setLastRefresh] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    loadSystemHealth();
    const interval = setInterval(() => {
      if (autoRefresh) {
        loadSystemHealth();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const loadSystemHealth = () => {
    dispatch(getSystemHealth());
    setLastRefresh(new Date());
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "healthy":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      case "degraded":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
      case "unhealthy":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "healthy":
        return <CheckCircle className="w-4 h-4" />;
      case "degraded":
        return <AlertTriangle className="w-4 h-4" />;
      case "unhealthy":
        return <XCircle className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const formatUptime = (seconds) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    }
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  if (systemHealthLoading && !systemHealth) {
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-2xl" />
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[...Array(2)].map((_, i) => (
                <Skeleton key={i} className="h-96 rounded-2xl" />
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
            <div className="p-3 bg-gradient-to-br from-emerald-500 to-green-500 rounded-2xl shadow-lg shadow-emerald-300/30 dark:shadow-emerald-500/20">
              <Heart className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-800 dark:text-white">
                System Health
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Monitor system performance and service status
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Badge
              variant={isConnected ? "default" : "destructive"}
              className="rounded-xl shadow-sm"
            >
              <Wifi className="w-3 h-3 mr-1" />
              {isConnected ? "Connected" : "Disconnected"}
            </Badge>

            {systemHealth && (
              <Badge
                className={cn(
                  "rounded-xl shadow-sm",
                  getStatusColor(systemHealth.status)
                )}
              >
                {getStatusIcon(systemHealth.status)}
                <span className="ml-1 capitalize">{systemHealth.status}</span>
              </Badge>
            )}

            <Button
              variant="outline"
              onClick={loadSystemHealth}
              disabled={systemHealthLoading}
              className="rounded-xl border-white/50 dark:border-slate-700/50 bg-white/30 dark:bg-slate-800/30 backdrop-blur-sm hover:bg-white/50 dark:hover:bg-slate-700/50"
            >
              <RefreshCw
                className={cn(
                  "w-4 h-4 mr-2",
                  systemHealthLoading && "animate-spin"
                )}
              />
              Refresh
            </Button>

            <Button
              variant={autoRefresh ? "default" : "outline"}
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={cn(
                "rounded-xl",
                autoRefresh
                  ? "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg shadow-green-300/30 dark:shadow-green-500/20"
                  : "border-white/50 dark:border-slate-700/50 bg-white/30 dark:bg-slate-800/30 backdrop-blur-sm hover:bg-white/50 dark:hover:bg-slate-700/50"
              )}
            >
              <Zap className="w-4 h-4 mr-2" />
              Auto Refresh
            </Button>
          </div>
        </div>

        {lastRefresh && (
          <div className="mb-6">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Last updated: {formatDistanceToNow(lastRefresh)} ago
            </p>
          </div>
        )}

        {systemHealth && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 shadow-xl rounded-2xl">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 dark:via-slate-700/10 to-transparent rounded-2xl"></div>
                <CardContent className="p-6 relative">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        Total Users
                      </p>
                      <p className="text-2xl font-bold text-slate-800 dark:text-white">
                        {systemHealth.platform.totalUsers.toLocaleString()}
                      </p>
                    </div>
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-lg">
                      <Users className="w-5 h-5 text-white" />
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
                        Total Courses
                      </p>
                      <p className="text-2xl font-bold text-slate-800 dark:text-white">
                        {systemHealth.platform.totalCourses.toLocaleString()}
                      </p>
                    </div>
                    <div className="p-2 bg-gradient-to-br from-purple-500 to-violet-500 rounded-lg shadow-lg">
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
                        Enrollments
                      </p>
                      <p className="text-2xl font-bold text-slate-800 dark:text-white">
                        {systemHealth.platform.totalEnrollments.toLocaleString()}
                      </p>
                    </div>
                    <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg shadow-lg">
                      <UserCheck className="w-5 h-5 text-white" />
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
                        Active Sessions
                      </p>
                      <p className="text-2xl font-bold text-slate-800 dark:text-white">
                        {systemHealth.platform.activeSessions.toLocaleString()}
                      </p>
                    </div>
                    <div className="p-2 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg shadow-lg">
                      <Activity className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 shadow-xl rounded-2xl">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 dark:via-slate-700/10 to-transparent rounded-2xl"></div>
                <CardHeader className="pb-6 relative">
                  <CardTitle className="text-slate-800 dark:text-white flex items-center">
                    <Server className="w-5 h-5 mr-2" />
                    Services Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-white/30 dark:bg-slate-700/30 backdrop-blur-sm rounded-xl">
                      <div className="flex items-center space-x-3">
                        <Database className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                        <div>
                          <p className="font-medium text-slate-800 dark:text-white">
                            Database
                          </p>
                          {systemHealth.services.database.responseTime && (
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              Response:{" "}
                              {systemHealth.services.database.responseTime}ms
                            </p>
                          )}
                        </div>
                      </div>
                      <Badge
                        className={cn(
                          "rounded-lg shadow-sm",
                          getStatusColor(systemHealth.services.database.status)
                        )}
                      >
                        {getStatusIcon(systemHealth.services.database.status)}
                        <span className="ml-1 capitalize">
                          {systemHealth.services.database.status}
                        </span>
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-white/30 dark:bg-slate-700/30 backdrop-blur-sm rounded-xl">
                      <div className="flex items-center space-x-3">
                        <HardDrive className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                        <div>
                          <p className="font-medium text-slate-800 dark:text-white">
                            Redis Cache
                          </p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            Connected:{" "}
                            {systemHealth.services.redis.connected
                              ? "Yes"
                              : "No"}
                          </p>
                        </div>
                      </div>
                      <Badge
                        className={cn(
                          "rounded-lg shadow-sm",
                          getStatusColor(systemHealth.services.redis.status)
                        )}
                      >
                        {getStatusIcon(systemHealth.services.redis.status)}
                        <span className="ml-1 capitalize">
                          {systemHealth.services.redis.status}
                        </span>
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-white/30 dark:bg-slate-700/30 backdrop-blur-sm rounded-xl">
                      <div className="flex items-center space-x-3">
                        <Globe className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                        <div>
                          <p className="font-medium text-slate-800 dark:text-white">
                            Application
                          </p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            Uptime:{" "}
                            {formatUptime(
                              systemHealth.services.application.uptime
                            )}
                          </p>
                        </div>
                      </div>
                      <Badge
                        className={cn(
                          "rounded-lg shadow-sm",
                          getStatusColor("healthy")
                        )}
                      >
                        {getStatusIcon("healthy")}
                        <span className="ml-1">Healthy</span>
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 shadow-xl rounded-2xl">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 dark:via-slate-700/10 to-transparent rounded-2xl"></div>
                <CardHeader className="pb-6 relative">
                  <CardTitle className="text-slate-800 dark:text-white flex items-center">
                    <Monitor className="w-5 h-5 mr-2" />
                    System Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-white/30 dark:bg-slate-700/30 backdrop-blur-sm rounded-xl">
                      <div className="flex items-center space-x-3">
                        <MemoryStick className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                        <div>
                          <p className="font-medium text-slate-800 dark:text-white">
                            Memory Usage
                          </p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            {systemHealth.services.application.memory.used} MB /{" "}
                            {systemHealth.services.application.memory.total} MB
                          </p>
                        </div>
                      </div>
                      <Badge
                        className={cn(
                          "rounded-lg shadow-sm",
                          systemHealth.services.application.memory.usage < 80
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                            : systemHealth.services.application.memory.usage <
                              90
                            ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                            : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                        )}
                      >
                        {systemHealth.services.application.memory.usage}%
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-white/30 dark:bg-slate-700/30 backdrop-blur-sm rounded-xl">
                      <div className="flex items-center space-x-3">
                        <Clock className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                        <div>
                          <p className="font-medium text-slate-800 dark:text-white">
                            Uptime
                          </p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            {formatUptime(systemHealth.system.uptime)}
                          </p>
                        </div>
                      </div>
                      <Badge className="rounded-lg shadow-sm bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                        <Activity className="w-3 h-3 mr-1" />
                        Running
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-white/30 dark:bg-slate-700/30 backdrop-blur-sm rounded-xl">
                      <div className="flex items-center space-x-3">
                        <Shield className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                        <div>
                          <p className="font-medium text-slate-800 dark:text-white">
                            Environment
                          </p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            Version: {systemHealth.system.version}
                          </p>
                        </div>
                      </div>
                      <Badge className="rounded-lg shadow-sm bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                        {systemHealth.system.environment}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 shadow-xl rounded-2xl">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 dark:via-slate-700/10 to-transparent rounded-2xl"></div>
              <CardHeader className="pb-6 relative">
                <CardTitle className="text-slate-800 dark:text-white flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  Health Checks
                </CardTitle>
              </CardHeader>
              <CardContent className="relative">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {Object.entries(systemHealth.checks).map(
                    ([check, status]) => (
                      <div
                        key={check}
                        className="flex items-center justify-between p-4 bg-white/30 dark:bg-slate-700/30 backdrop-blur-sm rounded-xl"
                      >
                        <div>
                          <p className="font-medium text-slate-800 dark:text-white capitalize">
                            {check.replace(/([A-Z])/g, " $1").trim()}
                          </p>
                        </div>
                        <Badge
                          className={cn(
                            "rounded-lg shadow-sm",
                            status
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                              : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                          )}
                        >
                          {status ? (
                            <CheckCircle className="w-3 h-3 mr-1" />
                          ) : (
                            <XCircle className="w-3 h-3 mr-1" />
                          )}
                          {status ? "Pass" : "Fail"}
                        </Badge>
                      </div>
                    )
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {!systemHealth && !systemHealthLoading && (
          <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 shadow-xl rounded-2xl">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 dark:via-slate-700/10 to-transparent rounded-2xl"></div>
            <CardContent className="p-12 text-center relative">
              <Heart className="w-12 h-12 mx-auto text-slate-400 mb-4 opacity-50" />
              <p className="text-slate-600 dark:text-slate-400">
                Unable to load system health data
              </p>
              <Button
                onClick={loadSystemHealth}
                className="mt-4 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-white shadow-lg"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SystemHealthPage;
