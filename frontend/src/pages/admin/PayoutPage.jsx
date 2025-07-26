import { useDispatch, useSelector } from "react-redux";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  Wallet,
  MoreVertical,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Filter,
  Loader2,
  CheckCircle,
  Clock,
  DollarSign,
  Calendar,
  User,
  Send,
} from "lucide-react";
import {
  getAllPayouts,
  processPayout,
  setPayoutsFilters,
  resetPayoutsFilters,
} from "@/features/adminSlice/adminPayment";
import { useEffect, useState } from "react";

const PayoutPage = () => {
  const dispatch = useDispatch();
  const {
    payouts,
    payoutsPagination,
    payoutsFilters,
    payoutsLoading,
    processPayoutLoading,
  } = useSelector((state) => state.adminPayment);

  const [isProcessDialogOpen, setIsProcessDialogOpen] = useState(false);
  const [selectedPayout, setSelectedPayout] = useState(null);
  const [operatingPayoutId, setOperatingPayoutId] = useState(null);
  const [localFilters, setLocalFilters] = useState({
    status: "all",
    dateFrom: "",
    dateTo: "",
    minAmount: "",
    maxAmount: "",
    instructorId: "",
  });

  useEffect(() => {
    dispatch(getAllPayouts({}));
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

    if (localFilters.status && localFilters.status !== "all") {
      processedFilters.status = localFilters.status;
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

    if (localFilters.instructorId && localFilters.instructorId.trim()) {
      processedFilters.instructorId = localFilters.instructorId.trim();
    }

    dispatch(setPayoutsFilters(processedFilters));
    dispatch(getAllPayouts(processedFilters));
  };

  const clearFilters = () => {
    const clearedFilters = {
      status: "all",
      dateFrom: "",
      dateTo: "",
      minAmount: "",
      maxAmount: "",
      instructorId: "",
    };

    setLocalFilters(clearedFilters);
    dispatch(resetPayoutsFilters());
    dispatch(getAllPayouts({}));
  };

  const getCurrentFilters = () => {
    const currentFilters = {
      page: payoutsFilters.page || 1,
      limit: payoutsFilters.limit || 20,
      sortBy: payoutsFilters.sortBy || "createdAt",
      sortOrder: payoutsFilters.sortOrder || "desc",
    };

    if (localFilters.status && localFilters.status !== "all") {
      currentFilters.status = localFilters.status;
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

    if (localFilters.instructorId && localFilters.instructorId.trim()) {
      currentFilters.instructorId = localFilters.instructorId.trim();
    }

    return currentFilters;
  };

  const handleRefresh = () => {
    const currentFilters = getCurrentFilters();
    dispatch(getAllPayouts(currentFilters));
  };

  const handlePageChange = (page) => {
    const newFilters = {
      ...getCurrentFilters(),
      page,
    };
    dispatch(setPayoutsFilters(newFilters));
    dispatch(getAllPayouts(newFilters));
  };

  const handleProcessPayout = (payout) => {
    setSelectedPayout(payout);
    setIsProcessDialogOpen(true);
  };

  const handleConfirmProcessPayout = async () => {
    try {
      setOperatingPayoutId(selectedPayout.id);

      await dispatch(processPayout(selectedPayout.id)).unwrap();

      setIsProcessDialogOpen(false);
      setSelectedPayout(null);
      setOperatingPayoutId(null);
    } catch (error) {
      console.error("Process payout failed:", error);
      setOperatingPayoutId(null);
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
            <Clock className="w-3 h-3 mr-1" />
            Failed
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

  const formatCurrency = (amount, currency = "INR") => {
    const symbol = currency === "INR" ? "₹" : "$";
    return `${symbol}${parseFloat(amount).toLocaleString()}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isPayoutOperating = (payoutId) => {
    return operatingPayoutId === payoutId && processPayoutLoading;
  };

  const canProcessPayout = (payout) => {
    return payout.status === "PENDING";
  };

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-blue-50/50 via-indigo-50/50 to-cyan-50/50 dark:from-slate-900/50 dark:via-slate-800/50 dark:to-gray-900/50 min-h-screen">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
            <Wallet className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
              Payout Management
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Manage instructor payouts and earnings
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            className="rounded-xl border-white/50 bg-white/30 backdrop-blur-sm hover:bg-white/50"
            disabled={payoutsLoading}
          >
            {payoutsLoading ? (
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4">
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
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
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

            <Input
              type="number"
              placeholder="Max Amount"
              value={localFilters.maxAmount}
              onChange={(e) =>
                handleLocalFilterChange("maxAmount", e.target.value)
              }
              className="rounded-xl border-white/50 bg-white/50 backdrop-blur-sm"
            />

            <Input
              placeholder="Instructor ID"
              value={localFilters.instructorId}
              onChange={(e) =>
                handleLocalFilterChange("instructorId", e.target.value)
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
            <span>Payouts ({payoutsPagination?.total || 0})</span>
            <div className="flex items-center space-x-2">
              <Badge className="bg-gradient-to-r from-indigo-500 to-blue-500 text-white">
                Page {payoutsPagination?.page || 1} of{" "}
                {payoutsPagination?.totalPages || 1}
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
                    Instructor
                  </TableHead>
                  <TableHead className="text-slate-700 dark:text-slate-300">
                    Amount
                  </TableHead>
                  <TableHead className="text-slate-700 dark:text-slate-300">
                    Status
                  </TableHead>
                  <TableHead className="text-slate-700 dark:text-slate-300">
                    Requested
                  </TableHead>
                  <TableHead className="text-slate-700 dark:text-slate-300">
                    Processed
                  </TableHead>
                  <TableHead className="text-slate-700 dark:text-slate-300">
                    Gateway ID
                  </TableHead>
                  <TableHead className="text-slate-700 dark:text-slate-300">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payoutsLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex items-center justify-center space-x-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span className="text-slate-600 dark:text-slate-400">
                          Loading payouts...
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : payouts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex flex-col items-center space-y-2">
                        <Wallet className="w-12 h-12 text-slate-400" />
                        <p className="text-slate-600 dark:text-slate-400">
                          No payouts found
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  payouts.map((payout) => (
                    <TableRow
                      key={payout.id}
                      className={cn(
                        "border-b border-white/10 dark:border-slate-700/30 hover:bg-white/30 dark:hover:bg-slate-700/30",
                        isPayoutOperating(payout.id) && "opacity-60"
                      )}
                    >
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8 ring-2 ring-white/50 dark:ring-slate-600/50">
                            <AvatarImage
                              src={payout.instructor?.profileImage}
                            />
                            <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-blue-500 text-white text-xs">
                              {payout.instructor?.name
                                ?.charAt(0)
                                ?.toUpperCase() || "I"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-slate-800 dark:text-white">
                              {payout.instructor?.name || "N/A"}
                            </p>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              {payout.instructor?.email || "N/A"}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <DollarSign className="w-4 h-4 text-green-500" />
                          <span className="font-semibold text-slate-800 dark:text-white">
                            {formatCurrency(payout.amount, payout.currency)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(payout.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                          <Calendar className="w-3 h-3 mr-1" />
                          {formatDate(payout.requestedAt)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                          <Calendar className="w-3 h-3 mr-1" />
                          {formatDate(payout.processedAt)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {payout.gatewayId ? (
                          <Badge
                            variant="outline"
                            className="font-mono text-xs"
                          >
                            {payout.gatewayId}
                          </Badge>
                        ) : (
                          <span className="text-sm text-slate-400">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {canProcessPayout(payout) && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 rounded-lg hover:bg-white/50 dark:hover:bg-slate-700/50"
                                  disabled={isPayoutOperating(payout.id)}
                                >
                                  {isPayoutOperating(payout.id) ? (
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
                                  onClick={() => handleProcessPayout(payout)}
                                  className="cursor-pointer text-green-600 dark:text-green-400"
                                >
                                  <Send className="w-4 h-4" />
                                  <span className="ml-2">Process Payout</span>
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

          {payoutsPagination?.totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-white/20 dark:border-slate-700/50">
              <div className="flex items-center space-x-2">
                <Button
                  onClick={() => handlePageChange(payoutsPagination.page - 1)}
                  disabled={!payoutsPagination.hasPrev}
                  variant="outline"
                  size="sm"
                  className="rounded-xl border-white/50 bg-white/30 backdrop-blur-sm hover:bg-white/50"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>

                <div className="flex items-center space-x-1">
                  {Array.from(
                    { length: Math.min(5, payoutsPagination.totalPages) },
                    (_, i) => {
                      const pageNum = i + 1;
                      return (
                        <Button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          variant={
                            payoutsPagination.page === pageNum
                              ? "default"
                              : "outline"
                          }
                          size="sm"
                          className={cn(
                            "w-8 h-8 p-0 rounded-lg",
                            payoutsPagination.page === pageNum
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
                  onClick={() => handlePageChange(payoutsPagination.page + 1)}
                  disabled={!payoutsPagination.hasNext}
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
                {((payoutsPagination?.page || 1) - 1) *
                  (payoutsPagination?.limit || 20) +
                  1}{" "}
                to{" "}
                {Math.min(
                  (payoutsPagination?.page || 1) *
                    (payoutsPagination?.limit || 20),
                  payoutsPagination?.total || 0
                )}{" "}
                of {payoutsPagination?.total || 0} payouts
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog
        open={isProcessDialogOpen}
        onOpenChange={setIsProcessDialogOpen}
      >
        <AlertDialogContent className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-800 dark:text-white">
              Process Payout
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600 dark:text-slate-400">
              Are you sure you want to process the payout of{" "}
              {selectedPayout &&
                formatCurrency(selectedPayout.amount, selectedPayout.currency)}
              for {selectedPayout?.instructor?.name}? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmProcessPayout}
              disabled={processPayoutLoading}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 rounded-xl"
            >
              {processPayoutLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                "Process Payout"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PayoutPage;
