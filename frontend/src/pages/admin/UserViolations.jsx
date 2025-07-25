/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Users,
  Shield,
  AlertTriangle,
  Ban,
  Clock,
  Search,
  ChevronLeft,
  ChevronRight,
  User,
  Calendar,
  FileText,
  MessageSquare,
  HelpCircle,
  Mail,
  RefreshCw,
  Filter,
  TrendingUp,
  Award,
  Eye,
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
import { useTheme } from "@/components/ThemeProvider";
import {
  getUserViolations,
  setUserViolationsFilters,
  clearError,
  clearSearchedUsers,
} from "@/features/adminSlice/adminModeration";

const UserViolations = () => {
  const { theme } = useTheme();
  const dispatch = useDispatch();

  const userViolations = useSelector(
    (state) => state.adminModeration?.userViolations || []
  );
  const userViolationDetails = useSelector(
    (state) => state.adminModeration?.userViolationDetails
  );
  const searchedUsers = useSelector(
    (state) => state.adminModeration?.searchedUsers || []
  );
  const userViolationsPagination = useSelector(
    (state) =>
      state.adminModeration?.userViolationsPagination || {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      }
  );
  const userViolationsFilters = useSelector(
    (state) =>
      state.adminModeration?.userViolationsFilters || {
        type: "",
        severity: "",
        dateFrom: "",
        dateTo: "",
      }
  );
  const error = useSelector((state) => state.adminModeration?.error);
  const loading = useSelector(
    (state) => state.adminModeration?.loading || false
  );
  const userViolationsLoading = useSelector(
    (state) => state.adminModeration?.userViolationsLoading || false
  );

  const [selectedUserId, setSelectedUserId] = useState("");
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [showUserList, setShowUserList] = useState(false);

  const loadUserViolations = useCallback(() => {
    if (selectedUserId) {
      const params = {
        page: userViolationsPagination.page,
        limit: userViolationsPagination.limit,
        ...userViolationsFilters,
      };
      dispatch(getUserViolations({ searchTerm: selectedUserId, params }));
    }
  }, [
    dispatch,
    selectedUserId,
    userViolationsPagination.page,
    userViolationsPagination.limit,
    userViolationsFilters,
  ]);

  useEffect(() => {
    dispatch(clearError());
    if (selectedUserId) {
      loadUserViolations();
    }
  }, [dispatch, loadUserViolations, selectedUserId]);

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  const handleFilterChange = (key, value) => {
    dispatch(setUserViolationsFilters({ [key]: value }));
  };

  const handleRefresh = () => {
    if (selectedUserId) {
      loadUserViolations();
    }
  };

  const handlePageChange = (newPage) => {
    if (selectedUserId) {
      const params = {
        ...userViolationsFilters,
        page: newPage,
        limit: userViolationsPagination.limit,
      };
      dispatch(getUserViolations({ searchTerm: selectedUserId, params }));
    }
  };

  const handleUserSearch = () => {
    if (userSearchTerm.trim()) {
      console.log("handleUserSearch called with:", userSearchTerm.trim());
      setSelectedUserId("");
      setShowUserList(false);
      dispatch(
        getUserViolations({ searchTerm: userSearchTerm.trim(), params: {} })
      );
    }
  };

  const selectUser = (userId) => {
    setSelectedUserId(userId);
    setShowUserList(false);
    setUserSearchTerm("");
    dispatch(clearSearchedUsers());
  };

  useEffect(() => {
    console.log("SearchedUsers:", searchedUsers);
    console.log("SearchedUsers length:", searchedUsers.length);
    console.log("ShowUserList:", showUserList);
    if (searchedUsers.length > 0) {
      setShowUserList(true);
    } else if (searchedUsers.length === 0 && userViolationDetails) {
      setShowUserList(false);
    }
  }, [searchedUsers, userViolationDetails]);

  const getViolationTypeBadge = (type) => {
    const typeConfig = {
      CONTENT_VIOLATION: {
        bg: "bg-red-100 dark:bg-red-900",
        text: "text-red-700 dark:text-red-300",
      },
      CONTENT_WARNING: {
        bg: "bg-yellow-100 dark:bg-yellow-900",
        text: "text-yellow-700 dark:text-yellow-300",
      },
      USER_WARNING: {
        bg: "bg-orange-100 dark:bg-orange-900",
        text: "text-orange-700 dark:text-orange-300",
      },
      USER_SUSPENSION: {
        bg: "bg-purple-100 dark:bg-purple-900",
        text: "text-purple-700 dark:text-purple-300",
      },
      USER_BAN: {
        bg: "bg-slate-100 dark:bg-slate-900",
        text: "text-slate-700 dark:text-slate-300",
      },
      USER_UNBAN: {
        bg: "bg-green-100 dark:bg-green-900",
        text: "text-green-700 dark:text-green-300",
      },
    };
    const config = typeConfig[type] || typeConfig.CONTENT_WARNING;
    return (
      <Badge className={`${config.bg} ${config.text} rounded-lg text-xs`}>
        {type.replace("_", " ")}
      </Badge>
    );
  };

  const getSeverityBadge = (severity) => {
    const severityConfig = {
      LOW: {
        bg: "bg-blue-100 dark:bg-blue-900",
        text: "text-blue-700 dark:text-blue-300",
      },
      MEDIUM: {
        bg: "bg-yellow-100 dark:bg-yellow-900",
        text: "text-yellow-700 dark:text-yellow-300",
      },
      HIGH: {
        bg: "bg-orange-100 dark:bg-orange-900",
        text: "text-orange-700 dark:text-orange-300",
      },
      CRITICAL: {
        bg: "bg-red-100 dark:bg-red-900",
        text: "text-red-700 dark:text-red-300",
      },
    };
    const config = severityConfig[severity] || severityConfig.LOW;
    return (
      <Badge className={`${config.bg} ${config.text} rounded-lg text-xs`}>
        {severity}
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

  const StatCard = ({
    title,
    value,
    icon: IconComponent,
    subtitle,
    color = "indigo",
  }) => (
    <Card className="bg-white/30 dark:bg-slate-700/30 backdrop-blur-sm border border-white/50 dark:border-slate-700/50 shadow-lg rounded-xl">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div
              className={`p-2 bg-gradient-to-br from-${color}-500 to-${color}-600 rounded-xl shadow-sm`}
            >
              <IconComponent className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300 truncate">
                {title}
              </p>
              <p className="text-xl font-bold text-slate-800 dark:text-white truncate">
                {value}
              </p>
            </div>
          </div>
        </div>
        {subtitle && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 truncate">
            {subtitle}
          </p>
        )}
      </CardContent>
    </Card>
  );

  if (loading && !selectedUserId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50/80 via-indigo-50/80 to-cyan-50/80 dark:from-slate-900/80 dark:via-slate-800/80 dark:to-gray-900/80 backdrop-blur-xl flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-indigo-600 dark:text-indigo-400 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base">
            Loading user violations...
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
                User Violations
              </h1>
              <p className="text-slate-600 dark:text-slate-300 mt-1 text-sm sm:text-base">
                View and analyze user violation history and patterns
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                onClick={handleRefresh}
                disabled={loading || !selectedUserId}
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

          <Card className="bg-white/30 dark:bg-slate-700/30 backdrop-blur-sm border border-white/50 dark:border-slate-700/50 shadow-lg rounded-xl mb-6">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-slate-800 dark:text-white flex items-center">
                <Search className="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400" />
                User Search
              </CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-300 text-sm">
                Search by user ID, name, or email to view violation history
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search by name, email, or user ID..."
                    value={userSearchTerm}
                    onChange={(e) => setUserSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleUserSearch()}
                    className="bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm border border-white/50 dark:border-slate-700/50 rounded-xl"
                  />
                </div>
                <Button
                  onClick={handleUserSearch}
                  disabled={!userSearchTerm.trim() || userViolationsLoading}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl"
                >
                  {userViolationsLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {showUserList && searchedUsers.length > 0 && (
            <Card className="bg-white/30 dark:bg-slate-700/30 backdrop-blur-sm border border-white/50 dark:border-slate-700/50 shadow-lg rounded-xl mb-6">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold text-slate-800 dark:text-white flex items-center">
                  <Users className="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400" />
                  Select User ({searchedUsers.length} found)
                </CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-300 text-sm">
                  Multiple users found for "{userSearchTerm}". Please select one
                  to view violations.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                {console.log("Rendering user list with users:", searchedUsers)}
                <div className="space-y-2">
                  {searchedUsers.map((user) => (
                    <div
                      key={user.id}
                      onClick={() => selectUser(user.id)}
                      className="p-3 bg-white/20 dark:bg-slate-800/30 backdrop-blur-sm rounded-xl border border-white/30 dark:border-slate-600/30 cursor-pointer hover:bg-white/30 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <User className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                            <div>
                              <p className="text-sm font-medium text-slate-800 dark:text-white">
                                {user.name}
                              </p>
                              <p className="text-xs text-slate-600 dark:text-slate-300">
                                {user.email}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-lg text-xs">
                            {user.role}
                          </Badge>
                          {user.isBanned && (
                            <Badge className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-lg text-xs">
                              BANNED
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {error && (
            <Alert className="bg-red-50/50 dark:bg-red-900/20 border border-red-200/50 dark:border-red-800/50 backdrop-blur-sm rounded-xl mb-4 sm:mb-6">
              <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
              <AlertDescription className="text-red-700 dark:text-red-400 text-sm">
                {error}
              </AlertDescription>
            </Alert>
          )}
        </div>

        {userViolationDetails && selectedUserId && !showUserList && (
          <>
            <Card className="bg-white/30 dark:bg-slate-700/30 backdrop-blur-sm border border-white/50 dark:border-slate-700/50 shadow-lg rounded-xl mb-6">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold text-slate-800 dark:text-white flex items-center">
                  <User className="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400" />
                  User Information
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 bg-white/20 dark:bg-slate-800/30 backdrop-blur-sm rounded-xl border border-white/30 dark:border-slate-600/30">
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                      Name
                    </p>
                    <p className="text-sm font-medium text-slate-800 dark:text-white">
                      {userViolationDetails.name}
                    </p>
                  </div>
                  <div className="p-4 bg-white/20 dark:bg-slate-800/30 backdrop-blur-sm rounded-xl border border-white/30 dark:border-slate-600/30">
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                      Email
                    </p>
                    <p className="text-sm font-medium text-slate-800 dark:text-white">
                      {userViolationDetails.email}
                    </p>
                  </div>
                  <div className="p-4 bg-white/20 dark:bg-slate-800/30 backdrop-blur-sm rounded-xl border border-white/30 dark:border-slate-600/30">
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                      Role
                    </p>
                    <Badge className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-lg text-xs">
                      {userViolationDetails.role}
                    </Badge>
                  </div>
                  <div className="p-4 bg-white/20 dark:bg-slate-800/30 backdrop-blur-sm rounded-xl border border-white/30 dark:border-slate-600/30">
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                      Status
                    </p>
                    <Badge
                      className={`rounded-lg text-xs ${
                        userViolationDetails.isBanned
                          ? "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300"
                          : "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                      }`}
                    >
                      {userViolationDetails.isBanned ? "BANNED" : "ACTIVE"}
                    </Badge>
                  </div>
                </div>
                {userViolationDetails.isBanned && (
                  <div className="mt-4 p-4 bg-red-50/50 dark:bg-red-900/20 backdrop-blur-sm rounded-xl border border-red-200/50 dark:border-red-800/50">
                    <div className="flex items-center space-x-2 mb-2">
                      <Ban className="w-4 h-4 text-red-600 dark:text-red-400" />
                      <p className="text-sm font-medium text-red-800 dark:text-red-200">
                        Ban Information
                      </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-xs text-red-600 dark:text-red-400 mb-1">
                          Banned At
                        </p>
                        <p className="text-red-700 dark:text-red-300">
                          {formatDate(userViolationDetails.bannedAt)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-red-600 dark:text-red-400 mb-1">
                          Reason
                        </p>
                        <p className="text-red-700 dark:text-red-300">
                          {userViolationDetails.banReason ||
                            "No reason provided"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:flex-wrap sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div className="flex items-center space-x-2">
                <Label className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 whitespace-nowrap">
                  Type:
                </Label>
                <Select
                  value={
                    userViolationsFilters.type === ""
                      ? "all"
                      : userViolationsFilters.type
                  }
                  onValueChange={(value) =>
                    handleFilterChange("type", value === "all" ? "" : value)
                  }
                >
                  <SelectTrigger className="w-44 bg-white/30 dark:bg-slate-700/30 backdrop-blur-sm border border-white/50 dark:border-slate-700/50 rounded-xl text-xs sm:text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 rounded-xl">
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="CONTENT_VIOLATION">
                      Content Violation
                    </SelectItem>
                    <SelectItem value="CONTENT_WARNING">
                      Content Warning
                    </SelectItem>
                    <SelectItem value="USER_WARNING">User Warning</SelectItem>
                    <SelectItem value="USER_SUSPENSION">
                      User Suspension
                    </SelectItem>
                    <SelectItem value="USER_BAN">User Ban</SelectItem>
                    <SelectItem value="USER_UNBAN">User Unban</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Label className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 whitespace-nowrap">
                  Severity:
                </Label>
                <Select
                  value={
                    userViolationsFilters.severity === ""
                      ? "all"
                      : userViolationsFilters.severity
                  }
                  onValueChange={(value) =>
                    handleFilterChange("severity", value === "all" ? "" : value)
                  }
                >
                  <SelectTrigger className="w-32 bg-white/30 dark:bg-slate-700/30 backdrop-blur-sm border border-white/50 dark:border-slate-700/50 rounded-xl text-xs sm:text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 rounded-xl">
                    <SelectItem value="all">All Severity</SelectItem>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="CRITICAL">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Card className="bg-white/30 dark:bg-slate-700/30 backdrop-blur-sm border border-white/50 dark:border-slate-700/50 shadow-lg rounded-xl mb-6">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold text-slate-800 dark:text-white flex items-center">
                  <Shield className="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400" />
                  Violations ({userViolationsPagination.total})
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {userViolationsLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-600 dark:text-indigo-400" />
                  </div>
                ) : userViolations.length === 0 ? (
                  <div className="text-center py-12">
                    <Shield className="w-12 h-12 mx-auto mb-4 text-slate-400 dark:text-slate-500" />
                    <p className="text-slate-600 dark:text-slate-300 text-lg mb-2">
                      No violations found
                    </p>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">
                      This user has no violations matching your current filters.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {userViolations.map((violation) => (
                      <div
                        key={violation.violationId}
                        className="p-4 bg-white/20 dark:bg-slate-800/30 backdrop-blur-sm rounded-xl border border-white/30 dark:border-slate-600/30"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            {getViolationTypeBadge(violation.violationType)}
                            {getSeverityBadge(violation.severity)}
                          </div>
                          <div className="flex items-center space-x-1 text-xs text-slate-500 dark:text-slate-400">
                            <Calendar className="w-3 h-3" />
                            <span>{formatDate(violation.createdAt)}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                          <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                              Description
                            </p>
                            <p className="text-sm text-slate-800 dark:text-white">
                              {violation.description}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                              Action Taken
                            </p>
                            <p className="text-sm text-slate-700 dark:text-slate-300">
                              {violation.actionTaken}
                            </p>
                          </div>
                        </div>

                        {violation.contentType && (
                          <div className="mb-3">
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                              Content Information
                            </p>
                            <div className="flex items-center space-x-2 text-sm text-slate-700 dark:text-slate-300">
                              {getContentTypeIcon(violation.contentType)}
                              <span>
                                {violation.contentType.replace("_", " ")}
                              </span>
                              {violation.contentId && (
                                <Badge className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded text-xs">
                                  ID: {violation.contentId.slice(0, 8)}...
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}

                        {violation.notes && (
                          <div className="mb-3">
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                              Moderator Notes
                            </p>
                            <p className="text-sm text-slate-700 dark:text-slate-300 bg-slate-100/50 dark:bg-slate-700/50 p-2 rounded-lg">
                              {violation.notes}
                            </p>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-white/20 dark:border-slate-600/20">
                          <div className="flex items-center space-x-1">
                            <User className="w-3 h-3" />
                            <span>Moderated by {violation.moderatorName}</span>
                          </div>
                          <Badge className="bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded text-xs">
                            {violation.violationId.slice(0, 12)}...
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {userViolationsPagination.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/20 dark:border-slate-600/20">
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      Showing{" "}
                      {(userViolationsPagination.page - 1) *
                        userViolationsPagination.limit +
                        1}{" "}
                      to{" "}
                      {Math.min(
                        userViolationsPagination.page *
                          userViolationsPagination.limit,
                        userViolationsPagination.total
                      )}{" "}
                      of {userViolationsPagination.total} violations
                    </p>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handlePageChange(userViolationsPagination.page - 1)
                        }
                        disabled={
                          !userViolationsPagination.hasPrev ||
                          userViolationsLoading
                        }
                        className="bg-white/30 dark:bg-slate-700/30 backdrop-blur-sm border border-white/50 dark:border-slate-700/50 rounded-xl"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <span className="text-sm text-slate-600 dark:text-slate-300">
                        Page {userViolationsPagination.page} of{" "}
                        {userViolationsPagination.totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handlePageChange(userViolationsPagination.page + 1)
                        }
                        disabled={
                          !userViolationsPagination.hasNext ||
                          userViolationsLoading
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
          </>
        )}

        {!selectedUserId && !showUserList && (
          <Card className="bg-white/30 dark:bg-slate-700/30 backdrop-blur-sm border border-white/50 dark:border-slate-700/50 shadow-lg rounded-xl">
            <CardContent className="p-12 text-center">
              <Users className="w-16 h-16 mx-auto mb-4 text-slate-400 dark:text-slate-500" />
              <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-2">
                Select a User
              </h3>
              <p className="text-slate-600 dark:text-slate-300 mb-4">
                Search by name, email, or user ID in the search box above to
                view violation history and details.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default UserViolations;
