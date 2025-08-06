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
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";
import {
  getEarningsOverview,
  getDetailedEarnings,
  requestPayout,
  getPayoutHistory,
  getRevenueAnalytics,
  generateFinancialReport,
  updatePaymentDetails,
  getFinancialDashboard,
  setEarningsFilters,
  resetEarningsFilters,
  setPayoutsFilters,
  resetPayoutsFilters,
  clearError,
} from "@/features/instructor/earningSlice";
import {
  DollarSign,
  Plus,
  Search,
  RefreshCw,
  Activity,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  Download,
  X,
  Loader2,
  BarChart3,
  Wallet,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Settings,
  FileText,
  PiggyBank,
} from "lucide-react";

const EarningsPage = () => {
  const dispatch = useDispatch();
  const {
    earningsOverview,
    detailedEarnings,
    payoutHistory,
    revenueAnalytics,
    financialDashboard,
    earningsPagination,
    payoutsPagination,
    earningsFilters,
    payoutsFilters,
    getEarningsOverviewLoading,
    getDetailedEarningsLoading,
    requestPayoutLoading,
    getPayoutHistoryLoading,
    getRevenueAnalyticsLoading,
    generateFinancialReportLoading,
    updatePaymentDetailsLoading,
    error,
  } = useSelector((state) => state.earning);

  const [isPayoutDialogOpen, setIsPayoutDialogOpen] = useState(false);
  const [isAnalyticsDialogOpen, setIsAnalyticsDialogOpen] = useState(false);
  const [isPaymentDetailsDialogOpen, setIsPaymentDetailsDialogOpen] =
    useState(false);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [hasInitialLoaded, setHasInitialLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState("earnings");

  const [payoutFormData, setPayoutFormData] = useState({
    amount: "",
    currency: "INR",
  });

  const [paymentDetailsFormData, setPaymentDetailsFormData] = useState({
    accountType: "",
    accountNumber: "",
    bankName: "",
    ifscCode: "",
    accountHolderName: "",
  });

  const [reportFormData, setReportFormData] = useState({
    type: "monthly",
    startDate: "",
    endDate: "",
    format: "json",
    includeDetails: false,
  });

  useEffect(() => {
    if (!hasInitialLoaded) {
      dispatch(getEarningsOverview());
      dispatch(getFinancialDashboard());
      dispatch(getDetailedEarnings({ page: 1, limit: 20 }));
      dispatch(getPayoutHistory({ page: 1, limit: 20 }));
      setHasInitialLoaded(true);
    }
  }, [dispatch, hasInitialLoaded]);

  useEffect(() => {
    setSearchTerm(earningsFilters.search || "");
  }, [earningsFilters.search]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const handleFilterChange = (key, value) => {
    const newFilters = { ...earningsFilters, [key]: value };
    dispatch(setEarningsFilters({ [key]: value }));

    if (hasInitialLoaded) {
      setTimeout(() => {
        dispatch(
          getDetailedEarnings({
            ...newFilters,
            page: 1,
            limit: earningsPagination.limit,
          })
        );
      }, 100);
    }
  };

  const handlePayoutFilterChange = (key, value) => {
    const newFilters = { ...payoutsFilters, [key]: value };
    dispatch(setPayoutsFilters({ [key]: value }));

    if (hasInitialLoaded) {
      setTimeout(() => {
        dispatch(
          getPayoutHistory({
            ...newFilters,
            page: 1,
            limit: payoutsPagination.limit,
          })
        );
      }, 100);
    }
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
    const newFilters = { ...earningsFilters, search: value };
    dispatch(setEarningsFilters({ search: value }));

    if (hasInitialLoaded) {
      setTimeout(() => {
        dispatch(
          getDetailedEarnings({
            ...newFilters,
            page: 1,
            limit: earningsPagination.limit,
          })
        );
      }, 300);
    }
  };

  const loadEarnings = () => {
    dispatch(getEarningsOverview());
    dispatch(getFinancialDashboard());
    dispatch(
      getDetailedEarnings({
        page: 1,
        limit: 20,
        ...(earningsFilters.search && { search: earningsFilters.search }),
        ...(earningsFilters.status && { status: earningsFilters.status }),
        ...(earningsFilters.startDate && {
          startDate: earningsFilters.startDate,
        }),
        ...(earningsFilters.endDate && { endDate: earningsFilters.endDate }),
        ...(earningsFilters.courseId && { courseId: earningsFilters.courseId }),
        sortBy: earningsFilters.sortBy || "createdAt",
        sortOrder: earningsFilters.sortOrder || "desc",
      })
    );
  };

  const loadPayouts = () => {
    dispatch(
      getPayoutHistory({
        page: 1,
        limit: 20,
        ...(payoutsFilters.status && { status: payoutsFilters.status }),
        ...(payoutsFilters.startDate && {
          startDate: payoutsFilters.startDate,
        }),
        ...(payoutsFilters.endDate && { endDate: payoutsFilters.endDate }),
        sortBy: payoutsFilters.sortBy || "requestedAt",
        sortOrder: payoutsFilters.sortOrder || "desc",
      })
    );
  };

  const handleRequestPayout = async () => {
    if (!payoutFormData.amount || parseFloat(payoutFormData.amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    try {
      await dispatch(
        requestPayout({
          amount: parseFloat(payoutFormData.amount),
          currency: payoutFormData.currency,
        })
      ).unwrap();
      setIsPayoutDialogOpen(false);
      setPayoutFormData({ amount: "", currency: "INR" });
      loadEarnings();
      loadPayouts();
    } catch (error) {
      toast.error(error.message || "Failed to request payout");
    }
  };

  const handleUpdatePaymentDetails = async () => {
    const requiredFields = [
      "accountType",
      "accountNumber",
      "bankName",
      "accountHolderName",
    ];
    const missingFields = requiredFields.filter(
      (field) => !paymentDetailsFormData[field]
    );

    if (missingFields.length > 0) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      await dispatch(
        updatePaymentDetails({
          paymentDetails: paymentDetailsFormData,
        })
      ).unwrap();
      setIsPaymentDetailsDialogOpen(false);
      toast.success("Payment details updated successfully");
    } catch (error) {
      toast.error(error.message || "Failed to update payment details");
    }
  };

  const handleGenerateReport = async () => {
    try {
      await dispatch(generateFinancialReport(reportFormData)).unwrap();
      setIsReportDialogOpen(false);
      toast.success("Financial report generated successfully");
    } catch (error) {
      toast.error(error.message || "Failed to generate report");
    }
  };

  const openAnalyticsDialog = () => {
    dispatch(getRevenueAnalytics());
    setIsAnalyticsDialogOpen(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "COMPLETED":
      case "PAID":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
      case "PROCESSING":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
      case "FAILED":
      case "CANCELLED":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
    }
  };

  const formatCurrency = (amount, currency = "INR") => {
    const numAmount =
      typeof amount === "string" ? parseFloat(amount) || 0 : amount || 0;
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
    }).format(numAmount);
  };

  const getTotalEarnings = () => {
    return earningsOverview?.summary?.totalEarningsRaw || 0;
  };

  const getAvailableBalance = () => {
    return earningsOverview?.summary?.availableBalanceRaw || 0;
  };

  const getPendingPayouts = () => {
    return earningsOverview?.payouts?.pendingAmountRaw || 0;
  };

  const getCurrentMonthEarnings = () => {
    return (
      financialDashboard?.quickStats?.last30DaysEarningsRaw ||
      earningsOverview?.summary?.currentMonthEarningsRaw ||
      0
    );
  };

  if (getEarningsOverviewLoading && !earningsOverview) {
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
              <DollarSign className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-800 dark:text-white">
                Earnings
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Track your earnings, payouts, and financial performance
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={openAnalyticsDialog}
              className="rounded-xl border-white/50 dark:border-slate-700/50 bg-white/30 dark:bg-slate-800/30 backdrop-blur-sm hover:bg-white/50 dark:hover:bg-slate-700/50"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </Button>

            <Dialog
              open={isReportDialogOpen}
              onOpenChange={setIsReportDialogOpen}
            >
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="rounded-xl border-white/50 dark:border-slate-700/50 bg-white/30 dark:bg-slate-800/30 backdrop-blur-sm hover:bg-white/50 dark:hover:bg-slate-700/50"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Generate Report
                </Button>
              </DialogTrigger>
            </Dialog>

            <Dialog
              open={isPayoutDialogOpen}
              onOpenChange={setIsPayoutDialogOpen}
            >
              <DialogTrigger asChild>
                <Button className="rounded-xl bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-white">
                  <Wallet className="w-4 h-4 mr-2" />
                  Request Payout
                </Button>
              </DialogTrigger>
            </Dialog>

            <Button
              variant="outline"
              onClick={loadEarnings}
              disabled={getEarningsOverviewLoading}
              className="rounded-xl border-white/50 dark:border-slate-700/50 bg-white/30 dark:bg-slate-800/30 backdrop-blur-sm hover:bg-white/50 dark:hover:bg-slate-700/50"
            >
              <RefreshCw
                className={cn(
                  "w-4 h-4 mr-2",
                  getEarningsOverviewLoading && "animate-spin"
                )}
              />
              Refresh
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 shadow-xl rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Total Earnings
                  </p>
                  <p className="text-2xl font-bold text-slate-800 dark:text-white">
                    {formatCurrency(getTotalEarnings())}
                  </p>
                </div>
                <div className="p-2 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-lg shadow-lg">
                  <DollarSign className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 shadow-xl rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Available Balance
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(getAvailableBalance())}
                  </p>
                </div>
                <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg shadow-lg">
                  <PiggyBank className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 shadow-xl rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Pending Payouts
                  </p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {formatCurrency(getPendingPayouts())}
                  </p>
                </div>
                <div className="p-2 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg shadow-lg">
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
                    This Month
                  </p>
                  <p className="text-2xl font-bold text-purple-600">
                    {formatCurrency(getCurrentMonthEarnings())}
                  </p>
                </div>
                <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg shadow-lg">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {financialDashboard?.alerts && financialDashboard.alerts.length > 0 && (
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-700 shadow-xl rounded-2xl mb-8">
            <CardHeader>
              <CardTitle className="text-blue-800 dark:text-blue-300 flex items-center">
                <Activity className="w-5 h-5 mr-2" />
                Alerts & Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {financialDashboard.alerts.map((alert, index) => (
                  <div
                    key={index}
                    className="p-4 bg-white/50 dark:bg-slate-800/50 rounded-xl border border-blue-200 dark:border-blue-700"
                  >
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {alert.message}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex items-center space-x-2 mb-6">
          <Button
            variant={activeTab === "earnings" ? "default" : "outline"}
            onClick={() => setActiveTab("earnings")}
            className="rounded-xl"
          >
            Earnings
          </Button>
          <Button
            variant={activeTab === "payouts" ? "default" : "outline"}
            onClick={() => setActiveTab("payouts")}
            className="rounded-xl"
          >
            Payouts
          </Button>
        </div>

        <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 shadow-xl rounded-2xl">
          <CardHeader className="pb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <CardTitle className="text-slate-800 dark:text-white">
                {activeTab === "earnings"
                  ? "Recent Earnings"
                  : "Payout History"}
              </CardTitle>

              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input
                    placeholder={`Search ${activeTab}...`}
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-10 w-64 rounded-xl bg-white/70 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600"
                  />
                </div>

                {activeTab === "earnings" ? (
                  <>
                    <Select
                      value={earningsFilters.status || "all"}
                      onValueChange={(value) =>
                        handleFilterChange(
                          "status",
                          value === "all" ? "" : value
                        )
                      }
                    >
                      <SelectTrigger className="w-32 rounded-xl bg-white/70 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="PENDING">Pending</SelectItem>
                        <SelectItem value="PAID">Paid</SelectItem>
                        <SelectItem value="FAILED">Failed</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button
                      variant="outline"
                      onClick={() => {
                        dispatch(resetEarningsFilters());
                        setSearchTerm("");
                        dispatch(
                          getDetailedEarnings({
                            page: 1,
                            limit: earningsPagination.limit,
                          })
                        );
                      }}
                      className="rounded-xl"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Clear
                    </Button>
                  </>
                ) : (
                  <>
                    <Select
                      value={payoutsFilters.status || "all"}
                      onValueChange={(value) =>
                        handlePayoutFilterChange(
                          "status",
                          value === "all" ? "" : value
                        )
                      }
                    >
                      <SelectTrigger className="w-32 rounded-xl bg-white/70 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="PENDING">Pending</SelectItem>
                        <SelectItem value="PROCESSING">Processing</SelectItem>
                        <SelectItem value="COMPLETED">Completed</SelectItem>
                        <SelectItem value="FAILED">Failed</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button
                      variant="outline"
                      onClick={() => {
                        dispatch(resetPayoutsFilters());
                        dispatch(
                          getPayoutHistory({
                            page: 1,
                            limit: payoutsPagination.limit,
                          })
                        );
                      }}
                      className="rounded-xl"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Clear
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <div className="space-y-4">
              {activeTab === "earnings" ? (
                detailedEarnings && detailedEarnings.length > 0 ? (
                  detailedEarnings.map((earning) => (
                    <div
                      key={earning.id}
                      className="p-6 rounded-xl border bg-white/50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 hover:bg-white/70 dark:hover:bg-slate-700/70 transition-all duration-200"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
                              {formatCurrency(earning.commissionRaw || 0)}
                            </h3>
                            <Badge
                              className={cn(
                                "text-xs",
                                getStatusColor(earning.status)
                              )}
                            >
                              {earning.status}
                            </Badge>
                          </div>

                          {earning.enrollments &&
                            earning.enrollments.length > 0 && (
                              <h4 className="font-medium text-slate-700 dark:text-slate-300 mb-2">
                                {earning.enrollments[0].course?.title ||
                                  "Course"}
                              </h4>
                            )}

                          <div className="flex items-center space-x-6 text-sm text-slate-500 dark:text-slate-400 mb-3">
                            <div className="flex items-center space-x-1">
                              <span>
                                Gross: {formatCurrency(earning.amountRaw || 0)}
                              </span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <CreditCard className="w-4 h-4" />
                              <span>
                                Platform Fee:{" "}
                                {formatCurrency(earning.platformFeeRaw || 0)}
                              </span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-4 h-4" />
                              <span>
                                {formatDistanceToNow(
                                  new Date(earning.createdAt)
                                )}{" "}
                                ago
                              </span>
                            </div>
                          </div>

                          {earning.enrollments &&
                            earning.enrollments[0]?.student && (
                              <p className="text-sm text-slate-600 dark:text-slate-400">
                                Student: {earning.enrollments[0].student.name}
                              </p>
                            )}
                        </div>

                        <div className="ml-4">
                          {earning.status === "PAID" ? (
                            <CheckCircle className="w-6 h-6 text-green-600" />
                          ) : earning.status === "PENDING" ? (
                            <Clock className="w-6 h-6 text-yellow-600" />
                          ) : (
                            <XCircle className="w-6 h-6 text-red-600" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : !getDetailedEarningsLoading ? (
                  <div className="text-center py-12">
                    <DollarSign className="w-12 h-12 mx-auto text-slate-400 mb-4 opacity-50" />
                    <p className="text-slate-600 dark:text-slate-400">
                      No earnings found
                    </p>
                  </div>
                ) : null
              ) : payoutHistory && payoutHistory.length > 0 ? (
                payoutHistory.map((payout) => (
                  <div
                    key={payout.id}
                    className="p-6 rounded-xl border bg-white/50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 hover:bg-white/70 dark:hover:bg-slate-700/70 transition-all duration-200"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
                            {formatCurrency(
                              payout.amountRaw || 0,
                              payout.currency
                            )}
                          </h3>
                          <Badge
                            className={cn(
                              "text-xs",
                              getStatusColor(payout.status)
                            )}
                          >
                            {payout.status}
                          </Badge>
                        </div>

                        <div className="flex items-center space-x-6 text-sm text-slate-500 dark:text-slate-400 mb-3">
                          <div className="flex items-center space-x-1">
                            <Activity className="w-4 h-4" />
                            <span>Ref: {payout.reference}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>
                              Requested:{" "}
                              {format(
                                new Date(payout.requestedAt),
                                "MMM dd, yyyy"
                              )}
                            </span>
                          </div>
                          {payout.processedAt && (
                            <div className="flex items-center space-x-1">
                              <CheckCircle className="w-4 h-4" />
                              <span>
                                Processed:{" "}
                                {format(
                                  new Date(payout.processedAt),
                                  "MMM dd, yyyy"
                                )}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="ml-4">
                        {payout.status === "COMPLETED" ? (
                          <CheckCircle className="w-6 h-6 text-green-600" />
                        ) : payout.status === "PENDING" ? (
                          <Clock className="w-6 h-6 text-yellow-600" />
                        ) : payout.status === "PROCESSING" ? (
                          <Activity className="w-6 h-6 text-blue-600" />
                        ) : (
                          <XCircle className="w-6 h-6 text-red-600" />
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : !getPayoutHistoryLoading ? (
                <div className="text-center py-12">
                  <Wallet className="w-12 h-12 mx-auto text-slate-400 mb-4 opacity-50" />
                  <p className="text-slate-600 dark:text-slate-400">
                    No payouts found
                  </p>
                </div>
              ) : null}

              {((activeTab === "earnings" && getDetailedEarningsLoading) ||
                (activeTab === "payouts" && getPayoutHistoryLoading)) && (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin" />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Dialog open={isPayoutDialogOpen} onOpenChange={setIsPayoutDialogOpen}>
          <DialogContent className="max-w-lg max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>Request Payout</DialogTitle>
              <DialogDescription>
                Request a payout from your available balance
              </DialogDescription>
            </DialogHeader>

            <ScrollArea className="max-h-[calc(90vh-200px)]">
              <div className="space-y-4 py-4 pr-6">
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                      Available Balance
                    </span>
                    <span className="text-lg font-bold text-green-600">
                      {formatCurrency(getAvailableBalance())}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Amount</Label>
                  <Input
                    type="number"
                    value={payoutFormData.amount}
                    onChange={(e) =>
                      setPayoutFormData({
                        ...payoutFormData,
                        amount: e.target.value,
                      })
                    }
                    placeholder="Enter amount"
                    className="rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Select
                    value={payoutFormData.currency}
                    onValueChange={(value) =>
                      setPayoutFormData({
                        ...payoutFormData,
                        currency: value,
                      })
                    }
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INR">INR (₹)</SelectItem>
                      <SelectItem value="USD">USD ($)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                    Minimum payout amount is ₹100. Processing time is 2-3
                    business days.
                  </p>
                </div>
              </div>
            </ScrollArea>

            <DialogFooter className="border-t pt-4">
              <Button
                variant="outline"
                onClick={() => setIsPayoutDialogOpen(false)}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button
                onClick={handleRequestPayout}
                disabled={
                  requestPayoutLoading ||
                  !payoutFormData.amount ||
                  parseFloat(payoutFormData.amount) <= 0
                }
                className="rounded-xl"
              >
                {requestPayoutLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Wallet className="w-4 h-4 mr-2" />
                )}
                Request Payout
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={isAnalyticsDialogOpen}
          onOpenChange={setIsAnalyticsDialogOpen}
        >
          <DialogContent className="max-w-4xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <BarChart3 className="w-5 h-5 mr-2" />
                Revenue Analytics
              </DialogTitle>
              <DialogDescription>
                Detailed analytics and performance metrics for your earnings
              </DialogDescription>
            </DialogHeader>

            <ScrollArea className="max-h-[calc(90vh-200px)]">
              {getRevenueAnalyticsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin" />
                </div>
              ) : revenueAnalytics ? (
                <div className="space-y-6 py-4 pr-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-blue-100 text-sm">
                              Total Revenue
                            </p>
                            <p className="text-2xl font-bold">
                              {revenueAnalytics.summary?.totalRevenue || "₹0"}
                            </p>
                          </div>
                          <TrendingUp className="w-8 h-8 text-blue-200" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-green-100 text-sm">
                              Total Transactions
                            </p>
                            <p className="text-2xl font-bold">
                              {revenueAnalytics.summary?.totalTransactions || 0}
                            </p>
                          </div>
                          <Activity className="w-8 h-8 text-green-200" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-purple-100 text-sm">
                              Avg Transaction
                            </p>
                            <p className="text-2xl font-bold">
                              {revenueAnalytics.summary
                                ?.averageTransactionValue || "₹0"}
                            </p>
                          </div>
                          <BarChart3 className="w-8 h-8 text-purple-200" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-orange-100 text-sm">
                              Growth Rate
                            </p>
                            <p className="text-2xl font-bold flex items-center">
                              {(revenueAnalytics.summary?.growthRate || 0) >
                              0 ? (
                                <ArrowUpRight className="w-5 h-5 mr-1" />
                              ) : (
                                <ArrowDownRight className="w-5 h-5 mr-1" />
                              )}
                              {Math.abs(
                                revenueAnalytics.summary?.growthRate || 0
                              )}
                              %
                            </p>
                          </div>
                          {(revenueAnalytics.summary?.growthRate || 0) > 0 ? (
                            <TrendingUp className="w-8 h-8 text-orange-200" />
                          ) : (
                            <TrendingDown className="w-8 h-8 text-orange-200" />
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {revenueAnalytics.topCourses &&
                    revenueAnalytics.topCourses.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold mb-4">
                          Top Performing Courses
                        </h3>
                        <div className="space-y-3">
                          {revenueAnalytics.topCourses
                            .slice(0, 5)
                            .map((course, index) => (
                              <div
                                key={course.id}
                                className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl"
                              >
                                <div className="flex items-center space-x-3">
                                  <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                                    {index + 1}
                                  </div>
                                  <div>
                                    <h4 className="font-semibold">
                                      {course.title}
                                    </h4>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">
                                      {course.uniqueStudents} students •{" "}
                                      {course.totalTransactions} sales
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="font-semibold">
                                    {course.totalEarnings}
                                  </p>
                                  <p className="text-sm text-slate-600 dark:text-slate-400">
                                    {course.price}
                                  </p>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <BarChart3 className="w-12 h-12 mx-auto text-slate-400 mb-4 opacity-50" />
                  <p className="text-slate-600 dark:text-slate-400">
                    No analytics data available
                  </p>
                </div>
              )}
            </ScrollArea>

            <DialogFooter className="border-t pt-4">
              <Button
                variant="outline"
                onClick={() => setIsAnalyticsDialogOpen(false)}
                className="rounded-xl"
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={isPaymentDetailsDialogOpen}
          onOpenChange={setIsPaymentDetailsDialogOpen}
        >
          <DialogContent className="max-w-2xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <Settings className="w-5 h-5 mr-2" />
                Update Payment Details
              </DialogTitle>
              <DialogDescription>
                Update your bank account details for payouts
              </DialogDescription>
            </DialogHeader>

            <ScrollArea className="max-h-[calc(90vh-200px)]">
              <div className="space-y-4 py-4 pr-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Account Type</Label>
                    <Select
                      value={paymentDetailsFormData.accountType}
                      onValueChange={(value) =>
                        setPaymentDetailsFormData({
                          ...paymentDetailsFormData,
                          accountType: value,
                        })
                      }
                    >
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="Select account type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SAVINGS">Savings</SelectItem>
                        <SelectItem value="CURRENT">Current</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Account Holder Name</Label>
                    <Input
                      value={paymentDetailsFormData.accountHolderName}
                      onChange={(e) =>
                        setPaymentDetailsFormData({
                          ...paymentDetailsFormData,
                          accountHolderName: e.target.value,
                        })
                      }
                      placeholder="Full name as per bank"
                      className="rounded-xl"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Account Number</Label>
                  <Input
                    value={paymentDetailsFormData.accountNumber}
                    onChange={(e) =>
                      setPaymentDetailsFormData({
                        ...paymentDetailsFormData,
                        accountNumber: e.target.value,
                      })
                    }
                    placeholder="Bank account number"
                    className="rounded-xl"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Bank Name</Label>
                    <Input
                      value={paymentDetailsFormData.bankName}
                      onChange={(e) =>
                        setPaymentDetailsFormData({
                          ...paymentDetailsFormData,
                          bankName: e.target.value,
                        })
                      }
                      placeholder="Bank name"
                      className="rounded-xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>IFSC Code</Label>
                    <Input
                      value={paymentDetailsFormData.ifscCode}
                      onChange={(e) =>
                        setPaymentDetailsFormData({
                          ...paymentDetailsFormData,
                          ifscCode: e.target.value.toUpperCase(),
                        })
                      }
                      placeholder="IFSC Code"
                      className="rounded-xl"
                    />
                  </div>
                </div>
              </div>
            </ScrollArea>

            <DialogFooter className="border-t pt-4">
              <Button
                variant="outline"
                onClick={() => setIsPaymentDetailsDialogOpen(false)}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdatePaymentDetails}
                disabled={updatePaymentDetailsLoading}
                className="rounded-xl"
              >
                {updatePaymentDetailsLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Settings className="w-4 h-4 mr-2" />
                )}
                Update Details
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
          <DialogContent className="max-w-lg max-h-[90vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Generate Financial Report
              </DialogTitle>
              <DialogDescription>
                Generate detailed financial reports for your earnings
              </DialogDescription>
            </DialogHeader>

            <ScrollArea className="max-h-[calc(90vh-200px)]">
              <div className="space-y-4 py-4 pr-6">
                <div className="space-y-2">
                  <Label>Report Type</Label>
                  <Select
                    value={reportFormData.type}
                    onValueChange={(value) =>
                      setReportFormData({
                        ...reportFormData,
                        type: value,
                      })
                    }
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                      <SelectItem value="custom">Custom Range</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {reportFormData.type === "custom" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Start Date</Label>
                      <Input
                        type="date"
                        value={reportFormData.startDate}
                        onChange={(e) =>
                          setReportFormData({
                            ...reportFormData,
                            startDate: e.target.value,
                          })
                        }
                        className="rounded-xl"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>End Date</Label>
                      <Input
                        type="date"
                        value={reportFormData.endDate}
                        onChange={(e) =>
                          setReportFormData({
                            ...reportFormData,
                            endDate: e.target.value,
                          })
                        }
                        className="rounded-xl"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Format</Label>
                  <Select
                    value={reportFormData.format}
                    onValueChange={(value) =>
                      setReportFormData({
                        ...reportFormData,
                        format: value,
                      })
                    }
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="json">JSON</SelectItem>
                      <SelectItem value="csv">CSV</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={reportFormData.includeDetails}
                    onChange={(e) =>
                      setReportFormData({
                        ...reportFormData,
                        includeDetails: e.target.checked,
                      })
                    }
                    className="rounded"
                  />
                  <Label>Include detailed transaction information</Label>
                </div>
              </div>
            </ScrollArea>

            <DialogFooter className="border-t pt-4">
              <Button
                variant="outline"
                onClick={() => setIsReportDialogOpen(false)}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button
                onClick={handleGenerateReport}
                disabled={generateFinancialReportLoading}
                className="rounded-xl"
              >
                {generateFinancialReportLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                Generate Report
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default EarningsPage;
