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
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";
import useSocket from "@/hooks/useSocket";
import {
  getAllAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  setAnnouncementsFilters,
  resetAnnouncementsFilters,
  clearError,
  clearLastCreatedAnnouncement,
  onAnnouncementCreated,
  onAnnouncementUpdated,
  onAnnouncementDeleted,
  onAnnouncementStatsUpdated,
  onNotificationStatusUpdate,
} from "@/features/adminSlice/adminSystem";
import {
  Megaphone,
  Plus,
  Search,
  RefreshCw,
  Activity,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  Send,
  Save,
  X,
  Loader2,
  TrendingUp,
  Eye,
  Wifi,
  WifiOff,
  Bell,
  BarChart3,
} from "lucide-react";

const AdminAnnouncementsPage = () => {
  const dispatch = useDispatch();
  const {
    announcements,
    announcementsPagination,
    announcementsFilters,
    announcementsLoading,
    createAnnouncementLoading,
    updateAnnouncementLoading,
    deleteAnnouncementLoading,
    error,
    lastCreatedAnnouncement,
  } = useSelector((state) => state.adminSystem);

  const {
    isConnected,
    emitAnnouncementCreated,
    emitAnnouncementUpdated,
    emitAnnouncementDeleted,
    subscribeToAnnouncementEvents,
    unsubscribeFromAnnouncementEvents,
  } = useSocket();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isStatsDialogOpen, setIsStatsDialogOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [announcementToDelete, setAnnouncementToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [hasInitialLoaded, setHasInitialLoaded] = useState(false);
  const [realtimeChanges, setRealtimeChanges] = useState(new Set());
  const [connectionStatus, setConnectionStatus] = useState("disconnected");

  const [createFormData, setCreateFormData] = useState({
    title: "",
    content: "",
    type: "INFO",
    priority: "NORMAL",
    targetAudience: "ALL",
    isActive: true,
    scheduledFor: "",
    expiresAt: "",
  });

  const [editFormData, setEditFormData] = useState({
    title: "",
    content: "",
    type: "INFO",
    priority: "NORMAL",
    targetAudience: "ALL",
    isActive: true,
    scheduledFor: "",
    expiresAt: "",
  });

  // Track connection status
  useEffect(() => {
    setConnectionStatus(isConnected ? "connected" : "disconnected");
  }, [isConnected]);

  // Socket event handlers
  useEffect(() => {
    if (
      isConnected &&
      subscribeToAnnouncementEvents &&
      unsubscribeFromAnnouncementEvents
    ) {
      const handleAnnouncementCreated = (data) => {
        dispatch(onAnnouncementCreated(data));
        setRealtimeChanges((prev) => new Set([...prev, data.id]));
        toast.success(`New announcement created: ${data.title}`);

        // Remove highlight after 3 seconds
        setTimeout(() => {
          setRealtimeChanges((prev) => {
            const newSet = new Set(prev);
            newSet.delete(data.id);
            return newSet;
          });
        }, 3000);
      };

      const handleAnnouncementUpdated = (data) => {
        dispatch(onAnnouncementUpdated(data));
        setRealtimeChanges((prev) => new Set([...prev, data.id]));
        toast.info(`Announcement updated: ${data.title}`);

        // Remove highlight after 3 seconds
        setTimeout(() => {
          setRealtimeChanges((prev) => {
            const newSet = new Set(prev);
            newSet.delete(data.id);
            return newSet;
          });
        }, 3000);
      };

      const handleAnnouncementDeleted = (data) => {
        dispatch(onAnnouncementDeleted(data));
        toast.info(
          `Announcement deleted: ${
            data.deletedAnnouncement?.title || "Unknown"
          }`
        );
      };

      const handleAnnouncementStatsUpdated = (data) => {
        dispatch(onAnnouncementStatsUpdated(data));
        setRealtimeChanges((prev) => new Set([...prev, data.announcementId]));

        // Remove highlight after 2 seconds for stats updates
        setTimeout(() => {
          setRealtimeChanges((prev) => {
            const newSet = new Set(prev);
            newSet.delete(data.announcementId);
            return newSet;
          });
        }, 2000);
      };

      const handleNotificationStatusUpdate = (data) => {
        dispatch(onNotificationStatusUpdate(data));
      };

      // Subscribe to events
      subscribeToAnnouncementEvents({
        onAnnouncementCreated: handleAnnouncementCreated,
        onAnnouncementUpdated: handleAnnouncementUpdated,
        onAnnouncementDeleted: handleAnnouncementDeleted,
        onAnnouncementStatsUpdated: handleAnnouncementStatsUpdated,
        onNotificationStatusUpdate: handleNotificationStatusUpdate,
      });

      return () => {
        unsubscribeFromAnnouncementEvents();
      };
    }
  }, [
    isConnected,
    subscribeToAnnouncementEvents,
    unsubscribeFromAnnouncementEvents,
    dispatch,
  ]);

  // Initial load
  useEffect(() => {
    if (!hasInitialLoaded) {
      dispatch(getAllAnnouncements({ page: 1, limit: 20 }));
      setHasInitialLoaded(true);
    }
  }, [dispatch, hasInitialLoaded]);

  // Handle search filter
  useEffect(() => {
    setSearchTerm(announcementsFilters.search || "");
  }, [announcementsFilters.search]);

  // Handle errors
  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  // Improved socket emission for created announcements
  useEffect(() => {
    if (isConnected && lastCreatedAnnouncement) {
      try {
        // Emit to other admins
        if (emitAnnouncementCreated) {
          emitAnnouncementCreated(lastCreatedAnnouncement);
        }

        // Also emit notification creation event for users
        if (lastCreatedAnnouncement.isActive) {
          // This should trigger notifications to be sent to users
          // The backend should handle creating and broadcasting notifications
          console.log(
            "Announcement created and should trigger notifications:",
            lastCreatedAnnouncement
          );
        }

        dispatch(clearLastCreatedAnnouncement());
      } catch (error) {
        console.error("Failed to emit announcement creation:", error);
        toast.warning(
          "Announcement created but may not be visible to others immediately"
        );
      }
    }
  }, [isConnected, lastCreatedAnnouncement, emitAnnouncementCreated, dispatch]);

  const handleFilterChange = (key, value) => {
    const newFilters = { ...announcementsFilters, [key]: value };
    dispatch(setAnnouncementsFilters({ [key]: value }));

    if (hasInitialLoaded) {
      setTimeout(() => {
        dispatch(
          getAllAnnouncements({
            ...newFilters,
            page: 1,
            limit: announcementsPagination.limit,
          })
        );
      }, 100);
    }
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
    const newFilters = { ...announcementsFilters, search: value };
    dispatch(setAnnouncementsFilters({ search: value }));

    if (hasInitialLoaded) {
      setTimeout(() => {
        dispatch(
          getAllAnnouncements({
            ...newFilters,
            page: 1,
            limit: announcementsPagination.limit,
          })
        );
      }, 300);
    }
  };

  const loadAnnouncements = () => {
    dispatch(
      getAllAnnouncements({
        ...announcementsFilters,
        page: announcementsPagination.page,
        limit: announcementsPagination.limit,
      })
    );
  };

  const handleCreateAnnouncement = async () => {
    try {
      const result = await dispatch(
        createAnnouncement(createFormData)
      ).unwrap();
      setIsCreateDialogOpen(false);
      setCreateFormData({
        title: "",
        content: "",
        type: "INFO",
        priority: "NORMAL",
        targetAudience: "ALL",
        isActive: true,
        scheduledFor: "",
        expiresAt: "",
      });

      toast.success("Announcement created and notifications sent!");

      // Emit to other connected admins if connected
      if (isConnected && emitAnnouncementCreated) {
        try {
          emitAnnouncementCreated(result.data);
        } catch (error) {
          console.error("Failed to emit announcement creation:", error);
        }
      }
    } catch (error) {
      toast.error(error.message || "Failed to create announcement");
    }
  };

  const handleUpdateAnnouncement = async () => {
    try {
      const result = await dispatch(
        updateAnnouncement({
          announcementId: selectedAnnouncement.id,
          announcementData: editFormData,
        })
      ).unwrap();

      setIsEditDialogOpen(false);
      setSelectedAnnouncement(null);

      toast.success("Announcement updated successfully!");

      // Emit update via socket with improved error handling
      if (isConnected && emitAnnouncementUpdated) {
        try {
          emitAnnouncementUpdated(result.data);
        } catch (error) {
          console.error("Failed to emit announcement update:", error);
          toast.warning(
            "Announcement updated but may not be visible to other admins immediately"
          );
        }
      }
    } catch (error) {
      toast.error(error.message || "Failed to update announcement");
    }
  };

  const handleDeleteAnnouncement = async () => {
    if (!announcementToDelete) return;

    try {
      await dispatch(deleteAnnouncement(announcementToDelete.id)).unwrap();

      setIsDeleteDialogOpen(false);
      setAnnouncementToDelete(null);
      toast.success("Announcement deleted successfully!");

      // Emit deletion via socket
      if (isConnected && emitAnnouncementDeleted) {
        try {
          emitAnnouncementDeleted({
            announcementId: announcementToDelete.id,
            deletedAnnouncement: announcementToDelete,
          });
        } catch (error) {
          console.error("Failed to emit announcement deletion:", error);
          toast.warning(
            "Announcement deleted but may still be visible to other admins temporarily"
          );
        }
      }
    } catch (error) {
      toast.error(error.message || "Failed to delete announcement");
    }
  };

  const openEditDialog = (announcement) => {
    setSelectedAnnouncement(announcement);
    setEditFormData({
      title: announcement.title,
      content: announcement.content,
      type: announcement.type,
      priority: announcement.priority,
      targetAudience: announcement.targetAudience,
      isActive: announcement.isActive,
      scheduledFor: announcement.scheduledFor
        ? format(new Date(announcement.scheduledFor), "yyyy-MM-dd'T'HH:mm")
        : "",
      expiresAt: announcement.expiresAt
        ? format(new Date(announcement.expiresAt), "yyyy-MM-dd'T'HH:mm")
        : "",
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (announcement) => {
    setAnnouncementToDelete(announcement);
    setIsDeleteDialogOpen(true);
  };

  const openStatsDialog = (announcement) => {
    setSelectedAnnouncement(announcement);
    setIsStatsDialogOpen(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      case "scheduled":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
      case "expired":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
      case "inactive":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
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

  const getTypeColor = (type) => {
    switch (type) {
      case "INFO":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
      case "WARNING":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
      case "UPDATE":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      case "MAINTENANCE":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300";
      case "PROMOTION":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
    }
  };

  const getConnectionIcon = () => {
    switch (connectionStatus) {
      case "connected":
        return <Wifi className="w-3 h-3" />;
      case "disconnected":
        return <WifiOff className="w-3 h-3" />;
      default:
        return <Activity className="w-3 h-3" />;
    }
  };

  const getConnectionColor = () => {
    switch (connectionStatus) {
      case "connected":
        return "default";
      case "disconnected":
        return "destructive";
      default:
        return "secondary";
    }
  };

  if (announcementsLoading && announcements.length === 0) {
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
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div className="flex items-center space-x-4 mb-4 lg:mb-0">
            <div className="p-3 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-2xl shadow-lg">
              <Megaphone className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-800 dark:text-white">
                Announcements
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Manage system-wide announcements and notifications
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Badge
              variant={getConnectionColor()}
              className="rounded-xl shadow-sm"
            >
              {getConnectionIcon()}
              {connectionStatus === "connected" ? "Connected" : "Disconnected"}
            </Badge>

            {realtimeChanges.size > 0 && (
              <Badge className="rounded-xl shadow-sm bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                <Activity className="w-3 h-3 mr-1 animate-pulse" />
                {realtimeChanges.size} Live Update
                {realtimeChanges.size > 1 ? "s" : ""}
              </Badge>
            )}

            <Dialog
              open={isCreateDialogOpen}
              onOpenChange={setIsCreateDialogOpen}
            >
              <DialogTrigger asChild>
                <Button className="rounded-xl bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Announcement
                </Button>
              </DialogTrigger>
            </Dialog>

            <Button
              variant="outline"
              onClick={loadAnnouncements}
              disabled={announcementsLoading}
              className="rounded-xl border-white/50 dark:border-slate-700/50 bg-white/30 dark:bg-slate-800/30 backdrop-blur-sm hover:bg-white/50 dark:hover:bg-slate-700/50"
            >
              <RefreshCw
                className={cn(
                  "w-4 h-4 mr-2",
                  announcementsLoading && "animate-spin"
                )}
              />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 shadow-xl rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Total
                  </p>
                  <p className="text-2xl font-bold text-slate-800 dark:text-white">
                    {announcementsPagination.total}
                  </p>
                </div>
                <div className="p-2 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-lg shadow-lg">
                  <Megaphone className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 shadow-xl rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Active
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {announcements.filter((a) => a.status === "active").length}
                  </p>
                </div>
                <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg shadow-lg">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 shadow-xl rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Scheduled
                  </p>
                  <p className="text-2xl font-bold text-blue-600">
                    {
                      announcements.filter((a) => a.status === "scheduled")
                        .length
                    }
                  </p>
                </div>
                <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg shadow-lg">
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
                    Total Engagement
                  </p>
                  <p className="text-2xl font-bold text-purple-600">
                    {announcements.reduce(
                      (sum, a) => sum + (a.readCount || 0),
                      0
                    )}
                  </p>
                </div>
                <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg shadow-lg">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Announcements List */}
        <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 shadow-xl rounded-2xl">
          <CardHeader className="pb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <CardTitle className="text-slate-800 dark:text-white">
                All Announcements
              </CardTitle>

              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input
                    placeholder="Search announcements..."
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-10 w-64 rounded-xl bg-white/70 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600"
                  />
                </div>

                <Select
                  value={announcementsFilters.type || "all"}
                  onValueChange={(value) =>
                    handleFilterChange("type", value === "all" ? "" : value)
                  }
                >
                  <SelectTrigger className="w-32 rounded-xl bg-white/70 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="INFO">Info</SelectItem>
                    <SelectItem value="WARNING">Warning</SelectItem>
                    <SelectItem value="UPDATE">Update</SelectItem>
                    <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                    <SelectItem value="PROMOTION">Promotion</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  onClick={() => {
                    dispatch(resetAnnouncementsFilters());
                    setSearchTerm("");
                    dispatch(
                      getAllAnnouncements({
                        page: 1,
                        limit: announcementsPagination.limit,
                      })
                    );
                  }}
                  className="rounded-xl"
                >
                  <X className="w-4 h-4 mr-2" />
                  Clear
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <div className="space-y-4">
              {announcements.map((announcement) => (
                <div
                  key={announcement.id}
                  className={cn(
                    "p-6 rounded-xl border transition-all duration-200",
                    realtimeChanges.has(announcement.id)
                      ? "bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border-green-200 dark:border-green-700 shadow-lg"
                      : "bg-white/50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 hover:bg-white/70 dark:hover:bg-slate-700/70"
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
                          {announcement.title}
                        </h3>

                        {realtimeChanges.has(announcement.id) && (
                          <Badge className="text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                            <Activity className="w-3 h-3 mr-1 animate-pulse" />
                            Live Update
                          </Badge>
                        )}

                        <Badge
                          className={cn(
                            "text-xs",
                            getStatusColor(announcement.status)
                          )}
                        >
                          {announcement.status}
                        </Badge>
                        <Badge
                          className={cn(
                            "text-xs",
                            getTypeColor(announcement.type)
                          )}
                        >
                          {announcement.type}
                        </Badge>
                        <Badge
                          className={cn(
                            "text-xs",
                            getPriorityColor(announcement.priority)
                          )}
                        >
                          {announcement.priority}
                        </Badge>
                      </div>

                      <p className="text-slate-600 dark:text-slate-300 mb-3 line-clamp-2">
                        {announcement.content}
                      </p>

                      <div className="flex items-center space-x-6 text-sm text-slate-500 dark:text-slate-400">
                        <div className="flex items-center space-x-1">
                          <Users className="w-4 h-4" />
                          <span>{announcement.targetAudience}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Eye className="w-4 h-4" />
                          <span>{announcement.readCount || 0} reads</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Bell className="w-4 h-4" />
                          <span>
                            {announcement.totalNotifications || 0} sent
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>
                            {formatDistanceToNow(
                              new Date(announcement.createdAt)
                            )}{" "}
                            ago
                          </span>
                        </div>
                      </div>

                      {announcement.totalNotifications > 0 && (
                        <div className="mt-3 p-3 bg-white/30 dark:bg-slate-600/30 rounded-lg">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                              Engagement Rate
                            </span>
                            <span className="text-sm font-bold text-slate-800 dark:text-white">
                              {announcement.totalNotifications > 0
                                ? Math.round(
                                    ((announcement.readCount || 0) /
                                      announcement.totalNotifications) *
                                      100
                                  )
                                : 0}
                              %
                            </span>
                          </div>
                          <Progress
                            value={
                              announcement.totalNotifications > 0
                                ? ((announcement.readCount || 0) /
                                    announcement.totalNotifications) *
                                  100
                                : 0
                            }
                            className="h-2"
                          />
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openStatsDialog(announcement)}
                        className="rounded-lg"
                      >
                        <TrendingUp className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(announcement)}
                        className="rounded-lg"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDeleteDialog(announcement)}
                        disabled={deleteAnnouncementLoading}
                        className="rounded-lg text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              {announcements.length === 0 && !announcementsLoading && (
                <div className="text-center py-12">
                  <Megaphone className="w-12 h-12 mx-auto text-slate-400 mb-4 opacity-50" />
                  <p className="text-slate-600 dark:text-slate-400">
                    No announcements found
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Stats Dialog */}
        <Dialog open={isStatsDialogOpen} onOpenChange={setIsStatsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <BarChart3 className="w-5 h-5 mr-2" />
                Announcement Statistics
              </DialogTitle>
              <DialogDescription>
                Detailed engagement metrics for "{selectedAnnouncement?.title}"
              </DialogDescription>
            </DialogHeader>

            {selectedAnnouncement && (
              <div className="space-y-6 py-4">
                {/* Summary Cards */}
                <div className="grid grid-cols-2 gap-4">
                  <Card className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-blue-100 text-sm">Total Sent</p>
                          <p className="text-2xl font-bold">
                            {selectedAnnouncement.totalNotifications || 0}
                          </p>
                        </div>
                        <Bell className="w-8 h-8 text-blue-200" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-green-100 text-sm">Total Reads</p>
                          <p className="text-2xl font-bold">
                            {selectedAnnouncement.readCount || 0}
                          </p>
                        </div>
                        <Eye className="w-8 h-8 text-green-200" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Engagement Rate */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Engagement Rate
                    </span>
                    <span className="text-lg font-bold text-slate-800 dark:text-white">
                      {selectedAnnouncement.totalNotifications > 0
                        ? Math.round(
                            ((selectedAnnouncement.readCount || 0) /
                              selectedAnnouncement.totalNotifications) *
                              100
                          )
                        : 0}
                      %
                    </span>
                  </div>
                  <Progress
                    value={
                      selectedAnnouncement.totalNotifications > 0
                        ? ((selectedAnnouncement.readCount || 0) /
                            selectedAnnouncement.totalNotifications) *
                          100
                        : 0
                    }
                    className="h-3"
                  />
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Created
                    </p>
                    <p className="font-medium">
                      {format(new Date(selectedAnnouncement.createdAt), "PPP")}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Target Audience
                    </p>
                    <p className="font-medium">
                      {selectedAnnouncement.targetAudience}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Type
                    </p>
                    <Badge className={getTypeColor(selectedAnnouncement.type)}>
                      {selectedAnnouncement.type}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Priority
                    </p>
                    <Badge
                      className={getPriorityColor(
                        selectedAnnouncement.priority
                      )}
                    >
                      {selectedAnnouncement.priority}
                    </Badge>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsStatsDialogOpen(false)}
                className="rounded-xl"
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create Announcement Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Announcement</DialogTitle>
              <DialogDescription>
                Create a system-wide announcement that will be sent as
                notifications to users.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={createFormData.title}
                  onChange={(e) =>
                    setCreateFormData({
                      ...createFormData,
                      title: e.target.value,
                    })
                  }
                  placeholder="Announcement title"
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label>Content</Label>
                <Textarea
                  value={createFormData.content}
                  onChange={(e) =>
                    setCreateFormData({
                      ...createFormData,
                      content: e.target.value,
                    })
                  }
                  placeholder="Announcement content"
                  className="rounded-xl min-h-[100px]"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    value={createFormData.type}
                    onValueChange={(value) =>
                      setCreateFormData({ ...createFormData, type: value })
                    }
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INFO">Info</SelectItem>
                      <SelectItem value="WARNING">Warning</SelectItem>
                      <SelectItem value="UPDATE">Update</SelectItem>
                      <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                      <SelectItem value="PROMOTION">Promotion</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select
                    value={createFormData.priority}
                    onValueChange={(value) =>
                      setCreateFormData({ ...createFormData, priority: value })
                    }
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Low</SelectItem>
                      <SelectItem value="NORMAL">Normal</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                      <SelectItem value="URGENT">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Target Audience</Label>
                  <Select
                    value={createFormData.targetAudience}
                    onValueChange={(value) =>
                      setCreateFormData({
                        ...createFormData,
                        targetAudience: value,
                      })
                    }
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Users</SelectItem>
                      <SelectItem value="STUDENTS">Students</SelectItem>
                      <SelectItem value="INSTRUCTORS">Instructors</SelectItem>
                      <SelectItem value="ADMINS">Admins</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={createFormData.isActive}
                  onCheckedChange={(checked) =>
                    setCreateFormData({ ...createFormData, isActive: checked })
                  }
                />
                <Label>Active (send notifications immediately)</Label>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateAnnouncement}
                disabled={
                  createAnnouncementLoading ||
                  !createFormData.title ||
                  !createFormData.content
                }
                className="rounded-xl"
              >
                {createAnnouncementLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                Create & Send
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Announcement Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Announcement</DialogTitle>
              <DialogDescription>
                Update the announcement details.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={editFormData.title}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, title: e.target.value })
                  }
                  placeholder="Announcement title"
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label>Content</Label>
                <Textarea
                  value={editFormData.content}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      content: e.target.value,
                    })
                  }
                  placeholder="Announcement content"
                  className="rounded-xl min-h-[100px]"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    value={editFormData.type}
                    onValueChange={(value) =>
                      setEditFormData({ ...editFormData, type: value })
                    }
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INFO">Info</SelectItem>
                      <SelectItem value="WARNING">Warning</SelectItem>
                      <SelectItem value="UPDATE">Update</SelectItem>
                      <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                      <SelectItem value="PROMOTION">Promotion</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select
                    value={editFormData.priority}
                    onValueChange={(value) =>
                      setEditFormData({ ...editFormData, priority: value })
                    }
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Low</SelectItem>
                      <SelectItem value="NORMAL">Normal</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                      <SelectItem value="URGENT">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Target Audience</Label>
                  <Select
                    value={editFormData.targetAudience}
                    onValueChange={(value) =>
                      setEditFormData({
                        ...editFormData,
                        targetAudience: value,
                      })
                    }
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Users</SelectItem>
                      <SelectItem value="STUDENTS">Students</SelectItem>
                      <SelectItem value="INSTRUCTORS">Instructors</SelectItem>
                      <SelectItem value="ADMINS">Admins</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={editFormData.isActive}
                  onCheckedChange={(checked) =>
                    setEditFormData({ ...editFormData, isActive: checked })
                  }
                />
                <Label>Active</Label>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateAnnouncement}
                disabled={
                  updateAnnouncementLoading ||
                  !editFormData.title ||
                  !editFormData.content
                }
                className="rounded-xl"
              >
                {updateAnnouncementLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Announcement</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{announcementToDelete?.title}"?
                This action cannot be undone and will remove the announcement
                for all users.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteAnnouncement}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default AdminAnnouncementsPage;
