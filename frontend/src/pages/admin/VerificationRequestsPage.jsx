/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Filter,
  RefreshCw,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  FileText,
  GraduationCap,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MoreHorizontal,
  Shield,
  Star,
  Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/components/ThemeProvider";
import {
  getAllVerificationRequests,
  getVerificationStats,
  setVerificationFilters,
  resetVerificationFilters,
  clearError,
} from "@/features/adminSlice/adminUser";

const VerificationRequestsPage = () => {
  const { theme } = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const {
    verificationRequests,
    verificationStats,
    verificationRequestsLoading,
    verificationRequestsPagination,
    verificationFilters,
    error,
  } = useSelector((state) => state.adminUser);

  const [localFilters, setLocalFilters] = useState({
    search: "",
    status: "",
    verificationLevel: "",
    priority: "",
  });

  const [requestsData, setRequestsData] = useState(null);

  useEffect(() => {
    dispatch(clearError());
    fetchStats();
  }, [dispatch]);

  useEffect(() => {
    fetchData();
  }, [
    dispatch,
    verificationFilters.status,
    verificationFilters.verificationLevel,
    verificationFilters.priority,
    verificationFilters.search,
    verificationFilters.sortBy,
    verificationFilters.sortOrder,
    verificationRequestsPagination.page,
    verificationRequestsPagination.limit,
  ]);

  const fetchData = async () => {
    const params = {
      page: verificationRequestsPagination.page,
      limit: verificationRequestsPagination.limit,
      ...verificationFilters,
    };
    const result = await dispatch(getAllVerificationRequests(params));
    if (result.payload && result.payload.data) {
      setRequestsData(result.payload.data);
    }
  };

  const fetchStats = () => {
    dispatch(getVerificationStats());
  };

  const handleFilterChange = (key, value) => {
    setLocalFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const applyFilters = () => {
    dispatch(setVerificationFilters(localFilters));
  };

  const clearFilters = () => {
    setLocalFilters({
      search: "",
      status: "",
      verificationLevel: "",
      priority: "",
    });
    dispatch(resetVerificationFilters());
  };

  const handlePageChange = (newPage) => {
    dispatch(setVerificationFilters({ ...verificationFilters, page: newPage }));
  };

  const getStatusBadge = (status) => {
    const variants = {
      PENDING:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
      APPROVED:
        "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
      REJECTED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
      UNDER_REVIEW:
        "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    };

    const icons = {
      PENDING: Clock,
      APPROVED: CheckCircle,
      REJECTED: XCircle,
      UNDER_REVIEW: AlertTriangle,
    };

    const Icon = icons[status] || Clock;

    return (
      <Badge className={`${variants[status]} border-0 font-medium`}>
        <Icon className="w-3 h-3 mr-1" />
        {status.replace("_", " ")}
      </Badge>
    );
  };

  const getVerificationLevelBadge = (level) => {
    const variants = {
      BASIC:
        "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300",
      PREMIUM:
        "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
      EXPERT:
        "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
    };

    const icons = {
      BASIC: Shield,
      PREMIUM: Star,
      EXPERT: Award,
    };

    const Icon = icons[level] || Shield;

    return (
      <Badge className={`${variants[level]} border-0 font-medium`}>
        <Icon className="w-3 h-3 mr-1" />
        {level}
      </Badge>
    );
  };

  const getPriorityBadge = (priority) => {
    const variants = {
      LOW: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
      NORMAL:
        "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
      HIGH: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
      URGENT: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    };

    return (
      <Badge className={`${variants[priority]} border-0 font-medium text-xs`}>
        {priority}
      </Badge>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatsData = () => {
    if (verificationStats && verificationStats.overview) {
      return verificationStats.overview;
    }

    if (requestsData && requestsData.stats) {
      return {
        totalRequests: requestsData.stats.totalRequests || 0,
        pendingRequests: requestsData.stats.pendingRequests || 0,
        approvedRequests: requestsData.stats.approvedRequests || 0,
        underReviewRequests: requestsData.stats.underReviewRequests || 0,
      };
    }

    return {
      totalRequests: 0,
      pendingRequests: 0,
      approvedRequests: 0,
      underReviewRequests: 0,
    };
  };

  const statsData = getStatsData();

  const StatCard = ({ title, value, icon: Icon, color = "indigo" }) => (
    <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 shadow-lg rounded-xl">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
              {title}
            </p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {value}
            </p>
          </div>
          <div
            className={`p-3 rounded-xl bg-${color}-100 dark:bg-${color}-900/30`}
          >
            <Icon
              className={`w-6 h-6 text-${color}-600 dark:text-${color}-400`}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-cyan-50 dark:from-slate-900 dark:via-slate-800 dark:to-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              Verification Requests
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2">
              Manage instructor verification requests and approvals
            </p>
          </div>
          <Button
            onClick={() => {
              fetchData();
              fetchStats();
            }}
            disabled={verificationRequestsLoading}
            className="bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-white rounded-xl"
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${
                verificationRequestsLoading ? "animate-spin" : ""
              }`}
            />
            Refresh
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Requests"
            value={statsData.totalRequests}
            icon={FileText}
            color="slate"
          />
          <StatCard
            title="Pending"
            value={statsData.pendingRequests}
            icon={Clock}
            color="yellow"
          />
          <StatCard
            title="Approved"
            value={statsData.approvedRequests}
            icon={CheckCircle}
            color="green"
          />
          <StatCard
            title="Under Review"
            value={statsData.underReviewRequests}
            icon={AlertTriangle}
            color="blue"
          />
        </div>

        <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 shadow-xl rounded-2xl">
          <CardHeader className="pb-6">
            <CardTitle className="text-xl font-semibold text-slate-900 dark:text-white">
              Filters & Search
            </CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400">
              Filter and search verification requests
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-center">
              <div className="lg:col-span-2">
                <div className="relative mt-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input
                    id="search"
                    value={localFilters.search}
                    onChange={(e) =>
                      handleFilterChange("search", e.target.value)
                    }
                    placeholder="Search by instructor name, email, or request ID..."
                    className="pl-10 bg-white/70 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl"
                  />
                </div>
              </div>

              <div className="flex items-center justify-center gap-2">
                <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Status
                </Label>
                <Select
                  value={localFilters.status || "all"}
                  onValueChange={(value) =>
                    handleFilterChange("status", value === "all" ? "" : value)
                  }
                >
                  <SelectTrigger className="mt-1 bg-white/70 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
                    <SelectItem value="APPROVED">Approved</SelectItem>
                    <SelectItem value="REJECTED">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-center gap-2">
                <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Level
                </Label>
                <Select
                  value={localFilters.verificationLevel || "all"}
                  onValueChange={(value) =>
                    handleFilterChange(
                      "verificationLevel",
                      value === "all" ? "" : value
                    )
                  }
                >
                  <SelectTrigger className="mt-1 bg-white/70 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl">
                    <SelectValue placeholder="All Levels" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="BASIC">Basic</SelectItem>
                    <SelectItem value="PREMIUM">Premium</SelectItem>
                    <SelectItem value="EXPERT">Expert</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-center gap-2">
                <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Priority
                </Label>
                <Select
                  value={localFilters.priority || "all"}
                  onValueChange={(value) =>
                    handleFilterChange("priority", value === "all" ? "" : value)
                  }
                >
                  <SelectTrigger className="mt-1 bg-white/70 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl">
                    <SelectValue placeholder="All Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priority</SelectItem>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="NORMAL">Normal</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="URGENT">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={applyFilters}
                className="bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-white rounded-xl"
              >
                <Filter className="w-4 h-4 mr-2" />
                Apply Filters
              </Button>
              <Button
                onClick={clearFilters}
                variant="outline"
                className="border-slate-200 dark:border-slate-700 rounded-xl"
              >
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>

        {error && (
          <Alert className="bg-red-50/80 dark:bg-red-900/30 border-red-200 dark:border-red-700/50 backdrop-blur-sm rounded-xl">
            <AlertTriangle className="h-4 w-4 text-red-500 dark:text-red-400" />
            <AlertDescription className="text-red-700 dark:text-red-300">
              {error}
            </AlertDescription>
          </Alert>
        )}

        <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 shadow-xl rounded-2xl">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-slate-900 dark:text-white">
              Verification Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            {verificationRequestsLoading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="w-6 h-6 animate-spin text-indigo-500 mr-2" />
                <span className="text-slate-600 dark:text-slate-400">
                  Loading requests...
                </span>
              </div>
            ) : verificationRequests.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600 dark:text-slate-400">
                  No verification requests found
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-200 dark:border-slate-700">
                      <TableHead className="text-slate-700 dark:text-slate-300">
                        Request ID
                      </TableHead>
                      <TableHead className="text-slate-700 dark:text-slate-300">
                        Instructor
                      </TableHead>
                      <TableHead className="text-slate-700 dark:text-slate-300">
                        Level
                      </TableHead>
                      <TableHead className="text-slate-700 dark:text-slate-300">
                        Status
                      </TableHead>
                      <TableHead className="text-slate-700 dark:text-slate-300">
                        Priority
                      </TableHead>
                      <TableHead className="text-slate-700 dark:text-slate-300">
                        Documents
                      </TableHead>
                      <TableHead className="text-slate-700 dark:text-slate-300">
                        Submitted
                      </TableHead>
                      <TableHead className="text-slate-700 dark:text-slate-300">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {verificationRequests.map((request) => (
                      <TableRow
                        key={request.requestId}
                        className="border-slate-200 dark:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-700/30"
                      >
                        <TableCell className="font-mono text-sm text-slate-600 dark:text-slate-400">
                          {request.requestId}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-slate-900 dark:text-white">
                              {request.instructorName}
                            </p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                              {request.instructorEmail}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getVerificationLevelBadge(request.verificationLevel)}
                        </TableCell>
                        <TableCell>{getStatusBadge(request.status)}</TableCell>
                        <TableCell>
                          {getPriorityBadge(request.priority)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                            <div className="flex items-center">
                              <FileText className="w-3 h-3 mr-1" />
                              {request.documentsCount}
                            </div>
                            <div className="flex items-center">
                              <GraduationCap className="w-3 h-3 mr-1" />
                              {request.qualificationsCount}
                            </div>
                            <div className="flex items-center">
                              <Briefcase className="w-3 h-3 mr-1" />
                              {request.experienceCount}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-slate-600 dark:text-slate-400">
                          {formatDate(request.submittedAt)}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-700"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                            >
                              <DropdownMenuItem
                                onClick={() =>
                                  navigate(
                                    `/admin/verification/${request.requestId}`
                                  )
                                }
                                className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700"
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {verificationRequestsPagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  Showing{" "}
                  {(verificationRequestsPagination.page - 1) *
                    verificationRequestsPagination.limit +
                    1}{" "}
                  to{" "}
                  {Math.min(
                    verificationRequestsPagination.page *
                      verificationRequestsPagination.limit,
                    verificationRequestsPagination.total
                  )}{" "}
                  of {verificationRequestsPagination.total} requests
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(1)}
                    disabled={verificationRequestsPagination.page === 1}
                    className="rounded-lg border-slate-200 dark:border-slate-700"
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      handlePageChange(verificationRequestsPagination.page - 1)
                    }
                    disabled={!verificationRequestsPagination.hasPrev}
                    className="rounded-lg border-slate-200 dark:border-slate-700"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="px-3 py-1 text-sm text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 rounded-lg">
                    {verificationRequestsPagination.page} of{" "}
                    {verificationRequestsPagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      handlePageChange(verificationRequestsPagination.page + 1)
                    }
                    disabled={!verificationRequestsPagination.hasNext}
                    className="rounded-lg border-slate-200 dark:border-slate-700"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      handlePageChange(
                        verificationRequestsPagination.totalPages
                      )
                    }
                    disabled={
                      verificationRequestsPagination.page ===
                      verificationRequestsPagination.totalPages
                    }
                    className="rounded-lg border-slate-200 dark:border-slate-700"
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VerificationRequestsPage;
