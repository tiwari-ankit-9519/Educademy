import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Shield,
  Flag,
  Eye,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowUp,
  RefreshCw,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  User,
  Calendar,
  MessageSquare,
  FileText,
  HelpCircle,
  Mail,
  Loader2,
  AlertCircle,
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useTheme } from "@/components/ThemeProvider";
import {
  getContentReports,
  reviewContentReport,
  bulkModerateContent,
  setContentReportsFilters,
  clearError,
} from "@/features/adminSlice/adminModeration";

const ContentReports = () => {
  const { theme } = useTheme();
  const dispatch = useDispatch();

  const contentReports = useSelector(
    (state) => state.adminModeration?.contentReports || []
  );
  const contentReportsPagination = useSelector(
    (state) =>
      state.adminModeration?.contentReportsPagination || {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      }
  );
  const contentReportsFilters = useSelector(
    (state) =>
      state.adminModeration?.contentReportsFilters || {
        status: "PENDING",
        contentType: "",
        priority: "",
        sortBy: "createdAt",
        sortOrder: "desc",
        search: "",
        reportedBy: "",
        dateFrom: "",
        dateTo: "",
      }
  );
  const error = useSelector((state) => state.adminModeration?.error);
  const loading = useSelector(
    (state) => state.adminModeration?.loading || false
  );
  const contentReportsLoading = useSelector(
    (state) => state.adminModeration?.contentReportsLoading || false
  );
  const reviewContentReportLoading = useSelector(
    (state) => state.adminModeration?.reviewContentReportLoading || false
  );
  const bulkModerateContentLoading = useSelector(
    (state) => state.adminModeration?.bulkModerateContentLoading || false
  );

  const [selectedReports, setSelectedReports] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [reviewDialog, setReviewDialog] = useState({
    open: false,
    reportId: null,
    action: null,
  });
  const [bulkDialog, setBulkDialog] = useState({
    open: false,
    action: null,
  });
  const [actionNotes, setActionNotes] = useState("");
  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    setSearchTerm(contentReportsFilters.search || "");
  }, [contentReportsFilters.search]);

  useEffect(() => {
    if (initialLoad) {
      dispatch(clearError());
      const params = {
        page: 1,
        limit: 20,
        status: "PENDING",
        contentType: "",
        priority: "",
        sortBy: "createdAt",
        sortOrder: "desc",
        search: "",
        reportedBy: "",
        dateFrom: "",
        dateTo: "",
      };
      dispatch(getContentReports(params));
      setInitialLoad(false);
    }
  }, [dispatch, initialLoad]);

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  const handleFilterChange = (key, value) => {
    dispatch(setContentReportsFilters({ [key]: value }));
    const params = {
      page: 1,
      limit: contentReportsPagination.limit,
      ...contentReportsFilters,
      [key]: value,
    };
    dispatch(getContentReports(params));
  };

  const handleSearch = () => {
    dispatch(setContentReportsFilters({ search: searchTerm }));
    const params = {
      page: 1,
      limit: contentReportsPagination.limit,
      ...contentReportsFilters,
      search: searchTerm,
    };
    dispatch(getContentReports(params));
  };

  const handleRefresh = () => {
    const params = {
      page: contentReportsPagination.page,
      limit: contentReportsPagination.limit,
      ...contentReportsFilters,
    };
    dispatch(getContentReports(params));
  };

  const handlePageChange = (newPage) => {
    const params = {
      ...contentReportsFilters,
      page: newPage,
      limit: contentReportsPagination.limit,
    };
    dispatch(getContentReports(params));
  };

  const handleSelectReport = (reportId) => {
    setSelectedReports((prev) =>
      prev.includes(reportId)
        ? prev.filter((id) => id !== reportId)
        : [...prev, reportId]
    );
  };

  const handleSelectAll = () => {
    if (selectedReports.length === contentReports.length) {
      setSelectedReports([]);
    } else {
      setSelectedReports(contentReports.map((report) => report.id));
    }
  };

  const handleReview = (reportId, action) => {
    setReviewDialog({ open: true, reportId, action });
  };

  const confirmReview = () => {
    if (reviewDialog.reportId && reviewDialog.action) {
      dispatch(
        reviewContentReport({
          reportId: reviewDialog.reportId,
          action: reviewDialog.action,
          actionTaken: actionNotes,
          moderatorNotes: actionNotes,
        })
      );
      setReviewDialog({ open: false, reportId: null, action: null });
      setActionNotes("");
    }
  };

  const handleBulkAction = (action) => {
    setBulkDialog({ open: true, action });
  };

  const confirmBulkAction = () => {
    if (bulkDialog.action && selectedReports.length > 0) {
      dispatch(
        bulkModerateContent({
          reportIds: selectedReports,
          action: bulkDialog.action,
          reason: actionNotes,
          moderatorNotes: actionNotes,
        })
      );
      setBulkDialog({ open: false, action: null });
      setActionNotes("");
      setSelectedReports([]);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      PENDING: {
        bg: "bg-yellow-100 dark:bg-yellow-900",
        text: "text-yellow-700 dark:text-yellow-300",
      },
      REVIEWED: {
        bg: "bg-blue-100 dark:bg-blue-900",
        text: "text-blue-700 dark:text-blue-300",
      },
      RESOLVED: {
        bg: "bg-green-100 dark:bg-green-900",
        text: "text-green-700 dark:text-green-300",
      },
      ESCALATED: {
        bg: "bg-red-100 dark:bg-red-900",
        text: "text-red-700 dark:text-red-300",
      },
    };
    const config = statusConfig[status] || statusConfig.PENDING;
    return (
      <Badge className={`${config.bg} ${config.text} rounded-lg text-xs`}>
        {status}
      </Badge>
    );
  };

  const getContentTypeIcon = (contentType) => {
    const icons = {
      REVIEW: MessageSquare,
      REVIEW_REPLY: MessageSquare,
      QNA_QUESTION: HelpCircle,
      QNA_ANSWER: HelpCircle,
      MESSAGE: Mail,
    };
    const IconComponent = icons[contentType] || FileText;
    return <IconComponent className="w-4 h-4" />;
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

  if (loading && contentReports.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50/80 via-indigo-50/80 to-cyan-50/80 dark:from-slate-900/80 dark:via-slate-800/80 dark:to-gray-900/80 backdrop-blur-xl flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-indigo-600 dark:text-indigo-400 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base">
            Loading content reports...
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
                Content Reports
              </h1>
              <p className="text-slate-600 dark:text-slate-300 mt-1 text-sm sm:text-base">
                Review and manage reported content from the community
              </p>
            </div>
            <div className="flex items-center space-x-2">
              {selectedReports.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={bulkModerateContentLoading}
                      className="bg-white/30 dark:bg-slate-700/30 backdrop-blur-sm border border-white/50 dark:border-slate-700/50 rounded-xl"
                    >
                      <MoreHorizontal className="w-4 h-4 mr-2" />
                      Bulk Actions ({selectedReports.length})
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 rounded-xl">
                    <DropdownMenuItem
                      onClick={() => handleBulkAction("APPROVE")}
                    >
                      <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                      Approve All
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleBulkAction("REMOVE")}
                    >
                      <XCircle className="w-4 h-4 mr-2 text-red-600" />
                      Remove All
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkAction("WARN")}>
                      <AlertTriangle className="w-4 h-4 mr-2 text-yellow-600" />
                      Warn All
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => handleBulkAction("ESCALATE")}
                    >
                      <ArrowUp className="w-4 h-4 mr-2 text-purple-600" />
                      Escalate All
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
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
            <div className="flex items-center space-x-2 flex-1 sm:flex-initial">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search reports..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                  className="pl-10 bg-white/30 dark:bg-slate-700/30 backdrop-blur-sm border border-white/50 dark:border-slate-700/50 rounded-xl text-sm"
                />
              </div>
              <Button
                onClick={handleSearch}
                size="sm"
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl"
              >
                <Search className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex items-center space-x-2">
              <Label className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 whitespace-nowrap">
                Status:
              </Label>
              <Select
                value={
                  contentReportsFilters.status === ""
                    ? "all"
                    : contentReportsFilters.status
                }
                onValueChange={(value) =>
                  handleFilterChange("status", value === "all" ? "" : value)
                }
              >
                <SelectTrigger className="w-32 bg-white/30 dark:bg-slate-700/30 backdrop-blur-sm border border-white/50 dark:border-slate-700/50 rounded-xl text-xs sm:text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 rounded-xl">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="REVIEWED">Reviewed</SelectItem>
                  <SelectItem value="RESOLVED">Resolved</SelectItem>
                  <SelectItem value="ESCALATED">Escalated</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Label className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 whitespace-nowrap">
                Type:
              </Label>
              <Select
                value={
                  contentReportsFilters.contentType === ""
                    ? "all"
                    : contentReportsFilters.contentType
                }
                onValueChange={(value) =>
                  handleFilterChange(
                    "contentType",
                    value === "all" ? "" : value
                  )
                }
              >
                <SelectTrigger className="w-36 bg-white/30 dark:bg-slate-700/30 backdrop-blur-sm border border-white/50 dark:border-slate-700/50 rounded-xl text-xs sm:text-sm">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 rounded-xl">
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="REVIEW">Review</SelectItem>
                  <SelectItem value="REVIEW_REPLY">Review Reply</SelectItem>
                  <SelectItem value="QNA_QUESTION">Q&A Question</SelectItem>
                  <SelectItem value="QNA_ANSWER">Q&A Answer</SelectItem>
                  <SelectItem value="MESSAGE">Message</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Label className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 whitespace-nowrap">
                Sort:
              </Label>
              <Select
                value={contentReportsFilters.sortBy}
                onValueChange={(value) => handleFilterChange("sortBy", value)}
              >
                <SelectTrigger className="w-32 bg-white/30 dark:bg-slate-700/30 backdrop-blur-sm border border-white/50 dark:border-slate-700/50 rounded-xl text-xs sm:text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 rounded-xl">
                  <SelectItem value="createdAt">Date</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                  <SelectItem value="contentType">Type</SelectItem>
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

        <Card className="bg-white/30 dark:bg-slate-700/30 backdrop-blur-sm border border-white/50 dark:border-slate-700/50 shadow-lg rounded-xl mb-6">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-slate-800 dark:text-white flex items-center">
                <Shield className="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400" />
                Reports ({contentReportsPagination.total})
              </CardTitle>
              {contentReports.length > 0 && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={selectedReports.length === contentReports.length}
                    onCheckedChange={handleSelectAll}
                    className="border-slate-400 dark:border-slate-500"
                  />
                  <Label className="text-sm text-slate-600 dark:text-slate-300">
                    Select All
                  </Label>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {contentReportsLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600 dark:text-indigo-400" />
              </div>
            ) : contentReports.length === 0 ? (
              <div className="text-center py-12">
                <Flag className="w-12 h-12 mx-auto mb-4 text-slate-400 dark:text-slate-500" />
                <p className="text-slate-600 dark:text-slate-300 text-lg mb-2">
                  No reports found
                </p>
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                  There are no content reports matching your current filters.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {contentReports.map((report) => (
                  <div
                    key={report.id}
                    className="p-4 bg-white/20 dark:bg-slate-800/30 backdrop-blur-sm rounded-xl border border-white/30 dark:border-slate-600/30"
                  >
                    <div className="flex items-start space-x-4">
                      <Checkbox
                        checked={selectedReports.includes(report.id)}
                        onCheckedChange={() => handleSelectReport(report.id)}
                        className="mt-1 border-slate-400 dark:border-slate-500"
                      />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            {getContentTypeIcon(report.contentType)}
                            <span className="text-sm font-medium text-slate-800 dark:text-white">
                              {report.contentType.replace("_", " ")}
                            </span>
                            {getStatusBadge(report.status)}
                          </div>
                          <div className="flex items-center space-x-2">
                            {report.status === "PENDING" && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    disabled={reviewContentReportLoading}
                                    className="h-8 w-8 p-0"
                                  >
                                    <MoreHorizontal className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 rounded-xl">
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleReview(report.id, "APPROVE")
                                    }
                                  >
                                    <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                                    Approve
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleReview(report.id, "REMOVE")
                                    }
                                  >
                                    <XCircle className="w-4 h-4 mr-2 text-red-600" />
                                    Remove
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleReview(report.id, "WARN")
                                    }
                                  >
                                    <AlertTriangle className="w-4 h-4 mr-2 text-yellow-600" />
                                    Warn
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleReview(report.id, "ESCALATE")
                                    }
                                  >
                                    <ArrowUp className="w-4 h-4 mr-2 text-purple-600" />
                                    Escalate
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                          <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                              Reason
                            </p>
                            <p className="text-sm text-slate-800 dark:text-white font-medium">
                              {report.reason}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                              Reporter
                            </p>
                            <div className="flex items-center space-x-2">
                              <User className="w-3 h-3 text-slate-400" />
                              <p className="text-sm text-slate-700 dark:text-slate-300">
                                {report.reportedBy.name}
                              </p>
                            </div>
                          </div>
                        </div>

                        {report.description && (
                          <div className="mb-3">
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                              Description
                            </p>
                            <p className="text-sm text-slate-700 dark:text-slate-300">
                              {report.description}
                            </p>
                          </div>
                        )}

                        {report.contentDetails && (
                          <div className="mb-3 p-3 bg-slate-100/50 dark:bg-slate-700/50 rounded-lg">
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                              Content Preview
                            </p>
                            <div className="text-sm text-slate-700 dark:text-slate-300">
                              {report.contentDetails.title && (
                                <p className="font-medium mb-1">
                                  {report.contentDetails.title}
                                </p>
                              )}
                              {report.contentDetails.content && (
                                <p className="line-clamp-2">
                                  {report.contentDetails.content}
                                </p>
                              )}
                              {report.contentDetails.author && (
                                <div className="flex items-center space-x-1 mt-2 text-xs text-slate-500 dark:text-slate-400">
                                  <User className="w-3 h-3" />
                                  <span>
                                    by {report.contentDetails.author.firstName}{" "}
                                    {report.contentDetails.author.lastName}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-3 h-3" />
                              <span>{formatDate(report.createdAt)}</span>
                            </div>
                            {report.reviewedAt && (
                              <div className="flex items-center space-x-1">
                                <Eye className="w-3 h-3" />
                                <span>
                                  Reviewed {formatDate(report.reviewedAt)}
                                </span>
                              </div>
                            )}
                          </div>
                          {report.reviewedBy && (
                            <span className="text-indigo-600 dark:text-indigo-400">
                              by {report.reviewedBy}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {contentReportsPagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/20 dark:border-slate-600/20">
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Showing{" "}
                  {(contentReportsPagination.page - 1) *
                    contentReportsPagination.limit +
                    1}{" "}
                  to{" "}
                  {Math.min(
                    contentReportsPagination.page *
                      contentReportsPagination.limit,
                    contentReportsPagination.total
                  )}{" "}
                  of {contentReportsPagination.total} reports
                </p>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      handlePageChange(contentReportsPagination.page - 1)
                    }
                    disabled={
                      !contentReportsPagination.hasPrev || contentReportsLoading
                    }
                    className="bg-white/30 dark:bg-slate-700/30 backdrop-blur-sm border border-white/50 dark:border-slate-700/50 rounded-xl"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm text-slate-600 dark:text-slate-300">
                    Page {contentReportsPagination.page} of{" "}
                    {contentReportsPagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      handlePageChange(contentReportsPagination.page + 1)
                    }
                    disabled={
                      !contentReportsPagination.hasNext || contentReportsLoading
                    }
                    className="bg-white/30 dark:bg-slate-700/30 backdrop-blur-sm border border-white/50 dark:border-slate-700/50 rounded-xl"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog
          open={reviewDialog.open}
          onOpenChange={(open) => setReviewDialog({ ...reviewDialog, open })}
        >
          <DialogContent className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 rounded-xl">
            <DialogHeader>
              <DialogTitle className="text-slate-800 dark:text-white">
                Confirm Action: {reviewDialog.action}
              </DialogTitle>
              <DialogDescription className="text-slate-600 dark:text-slate-300">
                Are you sure you want to {reviewDialog.action?.toLowerCase()}{" "}
                this report? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-sm text-slate-700 dark:text-slate-300">
                  Action Notes (Optional)
                </Label>
                <Textarea
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  placeholder="Add notes about this action..."
                  className="mt-2 bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm border border-white/50 dark:border-slate-700/50 rounded-xl"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() =>
                  setReviewDialog({ open: false, reportId: null, action: null })
                }
                className="bg-white/30 dark:bg-slate-700/30 backdrop-blur-sm border border-white/50 dark:border-slate-700/50 rounded-xl"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmReview}
                disabled={reviewContentReportLoading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl"
              >
                {reviewContentReportLoading && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                Confirm {reviewDialog.action}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={bulkDialog.open}
          onOpenChange={(open) => setBulkDialog({ ...bulkDialog, open })}
        >
          <DialogContent className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 rounded-xl">
            <DialogHeader>
              <DialogTitle className="text-slate-800 dark:text-white">
                Bulk Action: {bulkDialog.action}
              </DialogTitle>
              <DialogDescription className="text-slate-600 dark:text-slate-300">
                Are you sure you want to {bulkDialog.action?.toLowerCase()}{" "}
                {selectedReports.length} selected reports? This action cannot be
                undone.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-sm text-slate-700 dark:text-slate-300">
                  Action Reason (Optional)
                </Label>
                <Textarea
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  placeholder="Add reason for this bulk action..."
                  className="mt-2 bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm border border-white/50 dark:border-slate-700/50 rounded-xl"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setBulkDialog({ open: false, action: null })}
                className="bg-white/30 dark:bg-slate-700/30 backdrop-blur-sm border border-white/50 dark:border-slate-700/50 rounded-xl"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmBulkAction}
                disabled={bulkModerateContentLoading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl"
              >
                {bulkModerateContentLoading && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                {bulkDialog.action} {selectedReports.length} Reports
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default ContentReports;
