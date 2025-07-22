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
} from "@/features/adminSlice/adminSystem";
import {
  Megaphone,
  Plus,
  Search,
  MoreVertical,
  Edit3,
  Trash2,
  Eye,
  EyeOff,
  Users,
  AlertTriangle,
  Info,
  Wrench,
  Zap,
  Tag,
  RefreshCw,
  Send,
  Save,
  X,
  Loader2,
  Activity,
  CheckCircle,
  AlertCircle,
  Timer,
  Globe,
} from "lucide-react";

const AnnouncementsPage = () => {
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
  } = useSelector((state) => state.adminSystem);

  const { isConnected } = useSocket();

  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [hasInitialLoaded, setHasInitialLoaded] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    type: "INFO",
    priority: "NORMAL",
    targetAudience: "ALL",
    scheduledFor: "",
    expiresAt: "",
    isActive: true,
  });

  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    scheduled: 0,
    expired: 0,
    inactive: 0,
  });

  useEffect(() => {
    if (!hasInitialLoaded) {
      dispatch(
        getAllAnnouncements({
          page: 1,
          limit: 20,
        })
      );
      setHasInitialLoaded(true);
    }
  }, [dispatch, hasInitialLoaded]);

  useEffect(() => {
    setSearchTerm(announcementsFilters.search || "");
  }, [announcementsFilters.search]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  useEffect(() => {
    if (announcements.length > 0) {
      const newStats = announcements.reduce(
        (acc, announcement) => {
          acc.total += 1;
          acc[announcement.status] = (acc[announcement.status] || 0) + 1;
          return acc;
        },
        { total: 0, active: 0, scheduled: 0, expired: 0, inactive: 0 }
      );
      setStats(newStats);
    }
  }, [announcements]);

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

  const resetForm = () => {
    setFormData({
      title: "",
      content: "",
      type: "INFO",
      priority: "NORMAL",
      targetAudience: "ALL",
      scheduledFor: "",
      expiresAt: "",
      isActive: true,
    });
  };

  const handleCreateAnnouncement = async () => {
    try {
      const payload = {
        ...formData,
        scheduledFor: formData.scheduledFor || null,
        expiresAt: formData.expiresAt || null,
      };

      await dispatch(createAnnouncement(payload)).unwrap();
      setIsCreateDialogOpen(false);
      resetForm();
    } catch (error) {
      toast.error(error.message || "Failed to create announcement");
    }
  };

  const handleEditAnnouncement = async () => {
    try {
      await dispatch(
        updateAnnouncement({
          announcementId: selectedAnnouncement.id,
          announcementData: {
            ...formData,
            scheduledFor: formData.scheduledFor || null,
            expiresAt: formData.expiresAt || null,
          },
        })
      ).unwrap();
      setIsEditDialogOpen(false);
      setSelectedAnnouncement(null);
      resetForm();
    } catch (error) {
      toast.error(error.message || "Failed to update announcement");
    }
  };

  const handleDeleteAnnouncement = async () => {
    try {
      await dispatch(deleteAnnouncement(selectedAnnouncement.id)).unwrap();
      setIsDeleteDialogOpen(false);
      setSelectedAnnouncement(null);
    } catch (error) {
      toast.error(error.message || "Failed to delete announcement");
    }
  };

  const openEditDialog = (announcement) => {
    setSelectedAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      type: announcement.type,
      priority: announcement.priority,
      targetAudience: announcement.targetAudience,
      scheduledFor: announcement.scheduledFor
        ? format(new Date(announcement.scheduledFor), "yyyy-MM-dd'T'HH:mm")
        : "",
      expiresAt: announcement.expiresAt
        ? format(new Date(announcement.expiresAt), "yyyy-MM-dd'T'HH:mm")
        : "",
      isActive: announcement.isActive,
    });
    setIsEditDialogOpen(true);
  };

  const openViewDialog = (announcement) => {
    setSelectedAnnouncement(announcement);
    setIsViewDialogOpen(true);
  };

  const openDeleteDialog = (announcement) => {
    setSelectedAnnouncement(announcement);
    setIsDeleteDialogOpen(true);
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case "WARNING":
        return <AlertTriangle className="w-4 h-4" />;
      case "UPDATE":
        return <Zap className="w-4 h-4" />;
      case "MAINTENANCE":
        return <Wrench className="w-4 h-4" />;
      case "PROMOTION":
        return <Tag className="w-4 h-4" />;
      default:
        return <Info className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case "WARNING":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
      case "UPDATE":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
      case "MAINTENANCE":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300";
      case "PROMOTION":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300";
      default:
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
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

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      case "scheduled":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
      case "expired":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
      case "inactive":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "active":
        return <CheckCircle className="w-3 h-3" />;
      case "scheduled":
        return <Timer className="w-3 h-3" />;
      case "expired":
        return <AlertCircle className="w-3 h-3" />;
      case "inactive":
        return <EyeOff className="w-3 h-3" />;
      default:
        return <Activity className="w-3 h-3" />;
    }
  };

  const getAudienceIcon = (audience) => {
    switch (audience) {
      case "STUDENTS":
        return <Users className="w-4 h-4" />;
      case "INSTRUCTORS":
        return <Users className="w-4 h-4" />;
      case "ADMINS":
        return <Users className="w-4 h-4" />;
      default:
        return <Globe className="w-4 h-4" />;
    }
  };

  if (announcementsLoading && announcements.length === 0) {
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
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-cyan-50 dark:from-slate-900 dark:via-slate-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-7xl relative">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div className="flex items-center space-x-4 mb-4 lg:mb-0">
            <div className="p-3 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-2xl shadow-lg shadow-indigo-300/30 dark:shadow-indigo-500/20">
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
              variant={isConnected ? "default" : "destructive"}
              className="rounded-xl shadow-sm"
            >
              <Activity className="w-3 h-3 mr-1" />
              {isConnected ? "Connected" : "Disconnected"}
            </Badge>

            <Dialog
              open={isCreateDialogOpen}
              onOpenChange={setIsCreateDialogOpen}
            >
              <DialogTrigger asChild>
                <Button
                  onClick={resetForm}
                  className="rounded-xl bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-white shadow-lg shadow-indigo-300/30 dark:shadow-indigo-500/20"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Announcement
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 shadow-xl rounded-2xl max-w-2xl">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 dark:via-slate-700/10 to-transparent"></div>
                <div className="relative z-10">
                  <DialogHeader>
                    <DialogTitle className="text-slate-800 dark:text-white">
                      Create New Announcement
                    </DialogTitle>
                    <DialogDescription className="text-slate-600 dark:text-slate-400">
                      Create a system-wide announcement for your platform users.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="grid gap-6 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label
                          htmlFor="title"
                          className="text-slate-700 dark:text-slate-300"
                        >
                          Title
                        </Label>
                        <Input
                          id="title"
                          value={formData.title}
                          onChange={(e) =>
                            setFormData({ ...formData, title: e.target.value })
                          }
                          placeholder="Announcement title"
                          className="rounded-xl bg-white/70 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="type"
                          className="text-slate-700 dark:text-slate-300"
                        >
                          Type
                        </Label>
                        <Select
                          value={formData.type}
                          onValueChange={(value) =>
                            setFormData({ ...formData, type: value })
                          }
                        >
                          <SelectTrigger className="rounded-xl bg-white/70 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-lg border border-white/50 dark:border-slate-700/50">
                            <SelectItem value="INFO">Info</SelectItem>
                            <SelectItem value="WARNING">Warning</SelectItem>
                            <SelectItem value="UPDATE">Update</SelectItem>
                            <SelectItem value="MAINTENANCE">
                              Maintenance
                            </SelectItem>
                            <SelectItem value="PROMOTION">Promotion</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label
                          htmlFor="priority"
                          className="text-slate-700 dark:text-slate-300"
                        >
                          Priority
                        </Label>
                        <Select
                          value={formData.priority}
                          onValueChange={(value) =>
                            setFormData({ ...formData, priority: value })
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
                      <div className="space-y-2">
                        <Label
                          htmlFor="audience"
                          className="text-slate-700 dark:text-slate-300"
                        >
                          Target Audience
                        </Label>
                        <Select
                          value={formData.targetAudience}
                          onValueChange={(value) =>
                            setFormData({ ...formData, targetAudience: value })
                          }
                        >
                          <SelectTrigger className="rounded-xl bg-white/70 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-lg border border-white/50 dark:border-slate-700/50">
                            <SelectItem value="ALL">All Users</SelectItem>
                            <SelectItem value="STUDENTS">Students</SelectItem>
                            <SelectItem value="INSTRUCTORS">
                              Instructors
                            </SelectItem>
                            <SelectItem value="ADMINS">Admins</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="content"
                        className="text-slate-700 dark:text-slate-300"
                      >
                        Content
                      </Label>
                      <Textarea
                        id="content"
                        value={formData.content}
                        onChange={(e) =>
                          setFormData({ ...formData, content: e.target.value })
                        }
                        placeholder="Announcement content"
                        className="rounded-xl min-h-[120px] bg-white/70 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label
                          htmlFor="scheduledFor"
                          className="text-slate-700 dark:text-slate-300"
                        >
                          Schedule For (Optional)
                        </Label>
                        <Input
                          id="scheduledFor"
                          type="datetime-local"
                          value={formData.scheduledFor}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              scheduledFor: e.target.value,
                            })
                          }
                          className="rounded-xl bg-white/70 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="expiresAt"
                          className="text-slate-700 dark:text-slate-300"
                        >
                          Expires At (Optional)
                        </Label>
                        <Input
                          id="expiresAt"
                          type="datetime-local"
                          value={formData.expiresAt}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              expiresAt: e.target.value,
                            })
                          }
                          className="rounded-xl bg-white/70 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600"
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="isActive"
                        checked={formData.isActive}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, isActive: checked })
                        }
                      />
                      <Label
                        htmlFor="isActive"
                        className="text-slate-700 dark:text-slate-300"
                      >
                        Active
                      </Label>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsCreateDialogOpen(false)}
                      className="rounded-xl border-slate-200 dark:border-slate-600"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreateAnnouncement}
                      disabled={
                        createAnnouncementLoading ||
                        !formData.title ||
                        !formData.content
                      }
                      className="rounded-xl bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 shadow-md text-white"
                    >
                      {createAnnouncementLoading ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4 mr-2" />
                      )}
                      Create Announcement
                    </Button>
                  </DialogFooter>
                </div>
              </DialogContent>
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
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
                  <Megaphone className="w-5 h-5 text-white" />
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
                    Active
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {stats.active}
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
                    Scheduled
                  </p>
                  <p className="text-2xl font-bold text-blue-600">
                    {stats.scheduled}
                  </p>
                </div>
                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-lg">
                  <Timer className="w-5 h-5 text-white" />
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
                    Expired
                  </p>
                  <p className="text-2xl font-bold text-gray-600">
                    {stats.expired}
                  </p>
                </div>
                <div className="p-2 bg-gradient-to-br from-gray-500 to-slate-500 rounded-lg shadow-lg">
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
                    Inactive
                  </p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {stats.inactive}
                  </p>
                </div>
                <div className="p-2 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg shadow-lg">
                  <EyeOff className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 shadow-xl rounded-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 dark:via-slate-700/10 to-transparent rounded-2xl"></div>
          <CardHeader className="pb-6 relative">
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
                  <SelectContent className="rounded-xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-lg border border-white/50 dark:border-slate-700/50">
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="INFO">Info</SelectItem>
                    <SelectItem value="WARNING">Warning</SelectItem>
                    <SelectItem value="UPDATE">Update</SelectItem>
                    <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                    <SelectItem value="PROMOTION">Promotion</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={announcementsFilters.priority || "all"}
                  onValueChange={(value) =>
                    handleFilterChange("priority", value === "all" ? "" : value)
                  }
                >
                  <SelectTrigger className="w-32 rounded-xl bg-white/70 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-lg border border-white/50 dark:border-slate-700/50">
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="NORMAL">Normal</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="URGENT">Urgent</SelectItem>
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
                  className="rounded-xl border-slate-200 dark:border-slate-600 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm"
                >
                  <X className="w-4 h-4 mr-2" />
                  Clear
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="relative">
            <ScrollArea className="h-[600px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-slate-700 dark:text-slate-300">
                      Title
                    </TableHead>
                    <TableHead className="text-slate-700 dark:text-slate-300">
                      Type
                    </TableHead>
                    <TableHead className="text-slate-700 dark:text-slate-300">
                      Priority
                    </TableHead>
                    <TableHead className="text-slate-700 dark:text-slate-300">
                      Audience
                    </TableHead>
                    <TableHead className="text-slate-700 dark:text-slate-300">
                      Status
                    </TableHead>
                    <TableHead className="text-slate-700 dark:text-slate-300">
                      Created
                    </TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {announcements.map((announcement) => (
                    <TableRow
                      key={announcement.id}
                      className="hover:bg-white/50 dark:hover:bg-slate-700/30 transition-all duration-200"
                    >
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-800 dark:text-white">
                            {announcement.title}
                          </span>
                          <span className="text-sm text-slate-500 dark:text-slate-400 truncate max-w-xs">
                            {announcement.content}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={cn(
                            "rounded-lg shadow-sm",
                            getTypeColor(announcement.type)
                          )}
                        >
                          {getTypeIcon(announcement.type)}
                          <span className="ml-1">{announcement.type}</span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={cn(
                            "rounded-lg shadow-sm",
                            getPriorityColor(announcement.priority)
                          )}
                        >
                          {announcement.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          {getAudienceIcon(announcement.targetAudience)}
                          <span className="ml-2 text-sm text-slate-700 dark:text-slate-300">
                            {announcement.targetAudience}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={cn(
                            "rounded-lg shadow-sm",
                            getStatusColor(announcement.status)
                          )}
                        >
                          {getStatusIcon(announcement.status)}
                          <span className="ml-1 capitalize">
                            {announcement.status}
                          </span>
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-slate-600 dark:text-slate-400">
                        {formatDistanceToNow(new Date(announcement.createdAt))}{" "}
                        ago
                      </TableCell>
                      <TableCell>
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
                              onClick={() => openViewDialog(announcement)}
                              className="rounded-lg"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => openEditDialog(announcement)}
                              className="rounded-lg"
                            >
                              <Edit3 className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => openDeleteDialog(announcement)}
                              className="text-red-600 dark:text-red-400 rounded-lg"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {announcements.length === 0 && !announcementsLoading && (
                <div className="text-center py-12">
                  <Megaphone className="w-12 h-12 mx-auto text-slate-400 mb-4 opacity-50" />
                  <p className="text-slate-600 dark:text-slate-400">
                    No announcements found
                  </p>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 shadow-xl rounded-2xl max-w-2xl">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 dark:via-slate-700/10 to-transparent rounded-2xl"></div>
            <div className="relative z-10">
              <DialogHeader>
                <DialogTitle className="text-slate-800 dark:text-white">
                  Edit Announcement
                </DialogTitle>
                <DialogDescription className="text-slate-600 dark:text-slate-400">
                  Update the announcement details.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-6 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="edit-title"
                      className="text-slate-700 dark:text-slate-300"
                    >
                      Title
                    </Label>
                    <Input
                      id="edit-title"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                      placeholder="Announcement title"
                      className="rounded-xl bg-white/70 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="edit-type"
                      className="text-slate-700 dark:text-slate-300"
                    >
                      Type
                    </Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) =>
                        setFormData({ ...formData, type: value })
                      }
                    >
                      <SelectTrigger className="rounded-xl bg-white/70 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-lg border border-white/50 dark:border-slate-700/50">
                        <SelectItem value="INFO">Info</SelectItem>
                        <SelectItem value="WARNING">Warning</SelectItem>
                        <SelectItem value="UPDATE">Update</SelectItem>
                        <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                        <SelectItem value="PROMOTION">Promotion</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="edit-priority"
                      className="text-slate-700 dark:text-slate-300"
                    >
                      Priority
                    </Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(value) =>
                        setFormData({ ...formData, priority: value })
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
                  <div className="space-y-2">
                    <Label
                      htmlFor="edit-audience"
                      className="text-slate-700 dark:text-slate-300"
                    >
                      Target Audience
                    </Label>
                    <Select
                      value={formData.targetAudience}
                      onValueChange={(value) =>
                        setFormData({ ...formData, targetAudience: value })
                      }
                    >
                      <SelectTrigger className="rounded-xl bg-white/70 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-lg border border-white/50 dark:border-slate-700/50">
                        <SelectItem value="ALL">All Users</SelectItem>
                        <SelectItem value="STUDENTS">Students</SelectItem>
                        <SelectItem value="INSTRUCTORS">Instructors</SelectItem>
                        <SelectItem value="ADMINS">Admins</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="edit-content"
                    className="text-slate-700 dark:text-slate-300"
                  >
                    Content
                  </Label>
                  <Textarea
                    id="edit-content"
                    value={formData.content}
                    onChange={(e) =>
                      setFormData({ ...formData, content: e.target.value })
                    }
                    placeholder="Announcement content"
                    className="rounded-xl min-h-[120px] bg-white/70 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="edit-scheduledFor"
                      className="text-slate-700 dark:text-slate-300"
                    >
                      Schedule For (Optional)
                    </Label>
                    <Input
                      id="edit-scheduledFor"
                      type="datetime-local"
                      value={formData.scheduledFor}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          scheduledFor: e.target.value,
                        })
                      }
                      className="rounded-xl bg-white/70 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="edit-expiresAt"
                      className="text-slate-700 dark:text-slate-300"
                    >
                      Expires At (Optional)
                    </Label>
                    <Input
                      id="edit-expiresAt"
                      type="datetime-local"
                      value={formData.expiresAt}
                      onChange={(e) =>
                        setFormData({ ...formData, expiresAt: e.target.value })
                      }
                      className="rounded-xl bg-white/70 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="edit-isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, isActive: checked })
                    }
                  />
                  <Label
                    htmlFor="edit-isActive"
                    className="text-slate-700 dark:text-slate-300"
                  >
                    Active
                  </Label>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                  className="rounded-xl border-slate-200 dark:border-slate-600"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleEditAnnouncement}
                  disabled={
                    updateAnnouncementLoading ||
                    !formData.title ||
                    !formData.content
                  }
                  className="rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 shadow-md"
                >
                  {updateAnnouncementLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Update Announcement
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 shadow-xl rounded-2xl max-w-2xl">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 dark:via-slate-700/10 to-transparent rounded-2xl"></div>
            {selectedAnnouncement && (
              <div className="relative z-10">
                <DialogHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <DialogTitle className="text-slate-800 dark:text-white mb-2">
                        {selectedAnnouncement.title}
                      </DialogTitle>
                      <div className="flex items-center space-x-2 mb-4">
                        <Badge
                          className={cn(
                            "rounded-lg shadow-sm",
                            getTypeColor(selectedAnnouncement.type)
                          )}
                        >
                          {getTypeIcon(selectedAnnouncement.type)}
                          <span className="ml-1">
                            {selectedAnnouncement.type}
                          </span>
                        </Badge>
                        <Badge
                          className={cn(
                            "rounded-lg shadow-sm",
                            getPriorityColor(selectedAnnouncement.priority)
                          )}
                        >
                          {selectedAnnouncement.priority}
                        </Badge>
                        <Badge
                          className={cn(
                            "rounded-lg shadow-sm",
                            getStatusColor(selectedAnnouncement.status)
                          )}
                        >
                          {getStatusIcon(selectedAnnouncement.status)}
                          <span className="ml-1 capitalize">
                            {selectedAnnouncement.status}
                          </span>
                        </Badge>
                      </div>
                    </div>
                  </div>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="bg-white/30 dark:bg-slate-700/30 backdrop-blur-sm rounded-xl p-4">
                    <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                      {selectedAnnouncement.content}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        Target Audience
                      </Label>
                      <div className="flex items-center text-slate-700 dark:text-slate-300">
                        {getAudienceIcon(selectedAnnouncement.targetAudience)}
                        <span className="ml-2">
                          {selectedAnnouncement.targetAudience}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        Created
                      </Label>
                      <p className="text-sm text-slate-700 dark:text-slate-300">
                        {format(
                          new Date(selectedAnnouncement.createdAt),
                          "PPP 'at' p"
                        )}
                      </p>
                    </div>
                  </div>

                  {selectedAnnouncement.scheduledFor && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        Scheduled For
                      </Label>
                      <p className="text-sm text-slate-700 dark:text-slate-300">
                        {format(
                          new Date(selectedAnnouncement.scheduledFor),
                          "PPP 'at' p"
                        )}
                      </p>
                    </div>
                  )}

                  {selectedAnnouncement.expiresAt && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        Expires At
                      </Label>
                      <p className="text-sm text-slate-700 dark:text-slate-300">
                        {format(
                          new Date(selectedAnnouncement.expiresAt),
                          "PPP 'at' p"
                        )}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        Read Count
                      </Label>
                      <p className="text-sm text-slate-700 dark:text-slate-300">
                        {selectedAnnouncement.readCount || 0}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        Dismissed Count
                      </Label>
                      <p className="text-sm text-slate-700 dark:text-slate-300">
                        {selectedAnnouncement.dismissedCount || 0}
                      </p>
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsViewDialogOpen(false)}
                    className="rounded-xl border-slate-200 dark:border-slate-600"
                  >
                    Close
                  </Button>
                  <Button
                    onClick={() => {
                      setIsViewDialogOpen(false);
                      openEditDialog(selectedAnnouncement);
                    }}
                    className="rounded-xl bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 shadow-md"
                  >
                    <Edit3 className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <AlertDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
        >
          <AlertDialogContent className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 shadow-xl rounded-2xl">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 dark:via-slate-700/10 to-transparent rounded-2xl"></div>
            <div className="relative z-10">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-slate-800 dark:text-white">
                  Delete Announcement
                </AlertDialogTitle>
                <AlertDialogDescription className="text-slate-600 dark:text-slate-400">
                  Are you sure you want to delete "{selectedAnnouncement?.title}
                  "? This action cannot be undone and will remove the
                  announcement from all users.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-xl border-slate-200 dark:border-slate-600">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAnnouncement}
                  disabled={deleteAnnouncementLoading}
                  className="rounded-xl bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-md"
                >
                  {deleteAnnouncementLoading ? (
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
      </div>
    </div>
  );
};

export default AnnouncementsPage;
