import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Users,
  MoreVertical,
  Eye,
  Trash2,
  UserCheck,
  UserX,
  Shield,
  ShieldOff,
  Calendar,
  MapPin,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  Ban,
  Unlock,
  GraduationCap,
  BookOpen,
  Crown,
  Filter,
} from "lucide-react";
import {
  getAllUsers,
  updateUserStatus,
  bulkUpdateUsers,
  deleteUser,
  setFilters,
  resetFilters,
} from "@/features/adminSlice/adminUser";
import { useEffect, useState } from "react";

const AdminUsers = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const {
    users,
    pagination,
    filters,
    usersLoading,
    updateUserStatusLoading,
    bulkUpdateUsersLoading,
    deleteUserLoading,
  } = useSelector((state) => state.adminUser);

  const [selectedUsers, setSelectedUsers] = useState([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [isBulkActionDialogOpen, setIsBulkActionDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedAction, setSelectedAction] = useState("");
  const [actionReason, setActionReason] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [bulkAction, setBulkAction] = useState("");
  const [operatingUserId, setOperatingUserId] = useState(null);
  const [localFilters, setLocalFilters] = useState({
    search: "",
    role: "all",
    status: "all",
    isVerified: "all",
    isBanned: "all",
  });

  useEffect(() => {
    dispatch(getAllUsers({}));
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

    if (localFilters.role && localFilters.role !== "all") {
      processedFilters.role = localFilters.role;
    }

    if (localFilters.status && localFilters.status !== "all") {
      processedFilters.status = localFilters.status;
    }

    if (localFilters.isVerified && localFilters.isVerified !== "all") {
      processedFilters.isVerified = localFilters.isVerified;
    }

    if (localFilters.isBanned && localFilters.isBanned !== "all") {
      processedFilters.isBanned = localFilters.isBanned;
    }

    dispatch(setFilters(processedFilters));
    dispatch(getAllUsers(processedFilters));
  };

  const clearFilters = () => {
    const clearedFilters = {
      search: "",
      role: "all",
      status: "all",
      isVerified: "all",
      isBanned: "all",
    };

    setLocalFilters(clearedFilters);
    dispatch(resetFilters());
    dispatch(getAllUsers({}));
  };

  const hasActiveFilters = () => {
    return (
      (localFilters.role && localFilters.role !== "all") ||
      (localFilters.status && localFilters.status !== "all") ||
      (localFilters.isVerified && localFilters.isVerified !== "all") ||
      (localFilters.isBanned && localFilters.isBanned !== "all") ||
      (localFilters.search && localFilters.search.trim())
    );
  };

  const getCurrentFilters = () => {
    const currentFilters = {
      page: filters.page || 1,
      limit: filters.limit || 20,
      sortBy: filters.sortBy || "createdAt",
      sortOrder: filters.sortOrder || "desc",
    };

    if (localFilters.search && localFilters.search.trim()) {
      currentFilters.search = localFilters.search.trim();
    }

    if (localFilters.role && localFilters.role !== "all") {
      currentFilters.role = localFilters.role;
    }

    if (localFilters.status && localFilters.status !== "all") {
      currentFilters.status = localFilters.status;
    }

    if (localFilters.isVerified && localFilters.isVerified !== "all") {
      currentFilters.isVerified = localFilters.isVerified;
    }

    if (localFilters.isBanned && localFilters.isBanned !== "all") {
      currentFilters.isBanned = localFilters.isBanned;
    }

    return currentFilters;
  };

  const handleRefresh = () => {
    const currentFilters = getCurrentFilters();
    dispatch(getAllUsers(currentFilters));
  };

  const handlePageChange = (page) => {
    const newFilters = {
      ...getCurrentFilters(),
      page,
    };
    dispatch(setFilters(newFilters));
    dispatch(getAllUsers(newFilters));
  };

  const handlePaginationAfterDelete = () => {
    if (pagination.page > 1 && users.length === 1) {
      const newPage = pagination.page - 1;
      handlePageChange(newPage);
    }
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === "Enter") {
      applyFilters();
    }
  };

  const handleUserSelect = (userId) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    setSelectedUsers(
      selectedUsers.length === users.length ? [] : users.map((user) => user.id)
    );
  };

  const handleUserAction = async (user, action) => {
    setSelectedUser(user);
    setSelectedAction(action);

    if (action === "delete") {
      setIsDeleteDialogOpen(true);
    } else {
      setIsStatusDialogOpen(true);
    }
  };

  const handleStatusUpdate = async () => {
    try {
      setOperatingUserId(selectedUser.id);

      await dispatch(
        updateUserStatus({
          userId: selectedUser.id,
          action: selectedAction,
          reason: actionReason,
        })
      ).unwrap();

      setIsStatusDialogOpen(false);
      setSelectedUser(null);
      setSelectedAction("");
      setActionReason("");
      setOperatingUserId(null);

      if (hasActiveFilters()) {
        const currentFilters = getCurrentFilters();
        dispatch(getAllUsers(currentFilters));
      }
    } catch (error) {
      console.error("Status update failed:", error);
      setOperatingUserId(null);
    }
  };

  const handleUserDelete = async () => {
    try {
      setOperatingUserId(selectedUser.id);

      await dispatch(
        deleteUser({
          userId: selectedUser.id,
          reason: actionReason,
          confirmEmail: confirmEmail,
        })
      ).unwrap();

      setIsDeleteDialogOpen(false);
      setSelectedUser(null);
      setActionReason("");
      setConfirmEmail("");
      setOperatingUserId(null);

      setSelectedUsers((prev) => prev.filter((id) => id !== selectedUser.id));

      handlePaginationAfterDelete();
    } catch (error) {
      console.error("Delete failed:", error);
      setOperatingUserId(null);
    }
  };

  const handleBulkAction = async () => {
    try {
      await dispatch(
        bulkUpdateUsers({
          userIds: selectedUsers,
          action: bulkAction,
          reason: actionReason,
        })
      ).unwrap();

      setIsBulkActionDialogOpen(false);
      setSelectedUsers([]);
      setBulkAction("");
      setActionReason("");

      if (hasActiveFilters()) {
        const currentFilters = getCurrentFilters();
        dispatch(getAllUsers(currentFilters));
      }
    } catch (error) {
      console.error("Bulk action failed:", error);
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case "ADMIN":
        return <Crown className="w-4 h-4" />;
      case "INSTRUCTOR":
        return <GraduationCap className="w-4 h-4" />;
      case "STUDENT":
        return <BookOpen className="w-4 h-4" />;
      default:
        return <Users className="w-4 h-4" />;
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case "ADMIN":
        return "bg-gradient-to-r from-purple-500 to-pink-500";
      case "INSTRUCTOR":
        return "bg-gradient-to-r from-indigo-500 to-blue-500";
      case "STUDENT":
        return "bg-gradient-to-r from-green-500 to-teal-500";
      default:
        return "bg-gradient-to-r from-gray-500 to-slate-500";
    }
  };

  const getStatusBadge = (user) => {
    if (user.isBanned) {
      return (
        <Badge className="bg-gradient-to-r from-red-500 to-red-600 text-white">
          <Ban className="w-3 h-3 mr-1" />
          Banned
        </Badge>
      );
    }
    if (!user.isActive) {
      return (
        <Badge className="bg-gradient-to-r from-orange-500 to-amber-500 text-white">
          <AlertCircle className="w-3 h-3 mr-1" />
          Inactive
        </Badge>
      );
    }
    return (
      <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">
        <CheckCircle className="w-3 h-3 mr-1" />
        Active
      </Badge>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getActionButtons = (user) => {
    const actions = [];

    if (user.isActive) {
      actions.push({
        label: "Deactivate",
        action: "deactivate",
        icon: <UserX className="w-4 h-4" />,
        variant: "destructive",
      });
    } else {
      actions.push({
        label: "Activate",
        action: "activate",
        icon: <UserCheck className="w-4 h-4" />,
        variant: "default",
      });
    }

    if (user.isBanned) {
      actions.push({
        label: "Unban",
        action: "unban",
        icon: <Unlock className="w-4 h-4" />,
        variant: "default",
      });
    } else {
      actions.push({
        label: "Ban",
        action: "ban",
        icon: <Ban className="w-4 h-4" />,
        variant: "destructive",
      });
    }

    if (user.isVerified) {
      actions.push({
        label: "Unverify",
        action: "unverify",
        icon: <ShieldOff className="w-4 h-4" />,
        variant: "destructive",
      });
    } else {
      actions.push({
        label: "Verify",
        action: "verify",
        icon: <Shield className="w-4 h-4" />,
        variant: "default",
      });
    }

    return actions;
  };

  const isUserOperating = (userId) => {
    return (
      operatingUserId === userId &&
      (updateUserStatusLoading || deleteUserLoading)
    );
  };

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-blue-50/50 via-indigo-50/50 to-cyan-50/50 dark:from-slate-900/50 dark:via-slate-800/50 dark:to-gray-900/50 min-h-screen">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
              User Management
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Manage and monitor all platform users
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            className="rounded-xl border-white/50 bg-white/30 backdrop-blur-sm hover:bg-white/50"
            disabled={usersLoading}
          >
            {usersLoading ? (
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
            <div className="xl:col-span-2">
              <Input
                placeholder="Search users..."
                value={localFilters.search}
                onChange={(e) =>
                  handleLocalFilterChange("search", e.target.value)
                }
                onKeyPress={handleSearchKeyPress}
                className="rounded-xl border-white/50 bg-white/50 backdrop-blur-sm"
              />
            </div>

            <div className="flex gap-2 items-center justify-center">
              Role
              <Select
                value={localFilters.role}
                onValueChange={(value) =>
                  handleLocalFilterChange("role", value)
                }
              >
                <SelectTrigger className="rounded-xl border-white/50 bg-white/50 backdrop-blur-sm">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="INSTRUCTOR">Instructor</SelectItem>
                  <SelectItem value="STUDENT">Student</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-center gap-2">
              Status
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
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-center gap-2">
              Verification Status
              <Select
                value={localFilters.isVerified}
                onValueChange={(value) =>
                  handleLocalFilterChange("isVerified", value)
                }
              >
                <SelectTrigger className="rounded-xl border-white/50 bg-white/50 backdrop-blur-sm">
                  <SelectValue placeholder="Verified" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="true">Verified</SelectItem>
                  <SelectItem value="false">Unverified</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-center gap-2">
              Banned Status
              <Select
                value={localFilters.isBanned}
                onValueChange={(value) =>
                  handleLocalFilterChange("isBanned", value)
                }
              >
                <SelectTrigger className="rounded-xl border-white/50 bg-white/50 backdrop-blur-sm">
                  <SelectValue placeholder="Banned" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="true">Banned</SelectItem>
                  <SelectItem value="false">Not Banned</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={applyFilters}
              className="bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-white rounded-xl"
            >
              <Filter className="w-4 h-4 mr-2" />
              Apply Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {selectedUsers.length > 0 && (
        <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border border-white/50 dark:border-slate-700/50 shadow-xl rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {selectedUsers.length} user(s) selected
              </span>
              <div className="flex items-center space-x-2">
                <Select value={bulkAction} onValueChange={setBulkAction}>
                  <SelectTrigger className="w-40 rounded-xl border-white/50 bg-white/50 backdrop-blur-sm">
                    <SelectValue placeholder="Bulk Action" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="activate">Activate</SelectItem>
                    <SelectItem value="deactivate">Deactivate</SelectItem>
                    <SelectItem value="ban">Ban</SelectItem>
                    <SelectItem value="unban">Unban</SelectItem>
                    <SelectItem value="verify">Verify</SelectItem>
                    <SelectItem value="unverify">Unverify</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  onClick={() => setIsBulkActionDialogOpen(true)}
                  disabled={!bulkAction || bulkUpdateUsersLoading}
                  className="bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-white rounded-xl"
                >
                  {bulkUpdateUsersLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Apply"
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border border-white/50 dark:border-slate-700/50 shadow-xl rounded-2xl">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-slate-800 dark:text-white flex items-center justify-between">
            <span>Users ({pagination?.total || 0})</span>
            <div className="flex items-center space-x-2">
              <Badge className="bg-gradient-to-r from-indigo-500 to-blue-500 text-white">
                Page {pagination?.page || 1} of {pagination?.totalPages || 1}
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-white/20 dark:border-slate-700/50">
                  <TableHead className="w-12">
                    <Checkbox
                      checked={
                        selectedUsers.length === users.length &&
                        users.length > 0
                      }
                      onCheckedChange={handleSelectAll}
                      className="rounded"
                    />
                  </TableHead>
                  <TableHead className="text-slate-700 dark:text-slate-300">
                    User
                  </TableHead>
                  <TableHead className="text-slate-700 dark:text-slate-300">
                    Role
                  </TableHead>
                  <TableHead className="text-slate-700 dark:text-slate-300">
                    Status
                  </TableHead>
                  <TableHead className="text-slate-700 dark:text-slate-300">
                    Verified
                  </TableHead>
                  <TableHead className="text-slate-700 dark:text-slate-300">
                    Joined
                  </TableHead>
                  <TableHead className="text-slate-700 dark:text-slate-300">
                    Last Login
                  </TableHead>
                  <TableHead className="text-slate-700 dark:text-slate-300">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usersLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="flex items-center justify-center space-x-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span className="text-slate-600 dark:text-slate-400">
                          Loading users...
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="flex flex-col items-center space-y-2">
                        <Users className="w-12 h-12 text-slate-400" />
                        <p className="text-slate-600 dark:text-slate-400">
                          No users found
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow
                      key={user.id}
                      className={cn(
                        "border-b border-white/10 dark:border-slate-700/30 hover:bg-white/30 dark:hover:bg-slate-700/30",
                        isUserOperating(user.id) && "opacity-60"
                      )}
                    >
                      <TableCell>
                        <Checkbox
                          checked={selectedUsers.includes(user.id)}
                          onCheckedChange={() => handleUserSelect(user.id)}
                          className="rounded"
                          disabled={isUserOperating(user.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8 ring-2 ring-white/50 dark:ring-slate-600/50">
                            <AvatarImage src={user.profileImage} />
                            <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-blue-500 text-white text-xs">
                              {user.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-slate-800 dark:text-white">
                              {user.name}
                            </p>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              {user.email}
                            </p>
                            {user.country && (
                              <p className="text-xs text-slate-500 dark:text-slate-500 flex items-center">
                                <MapPin className="w-3 h-3 mr-1" />
                                {user.country}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={cn(
                            "text-white",
                            getRoleBadgeColor(user.role)
                          )}
                        >
                          {getRoleIcon(user.role)}
                          <span className="ml-1">{user.role}</span>
                        </Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(user)}</TableCell>
                      <TableCell>
                        {user.isVerified ? (
                          <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Verified
                          </Badge>
                        ) : (
                          <Badge className="bg-gradient-to-r from-gray-500 to-slate-500 text-white">
                            <XCircle className="w-3 h-3 mr-1" />
                            Unverified
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                          <Calendar className="w-3 h-3 mr-1" />
                          {formatDate(user.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {user.lastLogin ? (
                          <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                            <Calendar className="w-3 h-3 mr-1" />
                            {formatDate(user.lastLogin)}
                          </div>
                        ) : (
                          <span className="text-sm text-slate-400">Never</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            onClick={() => navigate(`/admin/users/${user.id}`)}
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 rounded-lg hover:bg-white/50 dark:hover:bg-slate-700/50"
                            disabled={isUserOperating(user.id)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 rounded-lg hover:bg-white/50 dark:hover:bg-slate-700/50"
                                disabled={isUserOperating(user.id)}
                              >
                                {isUserOperating(user.id) ? (
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
                              {getActionButtons(user).map((action) => (
                                <DropdownMenuItem
                                  key={action.action}
                                  onClick={() =>
                                    handleUserAction(user, action.action)
                                  }
                                  className={cn(
                                    "cursor-pointer",
                                    action.variant === "destructive" &&
                                      "text-red-600 dark:text-red-400"
                                  )}
                                >
                                  {action.icon}
                                  <span className="ml-2">{action.label}</span>
                                </DropdownMenuItem>
                              ))}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleUserAction(user, "delete")}
                                className="cursor-pointer text-red-600 dark:text-red-400"
                              >
                                <Trash2 className="w-4 h-4" />
                                <span className="ml-2">Delete</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {pagination?.totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-white/20 dark:border-slate-700/50">
              <div className="flex items-center space-x-2">
                <Button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={!pagination.hasPrev}
                  variant="outline"
                  size="sm"
                  className="rounded-xl border-white/50 bg-white/30 backdrop-blur-sm hover:bg-white/50"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>

                <div className="flex items-center space-x-1">
                  {Array.from(
                    { length: Math.min(5, pagination.totalPages) },
                    (_, i) => {
                      const pageNum = i + 1;
                      return (
                        <Button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          variant={
                            pagination.page === pageNum ? "default" : "outline"
                          }
                          size="sm"
                          className={cn(
                            "w-8 h-8 p-0 rounded-lg",
                            pagination.page === pageNum
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
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={!pagination.hasNext}
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
                {((pagination?.page || 1) - 1) * (pagination?.limit || 20) + 1}{" "}
                to{" "}
                {Math.min(
                  (pagination?.page || 1) * (pagination?.limit || 20),
                  pagination?.total || 0
                )}{" "}
                of {pagination?.total || 0} users
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog
        open={isStatusDialogOpen}
        onOpenChange={setIsStatusDialogOpen}
      >
        <AlertDialogContent className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-800 dark:text-white">
              {selectedAction === "activate"
                ? "Activate"
                : selectedAction === "deactivate"
                ? "Deactivate"
                : selectedAction === "ban"
                ? "Ban"
                : selectedAction === "unban"
                ? "Unban"
                : selectedAction === "verify"
                ? "Verify"
                : "Unverify"}{" "}
              User
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600 dark:text-slate-400">
              Are you sure you want to {selectedAction} {selectedUser?.name}?
              {(selectedAction === "ban" || selectedAction === "deactivate") &&
                " Please provide a reason."}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {(selectedAction === "ban" || selectedAction === "deactivate") && (
            <div className="py-4">
              <Textarea
                placeholder="Enter reason for this action..."
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                className="rounded-xl border-white/50 bg-white/50 backdrop-blur-sm"
                rows={3}
              />
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleStatusUpdate}
              disabled={
                updateUserStatusLoading ||
                ((selectedAction === "ban" ||
                  selectedAction === "deactivate") &&
                  !actionReason)
              }
              className={cn(
                "rounded-xl",
                selectedAction === "ban" ||
                  selectedAction === "deactivate" ||
                  selectedAction === "unverify"
                  ? "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                  : "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
              )}
            >
              {updateUserStatusLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                `${
                  selectedAction === "activate"
                    ? "Activate"
                    : selectedAction === "deactivate"
                    ? "Deactivate"
                    : selectedAction === "ban"
                    ? "Ban"
                    : selectedAction === "unban"
                    ? "Unban"
                    : selectedAction === "verify"
                    ? "Verify"
                    : "Unverify"
                } User`
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-800 dark:text-white">
              Delete User
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600 dark:text-slate-400">
              This action cannot be undone. Please confirm by typing the user's
              email address.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                User Email: {selectedUser?.email}
              </label>
              <Input
                placeholder="Type the email to confirm"
                value={confirmEmail}
                onChange={(e) => setConfirmEmail(e.target.value)}
                className="mt-2 rounded-xl border-white/50 bg-white/50 backdrop-blur-sm"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Reason for deletion
              </label>
              <Textarea
                placeholder="Enter reason for deletion..."
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                className="mt-2 rounded-xl border-white/50 bg-white/50 backdrop-blur-sm"
                rows={3}
              />
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUserDelete}
              disabled={
                deleteUserLoading ||
                confirmEmail !== selectedUser?.email ||
                !actionReason
              }
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-xl"
            >
              {deleteUserLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                "Delete User"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={isBulkActionDialogOpen}
        onOpenChange={setIsBulkActionDialogOpen}
      >
        <AlertDialogContent className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-800 dark:text-white">
              Bulk {bulkAction} Users
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600 dark:text-slate-400">
              Are you sure you want to {bulkAction} {selectedUsers.length}{" "}
              selected users?
              {(bulkAction === "ban" || bulkAction === "deactivate") &&
                " Please provide a reason."}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {(bulkAction === "ban" || bulkAction === "deactivate") && (
            <div className="py-4">
              <Textarea
                placeholder="Enter reason for this bulk action..."
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                className="rounded-xl border-white/50 bg-white/50 backdrop-blur-sm"
                rows={3}
              />
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkAction}
              disabled={
                bulkUpdateUsersLoading ||
                ((bulkAction === "ban" || bulkAction === "deactivate") &&
                  !actionReason)
              }
              className={cn(
                "rounded-xl",
                bulkAction === "ban" ||
                  bulkAction === "deactivate" ||
                  bulkAction === "unverify"
                  ? "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                  : "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
              )}
            >
              {bulkUpdateUsersLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                `${bulkAction} Users`
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminUsers;
