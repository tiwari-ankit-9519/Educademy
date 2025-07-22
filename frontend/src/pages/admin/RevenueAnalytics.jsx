/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Activity,
  RefreshCw,
  BarChart3,
  PieChart,
  CreditCard,
  Users,
  Globe,
  Calendar,
  Target,
  Award,
  Percent,
  ArrowUpRight,
  ArrowDownRight,
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
  getRevenueAnalytics,
  clearError,
} from "@/features/adminSlice/adminAnalytics";

const RevenueAnalytics = () => {
  const { theme } = useTheme();
  const dispatch = useDispatch();
  const adminAnalyticsState = useSelector(
    (state) => state.adminAnalytics || {}
  );

  const { revenueAnalytics, error, loading, revenueAnalyticsLoading } =
    adminAnalyticsState;

  const [selectedPeriod, setSelectedPeriod] = useState("30d");
  const [selectedGroupBy, setSelectedGroupBy] = useState("day");
  const [selectedCurrency, setSelectedCurrency] = useState("INR");

  const loadRevenueAnalytics = useCallback(() => {
    const params = {
      period: selectedPeriod,
      groupBy: selectedGroupBy,
      currency: selectedCurrency,
    };
    dispatch(getRevenueAnalytics(params));
  }, [dispatch, selectedPeriod, selectedGroupBy, selectedCurrency]);

  useEffect(() => {
    dispatch(clearError());
    loadRevenueAnalytics();
  }, [dispatch, loadRevenueAnalytics]);

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  const handleRefresh = () => {
    loadRevenueAnalytics();
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num?.toString() || "0";
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: selectedCurrency || "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
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
    subtitle,
    growth,
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
              {growth !== undefined && (
                <div className="flex items-center space-x-1">
                  {getGrowthIcon(growth)}
                  <span
                    className={`text-xs sm:text-sm font-medium ${getGrowthColor(
                      growth
                    )}`}
                  >
                    {growth > 0 ? "+" : ""}
                    {growth}%
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
              {entry.name}:{" "}
              {typeof entry.value === "number" && entry.value > 1000
                ? formatCurrency(entry.value)
                : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const getRevenueGrowth = () => {
    const trends = revenueAnalytics?.forecasting?.recentTrends || [];
    if (trends.length < 2) return 0;
    return parseFloat(trends[0]?.weekOverWeekGrowth || 0);
  };

  if (!adminAnalyticsState) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50/80 via-indigo-50/80 to-cyan-50/80 dark:from-slate-900/80 dark:via-slate-800/80 dark:to-gray-900/80 backdrop-blur-xl flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-indigo-600 dark:text-indigo-400 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base">
            Loading revenue analytics...
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
                Revenue Analytics
              </h1>
              <p className="text-slate-600 dark:text-slate-300 mt-1 text-sm sm:text-base">
                Comprehensive revenue insights and financial performance metrics
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
                Currency:
              </Label>
              <Select
                value={selectedCurrency}
                onValueChange={setSelectedCurrency}
              >
                <SelectTrigger className="w-20 sm:w-24 bg-white/30 dark:bg-slate-700/30 backdrop-blur-sm border border-white/50 dark:border-slate-700/50 rounded-xl text-xs sm:text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 rounded-xl">
                  <SelectItem value="INR">INR</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
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

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
          <StatCard
            title="Total Revenue"
            value={formatCurrency(
              revenueAnalytics?.overview?.totalRevenue || 0
            )}
            icon={DollarSign}
            loading={revenueAnalyticsLoading}
            growth={getRevenueGrowth()}
            subtitle="Gross revenue"
          />
          <StatCard
            title="Transactions"
            value={formatNumber(
              revenueAnalytics?.overview?.totalTransactions || 0
            )}
            icon={CreditCard}
            loading={revenueAnalyticsLoading}
            subtitle="Completed payments"
          />
          <StatCard
            title="Avg Transaction"
            value={formatCurrency(
              revenueAnalytics?.overview?.avgTransactionValue || 0
            )}
            icon={Target}
            loading={revenueAnalyticsLoading}
            subtitle="Per transaction"
          />
          <StatCard
            title="Total Discounts"
            value={formatCurrency(
              revenueAnalytics?.overview?.totalDiscounts || 0
            )}
            icon={Percent}
            loading={revenueAnalyticsLoading}
            subtitle="Discount amount"
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card className="bg-white/30 dark:bg-slate-700/30 backdrop-blur-sm border border-white/50 dark:border-slate-700/50 shadow-lg rounded-xl">
            <CardHeader className="pb-2 sm:pb-4">
              <CardTitle className="text-base sm:text-lg font-semibold text-slate-800 dark:text-white flex items-center">
                <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-indigo-600 dark:text-indigo-400" />
                Revenue Trends
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {revenueAnalyticsLoading ? (
                <div className="flex items-center justify-center h-48 sm:h-64">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-600 dark:text-indigo-400" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={revenueAnalytics?.trends || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={formatDate}
                      stroke="#64748b"
                      fontSize={12}
                    />
                    <YAxis stroke="#64748b" fontSize={12} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="totalRevenue"
                      stackId="1"
                      stroke="#6366f1"
                      fill="#6366f1"
                      fillOpacity={0.6}
                      name="Total Revenue"
                    />
                    <Area
                      type="monotone"
                      dataKey="discounts"
                      stackId="1"
                      stroke="#ef4444"
                      fill="#ef4444"
                      fillOpacity={0.6}
                      name="Discounts"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white/30 dark:bg-slate-700/30 backdrop-blur-sm border border-white/50 dark:border-slate-700/50 shadow-lg rounded-xl">
            <CardHeader className="pb-2 sm:pb-4">
              <CardTitle className="text-base sm:text-lg font-semibold text-slate-800 dark:text-white flex items-center">
                <PieChart className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-indigo-600 dark:text-indigo-400" />
                Category Revenue
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {revenueAnalyticsLoading ? (
                <div className="flex items-center justify-center h-48 sm:h-64">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-600 dark:text-indigo-400" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <RechartsPieChart>
                    <Pie
                      data={revenueAnalytics?.categoryBreakdown || []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ category, percent }) =>
                        `${category} ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="revenue"
                    >
                      {(revenueAnalytics?.categoryBreakdown || []).map(
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
                <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-indigo-600 dark:text-indigo-400" />
                Payment Methods
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {revenueAnalyticsLoading ? (
                <div className="flex items-center justify-center h-48 sm:h-64">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-600 dark:text-indigo-400" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={revenueAnalytics?.paymentMethods || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="method" stroke="#64748b" fontSize={10} />
                    <YAxis stroke="#64748b" fontSize={12} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar
                      dataKey="totalAmount"
                      fill="#6366f1"
                      name="Total Amount"
                    />
                    <Bar
                      dataKey="transactions"
                      fill="#10b981"
                      name="Transactions"
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white/30 dark:bg-slate-700/30 backdrop-blur-sm border border-white/50 dark:border-slate-700/50 shadow-lg rounded-xl">
            <CardHeader className="pb-2 sm:pb-4">
              <CardTitle className="text-base sm:text-lg font-semibold text-slate-800 dark:text-white flex items-center">
                <Globe className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-indigo-600 dark:text-indigo-400" />
                Geographic Revenue
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {revenueAnalyticsLoading ? (
                <div className="flex items-center justify-center h-48 sm:h-64">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-600 dark:text-indigo-400" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={revenueAnalytics?.geographic || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="country" stroke="#64748b" fontSize={10} />
                    <YAxis stroke="#64748b" fontSize={12} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="revenue" fill="#6366f1" name="Revenue" />
                    <Bar
                      dataKey="transactions"
                      fill="#8b5cf6"
                      name="Transactions"
                    />
                  </BarChart>
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
                Top Instructors by Revenue
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {revenueAnalyticsLoading ? (
                <div className="flex items-center justify-center h-48 sm:h-64">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-600 dark:text-indigo-400" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart
                    data={
                      revenueAnalytics?.instructorRevenue?.slice(0, 5) || []
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
                      dataKey="grossRevenue"
                      fill="#6366f1"
                      name="Gross Revenue"
                    />
                    <Bar
                      dataKey="instructorEarnings"
                      fill="#10b981"
                      name="Instructor Earnings"
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
              {revenueAnalyticsLoading ? (
                <div className="flex items-center justify-center h-48 sm:h-64">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-600 dark:text-indigo-400" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={revenueAnalytics?.seasonality || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                    <YAxis stroke="#64748b" fontSize={12} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#6366f1"
                      strokeWidth={2}
                      name="Revenue"
                    />
                    <Line
                      type="monotone"
                      dataKey="transactions"
                      stroke="#10b981"
                      strokeWidth={2}
                      name="Transactions"
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
                <Users className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-indigo-600 dark:text-indigo-400" />
                Customer Lifetime Value
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {revenueAnalyticsLoading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-600 dark:text-indigo-400" />
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  <div className="p-3 bg-white/20 dark:bg-slate-800/30 backdrop-blur-sm rounded-xl border border-white/30 dark:border-slate-600/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs sm:text-sm font-medium text-slate-800 dark:text-white">
                        Avg CLV
                      </span>
                      <span className="text-sm font-bold text-slate-800 dark:text-white">
                        {formatCurrency(
                          revenueAnalytics?.customerLifetimeValue?.overview
                            ?.avgLifetimeValue || 0
                        )}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      Avg Purchases:{" "}
                      {revenueAnalytics?.customerLifetimeValue?.overview
                        ?.avgPurchaseCount || 0}
                    </p>
                  </div>
                  {(
                    revenueAnalytics?.customerLifetimeValue?.segments || []
                  ).map((segment, index) => (
                    <div
                      key={index}
                      className="p-3 bg-white/20 dark:bg-slate-800/30 backdrop-blur-sm rounded-xl border border-white/30 dark:border-slate-600/30"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs sm:text-sm font-medium text-slate-800 dark:text-white">
                          {segment.segment}
                        </span>
                        <Badge className="bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs">
                          {segment.customers}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300">
                        Avg: {formatCurrency(segment.avgSpent)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white/30 dark:bg-slate-700/30 backdrop-blur-sm border border-white/50 dark:border-slate-700/50 shadow-lg rounded-xl">
            <CardHeader className="pb-2 sm:pb-4">
              <CardTitle className="text-base sm:text-lg font-semibold text-slate-800 dark:text-white flex items-center">
                <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-indigo-600 dark:text-indigo-400" />
                Refunds & Returns
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {revenueAnalyticsLoading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-600 dark:text-indigo-400" />
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  <div className="p-3 bg-white/20 dark:bg-slate-800/30 backdrop-blur-sm rounded-xl border border-white/30 dark:border-slate-600/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs sm:text-sm font-medium text-slate-800 dark:text-white">
                        Total Refunds
                      </span>
                      <span className="text-sm font-bold text-slate-800 dark:text-white">
                        {revenueAnalytics?.refunds?.totalRefunds || 0}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      Amount:{" "}
                      {formatCurrency(
                        revenueAnalytics?.refunds?.totalRefundAmount || 0
                      )}
                    </p>
                  </div>
                  <div className="p-3 bg-white/20 dark:bg-slate-800/30 backdrop-blur-sm rounded-xl border border-white/30 dark:border-slate-600/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs sm:text-sm font-medium text-slate-800 dark:text-white">
                        Refund Rate
                      </span>
                      <Badge
                        className={`rounded-lg text-xs ${
                          parseFloat(
                            revenueAnalytics?.refunds?.refundRate || 0
                          ) > 5
                            ? "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300"
                            : "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                        }`}
                      >
                        {revenueAnalytics?.refunds?.refundRate || 0}%
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      Avg:{" "}
                      {formatCurrency(
                        revenueAnalytics?.refunds?.avgRefundAmount || 0
                      )}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white/30 dark:bg-slate-700/30 backdrop-blur-sm border border-white/50 dark:border-slate-700/50 shadow-lg rounded-xl">
            <CardHeader className="pb-2 sm:pb-4">
              <CardTitle className="text-base sm:text-lg font-semibold text-slate-800 dark:text-white flex items-center">
                <Percent className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-indigo-600 dark:text-indigo-400" />
                Commission Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {revenueAnalyticsLoading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-600 dark:text-indigo-400" />
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  <div className="p-3 bg-white/20 dark:bg-slate-800/30 backdrop-blur-sm rounded-xl border border-white/30 dark:border-slate-600/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs sm:text-sm font-medium text-slate-800 dark:text-white">
                        Instructor Earnings
                      </span>
                      <span className="text-sm font-bold text-slate-800 dark:text-white">
                        {formatCurrency(
                          revenueAnalytics?.commissions
                            ?.totalInstructorEarnings || 0
                        )}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      Total Payouts:{" "}
                      {revenueAnalytics?.commissions?.totalPayouts || 0}
                    </p>
                  </div>
                  <div className="p-3 bg-white/20 dark:bg-slate-800/30 backdrop-blur-sm rounded-xl border border-white/30 dark:border-slate-600/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs sm:text-sm font-medium text-slate-800 dark:text-white">
                        Platform Commission
                      </span>
                      <span className="text-sm font-bold text-slate-800 dark:text-white">
                        {formatCurrency(
                          revenueAnalytics?.commissions
                            ?.totalPlatformCommission || 0
                        )}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      Avg per Sale:{" "}
                      {formatCurrency(
                        revenueAnalytics?.commissions?.avgCommissionPerSale || 0
                      )}
                    </p>
                  </div>
                  <div className="p-3 bg-white/20 dark:bg-slate-800/30 backdrop-blur-sm rounded-xl border border-white/30 dark:border-slate-600/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs sm:text-sm font-medium text-slate-800 dark:text-white">
                        Platform Fees
                      </span>
                      <span className="text-sm font-bold text-slate-800 dark:text-white">
                        {formatCurrency(
                          revenueAnalytics?.commissions?.totalPlatformFees || 0
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="bg-white/30 dark:bg-slate-700/30 backdrop-blur-sm border border-white/50 dark:border-slate-700/50 shadow-lg rounded-xl mb-6 sm:mb-8">
          <CardHeader className="pb-2 sm:pb-4">
            <CardTitle className="text-base sm:text-lg font-semibold text-slate-800 dark:text-white flex items-center">
              <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-indigo-600 dark:text-indigo-400" />
              Revenue Growth Forecast
            </CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-300 text-sm">
              Recent performance trends and growth indicators
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            {revenueAnalyticsLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-600 dark:text-indigo-400" />
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {(revenueAnalytics?.forecasting?.recentTrends || [])
                  .slice(0, 5)
                  .map((trend, index) => (
                    <div
                      key={index}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-white/20 dark:bg-slate-800/30 backdrop-blur-sm rounded-xl border border-white/30 dark:border-slate-600/30 space-y-2 sm:space-y-0"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3">
                          <span className="text-sm font-medium text-slate-800 dark:text-white">
                            {formatDate(trend.date)}
                          </span>
                          <span className="text-sm text-slate-600 dark:text-slate-300">
                            {formatCurrency(trend.revenue)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4 text-xs sm:text-sm">
                        {trend.weekOverWeekGrowth && (
                          <div className="flex items-center space-x-1">
                            {parseFloat(trend.weekOverWeekGrowth) > 0 ? (
                              <ArrowUpRight className="w-3 h-3 text-green-500" />
                            ) : (
                              <ArrowDownRight className="w-3 h-3 text-red-500" />
                            )}
                            <span
                              className={`font-medium ${
                                parseFloat(trend.weekOverWeekGrowth) > 0
                                  ? "text-green-600 dark:text-green-400"
                                  : "text-red-600 dark:text-red-400"
                              }`}
                            >
                              {trend.weekOverWeekGrowth}% WoW
                            </span>
                          </div>
                        )}
                        {trend.monthOverMonthGrowth && (
                          <div className="flex items-center space-x-1">
                            {parseFloat(trend.monthOverMonthGrowth) > 0 ? (
                              <ArrowUpRight className="w-3 h-3 text-green-500" />
                            ) : (
                              <ArrowDownRight className="w-3 h-3 text-red-500" />
                            )}
                            <span
                              className={`font-medium ${
                                parseFloat(trend.monthOverMonthGrowth) > 0
                                  ? "text-green-600 dark:text-green-400"
                                  : "text-red-600 dark:text-red-400"
                              }`}
                            >
                              {trend.monthOverMonthGrowth}% MoM
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                {(!revenueAnalytics?.forecasting?.recentTrends ||
                  revenueAnalytics.forecasting.recentTrends.length === 0) && (
                  <div className="text-center py-8 text-slate-600 dark:text-slate-300 text-sm">
                    No forecast data available
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="text-center text-xs sm:text-sm text-slate-600 dark:text-slate-300">
          Last updated:{" "}
          {revenueAnalytics?.lastUpdated
            ? new Date(revenueAnalytics.lastUpdated).toLocaleString()
            : "Never"}
        </div>
      </div>
    </div>
  );
};

export default RevenueAnalytics;
