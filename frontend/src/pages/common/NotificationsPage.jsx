/* eslint-disable no-unused-vars */
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
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";
import useSocket from "@/hooks/useSocket";
import {
  getNotifications,
  getUnreadCount,
  getNotificationStats,
  markNotificationsAsRead,
  deleteNotification,
  deleteAllReadNotifications,
  getNotificationSettings,
  updateNotificationSettings,
  sendTestNotification,
  setNotificationsFilters,
  resetNotificationsFilters,
  clearError,
} from "@/features/common/notificationSlice";
import {
  Bell,
  Search,
  MoreVertical,
  Eye,
  Trash2,
  Settings,
  RefreshCw,
  Send,
  Save,
  X,
  Loader2,
  Activity,
  CheckCircle,
  AlertCircle,
  Mail,
  Smartphone,
  Monitor,
  MessageCircle,
  Check,
  CheckCheck,
  Clock,
  Archive,
  Star,
  MessageSquare,
  CreditCard,
  GraduationCap,
  UserCheck,
  Zap,
  Award,
  HelpCircle,
  Shield,
  BellRing,
  Megaphone,
  Users,
  TrendingUp,
  Info,
} from "lucide-react";

const NotificationsPage = () => {
  const dispatch = useDispatch();
  const {
    notifications,
    notificationsPagination,
    notificationsFilters,
    notificationStats,
    notificationSettings,
    announcementStats,
    notificationsLoading,
    markReadLoading,
    deleteNotificationLoading,
    deleteAllReadLoading,
    updateSettingsLoading,
    sendTestLoading,
    error,
    pendingMarkAsRead,
    pendingDeletes,
  } = useSelector((state) => state.notification);

  const { isConnected, markNotificationsRead } = useSocket();

  const [selectedNotifications, setSelectedNotifications] = useState([]);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [isTestDialogOpen, setIsTestDialogOpen] = useState(false);
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const [isDeleteAllReadDialogOpen, setIsDeleteAllReadDialogOpen] =
    useState(false);
  const [isAnnouncementStatsDialogOpen, setIsAnnouncementStatsDialogOpen] =
    useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [hasInitialLoaded, setHasInitialLoaded] = useState(false);
  const [realtimeNotifications, setRealtimeNotifications] = useState(new Set());

  const [settingsFormData, setSettingsFormData] = useState({
    email: true,
    push: true,
    inApp: true,
    sms: false,
    assignmentUpdates: true,
    courseUpdates: true,
    accountUpdates: true,
    marketingUpdates: false,
    discussionUpdates: true,
    reviewUpdates: true,
    paymentUpdates: true,
  });

  const [testFormData, setTestFormData] = useState({
    type: "SYSTEM_ANNOUNCEMENT",
    title: "",
    message: "",
    priority: "NORMAL",
  });

  const [stats, setStats] = useState({
    total: 0,
    unread: 0,
    read: 0,
    byPriority: {},
  });

  useEffect(() => {
    if (!hasInitialLoaded) {
      Promise.all([
        dispatch(getNotifications({ page: 1, limit: 20 })),
        dispatch(getUnreadCount()),
        dispatch(getNotificationStats()),
        dispatch(getNotificationSettings()),
      ]);
      setHasInitialLoaded(true);
    }
  }, [dispatch, hasInitialLoaded]);

  useEffect(() => {
    if (isConnected && hasInitialLoaded) {
      dispatch(getNotifications({ page: 1, limit: 20 }));
      dispatch(getUnreadCount());
    }
  }, [isConnected, hasInitialLoaded, dispatch]);

  useEffect(() => {
    setSearchTerm(notificationsFilters.search || "");
  }, [notificationsFilters.search]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  useEffect(() => {
    if (notificationStats) {
      setStats({
        total: notificationStats.total || 0,
        unread: notificationStats.unread || 0,
        read: notificationStats.total - notificationStats.unread || 0,
        byPriority: notificationStats.byPriority || {},
      });
    }
  }, [notificationStats]);

  useEffect(() => {
    if (notificationSettings) {
      setSettingsFormData(notificationSettings);
    }
  }, [notificationSettings]);

  const handleFilterChange = (key, value) => {
    const newFilters = { ...notificationsFilters, [key]: value };
    dispatch(setNotificationsFilters({ [key]: value }));

    if (hasInitialLoaded) {
      setTimeout(() => {
        dispatch(
          getNotifications({
            ...newFilters,
            page: 1,
            limit: notificationsPagination.limit,
          })
        );
      }, 100);
    }
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
    const newFilters = { ...notificationsFilters, search: value };
    dispatch(setNotificationsFilters({ search: value }));

    if (hasInitialLoaded) {
      setTimeout(() => {
        dispatch(
          getNotifications({
            ...newFilters,
            page: 1,
            limit: notificationsPagination.limit,
          })
        );
      }, 300);
    }
  };

  const loadNotifications = () => {
    dispatch(
      getNotifications({
        ...notificationsFilters,
        page: notificationsPagination.page,
        limit: notificationsPagination.limit,
      })
    );
    dispatch(getUnreadCount());
    dispatch(getNotificationStats());
  };

  const handleSelectNotification = (notificationId, checked) => {
    if (checked) {
      setSelectedNotifications((prev) =>
        prev.includes(notificationId) ? prev : [...prev, notificationId]
      );
    } else {
      setSelectedNotifications((prev) =>
        prev.filter((id) => id !== notificationId)
      );
    }
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedNotifications(notifications.map((n) => n.id));
    } else {
      setSelectedNotifications([]);
    }
  };

  const handleMarkAsRead = async (notificationIds, markAll = false) => {
    try {
      await dispatch(
        markNotificationsAsRead({ notificationIds, markAll })
      ).unwrap();

      if (isConnected && !markAll) {
        markNotificationsRead(notificationIds);
      }

      setSelectedNotifications([]);
    } catch (error) {
      toast.error(error.message || "Failed to mark notifications as read");
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    try {
      await dispatch(deleteNotification(notificationId)).unwrap();
      setSelectedNotifications((prev) =>
        prev.filter((id) => id !== notificationId)
      );
    } catch (error) {
      toast.error(error.message || "Failed to delete notification");
    }
  };

  const handleBulkDelete = async () => {
    try {
      const notificationIds = selectedNotifications;
      await Promise.all(
        notificationIds.map((id) => dispatch(deleteNotification(id)).unwrap())
      );
      setSelectedNotifications([]);
      setIsBulkDeleteDialogOpen(false);
    } catch (error) {
      toast.error(error.message || "Failed to delete notifications");
    }
  };

  const handleDeleteAllRead = async () => {
    try {
      await dispatch(deleteAllReadNotifications()).unwrap();
      setIsDeleteAllReadDialogOpen(false);
    } catch (error) {
      toast.error(error.message || "Failed to delete read notifications");
    }
  };

  const handleUpdateSettings = async () => {
    try {
      await dispatch(updateNotificationSettings(settingsFormData)).unwrap();
      setIsSettingsDialogOpen(false);
    } catch (error) {
      toast.error(error.message || "Failed to update settings");
    }
  };

  const handleSendTest = async () => {
    try {
      await dispatch(sendTestNotification(testFormData)).unwrap();
      setIsTestDialogOpen(false);
      setTestFormData({
        type: "SYSTEM_ANNOUNCEMENT",
        title: "",
        message: "",
        priority: "NORMAL",
      });
    } catch (error) {
      toast.error(error.message || "Failed to send test notification");
    }
  };

  const openViewDialog = (notification) => {
    setSelectedNotification(notification);
    setIsViewDialogOpen(true);

    if (!notification.isRead) {
      handleMarkAsRead([notification.id]);
    }
  };

  const getNotificationIcon = (type, isAnnouncement = false) => {
    if (isAnnouncement) {
      return <Megaphone className="w-4 h-4" />;
    }

    switch (type) {
      case "ASSIGNMENT_SUBMITTED":
      case "ASSIGNMENT_GRADED":
        return <GraduationCap className="w-4 h-4" />;
      case "QUIZ_COMPLETED":
      case "QUIZ_GRADED":
        return <HelpCircle className="w-4 h-4" />;
      case "COURSE_PUBLISHED":
      case "COURSE_UPDATED":
        return <Star className="w-4 h-4" />;
      case "NEW_ENROLLMENT":
        return <UserCheck className="w-4 h-4" />;
      case "PAYMENT_RECEIVED":
      case "PAYMENT_FAILED":
      case "REFUND_PROCESSED":
        return <CreditCard className="w-4 h-4" />;
      case "MESSAGE_RECEIVED":
        return <MessageSquare className="w-4 h-4" />;
      case "NEW_REVIEW":
      case "REVIEW_REPLY":
        return <Star className="w-4 h-4" />;
      case "QNA_QUESTION":
      case "QNA_ANSWER":
        return <HelpCircle className="w-4 h-4" />;
      case "CERTIFICATE_ISSUED":
        return <Award className="w-4 h-4" />;
      case "ACHIEVEMENT_UNLOCKED":
        return <Award className="w-4 h-4" />;
      case "SUPPORT_TICKET_CREATED":
      case "SUPPORT_TICKET_UPDATED":
        return <HelpCircle className="w-4 h-4" />;
      case "ACCOUNT_BANNED":
      case "ACCOUNT_REACTIVATED":
        return <Shield className="w-4 h-4" />;
      case "SYSTEM_ANNOUNCEMENT":
        return <Megaphone className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const getNotificationColor = (type, isAnnouncement = false) => {
    if (isAnnouncement) {
      return "bg-gradient-to-r from-purple-500 to-pink-500 text-white";
    }

    switch (type) {
      case "ASSIGNMENT_GRADED":
      case "QUIZ_GRADED":
      case "CERTIFICATE_ISSUED":
      case "ACHIEVEMENT_UNLOCKED":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      case "PAYMENT_FAILED":
      case "ACCOUNT_BANNED":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
      case "PAYMENT_RECEIVED":
      case "REFUND_PROCESSED":
      case "COURSE_PUBLISHED":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
      case "NEW_ENROLLMENT":
      case "NEW_REVIEW":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300";
      case "SYSTEM_ANNOUNCEMENT":
        return "bg-gradient-to-r from-orange-500 to-pink-500 text-white";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "URGENT":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
      case "HIGH":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300";
      case "NORMAL":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
      case "LOW":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
    }
  };

  const getAnnouncementStatsArray = () => {
    return Object.entries(announcementStats).map(([announcementId, stats]) => ({
      id: announcementId,
      ...stats,
      readPercentage:
        stats.totalNotifications > 0
          ? Math.round(
              ((stats.readCount || 0) / stats.totalNotifications) * 100
            )
          : 0,
    }));
  };

  const getTotalAnnouncementStats = () => {
    const statsArray = getAnnouncementStatsArray();
    return statsArray.reduce(
      (acc, stat) => ({
        total: acc.total + (stat.totalNotifications || 0),
        read: acc.read + (stat.readCount || 0),
        unread: acc.unread + (stat.unreadCount || 0),
      }),
      { total: 0, read: 0, unread: 0 }
    );
  };

  if (notificationsLoading && notifications.length === 0) {
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-2xl" />
              ))}
            </div>
            <Skeleton className="h-96 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-cyan-50 dark:from-slate-900 dark:via-slate-800 dark:to-gray-900">
        <div className="container mx-auto px-4 py-8 max-w-7xl relative">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
            <div className="flex items-center space-x-4 mb-4 lg:mb-0">
              <div className="p-3 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-2xl shadow-lg shadow-indigo-300/30 dark:shadow-indigo-500/20">
                <Bell className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-800 dark:text-white">
                  Notifications
                </h1>
                <p className="text-slate-600 dark:text-slate-400">
                  Manage your notifications and preferences
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {realtimeNotifications.size > 0 && (
                <Badge className="rounded-xl shadow-sm bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                  <Activity className="w-3 h-3 mr-1 animate-pulse" />
                  {realtimeNotifications.size} New
                </Badge>
              )}

              <Dialog
                open={isAnnouncementStatsDialogOpen}
                onOpenChange={setIsAnnouncementStatsDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="rounded-xl border-white/50 dark:border-slate-700/50 bg-white/30 dark:bg-slate-800/30 backdrop-blur-sm hover:bg-white/50 dark:hover:bg-slate-700/50"
                  >
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Announcements
                  </Button>
                </DialogTrigger>
              </Dialog>

              <Dialog
                open={isSettingsDialogOpen}
                onOpenChange={setIsSettingsDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="rounded-xl border-white/50 dark:border-slate-700/50 bg-white/30 dark:bg-slate-800/30 backdrop-blur-sm hover:bg-white/50 dark:hover:bg-slate-700/50"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </Button>
                </DialogTrigger>
              </Dialog>

              <Button
                variant="outline"
                onClick={loadNotifications}
                disabled={notificationsLoading}
                className="rounded-xl border-white/50 dark:border-slate-700/50 bg-white/30 dark:bg-slate-800/30 backdrop-blur-sm hover:bg-white/50 dark:hover:bg-slate-700/50"
              >
                <RefreshCw
                  className={cn(
                    "w-4 h-4 mr-2",
                    notificationsLoading && "animate-spin"
                  )}
                />
                Refresh
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 shadow-xl rounded-2xl">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 dark:via-slate-700/10 to-transparent rounded-2xl"></div>
              <CardContent className="p-6 relative">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                      Total
                    </p>
                    <p className="text-2xl font-bold text-slate-800 dark:text-white">
                      {stats.total}
                    </p>
                  </div>
                  <div className="p-2 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-lg shadow-lg">
                    <Bell className="w-5 h-5 text-white" />
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
                      Unread
                    </p>
                    <p className="text-2xl font-bold text-red-600">
                      {stats.unread}
                    </p>
                  </div>
                  <div className="p-2 bg-gradient-to-br from-red-500 to-pink-500 rounded-lg shadow-lg">
                    <AlertCircle className="w-5 h-5 text-white" />
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
                      Read
                    </p>
                    <p className="text-2xl font-bold text-green-600">
                      {stats.read}
                    </p>
                  </div>
                  <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg shadow-lg">
                    <CheckCircle className="w-5 h-5 text-white" />
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
                      Announcements
                    </p>
                    <p className="text-2xl font-bold text-purple-600">
                      {getTotalAnnouncementStats().total}
                    </p>
                  </div>
                  <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg shadow-lg">
                    <Megaphone className="w-5 h-5 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* {selectedNotifications.length > 0 && (
            <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 shadow-xl rounded-2xl mb-6">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {selectedNotifications.length} selected
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const unreadIds = selectedNotifications.filter((id) => {
                          const notification = notifications.find(
                            (n) => n.id === id
                          );
                          return notification && !notification.isRead;
                        });
                        if (unreadIds.length > 0) {
                          handleMarkAsRead(unreadIds);
                        }
                      }}
                      disabled={markReadLoading}
                      className="rounded-xl"
                    >
                      <CheckCheck className="w-4 h-4 mr-1" />
                      Mark Read
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsBulkDeleteDialogOpen(true)}
                      disabled={deleteNotificationLoading}
                      className="rounded-xl text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelectedNotifications([])}
                      className="rounded-xl"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )} */}

          <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 shadow-xl rounded-2xl">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 dark:via-slate-700/10 to-transparent rounded-2xl"></div>
            <CardHeader className="pb-6 relative">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                <CardTitle className="text-slate-800 dark:text-white">
                  All Notifications
                </CardTitle>

                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <Input
                      placeholder="Search notifications..."
                      value={searchTerm}
                      onChange={(e) => handleSearch(e.target.value)}
                      className="pl-10 w-64 rounded-xl bg-white/70 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600"
                    />
                  </div>

                  <Select
                    value={
                      notificationsFilters.isRead !== undefined
                        ? notificationsFilters.isRead.toString()
                        : "all"
                    }
                    onValueChange={(value) =>
                      handleFilterChange(
                        "isRead",
                        value === "all" ? undefined : value === "true"
                      )
                    }
                  >
                    <SelectTrigger className="w-32 rounded-xl bg-white/70 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-lg border border-white/50 dark:border-slate-700/50">
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="false">Unread</SelectItem>
                      <SelectItem value="true">Read</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={notificationsFilters.type || "all"}
                    onValueChange={(value) =>
                      handleFilterChange("type", value === "all" ? "" : value)
                    }
                  >
                    <SelectTrigger className="w-40 rounded-xl bg-white/70 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-lg border border-white/50 dark:border-slate-700/50">
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="ASSIGNMENT_GRADED">
                        Assignment
                      </SelectItem>
                      <SelectItem value="PAYMENT_RECEIVED">Payment</SelectItem>
                      <SelectItem value="COURSE_PUBLISHED">Course</SelectItem>
                      <SelectItem value="SYSTEM_ANNOUNCEMENT">
                        System
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={notificationsFilters.priority || "all"}
                    onValueChange={(value) =>
                      handleFilterChange(
                        "priority",
                        value === "all" ? "" : value
                      )
                    }
                  >
                    <SelectTrigger className="w-32 rounded-xl bg-white/70 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600">
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-lg border border-white/50 dark:border-slate-700/50">
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="URGENT">Urgent</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                      <SelectItem value="NORMAL">Normal</SelectItem>
                      <SelectItem value="LOW">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4">
                <div className="flex items-center space-x-4">
                  <Checkbox
                    checked={
                      notifications.length > 0 &&
                      selectedNotifications.length === notifications.length
                    }
                    onCheckedChange={handleSelectAll}
                    className="rounded"
                  />
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    Select all
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleMarkAsRead([], true)}
                    disabled={markReadLoading}
                    className="rounded-xl"
                  >
                    <CheckCheck className="w-4 h-4 mr-1" />
                    Mark All Read
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsDeleteAllReadDialogOpen(true)}
                    disabled={deleteAllReadLoading}
                    className="rounded-xl text-white"
                  >
                    <Archive className="w-4 h-4 mr-1" />
                    Delete All Read
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="relative">
              <ScrollArea className="h-[600px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead className="text-slate-700 dark:text-slate-300">
                        Notification
                      </TableHead>
                      <TableHead className="text-slate-700 dark:text-slate-300">
                        Type
                      </TableHead>
                      <TableHead className="text-slate-700 dark:text-slate-300">
                        Priority
                      </TableHead>
                      <TableHead className="text-slate-700 dark:text-slate-300">
                        Status
                      </TableHead>
                      <TableHead className="text-slate-700 dark:text-slate-300">
                        Time
                      </TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {notifications.map((notification) => {
                      const isAnnouncement =
                        notification.type === "SYSTEM_ANNOUNCEMENT";
                      return (
                        <TableRow
                          key={notification.id}
                          className={cn(
                            "hover:bg-white/50 dark:hover:bg-slate-700/30 transition-all duration-200 cursor-pointer",
                            !notification.isRead &&
                              "bg-blue-50/50 dark:bg-blue-900/10",
                            isAnnouncement &&
                              !notification.isRead &&
                              "bg-gradient-to-r from-purple-50/50 to-pink-50/50 dark:from-purple-900/10 dark:to-pink-900/10",
                            realtimeNotifications.has(notification.id) &&
                              "bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border-green-200 dark:border-green-700 shadow-lg",
                            pendingMarkAsRead.includes(notification.id) &&
                              "opacity-60",
                            pendingDeletes.includes(notification.id) &&
                              "opacity-40"
                          )}
                          onClick={() => openViewDialog(notification)}
                        >
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={selectedNotifications.includes(
                                notification.id
                              )}
                              onCheckedChange={(checked) =>
                                handleSelectNotification(
                                  notification.id,
                                  checked
                                )
                              }
                              className="rounded"
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-start space-x-3">
                              <div
                                className={cn(
                                  "p-2 rounded-lg shadow-sm mt-1",
                                  getNotificationColor(
                                    notification.type,
                                    isAnnouncement
                                  )
                                )}
                              >
                                {getNotificationIcon(
                                  notification.type,
                                  isAnnouncement
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2">
                                  <span
                                    className={cn(
                                      "font-medium text-slate-800 dark:text-white",
                                      !notification.isRead && "font-semibold"
                                    )}
                                  >
                                    {notification.title}
                                  </span>
                                  {!notification.isRead && (
                                    <div
                                      className={cn(
                                        "w-2 h-2 rounded-full",
                                        isAnnouncement
                                          ? "bg-purple-500"
                                          : "bg-blue-500"
                                      )}
                                    ></div>
                                  )}
                                  {isAnnouncement && (
                                    <Badge className="text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
                                      <Megaphone className="w-3 h-3 mr-1" />
                                      Announcement
                                    </Badge>
                                  )}
                                  {realtimeNotifications.has(
                                    notification.id
                                  ) && (
                                    <Badge className="text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                                      <Activity className="w-3 h-3 mr-1 animate-pulse" />
                                      New
                                    </Badge>
                                  )}
                                </div>
                                <span className="text-sm text-slate-500 dark:text-slate-400 truncate max-w-xs block">
                                  {notification.message}
                                </span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={cn(
                                "rounded-lg shadow-sm text-xs",
                                getNotificationColor(
                                  notification.type,
                                  isAnnouncement
                                )
                              )}
                            >
                              {notification.type.replace(/_/g, " ")}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={cn(
                                "rounded-lg shadow-sm",
                                getPriorityColor(notification.priority)
                              )}
                            >
                              {notification.priority}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-1">
                              {notification.isRead ? (
                                <CheckCheck className="w-4 h-4 text-green-500" />
                              ) : (
                                <Clock className="w-4 h-4 text-orange-500" />
                              )}
                              <span className="text-sm text-slate-600 dark:text-slate-400">
                                {notification.isRead ? "Read" : "Unread"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-slate-600 dark:text-slate-400">
                            {formatDistanceToNow(
                              new Date(notification.createdAt)
                            )}{" "}
                            ago
                          </TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 hover:bg-white/50 dark:hover:bg-slate-700/50 rounded-lg"
                                >
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align="end"
                                className="rounded-xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 shadow-lg"
                              >
                                <DropdownMenuItem
                                  onClick={() => openViewDialog(notification)}
                                  className="rounded-lg"
                                >
                                  <Eye className="w-4 h-4 mr-2" />
                                  View
                                </DropdownMenuItem>
                                {!notification.isRead && (
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleMarkAsRead([notification.id])
                                    }
                                    className="rounded-lg"
                                  >
                                    <Check className="w-4 h-4 mr-2" />
                                    Mark as Read
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleDeleteNotification(notification.id)
                                  }
                                  className="text-red-600 dark:text-red-400 rounded-lg"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>

                {notifications.length === 0 && !notificationsLoading && (
                  <div className="text-center py-12">
                    <Bell className="w-12 h-12 mx-auto text-slate-400 mb-4 opacity-50" />
                    <p className="text-slate-600 dark:text-slate-400">
                      No notifications found
                    </p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          <Dialog
            open={isAnnouncementStatsDialogOpen}
            onOpenChange={setIsAnnouncementStatsDialogOpen}
          >
            <DialogContent className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 shadow-xl rounded-2xl max-w-4xl">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 dark:via-slate-700/10 to-transparent rounded-2xl"></div>
              <div className="relative z-10">
                <DialogHeader>
                  <DialogTitle className="text-slate-800 dark:text-white flex items-center">
                    <Megaphone className="w-5 h-5 mr-2" />
                    Announcement Statistics
                  </DialogTitle>
                  <DialogDescription className="text-slate-600 dark:text-slate-400">
                    View detailed statistics for system announcements.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-purple-100 text-sm">
                              Total Announcements
                            </p>
                            <p className="text-2xl font-bold">
                              {getTotalAnnouncementStats().total}
                            </p>
                          </div>
                          <Megaphone className="w-8 h-8 text-purple-200" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-green-100 text-sm">Read</p>
                            <p className="text-2xl font-bold">
                              {getTotalAnnouncementStats().read}
                            </p>
                          </div>
                          <CheckCircle className="w-8 h-8 text-green-200" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-orange-100 text-sm">Unread</p>
                            <p className="text-2xl font-bold">
                              {getTotalAnnouncementStats().unread}
                            </p>
                          </div>
                          <AlertCircle className="w-8 h-8 text-orange-200" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
                      Individual Announcements
                    </h3>

                    {getAnnouncementStatsArray().length === 0 ? (
                      <div className="text-center py-8">
                        <Info className="w-12 h-12 mx-auto text-slate-400 mb-4 opacity-50" />
                        <p className="text-slate-600 dark:text-slate-400">
                          No announcement statistics available
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {getAnnouncementStatsArray().map((stat) => (
                          <Card
                            key={stat.id}
                            className="bg-white/30 dark:bg-slate-700/30 backdrop-blur-sm border border-white/50 dark:border-slate-600/50"
                          >
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center space-x-3">
                                  <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                                    <Megaphone className="w-4 h-4 text-white" />
                                  </div>
                                  <div>
                                    <p className="font-medium text-slate-800 dark:text-white">
                                      Announcement #{stat.id}
                                    </p>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">
                                      {stat.totalNotifications} total
                                      notifications
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-lg font-bold text-slate-800 dark:text-white">
                                    {stat.readPercentage}%
                                  </p>
                                  <p className="text-xs text-slate-600 dark:text-slate-400">
                                    read rate
                                  </p>
                                </div>
                              </div>

                              <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                  <span className="text-slate-600 dark:text-slate-400">
                                    Progress
                                  </span>
                                  <span className="text-slate-800 dark:text-white">
                                    {stat.readCount || 0} /{" "}
                                    {stat.totalNotifications}
                                  </span>
                                </div>
                                <Progress
                                  value={stat.readPercentage}
                                  className="h-2"
                                />
                              </div>

                              <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-slate-200/50 dark:border-slate-600/50">
                                <div className="text-center">
                                  <p className="text-lg font-semibold text-green-600">
                                    {stat.readCount || 0}
                                  </p>
                                  <p className="text-xs text-slate-600 dark:text-slate-400">
                                    Read
                                  </p>
                                </div>
                                <div className="text-center">
                                  <p className="text-lg font-semibold text-orange-600">
                                    {stat.unreadCount || 0}
                                  </p>
                                  <p className="text-xs text-slate-600 dark:text-slate-400">
                                    Unread
                                  </p>
                                </div>
                                <div className="text-center">
                                  <p className="text-lg font-semibold text-slate-800 dark:text-white">
                                    {stat.totalNotifications}
                                  </p>
                                  <p className="text-xs text-slate-600 dark:text-slate-400">
                                    Total
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsAnnouncementStatsDialogOpen(false)}
                    className="rounded-xl border-slate-200 dark:border-slate-600"
                  >
                    Close
                  </Button>
                </DialogFooter>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
            <DialogContent className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 shadow-xl rounded-2xl max-w-2xl">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 dark:via-slate-700/10 to-transparent rounded-2xl"></div>
              {selectedNotification && (
                <div className="relative z-10">
                  <DialogHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <DialogTitle className="text-slate-800 dark:text-white mb-2">
                          {selectedNotification.title}
                        </DialogTitle>
                        <div className="flex items-center space-x-2 mb-4">
                          <Badge
                            className={cn(
                              "rounded-lg shadow-sm",
                              getNotificationColor(
                                selectedNotification.type,
                                selectedNotification.type ===
                                  "SYSTEM_ANNOUNCEMENT"
                              )
                            )}
                          >
                            {getNotificationIcon(
                              selectedNotification.type,
                              selectedNotification.type ===
                                "SYSTEM_ANNOUNCEMENT"
                            )}
                            <span className="ml-1">
                              {selectedNotification.type.replace(/_/g, " ")}
                            </span>
                          </Badge>
                          <Badge
                            className={cn(
                              "rounded-lg shadow-sm",
                              getPriorityColor(selectedNotification.priority)
                            )}
                          >
                            {selectedNotification.priority}
                          </Badge>
                          {selectedNotification.isRead ? (
                            <Badge className="rounded-lg shadow-sm bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                              <CheckCheck className="w-3 h-3 mr-1" />
                              Read
                            </Badge>
                          ) : (
                            <Badge className="rounded-lg shadow-sm bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">
                              <Clock className="w-3 h-3 mr-1" />
                              Unread
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </DialogHeader>

                  <div className="space-y-4">
                    <div className="bg-white/30 dark:bg-slate-700/30 backdrop-blur-sm rounded-xl p-4">
                      <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                        {selectedNotification.message}
                      </p>
                    </div>

                    {selectedNotification.data && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-600 dark:text-slate-400">
                          Additional Information
                        </Label>
                        <div className="bg-white/30 dark:bg-slate-700/30 backdrop-blur-sm rounded-xl p-4 space-y-3">
                          {selectedNotification.data.type && (
                            <div className="flex justify-between">
                              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                Type:
                              </span>
                              <span className="text-sm text-slate-700 dark:text-slate-300">
                                {selectedNotification.data.type}
                              </span>
                            </div>
                          )}
                          {selectedNotification.data.fullContent && (
                            <div className="space-y-1">
                              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                Full Content:
                              </span>
                              <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                                {selectedNotification.data.fullContent}
                              </p>
                            </div>
                          )}
                          {selectedNotification.data.announcementId && (
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                  Announcement ID:
                                </span>
                                <span className="text-sm text-slate-700 dark:text-slate-300 font-mono">
                                  {selectedNotification.data.announcementId}
                                </span>
                              </div>
                              {announcementStats[
                                selectedNotification.data.announcementId
                              ] && (
                                <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-3 space-y-2">
                                  <div className="flex items-center space-x-2 mb-2">
                                    <Megaphone className="w-4 h-4 text-purple-600" />
                                    <span className="text-sm font-medium text-purple-800 dark:text-purple-300">
                                      Announcement Stats
                                    </span>
                                  </div>
                                  {(() => {
                                    const stats =
                                      announcementStats[
                                        selectedNotification.data.announcementId
                                      ];
                                    const readPercentage =
                                      stats.totalNotifications > 0
                                        ? Math.round(
                                            ((stats.readCount || 0) /
                                              stats.totalNotifications) *
                                              100
                                          )
                                        : 0;
                                    return (
                                      <div className="grid grid-cols-2 gap-3">
                                        <div className="text-center">
                                          <p className="text-lg font-bold text-purple-700 dark:text-purple-300">
                                            {stats.totalNotifications || 0}
                                          </p>
                                          <p className="text-xs text-purple-600 dark:text-purple-400">
                                            Total Sent
                                          </p>
                                        </div>
                                        <div className="text-center">
                                          <p className="text-lg font-bold text-green-600">
                                            {readPercentage}%
                                          </p>
                                          <p className="text-xs text-green-600">
                                            Read Rate
                                          </p>
                                        </div>
                                        <div className="text-center">
                                          <p className="text-lg font-bold text-green-600">
                                            {stats.readCount || 0}
                                          </p>
                                          <p className="text-xs text-green-600">
                                            Read
                                          </p>
                                        </div>
                                        <div className="text-center">
                                          <p className="text-lg font-bold text-orange-600">
                                            {stats.unreadCount || 0}
                                          </p>
                                          <p className="text-xs text-orange-600">
                                            Unread
                                          </p>
                                        </div>
                                      </div>
                                    );
                                  })()}
                                </div>
                              )}
                            </div>
                          )}
                          {selectedNotification.data.targetAudience && (
                            <div className="flex justify-between">
                              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                Target Audience:
                              </span>
                              <Badge className="text-xs">
                                {selectedNotification.data.targetAudience}
                              </Badge>
                            </div>
                          )}
                          {selectedNotification.data.courseId && (
                            <div className="flex justify-between">
                              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                Course ID:
                              </span>
                              <span className="text-sm text-slate-700 dark:text-slate-300 font-mono">
                                {selectedNotification.data.courseId}
                              </span>
                            </div>
                          )}
                          {selectedNotification.data.assignmentId && (
                            <div className="flex justify-between">
                              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                Assignment ID:
                              </span>
                              <span className="text-sm text-slate-700 dark:text-slate-300 font-mono">
                                {selectedNotification.data.assignmentId}
                              </span>
                            </div>
                          )}
                          {selectedNotification.data.amount && (
                            <div className="flex justify-between">
                              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                Amount:
                              </span>
                              <span className="text-sm text-slate-700 dark:text-slate-300">
                                ${selectedNotification.data.amount}
                              </span>
                            </div>
                          )}
                          {selectedNotification.data.grade && (
                            <div className="flex justify-between">
                              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                Grade:
                              </span>
                              <Badge className="text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                                {selectedNotification.data.grade}
                              </Badge>
                            </div>
                          )}
                          {selectedNotification.data.dueDate && (
                            <div className="flex justify-between">
                              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                Due Date:
                              </span>
                              <span className="text-sm text-slate-700 dark:text-slate-300">
                                {format(
                                  new Date(selectedNotification.data.dueDate),
                                  "PPP"
                                )}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-600 dark:text-slate-400">
                          Created
                        </Label>
                        <p className="text-sm text-slate-700 dark:text-slate-300">
                          {format(
                            new Date(selectedNotification.createdAt),
                            "PPP 'at' p"
                          )}
                        </p>
                      </div>
                      {selectedNotification.readAt && (
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-slate-600 dark:text-slate-400">
                            Read At
                          </Label>
                          <p className="text-sm text-slate-700 dark:text-slate-300">
                            {format(
                              new Date(selectedNotification.readAt),
                              "PPP 'at' p"
                            )}
                          </p>
                        </div>
                      )}
                    </div>

                    {selectedNotification.actionUrl && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-600 dark:text-slate-400">
                          Action
                        </Label>
                        <Button
                          asChild
                          className="rounded-xl bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-white"
                        >
                          <a
                            href={selectedNotification.actionUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Take Action
                          </a>
                        </Button>
                      </div>
                    )}
                  </div>

                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsViewDialogOpen(false)}
                      className="rounded-xl border-slate-200 dark:border-slate-600"
                    >
                      Close
                    </Button>
                    {!selectedNotification.isRead && (
                      <Button
                        onClick={() => {
                          handleMarkAsRead([selectedNotification.id]);
                          setIsViewDialogOpen(false);
                        }}
                        className="rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                      >
                        <Check className="w-4 h-4 mr-2" />
                        Mark as Read
                      </Button>
                    )}
                  </DialogFooter>
                </div>
              )}
            </DialogContent>
          </Dialog>

          <Dialog
            open={isSettingsDialogOpen}
            onOpenChange={setIsSettingsDialogOpen}
          >
            <DialogContent className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 shadow-xl rounded-2xl max-w-2xl">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 dark:via-slate-700/10 to-transparent rounded-2xl"></div>
              <div className="relative z-10">
                <DialogHeader>
                  <DialogTitle className="text-slate-800 dark:text-white">
                    Notification Settings
                  </DialogTitle>
                  <DialogDescription className="text-slate-600 dark:text-slate-400">
                    Configure how and when you receive notifications.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                  <div className="space-y-4">
                    <Label className="text-base font-medium text-slate-700 dark:text-slate-300">
                      Delivery Methods
                    </Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center justify-between p-3 bg-white/30 dark:bg-slate-700/30 backdrop-blur-sm rounded-xl">
                        <div className="flex items-center space-x-3">
                          <Mail className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            Email
                          </span>
                        </div>
                        <Switch
                          checked={settingsFormData.email}
                          onCheckedChange={(checked) =>
                            setSettingsFormData({
                              ...settingsFormData,
                              email: checked,
                            })
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between p-3 bg-white/30 dark:bg-slate-700/30 backdrop-blur-sm rounded-xl">
                        <div className="flex items-center space-x-3">
                          <Smartphone className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            Push
                          </span>
                        </div>
                        <Switch
                          checked={settingsFormData.push}
                          onCheckedChange={(checked) =>
                            setSettingsFormData({
                              ...settingsFormData,
                              push: checked,
                            })
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between p-3 bg-white/30 dark:bg-slate-700/30 backdrop-blur-sm rounded-xl">
                        <div className="flex items-center space-x-3">
                          <Monitor className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            In-App
                          </span>
                        </div>
                        <Switch
                          checked={settingsFormData.inApp}
                          onCheckedChange={(checked) =>
                            setSettingsFormData({
                              ...settingsFormData,
                              inApp: checked,
                            })
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between p-3 bg-white/30 dark:bg-slate-700/30 backdrop-blur-sm rounded-xl">
                        <div className="flex items-center space-x-3">
                          <MessageCircle className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            SMS
                          </span>
                        </div>
                        <Switch
                          checked={settingsFormData.sms}
                          onCheckedChange={(checked) =>
                            setSettingsFormData({
                              ...settingsFormData,
                              sms: checked,
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label className="text-base font-medium text-slate-700 dark:text-slate-300">
                      Notification Types
                    </Label>
                    <div className="space-y-3">
                      {[
                        {
                          key: "assignmentUpdates",
                          label: "Assignment Updates",
                          icon: GraduationCap,
                        },
                        {
                          key: "courseUpdates",
                          label: "Course Updates",
                          icon: Star,
                        },
                        {
                          key: "accountUpdates",
                          label: "Account Updates",
                          icon: UserCheck,
                        },
                        {
                          key: "marketingUpdates",
                          label: "Marketing Updates",
                          icon: Zap,
                        },
                        {
                          key: "discussionUpdates",
                          label: "Discussion Updates",
                          icon: MessageSquare,
                        },
                        {
                          key: "reviewUpdates",
                          label: "Review Updates",
                          icon: Star,
                        },
                        {
                          key: "paymentUpdates",
                          label: "Payment Updates",
                          icon: CreditCard,
                        },
                      ].map(({ key, label, icon: Icon }) => (
                        <div
                          key={key}
                          className="flex items-center justify-between p-3 bg-white/30 dark:bg-slate-700/30 backdrop-blur-sm rounded-xl"
                        >
                          <div className="flex items-center space-x-3">
                            <Icon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                              {label}
                            </span>
                          </div>
                          <Switch
                            checked={settingsFormData[key]}
                            onCheckedChange={(checked) =>
                              setSettingsFormData({
                                ...settingsFormData,
                                [key]: checked,
                              })
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsSettingsDialogOpen(false)}
                    className="rounded-xl border-slate-200 dark:border-slate-600"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleUpdateSettings}
                    disabled={updateSettingsLoading}
                    className="rounded-xl bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-white"
                  >
                    {updateSettingsLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Save Settings
                  </Button>
                </DialogFooter>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isTestDialogOpen} onOpenChange={setIsTestDialogOpen}>
            <DialogContent className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 shadow-xl rounded-2xl max-w-xl">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 dark:via-slate-700/10 to-transparent rounded-2xl"></div>
              <div className="relative z-10">
                <DialogHeader>
                  <DialogTitle className="text-slate-800 dark:text-white">
                    Send Test Notification
                  </DialogTitle>
                  <DialogDescription className="text-slate-600 dark:text-slate-400">
                    Send a test notification to yourself.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-slate-700 dark:text-slate-300">
                        Type
                      </Label>
                      <Select
                        value={testFormData.type}
                        onValueChange={(value) =>
                          setTestFormData({ ...testFormData, type: value })
                        }
                      >
                        <SelectTrigger className="rounded-xl bg-white/70 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-lg border border-white/50 dark:border-slate-700/50">
                          <SelectItem value="SYSTEM_ANNOUNCEMENT">
                            System Announcement
                          </SelectItem>
                          <SelectItem value="ASSIGNMENT_GRADED">
                            Assignment Graded
                          </SelectItem>
                          <SelectItem value="PAYMENT_RECEIVED">
                            Payment Received
                          </SelectItem>
                          <SelectItem value="COURSE_PUBLISHED">
                            Course Published
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-700 dark:text-slate-300">
                        Priority
                      </Label>
                      <Select
                        value={testFormData.priority}
                        onValueChange={(value) =>
                          setTestFormData({ ...testFormData, priority: value })
                        }
                      >
                        <SelectTrigger className="rounded-xl bg-white/70 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-lg border border-white/50 dark:border-slate-700/50">
                          <SelectItem value="LOW">Low</SelectItem>
                          <SelectItem value="NORMAL">Normal</SelectItem>
                          <SelectItem value="HIGH">High</SelectItem>
                          <SelectItem value="URGENT">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-700 dark:text-slate-300">
                      Title
                    </Label>
                    <Input
                      value={testFormData.title}
                      onChange={(e) =>
                        setTestFormData({
                          ...testFormData,
                          title: e.target.value,
                        })
                      }
                      placeholder="Test notification title"
                      className="rounded-xl bg-white/70 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-700 dark:text-slate-300">
                      Message
                    </Label>
                    <Textarea
                      value={testFormData.message}
                      onChange={(e) =>
                        setTestFormData({
                          ...testFormData,
                          message: e.target.value,
                        })
                      }
                      placeholder="Test notification message"
                      className="rounded-xl min-h-[100px] bg-white/70 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600"
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsTestDialogOpen(false)}
                    className="rounded-xl border-slate-200 dark:border-slate-600"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSendTest}
                    disabled={
                      sendTestLoading ||
                      !testFormData.title ||
                      !testFormData.message
                    }
                    className="rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                  >
                    {sendTestLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4 mr-2" />
                    )}
                    Send Test
                  </Button>
                </DialogFooter>
              </div>
            </DialogContent>
          </Dialog>

          <AlertDialog
            open={isBulkDeleteDialogOpen}
            onOpenChange={setIsBulkDeleteDialogOpen}
          >
            <AlertDialogContent className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 shadow-xl rounded-2xl">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 dark:via-slate-700/10 to-transparent rounded-2xl"></div>
              <div className="relative z-10">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-slate-800 dark:text-white">
                    Delete Selected Notifications
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-slate-600 dark:text-slate-400">
                    Are you sure you want to delete{" "}
                    {selectedNotifications.length} selected notifications? This
                    action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="rounded-xl border-slate-200 dark:border-slate-600">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleBulkDelete}
                    disabled={deleteNotificationLoading}
                    className="rounded-xl bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white"
                  >
                    {deleteNotificationLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4 mr-2" />
                    )}
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </div>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog
            open={isDeleteAllReadDialogOpen}
            onOpenChange={setIsDeleteAllReadDialogOpen}
          >
            <AlertDialogContent className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 shadow-xl rounded-2xl">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 dark:via-slate-700/10 to-transparent rounded-2xl"></div>
              <div className="relative z-10">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-slate-800 dark:text-white">
                    Delete All Read Notifications
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-slate-600 dark:text-slate-400">
                    Are you sure you want to delete all read notifications? This
                    action cannot be undone and will permanently remove all read
                    notifications.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="rounded-xl border-slate-200 dark:border-slate-600">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAllRead}
                    disabled={deleteAllReadLoading}
                    className="rounded-xl bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white"
                  >
                    {deleteAllReadLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Archive className="w-4 h-4 mr-2" />
                    )}
                    Delete All Read
                  </AlertDialogAction>
                </AlertDialogFooter>
              </div>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </>
  );
};

export default NotificationsPage;
