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
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";

import {
  getSupportTickets,
  getSupportTicket,
  createSupportTicket,
  addTicketResponse,
  updateTicketStatus,
  getSupportStats,
  getSupportCategories,
  setTicketsFilters,
  resetTicketsFilters,
  clearError,
} from "@/features/common/ticketSlice";
import {
  Headphones,
  Search,
  MoreVertical,
  Eye,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  RefreshCw,
  Send,
  X,
  Loader2,
  Timer,
  User,
  Mail,
  Calendar,
  FileText,
  Paperclip,
  ArrowUp,
  ArrowDown,
  Minus,
  Zap,
  Edit3,
  Plus,
} from "lucide-react";

const SupportPage = () => {
  const dispatch = useDispatch();
  const {
    tickets,
    ticketDetails,
    ticketStats,
    supportCategories,
    ticketsPagination,
    ticketsFilters,
    ticketsLoading,
    ticketDetailsLoading,
    createTicketLoading,
    addResponseLoading,
    updateStatusLoading,
    error,
  } = useSelector((state) => state.ticketSupport);

  const { user } = useSelector((state) => state.auth);

  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isResponseDialogOpen, setIsResponseDialogOpen] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [hasInitialLoaded, setHasInitialLoaded] = useState(false);

  const [createForm, setCreateForm] = useState({
    subject: "",
    description: "",
    category: "GENERAL",
    priority: "MEDIUM",
    attachments: null,
  });

  const [responseForm, setResponseForm] = useState({
    message: "",
    attachments: null,
  });

  const [statusForm, setStatusForm] = useState({
    status: "",
    resolvedBy: "",
  });

  const [stats, setStats] = useState({
    totalTickets: 0,
    openTickets: 0,
    resolvedTickets: 0,
    closedTickets: 0,
    avgResponseTime: "N/A",
  });

  const isStaff = user && (user.role === "ADMIN" || user.role === "MODERATOR");

  useEffect(() => {
    if (!hasInitialLoaded) {
      dispatch(getSupportTickets({ page: 1, limit: 20 }));
      dispatch(getSupportStats());
      dispatch(getSupportCategories());
      setHasInitialLoaded(true);
    }
  }, [dispatch, hasInitialLoaded]);

  useEffect(() => {
    setSearchTerm(ticketsFilters.search || "");
  }, [ticketsFilters.search]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  useEffect(() => {
    if (ticketStats) {
      setStats({
        totalTickets: ticketStats.overview.totalTickets,
        openTickets: ticketStats.overview.openTickets,
        resolvedTickets: ticketStats.overview.resolvedTickets,
        closedTickets: ticketStats.overview.closedTickets,
        avgResponseTime: ticketStats.overview.avgResponseTime,
      });
    }
  }, [ticketStats]);

  const handleFilterChange = (key, value) => {
    const newFilters = { ...ticketsFilters, [key]: value };
    dispatch(setTicketsFilters({ [key]: value }));

    if (hasInitialLoaded) {
      setTimeout(() => {
        dispatch(
          getSupportTickets({
            ...newFilters,
            page: 1,
            limit: ticketsPagination.limit,
          })
        );
      }, 100);
    }
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
    const newFilters = { ...ticketsFilters, search: value };
    dispatch(setTicketsFilters({ search: value }));

    if (hasInitialLoaded) {
      setTimeout(() => {
        dispatch(
          getSupportTickets({
            ...newFilters,
            page: 1,
            limit: ticketsPagination.limit,
          })
        );
      }, 300);
    }
  };

  const loadTickets = () => {
    dispatch(
      getSupportTickets({
        ...ticketsFilters,
        page: ticketsPagination.page,
        limit: ticketsPagination.limit,
      })
    );
    dispatch(getSupportStats());
  };

  const resetCreateForm = () => {
    setCreateForm({
      subject: "",
      description: "",
      category: "GENERAL",
      priority: "MEDIUM",
      attachments: null,
    });
  };

  const resetResponseForm = () => {
    setResponseForm({
      message: "",
      attachments: null,
    });
  };

  const resetStatusForm = () => {
    setStatusForm({
      status: "",
      resolvedBy: "",
    });
  };

  const handleCreateTicket = async () => {
    try {
      await dispatch(
        createSupportTicket({
          subject: createForm.subject,
          description: createForm.description,
          category: createForm.category,
          priority: createForm.priority,
          attachments: createForm.attachments,
        })
      ).unwrap();
      setIsCreateDialogOpen(false);
      resetCreateForm();
      loadTickets();
    } catch (error) {
      toast.error(error.message || "Failed to create ticket");
    }
  };

  const handleViewTicket = async (ticket) => {
    setSelectedTicket(ticket);
    setIsViewDialogOpen(true);
    await dispatch(getSupportTicket(ticket.id));
  };

  const handleAddResponse = async () => {
    try {
      await dispatch(
        addTicketResponse({
          ticketId: selectedTicket.id,
          responseData: {
            message: responseForm.message,
            attachments: responseForm.attachments,
          },
        })
      ).unwrap();
      setIsResponseDialogOpen(false);
      resetResponseForm();
      if (isViewDialogOpen) {
        await dispatch(getSupportTicket(selectedTicket.id));
      }
      loadTickets();
    } catch (error) {
      toast.error(error.message || "Failed to add response");
    }
  };

  const handleUpdateStatus = async () => {
    try {
      await dispatch(
        updateTicketStatus({
          ticketId: selectedTicket.id,
          status: statusForm.status,
          resolvedBy: statusForm.resolvedBy,
        })
      ).unwrap();
      setIsStatusDialogOpen(false);
      resetStatusForm();
      if (isViewDialogOpen) {
        await dispatch(getSupportTicket(selectedTicket.id));
      }
      loadTickets();
    } catch (error) {
      toast.error(error.message || "Failed to update status");
    }
  };

  const openResponseDialog = (ticket) => {
    setSelectedTicket(ticket);
    resetResponseForm();
    setIsResponseDialogOpen(true);
  };

  const openStatusDialog = (ticket) => {
    setSelectedTicket(ticket);
    setStatusForm({
      status: ticket.status,
      resolvedBy: "",
    });
    setIsStatusDialogOpen(true);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "URGENT":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
      case "HIGH":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300";
      case "MEDIUM":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
      case "LOW":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "OPEN":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
      case "IN_PROGRESS":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
      case "RESOLVED":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      case "CLOSED":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
      case "ESCALATED":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case "TECHNICAL":
        return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300";
      case "PAYMENT":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      case "COURSE_CONTENT":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300";
      case "ACCOUNT":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300";
      case "REFUND":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
      case "BUG_REPORT":
        return "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300";
      case "FEATURE_REQUEST":
        return "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300";
      default:
        return "bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-300";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "OPEN":
        return <AlertCircle className="w-3 h-3" />;
      case "IN_PROGRESS":
        return <Timer className="w-3 h-3" />;
      case "RESOLVED":
        return <CheckCircle className="w-3 h-3" />;
      case "CLOSED":
        return <XCircle className="w-3 h-3" />;
      case "ESCALATED":
        return <Zap className="w-3 h-3" />;
      default:
        return <Activity className="w-3 h-3" />;
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case "URGENT":
        return <ArrowUp className="w-3 h-3" />;
      case "HIGH":
        return <ArrowUp className="w-3 h-3" />;
      case "MEDIUM":
        return <Minus className="w-3 h-3" />;
      case "LOW":
        return <ArrowDown className="w-3 h-3" />;
      default:
        return <Minus className="w-3 h-3" />;
    }
  };

  if (ticketsLoading && tickets.length === 0) {
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
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              {[...Array(5)].map((_, i) => (
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
              <Headphones className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-800 dark:text-white">
                {isStaff ? "Support Management" : "My Support Tickets"}
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                {isStaff
                  ? "Manage customer support tickets and responses"
                  : "View and manage your support tickets"}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Dialog
              open={isCreateDialogOpen}
              onOpenChange={setIsCreateDialogOpen}
            >
              <DialogTrigger asChild>
                <Button
                  onClick={resetCreateForm}
                  className="rounded-xl bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-white shadow-lg shadow-indigo-300/30 dark:shadow-indigo-500/20"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Ticket
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 shadow-xl rounded-2xl max-w-2xl">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 dark:via-slate-700/10 to-transparent rounded-2xl"></div>
                <div className="relative z-10">
                  <DialogHeader>
                    <DialogTitle className="text-slate-800 dark:text-white">
                      Create Support Ticket
                    </DialogTitle>
                    <DialogDescription className="text-slate-600 dark:text-slate-400">
                      Create a new support ticket for assistance.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="grid gap-6 py-4">
                    <div className="space-y-2">
                      <Label
                        htmlFor="create-subject"
                        className="text-slate-700 dark:text-slate-300"
                      >
                        Subject
                      </Label>
                      <Input
                        id="create-subject"
                        value={createForm.subject}
                        onChange={(e) =>
                          setCreateForm({
                            ...createForm,
                            subject: e.target.value,
                          })
                        }
                        placeholder="Brief description of your issue"
                        className="rounded-xl bg-white/70 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label
                          htmlFor="create-category"
                          className="text-slate-700 dark:text-slate-300"
                        >
                          Category
                        </Label>
                        <Select
                          value={createForm.category}
                          onValueChange={(value) =>
                            setCreateForm({ ...createForm, category: value })
                          }
                        >
                          <SelectTrigger className="rounded-xl bg-white/70 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-lg border border-white/50 dark:border-slate-700/50">
                            {supportCategories?.categories?.map((category) => (
                              <SelectItem
                                key={category.value}
                                value={category.value}
                              >
                                {category.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="create-priority"
                          className="text-slate-700 dark:text-slate-300"
                        >
                          Priority
                        </Label>
                        <Select
                          value={createForm.priority}
                          onValueChange={(value) =>
                            setCreateForm({ ...createForm, priority: value })
                          }
                        >
                          <SelectTrigger className="rounded-xl bg-white/70 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-lg border border-white/50 dark:border-slate-700/50">
                            {supportCategories?.priorities?.map((priority) => (
                              <SelectItem
                                key={priority.value}
                                value={priority.value}
                              >
                                {priority.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="create-description"
                        className="text-slate-700 dark:text-slate-300"
                      >
                        Description
                      </Label>
                      <Textarea
                        id="create-description"
                        value={createForm.description}
                        onChange={(e) =>
                          setCreateForm({
                            ...createForm,
                            description: e.target.value,
                          })
                        }
                        placeholder="Describe your issue in detail..."
                        className="rounded-xl min-h-[120px] bg-white/70 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="create-attachments"
                        className="text-slate-700 dark:text-slate-300"
                      >
                        Attachments (Optional)
                      </Label>
                      <Input
                        id="create-attachments"
                        type="file"
                        multiple
                        onChange={(e) =>
                          setCreateForm({
                            ...createForm,
                            attachments: e.target.files,
                          })
                        }
                        className="rounded-xl bg-white/70 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600"
                      />
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
                      onClick={handleCreateTicket}
                      disabled={
                        createTicketLoading ||
                        !createForm.subject ||
                        !createForm.description
                      }
                      className="rounded-xl bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 shadow-md text-white"
                    >
                      {createTicketLoading ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4 mr-2" />
                      )}
                      Create Ticket
                    </Button>
                  </DialogFooter>
                </div>
              </DialogContent>
            </Dialog>

            <Button
              variant="outline"
              onClick={loadTickets}
              disabled={ticketsLoading}
              className="rounded-xl border-white/50 dark:border-slate-700/50 bg-white/30 dark:bg-slate-800/30 backdrop-blur-sm hover:bg-white/50 dark:hover:bg-slate-700/50"
            >
              <RefreshCw
                className={cn("w-4 h-4 mr-2", ticketsLoading && "animate-spin")}
              />
              Refresh
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 shadow-xl rounded-2xl">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 dark:via-slate-700/10 to-transparent rounded-2xl"></div>
            <CardContent className="p-6 relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Total Tickets
                  </p>
                  <p className="text-2xl font-bold text-slate-800 dark:text-white">
                    {stats.totalTickets}
                  </p>
                </div>
                <div className="p-2 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-lg shadow-lg">
                  <Headphones className="w-5 h-5 text-white" />
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
                    Open Tickets
                  </p>
                  <p className="text-2xl font-bold text-blue-600">
                    {stats.openTickets}
                  </p>
                </div>
                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-lg">
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
                    Resolved
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {stats.resolvedTickets}
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
                    Closed
                  </p>
                  <p className="text-2xl font-bold text-gray-600">
                    {stats.closedTickets}
                  </p>
                </div>
                <div className="p-2 bg-gradient-to-br from-gray-500 to-slate-500 rounded-lg shadow-lg">
                  <XCircle className="w-5 h-5 text-white" />
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
                    {isStaff ? "Avg Response" : "Response Time"}
                  </p>
                  <p className="text-2xl font-bold text-purple-600">
                    {stats.avgResponseTime}
                  </p>
                </div>
                <div className="p-2 bg-gradient-to-br from-purple-500 to-violet-500 rounded-lg shadow-lg">
                  <Clock className="w-5 h-5 text-white" />
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
                {isStaff ? "All Support Tickets" : "Your Support Tickets"}
              </CardTitle>

              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input
                    placeholder="Search tickets..."
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-10 w-64 rounded-xl bg-white/70 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600"
                  />
                </div>

                <Select
                  value={ticketsFilters.status || "all"}
                  onValueChange={(value) =>
                    handleFilterChange("status", value === "all" ? "" : value)
                  }
                >
                  <SelectTrigger className="w-36 rounded-xl bg-white/70 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-lg border border-white/50 dark:border-slate-700/50">
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="OPEN">Open</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="RESOLVED">Resolved</SelectItem>
                    <SelectItem value="CLOSED">Closed</SelectItem>
                    <SelectItem value="ESCALATED">Escalated</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={ticketsFilters.priority || "all"}
                  onValueChange={(value) =>
                    handleFilterChange("priority", value === "all" ? "" : value)
                  }
                >
                  <SelectTrigger className="w-32 rounded-xl bg-white/70 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-lg border border-white/50 dark:border-slate-700/50">
                    <SelectItem value="all">All Priority</SelectItem>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="URGENT">Urgent</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={ticketsFilters.category || "all"}
                  onValueChange={(value) =>
                    handleFilterChange("category", value === "all" ? "" : value)
                  }
                >
                  <SelectTrigger className="w-40 rounded-xl bg-white/70 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-lg border border-white/50 dark:border-slate-700/50">
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="GENERAL">General</SelectItem>
                    <SelectItem value="TECHNICAL">Technical</SelectItem>
                    <SelectItem value="PAYMENT">Payment</SelectItem>
                    <SelectItem value="COURSE_CONTENT">
                      Course Content
                    </SelectItem>
                    <SelectItem value="ACCOUNT">Account</SelectItem>
                    <SelectItem value="REFUND">Refund</SelectItem>
                    <SelectItem value="BUG_REPORT">Bug Report</SelectItem>
                    <SelectItem value="FEATURE_REQUEST">
                      Feature Request
                    </SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  onClick={() => {
                    dispatch(resetTicketsFilters());
                    setSearchTerm("");
                    dispatch(
                      getSupportTickets({
                        page: 1,
                        limit: ticketsPagination.limit,
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
                      Ticket
                    </TableHead>
                    {isStaff && (
                      <TableHead className="text-slate-700 dark:text-slate-300">
                        User
                      </TableHead>
                    )}
                    <TableHead className="text-slate-700 dark:text-slate-300">
                      Category
                    </TableHead>
                    <TableHead className="text-slate-700 dark:text-slate-300">
                      Priority
                    </TableHead>
                    <TableHead className="text-slate-700 dark:text-slate-300">
                      Status
                    </TableHead>
                    <TableHead className="text-slate-700 dark:text-slate-300">
                      Responses
                    </TableHead>
                    <TableHead className="text-slate-700 dark:text-slate-300">
                      Created
                    </TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tickets.map((ticket) => (
                    <TableRow
                      key={ticket.id}
                      className="hover:bg-white/50 dark:hover:bg-slate-700/30 transition-all duration-200"
                    >
                      <TableCell>
                        <div className="flex flex-col">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-slate-800 dark:text-white">
                              {ticket.ticketNumber}
                            </span>
                            {ticket.isOverdue && (
                              <Badge variant="destructive" className="text-xs">
                                Overdue
                              </Badge>
                            )}
                          </div>
                          <span className="text-sm text-slate-500 dark:text-slate-400 truncate max-w-xs">
                            {ticket.subject}
                          </span>
                        </div>
                      </TableCell>
                      {isStaff && (
                        <TableCell>
                          {ticket.user ? (
                            <div className="flex flex-col">
                              <div className="flex items-center space-x-2">
                                <User className="w-3 h-3 text-slate-400" />
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                  {ticket.user.name}
                                </span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Mail className="w-3 h-3 text-slate-400" />
                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                  {ticket.user.email}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <span className="text-sm text-slate-500 dark:text-slate-400">
                              Unknown User
                            </span>
                          )}
                        </TableCell>
                      )}
                      <TableCell>
                        <Badge
                          className={cn(
                            "rounded-lg shadow-sm",
                            getCategoryColor(ticket.category)
                          )}
                        >
                          {ticket.category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={cn(
                            "rounded-lg shadow-sm",
                            getPriorityColor(ticket.priority)
                          )}
                        >
                          {getPriorityIcon(ticket.priority)}
                          <span className="ml-1">{ticket.priority}</span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={cn(
                            "rounded-lg shadow-sm",
                            getStatusColor(ticket.status)
                          )}
                        >
                          {getStatusIcon(ticket.status)}
                          <span className="ml-1">{ticket.status}</span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <MessageSquare className="w-4 h-4 text-slate-400" />
                          <span className="text-sm text-slate-700 dark:text-slate-300">
                            {ticket.responseCount || 0}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-slate-600 dark:text-slate-400">
                        {formatDistanceToNow(new Date(ticket.createdAt))} ago
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
                              onClick={() => handleViewTicket(ticket)}
                              className="rounded-lg"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            {(ticket.status !== "CLOSED" || isStaff) && (
                              <DropdownMenuItem
                                onClick={() => openResponseDialog(ticket)}
                                className="rounded-lg"
                              >
                                <MessageSquare className="w-4 h-4 mr-2" />
                                Add Response
                              </DropdownMenuItem>
                            )}
                            {isStaff && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => openStatusDialog(ticket)}
                                  className="rounded-lg"
                                >
                                  <Edit3 className="w-4 h-4 mr-2" />
                                  Update Status
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {tickets.length === 0 && !ticketsLoading && (
                <div className="text-center py-12">
                  <Headphones className="w-12 h-12 mx-auto text-slate-400 mb-4 opacity-50" />
                  <p className="text-slate-600 dark:text-slate-400">
                    No support tickets found
                  </p>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 shadow-xl rounded-2xl max-w-4xl max-h-[90vh]">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 dark:via-slate-700/10 to-transparent rounded-2xl"></div>
            {selectedTicket && ticketDetails && (
              <div className="relative z-10">
                <DialogHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <DialogTitle className="text-slate-800 dark:text-white mb-2">
                        {ticketDetails.ticket.ticketNumber} -{" "}
                        {ticketDetails.ticket.subject}
                      </DialogTitle>
                      <div className="flex items-center space-x-2 mb-4">
                        <Badge
                          className={cn(
                            "rounded-lg shadow-sm",
                            getCategoryColor(ticketDetails.ticket.category)
                          )}
                        >
                          {ticketDetails.ticket.category}
                        </Badge>
                        <Badge
                          className={cn(
                            "rounded-lg shadow-sm",
                            getPriorityColor(ticketDetails.ticket.priority)
                          )}
                        >
                          {getPriorityIcon(ticketDetails.ticket.priority)}
                          <span className="ml-1">
                            {ticketDetails.ticket.priority}
                          </span>
                        </Badge>
                        <Badge
                          className={cn(
                            "rounded-lg shadow-sm",
                            getStatusColor(ticketDetails.ticket.status)
                          )}
                        >
                          {getStatusIcon(ticketDetails.ticket.status)}
                          <span className="ml-1">
                            {ticketDetails.ticket.status}
                          </span>
                        </Badge>
                      </div>
                    </div>
                  </div>
                </DialogHeader>

                <ScrollArea className="max-h-[60vh]">
                  <div className="space-y-4">
                    <div className="bg-white/30 dark:bg-slate-700/30 backdrop-blur-sm rounded-xl p-4">
                      <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                        {ticketDetails.ticket.description}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {isStaff && (
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-slate-600 dark:text-slate-400">
                            Created By
                          </Label>
                          <div className="flex items-center text-slate-700 dark:text-slate-300">
                            <User className="w-4 h-4 mr-2" />
                            <span>{ticketDetails.ticket.user.name}</span>
                          </div>
                        </div>
                      )}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-600 dark:text-slate-400">
                          Created At
                        </Label>
                        <div className="flex items-center text-slate-700 dark:text-slate-300">
                          <Calendar className="w-4 h-4 mr-2" />
                          <span className="text-sm">
                            {format(
                              new Date(ticketDetails.ticket.createdAt),
                              "PPP 'at' p"
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    {ticketDetails.ticket.resolvedAt && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-600 dark:text-slate-400">
                          Resolved At
                        </Label>
                        <p className="text-sm text-slate-700 dark:text-slate-300">
                          {format(
                            new Date(ticketDetails.ticket.resolvedAt),
                            "PPP 'at' p"
                          )}
                        </p>
                      </div>
                    )}

                    <div className="space-y-4">
                      <Label className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        Responses ({ticketDetails.ticket.responses?.length || 0}
                        )
                      </Label>

                      {ticketDetails.ticket.responses &&
                      ticketDetails.ticket.responses.length > 0 ? (
                        <div className="space-y-3">
                          {ticketDetails.ticket.responses.map((response) => (
                            <div
                              key={response.id}
                              className={cn(
                                "p-4 rounded-xl",
                                response.isStaffResponse
                                  ? "bg-blue-50/50 dark:bg-blue-900/20 border-l-4 border-blue-500"
                                  : "bg-gray-50/50 dark:bg-gray-800/20 border-l-4 border-gray-400"
                              )}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center space-x-2">
                                  <User className="w-4 h-4 text-slate-500" />
                                  <span className="font-medium text-slate-800 dark:text-white">
                                    {response.user.name}
                                  </span>
                                  {response.isStaffResponse && (
                                    <Badge
                                      variant="secondary"
                                      className="text-xs"
                                    >
                                      Staff
                                    </Badge>
                                  )}
                                </div>
                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                  {formatDistanceToNow(
                                    new Date(response.createdAt)
                                  )}{" "}
                                  ago
                                </span>
                              </div>
                              <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                                {response.message}
                              </p>
                              {response.attachments &&
                                response.attachments > 0 && (
                                  <div className="flex items-center mt-2 text-slate-500 dark:text-slate-400">
                                    <Paperclip className="w-4 h-4 mr-1" />
                                    <span className="text-xs">
                                      {response.attachments} attachments
                                    </span>
                                  </div>
                                )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-slate-500 dark:text-slate-400 text-center py-4">
                          No responses yet
                        </p>
                      )}
                    </div>
                  </div>
                </ScrollArea>

                <DialogFooter className="pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setIsViewDialogOpen(false)}
                    className="rounded-xl border-slate-200 dark:border-slate-600"
                  >
                    Close
                  </Button>
                  {(selectedTicket.status !== "CLOSED" || isStaff) && (
                    <Button
                      onClick={() => {
                        setIsViewDialogOpen(false);
                        openResponseDialog(selectedTicket);
                      }}
                      className="rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 shadow-md"
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Add Response
                    </Button>
                  )}
                  {isStaff && (
                    <Button
                      onClick={() => {
                        setIsViewDialogOpen(false);
                        openStatusDialog(selectedTicket);
                      }}
                      className="rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 shadow-md"
                    >
                      <Edit3 className="w-4 h-4 mr-2" />
                      Update Status
                    </Button>
                  )}
                </DialogFooter>
              </div>
            )}
            {ticketDetailsLoading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Dialog
          open={isResponseDialogOpen}
          onOpenChange={setIsResponseDialogOpen}
        >
          <DialogContent className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 shadow-xl rounded-2xl max-w-2xl">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 dark:via-slate-700/10 to-transparent rounded-2xl"></div>
            <div className="relative z-10">
              <DialogHeader>
                <DialogTitle className="text-slate-800 dark:text-white">
                  Add Response
                </DialogTitle>
                <DialogDescription className="text-slate-600 dark:text-slate-400">
                  Add a response to ticket {selectedTicket?.ticketNumber}
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-6 py-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="response-message"
                    className="text-slate-700 dark:text-slate-300"
                  >
                    Response Message
                  </Label>
                  <Textarea
                    id="response-message"
                    value={responseForm.message}
                    onChange={(e) =>
                      setResponseForm({
                        ...responseForm,
                        message: e.target.value,
                      })
                    }
                    placeholder="Enter your response..."
                    className="rounded-xl min-h-[120px] bg-white/70 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="response-attachments"
                    className="text-slate-700 dark:text-slate-300"
                  >
                    Attachments (Optional)
                  </Label>
                  <Input
                    id="response-attachments"
                    type="file"
                    multiple
                    onChange={(e) =>
                      setResponseForm({
                        ...responseForm,
                        attachments: e.target.files,
                      })
                    }
                    className="rounded-xl bg-white/70 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsResponseDialogOpen(false);
                    resetResponseForm();
                  }}
                  className="rounded-xl border-slate-200 dark:border-slate-600"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddResponse}
                  disabled={addResponseLoading || !responseForm.message.trim()}
                  className="rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 shadow-md text-white"
                >
                  {addResponseLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  Send Response
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>

        {isStaff && (
          <Dialog
            open={isStatusDialogOpen}
            onOpenChange={setIsStatusDialogOpen}
          >
            <DialogContent className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 shadow-xl rounded-2xl max-w-lg">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 dark:via-slate-700/10 to-transparent rounded-2xl"></div>
              <div className="relative z-10">
                <DialogHeader>
                  <DialogTitle className="text-slate-800 dark:text-white">
                    Update Ticket Status
                  </DialogTitle>
                  <DialogDescription className="text-slate-600 dark:text-slate-400">
                    Update the status of ticket {selectedTicket?.ticketNumber}
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="status-select"
                      className="text-slate-700 dark:text-slate-300"
                    >
                      Status
                    </Label>
                    <Select
                      value={statusForm.status}
                      onValueChange={(value) =>
                        setStatusForm({ ...statusForm, status: value })
                      }
                    >
                      <SelectTrigger className="rounded-xl bg-white/70 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-lg border border-white/50 dark:border-slate-700/50">
                        <SelectItem value="OPEN">Open</SelectItem>
                        <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                        <SelectItem value="RESOLVED">Resolved</SelectItem>
                        <SelectItem value="CLOSED">Closed</SelectItem>
                        <SelectItem value="ESCALATED">Escalated</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {(statusForm.status === "RESOLVED" ||
                    statusForm.status === "CLOSED") && (
                    <div className="space-y-2">
                      <Label
                        htmlFor="resolved-by"
                        className="text-slate-700 dark:text-slate-300"
                      >
                        Resolved By (Optional)
                      </Label>
                      <Input
                        id="resolved-by"
                        value={statusForm.resolvedBy}
                        onChange={(e) =>
                          setStatusForm({
                            ...statusForm,
                            resolvedBy: e.target.value,
                          })
                        }
                        placeholder="Enter resolver name"
                        className="rounded-xl bg-white/70 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600"
                      />
                    </div>
                  )}
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsStatusDialogOpen(false);
                      resetStatusForm();
                    }}
                    className="rounded-xl border-slate-200 dark:border-slate-600"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleUpdateStatus}
                    disabled={updateStatusLoading || !statusForm.status}
                    className="rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 shadow-md text-white"
                  >
                    {updateStatusLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Edit3 className="w-4 h-4 mr-2" />
                    )}
                    Update Status
                  </Button>
                </DialogFooter>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
};

export default SupportPage;
