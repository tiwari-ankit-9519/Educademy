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
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";
import {
  requestVerification,
  getMyVerificationRequests,
  getVerificationRequestDetails,
  updateVerificationRequest,
  cancelVerificationRequest,
  clearError,
  resetVerificationState,
} from "@/features/instructor/verificationSlice";
import {
  Shield,
  Plus,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Edit,
  Trash2,
  Send,
  Save,
  X,
  Loader2,
  Eye,
  AlertTriangle,
  Award,
  Calendar,
  Download,
  Upload,
} from "lucide-react";

const VerificationPage = () => {
  const dispatch = useDispatch();
  const {
    verificationRequests,
    currentRequest,
    requestDetails,
    currentStatus,
    totalRequests,
    error,
    loading,
    requestVerificationLoading,
    getMyRequestsLoading,
    getRequestDetailsLoading,
    updateRequestLoading,
    cancelRequestLoading,
  } = useSelector((state) => state.verification);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [requestToCancel, setRequestToCancel] = useState(null);
  const [hasInitialLoaded, setHasInitialLoaded] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);

  const [createFormData, setCreateFormData] = useState({
    verificationLevel: "BASIC",
    qualifications: [{ title: "", institution: "", year: "", document: "" }],
    experience: [{ title: "", company: "", duration: "", description: "" }],
    portfolio: [{ title: "", url: "", description: "" }],
    references: [{ name: "", email: "", phone: "", relationship: "" }],
    additionalInfo: "",
  });

  const [editFormData, setEditFormData] = useState({
    qualifications: [],
    experience: [],
    portfolio: [],
    references: [],
    additionalInfo: "",
  });

  useEffect(() => {
    if (!hasInitialLoaded) {
      loadVerificationRequests();
      setHasInitialLoaded(true);
    }
  }, [hasInitialLoaded]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  useEffect(() => {
    return () => {
      dispatch(resetVerificationState());
    };
  }, [dispatch]);

  const loadVerificationRequests = () => {
    dispatch(getMyVerificationRequests());
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(files);
    toast.success(`${files.length} file(s) selected for upload`);
  };

  const handleCreateVerificationRequest = async () => {
    if (selectedFiles.length === 0) {
      toast.error("Please select at least one document to upload");
      return;
    }

    try {
      const formData = new FormData();

      formData.append("verificationLevel", createFormData.verificationLevel);
      formData.append(
        "qualifications",
        JSON.stringify(
          createFormData.qualifications.filter((q) => q.title.trim())
        )
      );
      formData.append(
        "experience",
        JSON.stringify(createFormData.experience.filter((e) => e.title.trim()))
      );
      formData.append(
        "portfolio",
        JSON.stringify(createFormData.portfolio.filter((p) => p.title.trim()))
      );
      formData.append(
        "references",
        JSON.stringify(createFormData.references.filter((r) => r.name.trim()))
      );
      formData.append("additionalInfo", createFormData.additionalInfo);

      selectedFiles.forEach((file) => {
        formData.append("documents", file);
      });

      await dispatch(requestVerification(formData)).unwrap();

      setIsCreateDialogOpen(false);
      setSelectedFiles([]);
      setCreateFormData({
        verificationLevel: "BASIC",
        qualifications: [
          { title: "", institution: "", year: "", document: "" },
        ],
        experience: [{ title: "", company: "", duration: "", description: "" }],
        portfolio: [{ title: "", url: "", description: "" }],
        references: [{ name: "", email: "", phone: "", relationship: "" }],
        additionalInfo: "",
      });

      toast.success("Verification request submitted successfully!");
      loadVerificationRequests();
    } catch (error) {
      toast.error(error.message || "Failed to submit verification request");
    }
  };

  const handleUpdateVerificationRequest = async () => {
    try {
      await dispatch(
        updateVerificationRequest({
          requestId: selectedRequest.requestId,
          updateData: editFormData,
        })
      ).unwrap();

      setIsEditDialogOpen(false);
      setSelectedRequest(null);
      toast.success("Verification request updated successfully!");
      loadVerificationRequests();
    } catch (error) {
      toast.error(error.message || "Failed to update verification request");
    }
  };

  const handleCancelVerificationRequest = async () => {
    if (!requestToCancel) return;

    try {
      await dispatch(
        cancelVerificationRequest(requestToCancel.requestId)
      ).unwrap();

      setIsCancelDialogOpen(false);
      setRequestToCancel(null);
      toast.success("Verification request cancelled successfully!");
      loadVerificationRequests();
    } catch (error) {
      toast.error(error.message || "Failed to cancel verification request");
    }
  };

  const openDetailsDialog = async (request) => {
    setSelectedRequest(request);
    setIsDetailsDialogOpen(true);
    try {
      await dispatch(getVerificationRequestDetails(request.requestId)).unwrap();
    } catch (error) {
      toast.error(error.message || "Failed to load request details");
    }
  };

  const openEditDialog = (request) => {
    setSelectedRequest(request);
    setEditFormData({
      qualifications: request.qualifications || [],
      experience: request.experience || [],
      portfolio: request.portfolio || [],
      references: request.references || [],
      additionalInfo: request.additionalInfo || "",
    });
    setIsEditDialogOpen(true);
  };

  const openCancelDialog = (request) => {
    setRequestToCancel(request);
    setIsCancelDialogOpen(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
      case "UNDER_REVIEW":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
      case "APPROVED":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      case "REJECTED":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
      case "CANCELLED":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
    }
  };

  const getVerificationLevelColor = (level) => {
    switch (level) {
      case "BASIC":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
      case "PREMIUM":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300";
      case "EXPERT":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "PENDING":
        return <Clock className="w-4 h-4" />;
      case "UNDER_REVIEW":
        return <Eye className="w-4 h-4" />;
      case "APPROVED":
        return <CheckCircle className="w-4 h-4" />;
      case "REJECTED":
        return <XCircle className="w-4 h-4" />;
      case "CANCELLED":
        return <X className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const addFormField = (fieldName) => {
    const fieldDefaults = {
      qualifications: { title: "", institution: "", year: "", document: "" },
      experience: { title: "", company: "", duration: "", description: "" },
      portfolio: { title: "", url: "", description: "" },
      references: { name: "", email: "", phone: "", relationship: "" },
    };

    setCreateFormData((prev) => ({
      ...prev,
      [fieldName]: [...prev[fieldName], fieldDefaults[fieldName]],
    }));
  };

  const removeFormField = (fieldName, index) => {
    setCreateFormData((prev) => ({
      ...prev,
      [fieldName]: prev[fieldName].filter((_, i) => i !== index),
    }));
  };

  const updateFormField = (fieldName, index, field, value) => {
    setCreateFormData((prev) => ({
      ...prev,
      [fieldName]: prev[fieldName].map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const isCurrentRequest = (request) => {
    return currentRequest && currentRequest.requestId === request.requestId;
  };

  const hasPendingRequest = () => {
    return verificationRequests.some(
      (request) =>
        request.status === "PENDING" || request.status === "UNDER_REVIEW"
    );
  };

  const getRequestButtonText = () => {
    if (currentStatus.isVerified) {
      return "Request Higher Verification";
    }
    if (hasPendingRequest()) {
      return "Submit Another Request";
    }
    return "Request Verification";
  };

  if (loading && verificationRequests.length === 0 && !hasInitialLoaded) {
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
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div className="flex items-center space-x-4 mb-4 lg:mb-0">
            <div className="p-3 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-2xl shadow-lg">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-800 dark:text-white">
                Instructor Verification
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Manage your verification requests and credentials
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Dialog
              open={isCreateDialogOpen}
              onOpenChange={setIsCreateDialogOpen}
            >
              <DialogTrigger asChild>
                <Button className="rounded-xl bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  {getRequestButtonText()}
                </Button>
              </DialogTrigger>
            </Dialog>

            <Button
              variant="outline"
              onClick={loadVerificationRequests}
              disabled={getMyRequestsLoading}
              className="rounded-xl border-white/50 dark:border-slate-700/50 bg-white/30 dark:bg-slate-800/30 backdrop-blur-sm hover:bg-white/50 dark:hover:bg-slate-700/50"
            >
              <RefreshCw
                className={cn(
                  "w-4 h-4 mr-2",
                  getMyRequestsLoading && "animate-spin"
                )}
              />
              Refresh
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 shadow-xl rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Verification Status
                  </p>
                  <p className="text-lg font-bold text-slate-800 dark:text-white">
                    {currentStatus.isVerified ? "Verified" : "Not Verified"}
                  </p>
                </div>
                <div
                  className={cn(
                    "p-2 rounded-lg shadow-lg",
                    currentStatus.isVerified
                      ? "bg-gradient-to-br from-green-500 to-emerald-500"
                      : "bg-gradient-to-br from-gray-500 to-slate-500"
                  )}
                >
                  {currentStatus.isVerified ? (
                    <CheckCircle className="w-5 h-5 text-white" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-white" />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 shadow-xl rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Total Requests
                  </p>
                  <p className="text-2xl font-bold text-slate-800 dark:text-white">
                    {totalRequests}
                  </p>
                </div>
                <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg shadow-lg">
                  <FileText className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 shadow-xl rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Pending
                  </p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {
                      verificationRequests.filter(
                        (r) =>
                          r.status === "PENDING" || r.status === "UNDER_REVIEW"
                      ).length
                    }
                  </p>
                </div>
                <div className="p-2 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg shadow-lg">
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
                    Badge Level
                  </p>
                  <p className="text-lg font-bold text-slate-800 dark:text-white">
                    {currentStatus.verificationBadge || "None"}
                  </p>
                </div>
                <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg shadow-lg">
                  <Award className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 shadow-xl rounded-2xl">
          <CardHeader className="pb-6">
            <div className="flex items-center justify-between">
              <CardTitle className="text-slate-800 dark:text-white">
                Verification Requests
              </CardTitle>
              {getMyRequestsLoading && (
                <Badge className="bg-blue-100 text-blue-800">
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  Loading...
                </Badge>
              )}
            </div>
          </CardHeader>

          <CardContent>
            <div className="space-y-4">
              {verificationRequests.length > 0 ? (
                verificationRequests.map((request) => (
                  <div
                    key={request.requestId}
                    className={cn(
                      "p-6 rounded-xl border transition-all duration-200",
                      isCurrentRequest(request)
                        ? "bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-700 shadow-lg"
                        : "bg-white/50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 hover:bg-white/70 dark:hover:bg-slate-700/70"
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
                            {request.verificationLevel} Verification
                          </h3>

                          {isCurrentRequest(request) && (
                            <Badge className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                              Current
                            </Badge>
                          )}

                          <Badge
                            className={cn(
                              "text-xs",
                              getStatusColor(request.status)
                            )}
                          >
                            {getStatusIcon(request.status)}
                            <span className="ml-1">{request.status}</span>
                          </Badge>

                          <Badge
                            className={cn(
                              "text-xs",
                              getVerificationLevelColor(
                                request.verificationLevel
                              )
                            )}
                          >
                            {request.verificationLevel}
                          </Badge>
                        </div>

                        <div className="flex items-center space-x-6 text-sm text-slate-500 dark:text-slate-400 mb-3">
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>
                              Submitted{" "}
                              {formatDistanceToNow(
                                new Date(request.submittedAt)
                              )}{" "}
                              ago
                            </span>
                          </div>
                          {request.reviewedAt && (
                            <div className="flex items-center space-x-1">
                              <Eye className="w-4 h-4" />
                              <span>
                                Reviewed{" "}
                                {formatDistanceToNow(
                                  new Date(request.reviewedAt)
                                )}{" "}
                                ago
                              </span>
                            </div>
                          )}
                          {request.documentsUploaded && (
                            <div className="flex items-center space-x-1">
                              <Upload className="w-4 h-4" />
                              <span>{request.documentsUploaded} documents</span>
                            </div>
                          )}
                        </div>

                        {request.estimatedReviewTime && (
                          <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">
                            Estimated review time: {request.estimatedReviewTime}
                          </p>
                        )}

                        {request.rejectionReason && (
                          <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-700">
                            <p className="text-sm text-red-700 dark:text-red-300 font-medium">
                              Rejection Reason:
                            </p>
                            <p className="text-sm text-red-600 dark:text-red-400">
                              {request.rejectionReason}
                            </p>
                          </div>
                        )}

                        {request.adminNotes && request.status !== "PENDING" && (
                          <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                            <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                              Admin Notes:
                            </p>
                            <p className="text-sm text-blue-600 dark:text-blue-400">
                              {request.adminNotes}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center space-x-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openDetailsDialog(request)}
                          className="rounded-lg"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>

                        {request.status === "PENDING" && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditDialog(request)}
                              className="rounded-lg"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openCancelDialog(request)}
                              disabled={cancelRequestLoading}
                              className="rounded-lg text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : !getMyRequestsLoading ? (
                <div className="text-center py-12">
                  <Shield className="w-12 h-12 mx-auto text-slate-400 mb-4 opacity-50" />
                  <p className="text-slate-600 dark:text-slate-400 mb-4">
                    No verification requests found
                  </p>
                  <Button
                    onClick={() => setIsCreateDialogOpen(true)}
                    className="rounded-xl bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Submit Your First Request
                  </Button>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Loader2 className="w-8 h-8 mx-auto text-slate-400 mb-4 animate-spin" />
                  <p className="text-slate-600 dark:text-slate-400">
                    Loading verification requests...
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-6xl w-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/50 dark:border-slate-700/50 shadow-2xl">
            <DialogHeader>
              <DialogTitle>Request Instructor Verification</DialogTitle>
              <DialogDescription>
                Submit your credentials and documents for verification to
                enhance your profile credibility.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-2">
                  <Label className="text-base font-semibold">
                    Verification Level *
                  </Label>
                  <Select
                    value={createFormData.verificationLevel}
                    onValueChange={(value) =>
                      setCreateFormData({
                        ...createFormData,
                        verificationLevel: value,
                      })
                    }
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BASIC">Basic Verification</SelectItem>
                      <SelectItem value="PREMIUM">
                        Premium Verification
                      </SelectItem>
                      <SelectItem value="EXPERT">
                        Expert Verification
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-base font-semibold">
                    Documents * (Required)
                  </Label>
                  <Input
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    className="rounded-xl"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  />
                  <p className="text-sm text-slate-500">
                    Upload certificates, diplomas, transcripts, or other
                    verification documents (PDF, DOC, DOCX, JPG, PNG)
                  </p>
                </div>
              </div>

              {selectedFiles.length > 0 && (
                <div className="p-3 border border-white/30 dark:border-slate-700/50 rounded-xl bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm">
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Selected files ({selectedFiles.length}):
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {selectedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-400 bg-white/70 dark:bg-slate-700/70 p-2 rounded-lg border border-white/40 dark:border-slate-600/50"
                      >
                        <FileText className="w-4 h-4" />
                        <div className="flex-1 min-w-0">
                          <span className="truncate block">{file.name}</span>
                          <span className="text-xs text-slate-400">
                            ({Math.round(file.size / 1024)} KB)
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-lg font-semibold">
                      Qualifications
                    </Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addFormField("qualifications")}
                      className="rounded-lg"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {createFormData.qualifications.map((qual, index) => (
                      <div
                        key={index}
                        className="p-3 border border-white/30 dark:border-slate-700/50 rounded-xl bg-white/30 dark:bg-slate-800/30 backdrop-blur-sm"
                      >
                        <div className="grid grid-cols-4 gap-3">
                          <Input
                            placeholder="Title/Degree"
                            value={qual.title}
                            onChange={(e) =>
                              updateFormField(
                                "qualifications",
                                index,
                                "title",
                                e.target.value
                              )
                            }
                            className="rounded-lg"
                          />
                          <Input
                            placeholder="Institution"
                            value={qual.institution}
                            onChange={(e) =>
                              updateFormField(
                                "qualifications",
                                index,
                                "institution",
                                e.target.value
                              )
                            }
                            className="rounded-lg"
                          />
                          <Input
                            placeholder="Year"
                            value={qual.year}
                            onChange={(e) =>
                              updateFormField(
                                "qualifications",
                                index,
                                "year",
                                e.target.value
                              )
                            }
                            className="rounded-lg"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              removeFormField("qualifications", index)
                            }
                            className="rounded-lg text-red-600"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-lg font-semibold">Experience</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addFormField("experience")}
                      className="rounded-lg"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {createFormData.experience.map((exp, index) => (
                      <div
                        key={index}
                        className="p-3 border border-white/30 dark:border-slate-700/50 rounded-xl bg-white/30 dark:bg-slate-800/30 backdrop-blur-sm"
                      >
                        <div className="space-y-3">
                          <div className="grid grid-cols-3 gap-3">
                            <Input
                              placeholder="Job Title"
                              value={exp.title}
                              onChange={(e) =>
                                updateFormField(
                                  "experience",
                                  index,
                                  "title",
                                  e.target.value
                                )
                              }
                              className="rounded-lg"
                            />
                            <Input
                              placeholder="Company"
                              value={exp.company}
                              onChange={(e) =>
                                updateFormField(
                                  "experience",
                                  index,
                                  "company",
                                  e.target.value
                                )
                              }
                              className="rounded-lg"
                            />
                            <Input
                              placeholder="Duration"
                              value={exp.duration}
                              onChange={(e) =>
                                updateFormField(
                                  "experience",
                                  index,
                                  "duration",
                                  e.target.value
                                )
                              }
                              className="rounded-lg"
                            />
                          </div>
                          <div className="flex space-x-3">
                            <Textarea
                              placeholder="Description"
                              value={exp.description}
                              onChange={(e) =>
                                updateFormField(
                                  "experience",
                                  index,
                                  "description",
                                  e.target.value
                                )
                              }
                              className="rounded-lg flex-1"
                              rows={2}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                removeFormField("experience", index)
                              }
                              className="rounded-lg text-red-600 self-start"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-lg font-semibold">
                  Additional Information
                </Label>
                <Textarea
                  value={createFormData.additionalInfo}
                  onChange={(e) =>
                    setCreateFormData({
                      ...createFormData,
                      additionalInfo: e.target.value,
                    })
                  }
                  placeholder="Any additional information to support your verification request..."
                  className="rounded-xl min-h-[80px]"
                />
              </div>
            </div>

            <DialogFooter className="pt-4">
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateVerificationRequest}
                disabled={
                  requestVerificationLoading || selectedFiles.length === 0
                }
                className="rounded-xl"
              >
                {requestVerificationLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                Submit Request
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={isDetailsDialogOpen}
          onOpenChange={setIsDetailsDialogOpen}
        >
          <DialogContent className="max-w-[90vw] w-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/50 dark:border-slate-700/50 shadow-2xl">
            <DialogHeader>
              <DialogTitle>Verification Request Details</DialogTitle>
              <DialogDescription>
                Complete information about your verification request
              </DialogDescription>
            </DialogHeader>

            {getRequestDetailsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                <span>Loading request details...</span>
              </div>
            ) : requestDetails ? (
              <div className="space-y-6 py-4">
                <div className="grid grid-cols-4 gap-8 p-6 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-lg border border-white/30 dark:border-slate-700/50">
                  <div>
                    <Label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                      Request ID
                    </Label>
                    <p className="font-mono text-sm mt-2 break-all">
                      {requestDetails.requestId}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                      Status
                    </Label>
                    <div className="mt-2">
                      <Badge
                        className={cn(
                          "text-xs",
                          getStatusColor(requestDetails.status)
                        )}
                      >
                        {getStatusIcon(requestDetails.status)}
                        <span className="ml-1">{requestDetails.status}</span>
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                      Verification Level
                    </Label>
                    <div className="mt-2">
                      <Badge
                        className={cn(
                          "text-xs",
                          getVerificationLevelColor(
                            requestDetails.verificationLevel
                          )
                        )}
                      >
                        {requestDetails.verificationLevel}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                      Submitted At
                    </Label>
                    <p className="text-sm mt-2">
                      {format(
                        new Date(requestDetails.submittedAt),
                        "MMM dd, yyyy"
                      )}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8">
                  {requestDetails.documents &&
                    requestDetails.documents.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-lg mb-4">
                          Documents ({requestDetails.documents.length})
                        </h3>
                        <div className="space-y-3">
                          {requestDetails.documents.map((doc, index) => (
                            <div
                              key={index}
                              className="flex items-center space-x-4 p-4 border border-white/30 dark:border-slate-700/50 rounded-lg bg-white/30 dark:bg-slate-800/30 backdrop-blur-sm"
                            >
                              <FileText className="w-5 h-5 text-blue-500" />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">
                                  {doc.originalName || doc.filename}
                                </p>
                                <p className="text-xs text-slate-500 mt-1">
                                  {Math.round(doc.size / 1024)} KB •{" "}
                                  {doc.mimeType}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  {requestDetails.qualifications &&
                    requestDetails.qualifications.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-lg mb-4">
                          Qualifications
                        </h3>
                        <div className="space-y-3">
                          {requestDetails.qualifications.map((qual, index) => (
                            <div
                              key={index}
                              className="p-4 border border-white/30 dark:border-slate-700/50 rounded-lg bg-white/30 dark:bg-slate-800/30 backdrop-blur-sm"
                            >
                              <p className="font-medium text-sm">
                                {qual.degree || qual.title}
                              </p>
                              <p className="text-xs text-slate-600 mt-1">
                                {qual.institute || qual.institution} •{" "}
                                {qual.year}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-8">
                  {requestDetails.experience &&
                    requestDetails.experience.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-lg mb-4">
                          Experience
                        </h3>
                        <div className="space-y-3">
                          {requestDetails.experience.map((exp, index) => (
                            <div
                              key={index}
                              className="p-4 border border-white/30 dark:border-slate-700/50 rounded-lg bg-white/30 dark:bg-slate-800/30 backdrop-blur-sm"
                            >
                              <p className="font-medium text-sm">
                                {exp.role || exp.title} at{" "}
                                {exp.organization || exp.company}
                              </p>
                              <p className="text-xs text-slate-600 mt-1">
                                {exp.years
                                  ? `${exp.years} years`
                                  : exp.duration}
                              </p>
                              {exp.description && (
                                <p className="text-xs text-slate-500 mt-2">
                                  {exp.description}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  {requestDetails.additionalInfo && (
                    <div>
                      <h3 className="font-semibold text-lg mb-4">
                        Additional Information
                      </h3>
                      <div className="p-4 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-lg border border-white/30 dark:border-slate-700/50">
                        <p className="text-sm">
                          {requestDetails.additionalInfo}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                No details available
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDetailsDialogOpen(false)}
                className="rounded-xl"
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-4xl w-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/50 dark:border-slate-700/50 shadow-2xl">
            <DialogHeader>
              <DialogTitle>Edit Verification Request</DialogTitle>
              <DialogDescription>
                Update your verification request information (Only pending
                requests can be edited)
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2">
              <div className="space-y-2">
                <Label className="text-base font-semibold">
                  Additional Information
                </Label>
                <Textarea
                  value={editFormData.additionalInfo}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      additionalInfo: e.target.value,
                    })
                  }
                  placeholder="Any additional information to support your verification request..."
                  className="rounded-xl min-h-[100px]"
                />
              </div>
            </div>

            <DialogFooter className="pt-4">
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateVerificationRequest}
                disabled={updateRequestLoading}
                className="rounded-xl"
              >
                {updateRequestLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog
          open={isCancelDialogOpen}
          onOpenChange={setIsCancelDialogOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cancel Verification Request</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to cancel this verification request? This
                action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleCancelVerificationRequest}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {cancelRequestLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                Yes, Cancel Request
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default VerificationPage;
