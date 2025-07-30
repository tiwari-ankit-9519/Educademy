import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  FileText,
  GraduationCap,
  Briefcase,
  Download,
  Eye,
  User,
  Mail,
  Calendar,
  Shield,
  Star,
  Award,
  MessageSquare,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  getVerificationRequestById,
  reviewVerificationRequest,
  clearError,
  clearVerificationRequestDetails,
} from "@/features/adminSlice/adminUser";

const RequestDetailPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { requestId } = useParams();

  const {
    verificationRequestDetails,
    verificationRequestDetailsLoading,
    reviewVerificationRequestLoading,
    error,
  } = useSelector((state) => state.adminUser);

  const [reviewData, setReviewData] = useState({
    action: "",
    adminNotes: "",
    rejectionReason: "",
  });
  const [showReviewDialog, setShowReviewDialog] = useState(false);

  useEffect(() => {
    dispatch(clearError());
    if (requestId) {
      dispatch(getVerificationRequestById(requestId));
    }

    return () => {
      dispatch(clearVerificationRequestDetails());
    };
  }, [dispatch, requestId]);

  const handleReview = async () => {
    if (!reviewData.action) return;

    if (reviewData.action === "REJECT" && !reviewData.rejectionReason.trim()) {
      return;
    }

    try {
      await dispatch(
        reviewVerificationRequest({
          requestId,
          action: reviewData.action,
          adminNotes: reviewData.adminNotes,
          rejectionReason: reviewData.rejectionReason,
        })
      ).unwrap();

      setShowReviewDialog(false);
      setReviewData({ action: "", adminNotes: "", rejectionReason: "" });
    } catch (error) {
      console.error("Review failed:", error);
    }
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
      <Badge
        className={`${variants[status]} border-0 font-medium text-sm px-3 py-1`}
      >
        <Icon className="w-4 h-4 mr-2" />
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
      <Badge
        className={`${variants[level]} border-0 font-medium text-sm px-3 py-1`}
      >
        <Icon className="w-4 h-4 mr-2" />
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
      <Badge
        className={`${variants[priority]} border-0 font-medium text-sm px-3 py-1`}
      >
        {priority}
      </Badge>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const renderQualificationTitle = (qual) => {
    return qual.degree || qual.title || "N/A";
  };

  const renderQualificationInstitution = (qual) => {
    return qual.institute || qual.institution || "N/A";
  };

  const renderExperienceRole = (exp) => {
    return exp.role || exp.position || exp.title || "N/A";
  };

  const renderExperienceOrganization = (exp) => {
    return exp.organization || exp.company || exp.employer || "N/A";
  };

  const renderExperienceYears = (exp) => {
    return exp.years || exp.duration || exp.yearsOfExperience || "N/A";
  };

  if (verificationRequestDetailsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-cyan-50 dark:from-slate-900 dark:via-slate-800 dark:to-gray-900 flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
          <span className="text-slate-600 dark:text-slate-400">
            Loading request details...
          </span>
        </div>
      </div>
    );
  }

  if (!verificationRequestDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-cyan-50 dark:from-slate-900 dark:via-slate-800 dark:to-gray-900 flex items-center justify-center">
        <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 shadow-xl rounded-2xl p-6">
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
              Request Not Found
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              The verification request you're looking for could not be found.
            </p>
            <Button
              onClick={() => navigate("/admin/verification")}
              className="bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-white rounded-xl"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Requests
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const request = verificationRequestDetails;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-cyan-50 dark:from-slate-900 dark:via-slate-800 dark:to-gray-900 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              onClick={() => navigate(-1)}
              variant="outline"
              className="border-slate-200 dark:border-slate-700 rounded-xl"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                Verification Request Details
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                Request ID: {request.requestId}
              </p>
            </div>
          </div>

          {request.status === "PENDING" && (
            <div className="flex space-x-2">
              <Dialog
                open={showReviewDialog}
                onOpenChange={setShowReviewDialog}
              >
                <DialogTrigger asChild>
                  <Button
                    onClick={() =>
                      setReviewData({ ...reviewData, action: "REJECT" })
                    }
                    variant="outline"
                    className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20 rounded-xl"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                </DialogTrigger>
              </Dialog>

              <Dialog
                open={showReviewDialog}
                onOpenChange={setShowReviewDialog}
              >
                <DialogTrigger asChild>
                  <Button
                    onClick={() =>
                      setReviewData({ ...reviewData, action: "APPROVE" })
                    }
                    className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve
                  </Button>
                </DialogTrigger>
              </Dialog>
            </div>
          )}
        </div>

        {error && (
          <Alert className="bg-red-50/80 dark:bg-red-900/30 border-red-200 dark:border-red-700/50 backdrop-blur-sm rounded-xl">
            <AlertTriangle className="h-4 w-4 text-red-500 dark:text-red-400" />
            <AlertDescription className="text-red-700 dark:text-red-300">
              {error}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 shadow-xl rounded-2xl">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-slate-900 dark:text-white">
                  Request Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Status
                    </Label>
                    <div className="mt-1">{getStatusBadge(request.status)}</div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Verification Level
                    </Label>
                    <div className="mt-1">
                      {getVerificationLevelBadge(request.verificationLevel)}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Priority
                    </Label>
                    <div className="mt-1">
                      {getPriorityBadge(request.priority)}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Submitted At
                    </Label>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                      {formatDate(request.submittedAt)}
                    </p>
                  </div>
                </div>

                {request.reviewedAt && (
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <div>
                      <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Reviewed At
                      </Label>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                        {formatDate(request.reviewedAt)}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Reviewed By
                      </Label>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                        {request.reviewedBy}
                      </p>
                    </div>
                  </div>
                )}

                {request.additionalInfo && (
                  <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                    <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Additional Information
                    </Label>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 whitespace-pre-wrap">
                      {request.additionalInfo}
                    </p>
                  </div>
                )}

                {request.adminNotes && (
                  <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                    <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Admin Notes
                    </Label>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 whitespace-pre-wrap">
                      {request.adminNotes}
                    </p>
                  </div>
                )}

                {request.rejectionReason && (
                  <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                    <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Rejection Reason
                    </Label>
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1 whitespace-pre-wrap">
                      {request.rejectionReason}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 shadow-xl rounded-2xl">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-slate-900 dark:text-white flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Documents ({request.documents?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {request.documents && request.documents.length > 0 ? (
                  <div className="space-y-3">
                    {request.documents.map((doc, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl"
                      >
                        <div className="flex items-center space-x-3">
                          <FileText className="w-8 h-8 text-slate-400" />
                          <div>
                            <p className="font-medium text-slate-900 dark:text-white">
                              {doc.originalName}
                            </p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                              {formatFileSize(doc.size)} • {doc.mimeType}
                            </p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(doc.url, "_blank")}
                            className="border-slate-200 dark:border-slate-600 rounded-lg"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const link = document.createElement("a");
                              link.href = doc.url;
                              link.download = doc.originalName;
                              link.click();
                            }}
                            className="border-slate-200 dark:border-slate-600 rounded-lg"
                          >
                            <Download className="w-4 h-4 mr-1" />
                            Download
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 dark:text-slate-400 text-center py-4">
                    No documents submitted
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 shadow-xl rounded-2xl">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-slate-900 dark:text-white flex items-center">
                  <GraduationCap className="w-5 h-5 mr-2" />
                  Qualifications ({request.qualifications?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {request.qualifications && request.qualifications.length > 0 ? (
                  <div className="space-y-3">
                    {request.qualifications.map((qual, index) => (
                      <div
                        key={index}
                        className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-slate-900 dark:text-white">
                              {renderQualificationTitle(qual)}
                            </p>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              {renderQualificationInstitution(qual)}
                            </p>
                          </div>
                          <Badge className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300 border-0">
                            {qual.year}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 dark:text-slate-400 text-center py-4">
                    No qualifications submitted
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 shadow-xl rounded-2xl">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-slate-900 dark:text-white flex items-center">
                  <Briefcase className="w-5 h-5 mr-2" />
                  Experience ({request.experience?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {request.experience && request.experience.length > 0 ? (
                  <div className="space-y-3">
                    {request.experience.map((exp, index) => (
                      <div
                        key={index}
                        className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-slate-900 dark:text-white">
                              {renderExperienceRole(exp)}
                            </p>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              {renderExperienceOrganization(exp)}
                            </p>
                          </div>
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-0">
                            {renderExperienceYears(exp)} years
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 dark:text-slate-400 text-center py-4">
                    No experience submitted
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 shadow-xl rounded-2xl">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-slate-900 dark:text-white flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Instructor Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Name
                  </Label>
                  <p className="text-slate-900 dark:text-white font-medium mt-1">
                    {request.instructor.user.firstName}{" "}
                    {request.instructor.user.lastName}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Email
                  </Label>
                  <p className="text-slate-600 dark:text-slate-400 mt-1 flex items-center">
                    <Mail className="w-4 h-4 mr-2" />
                    {request.instructor.user.email}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Instructor ID
                  </Label>
                  <p className="text-slate-600 dark:text-slate-400 mt-1 font-mono text-sm">
                    {request.instructorId}
                  </p>
                </div>
                <Separator className="bg-slate-200 dark:bg-slate-700" />
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="text-xs text-slate-500 dark:text-slate-400">
                      Rating
                    </Label>
                    <p className="text-slate-900 dark:text-white font-medium">
                      {request.instructor.rating}/5
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500 dark:text-slate-400">
                      Students
                    </Label>
                    <p className="text-slate-900 dark:text-white font-medium">
                      {request.instructor.totalStudents}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500 dark:text-slate-400">
                      Courses
                    </Label>
                    <p className="text-slate-900 dark:text-white font-medium">
                      {request.instructor.totalCourses}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500 dark:text-slate-400">
                      Verified
                    </Label>
                    <p className="text-slate-900 dark:text-white font-medium">
                      {request.instructor.isVerified ? "Yes" : "No"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
          <DialogContent className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl max-w-md">
            <DialogHeader>
              <DialogTitle className="text-slate-900 dark:text-white">
                {reviewData.action === "APPROVE"
                  ? "Approve Request"
                  : "Reject Request"}
              </DialogTitle>
              <DialogDescription className="text-slate-600 dark:text-slate-400">
                {reviewData.action === "APPROVE"
                  ? "Approve this verification request and grant the instructor verified status."
                  : "Reject this verification request with a reason."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Admin Notes
                </Label>
                <Textarea
                  value={reviewData.adminNotes}
                  onChange={(e) =>
                    setReviewData({ ...reviewData, adminNotes: e.target.value })
                  }
                  placeholder="Add any notes about this review..."
                  className="mt-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl"
                  rows={3}
                />
              </div>

              {reviewData.action === "REJECT" && (
                <div>
                  <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Rejection Reason *
                  </Label>
                  <Textarea
                    value={reviewData.rejectionReason}
                    onChange={(e) =>
                      setReviewData({
                        ...reviewData,
                        rejectionReason: e.target.value,
                      })
                    }
                    placeholder="Explain why this request is being rejected..."
                    className="mt-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl"
                    rows={3}
                    required
                  />
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowReviewDialog(false)}
                  className="border-slate-200 dark:border-slate-700 rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleReview}
                  disabled={
                    reviewVerificationRequestLoading ||
                    (reviewData.action === "REJECT" &&
                      !reviewData.rejectionReason.trim())
                  }
                  className={`rounded-xl ${
                    reviewData.action === "APPROVE"
                      ? "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                      : "bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600"
                  } text-white`}
                >
                  {reviewVerificationRequestLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : reviewData.action === "APPROVE" ? (
                    <CheckCircle className="w-4 h-4 mr-2" />
                  ) : (
                    <XCircle className="w-4 h-4 mr-2" />
                  )}
                  {reviewData.action === "APPROVE" ? "Approve" : "Reject"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default RequestDetailPage;
