/* eslint-disable no-unused-vars */
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  CreditCard,
  MoreVertical,
  Eye,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Filter,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  DollarSign,
  Calendar,
  User,
  Clock,
  Undo2,
  Building,
  Hash,
  Globe,
} from "lucide-react";
import {
  getAllTransactions,
  getTransactionDetails,
  processRefund,
  setTransactionsFilters,
  resetTransactionsFilters,
} from "@/features/adminSlice/adminPayment";
import { useEffect, useState } from "react";
import { format } from "date-fns";

const TransactionsPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const {
    transactions,
    transactionsPagination,
    transactionsFilters,
    transactionsLoading,
    processRefundLoading,
  } = useSelector((state) => state.adminPayment);

  const [isRefundDialogOpen, setIsRefundDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [operatingTransactionId, setOperatingTransactionId] = useState(null);
  const [localFilters, setLocalFilters] = useState({
    search: "",
    status: "all",
    method: "all",
    gateway: "all",
    dateFrom: "",
    dateTo: "",
    minAmount: "",
    maxAmount: "",
  });

  useEffect(() => {
    dispatch(getAllTransactions({}));
  }, [dispatch]);

  const handleLocalFilterChange = (key, value) => {
    setLocalFilters((prev) => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    const processedFilters = {
      page: 1,
      limit: 20,
      sortBy: "createdAt",
      sortOrder: "desc",
    };

    if (localFilters.search && localFilters.search.trim()) {
      processedFilters.search = localFilters.search.trim();
    }

    if (localFilters.status && localFilters.status !== "all") {
      processedFilters.status = localFilters.status;
    }

    if (localFilters.method && localFilters.method !== "all") {
      processedFilters.method = localFilters.method;
    }

    if (localFilters.gateway && localFilters.gateway !== "all") {
      processedFilters.gateway = localFilters.gateway;
    }

    if (localFilters.dateFrom) {
      processedFilters.dateFrom = localFilters.dateFrom;
    }

    if (localFilters.dateTo) {
      processedFilters.dateTo = localFilters.dateTo;
    }

    if (localFilters.minAmount) {
      processedFilters.minAmount = localFilters.minAmount;
    }

    if (localFilters.maxAmount) {
      processedFilters.maxAmount = localFilters.maxAmount;
    }

    dispatch(setTransactionsFilters(processedFilters));
    dispatch(getAllTransactions(processedFilters));
  };

  const clearFilters = () => {
    const clearedFilters = {
      search: "",
      status: "all",
      method: "all",
      gateway: "all",
      dateFrom: "",
      dateTo: "",
      minAmount: "",
      maxAmount: "",
    };

    setLocalFilters(clearedFilters);
    dispatch(resetTransactionsFilters());
    dispatch(getAllTransactions({}));
  };

  const getCurrentFilters = () => {
    const currentFilters = {
      page: transactionsFilters.page || 1,
      limit: transactionsFilters.limit || 20,
      sortBy: transactionsFilters.sortBy || "createdAt",
      sortOrder: transactionsFilters.sortOrder || "desc",
    };

    if (localFilters.search && localFilters.search.trim()) {
      currentFilters.search = localFilters.search.trim();
    }

    if (localFilters.status && localFilters.status !== "all") {
      currentFilters.status = localFilters.status;
    }

    if (localFilters.method && localFilters.method !== "all") {
      currentFilters.method = localFilters.method;
    }

    if (localFilters.gateway && localFilters.gateway !== "all") {
      currentFilters.gateway = localFilters.gateway;
    }

    if (localFilters.dateFrom) {
      currentFilters.dateFrom = localFilters.dateFrom;
    }

    if (localFilters.dateTo) {
      currentFilters.dateTo = localFilters.dateTo;
    }

    if (localFilters.minAmount) {
      currentFilters.minAmount = localFilters.minAmount;
    }

    if (localFilters.maxAmount) {
      currentFilters.maxAmount = localFilters.maxAmount;
    }

    return currentFilters;
  };

  const handleRefresh = () => {
    const currentFilters = getCurrentFilters();
    dispatch(getAllTransactions(currentFilters));
  };

  const handlePageChange = (page) => {
    const newFilters = {
      ...getCurrentFilters(),
      page,
    };
    dispatch(setTransactionsFilters(newFilters));
    dispatch(getAllTransactions(newFilters));
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === "Enter") {
      applyFilters();
    }
  };

  const openViewDialog = (transaction) => {
    setSelectedTransaction(transaction);
    setIsViewDialogOpen(true);
  };

  const handleRefundTransaction = (transaction) => {
    setSelectedTransaction(transaction);
    setRefundAmount("");
    setRefundReason("");
    setIsRefundDialogOpen(true);
  };

  const handleProcessRefund = async () => {
    try {
      setOperatingTransactionId(selectedTransaction.id);

      await dispatch(
        processRefund({
          transactionId: selectedTransaction.id,
          refundData: {
            refundAmount: parseFloat(refundAmount),
            refundReason,
            notifyUser: true,
          },
        })
      ).unwrap();

      setIsRefundDialogOpen(false);
      setSelectedTransaction(null);
      setRefundAmount("");
      setRefundReason("");
      setOperatingTransactionId(null);
    } catch (error) {
      console.error("Refund failed:", error);
      setOperatingTransactionId(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "COMPLETED":
        return (
          <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">
            <CheckCircle className="w-3 h-3 mr-1" />
            Completed
          </Badge>
        );
      case "PENDING":
        return (
          <Badge className="bg-gradient-to-r from-yellow-500 to-amber-500 text-white">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case "FAILED":
        return (
          <Badge className="bg-gradient-to-r from-red-500 to-red-600 text-white">
            <XCircle className="w-3 h-3 mr-1" />
            Failed
          </Badge>
        );
      case "REFUNDED":
        return (
          <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
            <Undo2 className="w-3 h-3 mr-1" />
            Refunded
          </Badge>
        );
      case "PARTIALLY_REFUNDED":
        return (
          <Badge className="bg-gradient-to-r from-orange-500 to-amber-600 text-white">
            <AlertCircle className="w-3 h-3 mr-1" />
            Partial Refund
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gradient-to-r from-gray-500 to-slate-500 text-white">
            {status}
          </Badge>
        );
    }
  };

  const getMethodBadge = (method) => {
    const methodColors = {
      CARD: "bg-gradient-to-r from-blue-500 to-indigo-500",
      UPI: "bg-gradient-to-r from-green-500 to-teal-500",
      NETBANKING: "bg-gradient-to-r from-purple-500 to-violet-500",
      WALLET: "bg-gradient-to-r from-orange-500 to-amber-500",
    };

    return (
      <Badge
        className={cn(
          "text-white",
          methodColors[method] || "bg-gradient-to-r from-gray-500 to-slate-500"
        )}
      >
        {method}
      </Badge>
    );
  };

  const formatCurrency = (amount, currency = "INR") => {
    const symbol = currency === "INR" ? "₹" : "$";
    return `${symbol}${parseFloat(amount).toLocaleString()}`;
  };

  // const getCurrencyIcon = (currency) => {
  //   return currency === "INR" ? "₹" : "$";
  // };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getMaxRefundAmount = (transaction) => {
    return (
      parseFloat(transaction.amount) - parseFloat(transaction.refundAmount || 0)
    );
  };

  const isTransactionOperating = (transactionId) => {
    return operatingTransactionId === transactionId && processRefundLoading;
  };

  const canRefund = (transaction) => {
    return (
      transaction.status === "COMPLETED" && getMaxRefundAmount(transaction) > 0
    );
  };

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-blue-50/50 via-indigo-50/50 to-cyan-50/50 dark:from-slate-900/50 dark:via-slate-800/50 dark:to-gray-900/50 min-h-screen">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
            <CreditCard className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
              Transaction Management
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Monitor and manage all payment transactions
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            className="rounded-xl border-white/50 bg-white/30 backdrop-blur-sm hover:bg-white/50"
            disabled={transactionsLoading}
          >
            {transactionsLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border border-white/50 dark:border-slate-700/50 shadow-xl rounded-2xl">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-slate-800 dark:text-white flex items-center justify-between">
            <span>Filters & Search</span>
            <Button
              onClick={clearFilters}
              variant="ghost"
              size="sm"
              className="rounded-xl"
            >
              Clear All
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-9 gap-4">
            <div className="xl:col-span-2">
              <Input
                placeholder="Search transactions..."
                value={localFilters.search}
                onChange={(e) =>
                  handleLocalFilterChange("search", e.target.value)
                }
                onKeyPress={handleSearchKeyPress}
                className="rounded-xl border-white/50 bg-white/50 backdrop-blur-sm"
              />
            </div>

            <Select
              value={localFilters.status}
              onValueChange={(value) =>
                handleLocalFilterChange("status", value)
              }
            >
              <SelectTrigger className="rounded-xl border-white/50 bg-white/50 backdrop-blur-sm">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
                <SelectItem value="REFUNDED">Refunded</SelectItem>
                <SelectItem value="PARTIALLY_REFUNDED">
                  Partial Refund
                </SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={localFilters.method}
              onValueChange={(value) =>
                handleLocalFilterChange("method", value)
              }
            >
              <SelectTrigger className="rounded-xl border-white/50 bg-white/50 backdrop-blur-sm">
                <SelectValue placeholder="Method" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">All Methods</SelectItem>
                <SelectItem value="CARD">Card</SelectItem>
                <SelectItem value="UPI">UPI</SelectItem>
                <SelectItem value="NETBANKING">Net Banking</SelectItem>
                <SelectItem value="WALLET">Wallet</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={localFilters.gateway}
              onValueChange={(value) =>
                handleLocalFilterChange("gateway", value)
              }
            >
              <SelectTrigger className="rounded-xl border-white/50 bg-white/50 backdrop-blur-sm">
                <SelectValue placeholder="Gateway" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">All Gateways</SelectItem>
                <SelectItem value="RAZORPAY">Razorpay</SelectItem>
                <SelectItem value="STRIPE">Stripe</SelectItem>
                <SelectItem value="PAYU">PayU</SelectItem>
                <SelectItem value="CASHFREE">Cashfree</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="date"
              placeholder="From Date"
              value={localFilters.dateFrom}
              onChange={(e) =>
                handleLocalFilterChange("dateFrom", e.target.value)
              }
              className="rounded-xl border-white/50 bg-white/50 backdrop-blur-sm"
            />

            <Input
              type="date"
              placeholder="To Date"
              value={localFilters.dateTo}
              onChange={(e) =>
                handleLocalFilterChange("dateTo", e.target.value)
              }
              className="rounded-xl border-white/50 bg-white/50 backdrop-blur-sm"
            />

            <Input
              type="number"
              placeholder="Min Amount"
              value={localFilters.minAmount}
              onChange={(e) =>
                handleLocalFilterChange("minAmount", e.target.value)
              }
              className="rounded-xl border-white/50 bg-white/50 backdrop-blur-sm"
            />

            <Button
              onClick={applyFilters}
              className="bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-white rounded-xl"
            >
              <Filter className="w-4 h-4 mr-2" />
              Apply
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border border-white/50 dark:border-slate-700/50 shadow-xl rounded-2xl">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-slate-800 dark:text-white flex items-center justify-between">
            <span>Transactions ({transactionsPagination?.total || 0})</span>
            <div className="flex items-center space-x-2">
              <Badge className="bg-gradient-to-r from-indigo-500 to-blue-500 text-white">
                Page {transactionsPagination?.page || 1} of{" "}
                {transactionsPagination?.totalPages || 1}
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-white/20 dark:border-slate-700/50">
                  <TableHead className="text-slate-700 dark:text-slate-300">
                    Transaction ID
                  </TableHead>
                  <TableHead className="text-slate-700 dark:text-slate-300">
                    Student
                  </TableHead>
                  <TableHead className="text-slate-700 dark:text-slate-300">
                    Amount
                  </TableHead>
                  <TableHead className="text-slate-700 dark:text-slate-300">
                    Status
                  </TableHead>
                  <TableHead className="text-slate-700 dark:text-slate-300">
                    Method
                  </TableHead>
                  <TableHead className="text-slate-700 dark:text-slate-300">
                    Gateway
                  </TableHead>
                  <TableHead className="text-slate-700 dark:text-slate-300">
                    Date
                  </TableHead>
                  <TableHead className="text-slate-700 dark:text-slate-300">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactionsLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="flex items-center justify-center space-x-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span className="text-slate-600 dark:text-slate-400">
                          Loading transactions...
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="flex flex-col items-center space-y-2">
                        <CreditCard className="w-12 h-12 text-slate-400" />
                        <p className="text-slate-600 dark:text-slate-400">
                          No transactions found
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((transaction) => (
                    <TableRow
                      key={transaction.id}
                      className={cn(
                        "border-b border-white/10 dark:border-slate-700/30 hover:bg-white/30 dark:hover:bg-slate-700/30",
                        isTransactionOperating(transaction.id) && "opacity-60"
                      )}
                    >
                      <TableCell>
                        <div className="font-mono text-sm text-slate-800 dark:text-white">
                          {transaction.transactionId}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4 text-slate-500" />
                          <div>
                            <p className="font-medium text-slate-800 dark:text-white">
                              {transaction.student?.name || "N/A"}
                            </p>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              {transaction.student?.email || "N/A"}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center space-x-1">
                            <span className="text-green-500 font-bold text-sm">
                              {/* {getCurrencyIcon(transaction.currency)} */}
                            </span>
                            <span className="font-semibold text-slate-800 dark:text-white">
                              {formatCurrency(
                                transaction.amount,
                                transaction.currency
                              )}
                            </span>
                          </div>
                          {transaction.refundAmount > 0 && (
                            <div className="text-sm text-red-600 dark:text-red-400">
                              Refunded:{" "}
                              {formatCurrency(
                                transaction.refundAmount,
                                transaction.currency
                              )}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(transaction.status)}
                      </TableCell>
                      <TableCell>
                        {getMethodBadge(transaction.method)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="text-slate-600 dark:text-slate-400"
                        >
                          {transaction.gateway}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                          <Calendar className="w-3 h-3 mr-1" />
                          {formatDate(transaction.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            onClick={() => openViewDialog(transaction)}
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 rounded-lg hover:bg-white/50 dark:hover:bg-slate-700/50"
                            disabled={isTransactionOperating(transaction.id)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>

                          {canRefund(transaction) && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 rounded-lg hover:bg-white/50 dark:hover:bg-slate-700/50"
                                  disabled={isTransactionOperating(
                                    transaction.id
                                  )}
                                >
                                  {isTransactionOperating(transaction.id) ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <MoreVertical className="w-4 h-4" />
                                  )}
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align="end"
                                className="rounded-xl"
                              >
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleRefundTransaction(transaction)
                                  }
                                  className="cursor-pointer text-red-600 dark:text-red-400"
                                >
                                  <Undo2 className="w-4 h-4" />
                                  <span className="ml-2">Process Refund</span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {transactionsPagination?.totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-white/20 dark:border-slate-700/50">
              <div className="flex items-center space-x-2">
                <Button
                  onClick={() =>
                    handlePageChange(transactionsPagination.page - 1)
                  }
                  disabled={!transactionsPagination.hasPrev}
                  variant="outline"
                  size="sm"
                  className="rounded-xl border-white/50 bg-white/30 backdrop-blur-sm hover:bg-white/50"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>

                <div className="flex items-center space-x-1">
                  {Array.from(
                    { length: Math.min(5, transactionsPagination.totalPages) },
                    (_, i) => {
                      const pageNum = i + 1;
                      return (
                        <Button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          variant={
                            transactionsPagination.page === pageNum
                              ? "default"
                              : "outline"
                          }
                          size="sm"
                          className={cn(
                            "w-8 h-8 p-0 rounded-lg",
                            transactionsPagination.page === pageNum
                              ? "bg-gradient-to-r from-indigo-500 to-blue-500 text-white"
                              : "border-white/50 bg-white/30 backdrop-blur-sm hover:bg-white/50"
                          )}
                        >
                          {pageNum}
                        </Button>
                      );
                    }
                  )}
                </div>

                <Button
                  onClick={() =>
                    handlePageChange(transactionsPagination.page + 1)
                  }
                  disabled={!transactionsPagination.hasNext}
                  variant="outline"
                  size="sm"
                  className="rounded-xl border-white/50 bg-white/30 backdrop-blur-sm hover:bg-white/50"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>

              <div className="text-sm text-slate-600 dark:text-slate-400">
                Showing{" "}
                {((transactionsPagination?.page || 1) - 1) *
                  (transactionsPagination?.limit || 20) +
                  1}{" "}
                to{" "}
                {Math.min(
                  (transactionsPagination?.page || 1) *
                    (transactionsPagination?.limit || 20),
                  transactionsPagination?.total || 0
                )}{" "}
                of {transactionsPagination?.total || 0} transactions
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 shadow-xl rounded-2xl max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 dark:via-slate-700/10 to-transparent rounded-2xl"></div>
          {selectedTransaction && (
            <div className="relative z-10">
              <DialogHeader className="pb-4">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex-1">
                    <DialogTitle className="text-xl font-bold text-slate-800 dark:text-white mb-3">
                      Transaction Details
                    </DialogTitle>
                    <div className="flex flex-wrap items-center gap-2">
                      {getStatusBadge(selectedTransaction.status)}
                      {getMethodBadge(selectedTransaction.method)}
                      <Badge
                        variant="outline"
                        className="text-slate-600 dark:text-slate-400"
                      >
                        {selectedTransaction.gateway}
                      </Badge>
                    </div>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-6">
                <div className="bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-slate-700/30 dark:to-slate-600/30 backdrop-blur-sm rounded-xl p-6 border border-blue-100/50 dark:border-slate-600/50">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label className="text-sm font-semibold text-slate-600 dark:text-slate-400 flex items-center">
                        <Hash className="w-4 h-4 mr-2" />
                        Transaction ID
                      </Label>
                      <div className="font-mono text-sm text-slate-800 dark:text-white bg-white/60 dark:bg-slate-800/60 px-4 py-3 rounded-lg border border-slate-200/50 dark:border-slate-600/50 break-all">
                        {selectedTransaction.transactionId}
                      </div>
                    </div>
                    <div className="space-y-3">
                      <Label className="text-sm font-semibold text-slate-600 dark:text-slate-400 flex items-center">
                        <span className="w-4 h-4 mr-2 text-lg font-bold">
                          {/* {getCurrencyIcon(selectedTransaction.currency)} */}
                        </span>
                        Amount
                      </Label>
                      <div className="text-2xl font-bold text-slate-800 dark:text-white">
                        {formatCurrency(
                          selectedTransaction.amount,
                          selectedTransaction.currency
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-6">
                    <div className="bg-white/40 dark:bg-slate-700/40 backdrop-blur-sm rounded-xl p-5 border border-white/50 dark:border-slate-600/50">
                      <Label className="text-sm font-semibold text-slate-600 dark:text-slate-400 flex items-center mb-4">
                        <User className="w-4 h-4 mr-2" />
                        Student Information
                      </Label>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            Name
                          </p>
                          <p className="font-semibold text-slate-800 dark:text-white">
                            {selectedTransaction.student?.name || "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            Email
                          </p>
                          <p className="text-sm text-slate-700 dark:text-slate-300 break-all">
                            {selectedTransaction.student?.email || "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white/40 dark:bg-slate-700/40 backdrop-blur-sm rounded-xl p-5 border border-white/50 dark:border-slate-600/50">
                      <Label className="text-sm font-semibold text-slate-600 dark:text-slate-400 flex items-center mb-4">
                        <Building className="w-4 h-4 mr-2" />
                        Payment Information
                      </Label>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            Gateway
                          </p>
                          <p className="font-medium text-slate-800 dark:text-white">
                            {selectedTransaction.gateway}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            Method
                          </p>
                          <div className="mt-1">
                            {getMethodBadge(selectedTransaction.method)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-white/40 dark:bg-slate-700/40 backdrop-blur-sm rounded-xl p-5 border border-white/50 dark:border-slate-600/50">
                      <Label className="text-sm font-semibold text-slate-600 dark:text-slate-400 flex items-center mb-4">
                        <Calendar className="w-4 h-4 mr-2" />
                        Transaction Timeline
                      </Label>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            Created
                          </p>
                          <p className="text-sm font-medium text-slate-800 dark:text-white">
                            {format(
                              new Date(selectedTransaction.createdAt),
                              "PPP 'at' p"
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            Status
                          </p>
                          <div className="mt-1">
                            {getStatusBadge(selectedTransaction.status)}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white/40 dark:bg-slate-700/40 backdrop-blur-sm rounded-xl p-5 border border-white/50 dark:border-slate-600/50">
                      <Label className="text-sm font-semibold text-slate-600 dark:text-slate-400 flex items-center mb-4">
                        <Globe className="w-4 h-4 mr-2" />
                        Additional Details
                      </Label>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            Currency
                          </p>
                          <p className="font-medium text-slate-800 dark:text-white">
                            {selectedTransaction.currency}
                          </p>
                        </div>
                        {selectedTransaction.gatewayTransactionId && (
                          <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                              Gateway Transaction ID
                            </p>
                            <p className="font-mono text-xs text-slate-700 dark:text-slate-300 break-all">
                              {selectedTransaction.gatewayTransactionId}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {selectedTransaction.refundAmount > 0 && (
                  <div className="bg-gradient-to-r from-red-50/80 to-pink-50/80 dark:from-red-900/30 dark:to-pink-900/30 backdrop-blur-sm rounded-xl p-6 border border-red-200/60 dark:border-red-800/60">
                    <Label className="text-sm font-semibold text-red-700 dark:text-red-400 flex items-center mb-4">
                      <Undo2 className="w-4 h-4 mr-2" />
                      Refund Information
                    </Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-white/50 dark:bg-slate-800/50 rounded-lg p-4">
                        <p className="text-sm text-red-600 dark:text-red-400 mb-1">
                          Refunded Amount
                        </p>
                        <p className="text-lg font-bold text-red-700 dark:text-red-300">
                          {formatCurrency(
                            selectedTransaction.refundAmount,
                            selectedTransaction.currency
                          )}
                        </p>
                      </div>
                      <div className="bg-white/50 dark:bg-slate-800/50 rounded-lg p-4">
                        <p className="text-sm text-red-600 dark:text-red-400 mb-1">
                          Remaining Amount
                        </p>
                        <p className="text-lg font-bold text-red-700 dark:text-red-300">
                          {formatCurrency(
                            getMaxRefundAmount(selectedTransaction),
                            selectedTransaction.currency
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {selectedTransaction.description && (
                  <div className="bg-white/40 dark:bg-slate-700/40 backdrop-blur-sm rounded-xl p-5 border border-white/50 dark:border-slate-600/50">
                    <Label className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-3 block">
                      Description
                    </Label>
                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                      {selectedTransaction.description}
                    </p>
                  </div>
                )}
              </div>

              <DialogFooter className="mt-8 pt-6 border-t border-white/20 dark:border-slate-700/50">
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto sm:justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setIsViewDialogOpen(false)}
                    className="rounded-xl border-slate-200 dark:border-slate-600 order-2 sm:order-1"
                  >
                    Close
                  </Button>
                  {canRefund(selectedTransaction) && (
                    <Button
                      onClick={() => {
                        setIsViewDialogOpen(false);
                        handleRefundTransaction(selectedTransaction);
                      }}
                      className="rounded-xl bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white order-1 sm:order-2"
                    >
                      <Undo2 className="w-4 h-4 mr-2" />
                      Process Refund
                    </Button>
                  )}
                </div>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={isRefundDialogOpen}
        onOpenChange={setIsRefundDialogOpen}
      >
        <AlertDialogContent className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-800 dark:text-white">
              Process Refund
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600 dark:text-slate-400">
              Process refund for transaction{" "}
              {selectedTransaction?.transactionId}. Maximum refundable amount:{" "}
              {selectedTransaction &&
                formatCurrency(
                  getMaxRefundAmount(selectedTransaction),
                  selectedTransaction.currency
                )}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Refund Amount
              </label>
              <Input
                type="number"
                placeholder="Enter refund amount"
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                max={
                  selectedTransaction
                    ? getMaxRefundAmount(selectedTransaction)
                    : 0
                }
                className="mt-2 rounded-xl border-white/50 bg-white/50 backdrop-blur-sm"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Refund Reason
              </label>
              <Textarea
                placeholder="Enter reason for refund..."
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                className="mt-2 rounded-xl border-white/50 bg-white/50 backdrop-blur-sm"
                rows={3}
              />
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleProcessRefund}
              disabled={
                processRefundLoading ||
                !refundAmount ||
                !refundReason ||
                parseFloat(refundAmount) <= 0 ||
                (selectedTransaction &&
                  parseFloat(refundAmount) >
                    getMaxRefundAmount(selectedTransaction))
              }
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-xl"
            >
              {processRefundLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                "Process Refund"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TransactionsPage;
