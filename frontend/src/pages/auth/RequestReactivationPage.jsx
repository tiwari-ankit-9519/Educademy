/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import {
  AlertTriangle,
  MessageSquare,
  CheckCircle,
  X,
  ArrowLeft,
  Loader2,
  Mail,
  User,
  FileText,
  Clock,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const RequestReactivationPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    requestReactivation,
    reactivationLoading,
    clearError,
    error,
    reactivationRequestData,
    hasExistingReactivationRequest,
    getExistingRequestInfo,
    checkReactivationRequestStatus,
    reactivationStatus,
    reactivationStatusLoading,
    clearDeactivatedUserData,
  } = useAuth();

  const [reactivationData, setReactivationData] = useState({
    reason: "",
    additionalInfo: "",
  });
  const [validationErrors, setValidationErrors] = useState({});
  const [isVisible, setIsVisible] = useState(false);
  const [reactivationSuccess, setReactivationSuccess] = useState(false);

  const { userId } = useParams();

  const deactivatedUserData = location.state?.deactivatedUserData || {
    userId: userId || "", // Get from URL params
    userEmail: "",
    userName: "User",
  };

  const existingRequestInfo = getExistingRequestInfo();
  const hasExistingRequest = hasExistingReactivationRequest();

  console.log("🔍 RequestReactivationPage Debug:");
  console.log("deactivatedUserData:", deactivatedUserData);
  console.log("hasExistingRequest:", hasExistingRequest);
  console.log("existingRequestInfo:", existingRequestInfo);
  console.log("reactivationStatus:", reactivationStatus);

  useEffect(() => {
    setIsVisible(true);
    clearError();

    if (!deactivatedUserData.userId) {
      console.log("❌ No userId found, redirecting to login");
      navigate("/auth/login", { replace: true });
      return;
    }

    console.log("✅ Making API call with userId:", deactivatedUserData.userId);
    checkReactivationRequestStatus(deactivatedUserData.userId);
  }, [
    clearError,
    deactivatedUserData.userId,
    navigate,
    checkReactivationRequestStatus,
  ]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        clearError();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setReactivationData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (validationErrors[name]) {
      setValidationErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }

    if (error) {
      clearError();
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!reactivationData.reason.trim()) {
      errors.reason = "Reason for reactivation is required";
    } else if (reactivationData.reason.trim().length < 10) {
      errors.reason =
        "Please provide a more detailed reason (at least 10 characters)";
    } else if (reactivationData.reason.trim().length > 1000) {
      errors.reason = "Reason cannot exceed 1000 characters";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const result = await requestReactivation({
        userId: deactivatedUserData.userId,
        reason: reactivationData.reason.trim(),
        additionalInfo: reactivationData.additionalInfo.trim(),
      });

      if (result.type === "auth/requestAccountReactivation/fulfilled") {
        setReactivationSuccess(true);
        setTimeout(() => {
          handleBackToLogin();
        }, 4000);
      }
    } catch (err) {
      console.error("Reactivation request error:", err);
    }
  };

  const handleBackToLogin = () => {
    console.log("🔄 Navigating back to login and clearing state");
    // Clear the deactivated user data from Redux state
    clearDeactivatedUserData();
    // Clear any error states
    clearError();
    // Navigate back to login
    navigate("/auth/login", { replace: true });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  const glowVariants = {
    animate: {
      scale: [1, 1.2, 1],
      opacity: [0.5, 0.8, 0.5],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
  };

  if (reactivationSuccess) {
    return (
      <div className="min-h-screen flex relative overflow-hidden bg-gradient-to-br from-slate-50 via-green-50 to-emerald-100 dark:from-slate-900 dark:via-slate-800 dark:to-emerald-900">
        <motion.div
          className="absolute inset-0 overflow-hidden pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
        >
          <motion.div
            className="absolute top-20 left-20 w-32 h-32 bg-green-500/10 rounded-full blur-xl"
            variants={glowVariants}
            animate="animate"
          />
          <motion.div
            className="absolute top-40 right-32 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl"
            variants={glowVariants}
            animate="animate"
            style={{ animationDelay: "1s" }}
          />
          <motion.div
            className="absolute bottom-32 left-1/4 w-40 h-40 bg-teal-500/10 rounded-full blur-xl"
            variants={glowVariants}
            animate="animate"
            style={{ animationDelay: "2s" }}
          />
        </motion.div>

        <div className="flex-1 flex items-center justify-center px-4 py-4 sm:px-6 lg:px-8 lg:py-8 relative z-10">
          <motion.div
            className="w-full max-w-lg"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
          >
            <motion.div
              className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-slate-700/50 p-6 sm:p-8 relative overflow-hidden"
              initial={{ y: 50 }}
              animate={{ y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />

              <div className="relative z-10 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, duration: 0.5, ease: "easeOut" }}
                >
                  <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
                </motion.div>

                <motion.h1
                  className="text-3xl font-bold text-slate-900 dark:text-white mb-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                >
                  Request Sent Successfully!
                </motion.h1>

                <motion.div
                  className="space-y-4 mb-8"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7, duration: 0.5 }}
                >
                  <p className="text-slate-600 dark:text-slate-300 text-lg">
                    Your account reactivation request has been submitted
                    successfully.
                  </p>

                  {reactivationRequestData && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-4">
                      <div className="flex items-center space-x-2 text-blue-800 dark:text-blue-200 mb-2">
                        <Info className="w-5 h-5" />
                        <span className="font-medium">Request Details</span>
                      </div>
                      <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                        <p>
                          <strong>Request ID:</strong>{" "}
                          {reactivationRequestData.requestId ||
                            reactivationRequestData.id}
                        </p>
                        <p>
                          <strong>Status:</strong>{" "}
                          {reactivationRequestData.status}
                        </p>
                        <p>
                          <strong>Expected Review Time:</strong>{" "}
                          {reactivationRequestData.expectedReviewTime ||
                            "1-3 business days"}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
                    <div className="flex items-center space-x-2 text-green-800 dark:text-green-200">
                      <Clock className="w-5 h-5" />
                      <span className="font-medium">What happens next?</span>
                    </div>
                    <ul className="mt-3 text-sm text-green-700 dark:text-green-300 space-y-1">
                      <li>• An administrator will review your request</li>
                      <li>
                        • You'll receive an email notification with the decision
                      </li>
                      <li>• This process typically takes 1-3 business days</li>
                      <li>
                        • If approved, your account will be reactivated
                        automatically
                      </li>
                    </ul>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9, duration: 0.5 }}
                >
                  <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">
                    Redirecting to login page in a few seconds...
                  </p>

                  <Button
                    onClick={handleBackToLogin}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-xl px-8 py-3 transition-all duration-200"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Login
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex relative overflow-hidden bg-gradient-to-br from-slate-50 via-orange-50 to-red-100 dark:from-slate-900 dark:via-slate-800 dark:to-red-900">
      <motion.div
        className="absolute inset-0 overflow-hidden pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <motion.div
          className="absolute top-20 left-20 w-32 h-32 bg-orange-500/10 rounded-full blur-xl"
          variants={glowVariants}
          animate="animate"
        />
        <motion.div
          className="absolute top-40 right-32 w-24 h-24 bg-red-500/10 rounded-full blur-xl"
          variants={glowVariants}
          animate="animate"
          style={{ animationDelay: "1s" }}
        />
        <motion.div
          className="absolute bottom-32 left-1/4 w-40 h-40 bg-yellow-500/10 rounded-full blur-xl"
          variants={glowVariants}
          animate="animate"
          style={{ animationDelay: "2s" }}
        />
      </motion.div>

      <div className="flex-1 flex items-center justify-center px-4 py-4 sm:px-6 lg:px-8 lg:py-8 relative z-10">
        <motion.div
          className="w-full max-w-lg"
          variants={containerVariants}
          initial="hidden"
          animate={isVisible ? "visible" : "hidden"}
        >
          <motion.div
            className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-slate-700/50 p-6 sm:p-8 relative overflow-hidden"
            variants={itemVariants}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />

            <motion.div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <motion.div
                  className="flex items-center space-x-3"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                      Account Reactivation
                    </h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Request to reactivate your account
                    </p>
                  </div>
                </motion.div>
              </div>

              <motion.div className="mb-6" variants={itemVariants}>
                <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-4 mb-6">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-orange-800 dark:text-orange-200 font-medium text-sm mb-2">
                        Account Status: Deactivated
                      </p>
                      <p className="text-orange-700 dark:text-orange-300 text-sm">
                        Your account has been deactivated by an administrator.
                        Please provide a reason for reactivation below.
                      </p>
                    </div>
                  </div>
                </div>

                {deactivatedUserData.userEmail && (
                  <div className="bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl p-4 mb-4">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-slate-500" />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          Account Details
                        </span>
                      </div>
                      <div className="ml-6 space-y-1">
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          <strong>Name:</strong> {deactivatedUserData.userName}
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          <strong>Email:</strong>{" "}
                          {deactivatedUserData.userEmail}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: "auto" }}
                    exit={{ opacity: 0, y: -10, height: 0 }}
                    className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl text-sm"
                  >
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                      <span>{error}</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {hasExistingRequest && existingRequestInfo?.hasPendingRequest ? (
                <motion.div
                  variants={itemVariants}
                  className="text-center space-y-4"
                >
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-6">
                    <Clock className="w-12 h-12 text-yellow-600 dark:text-yellow-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                      Request Already Submitted
                    </h3>
                    <p className="text-yellow-700 dark:text-yellow-300 text-sm mb-4">
                      You already have a pending reactivation request submitted
                      on{" "}
                      {existingRequestInfo?.submittedAt &&
                        new Date(
                          existingRequestInfo.submittedAt
                        ).toLocaleDateString()}
                    </p>
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                      <p className="text-blue-700 dark:text-blue-300 text-sm">
                        <strong>Status:</strong>{" "}
                        {existingRequestInfo?.status || "Pending"}
                      </p>
                      <p className="text-blue-700 dark:text-blue-300 text-sm">
                        <strong>Request ID:</strong> {existingRequestInfo?.id}
                      </p>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBackToLogin}
                    className="w-full h-12 border-slate-200 dark:border-slate-600 bg-white/50 dark:bg-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-600/50 backdrop-blur-sm rounded-xl transition-all duration-200"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Login
                  </Button>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <motion.div variants={itemVariants}>
                    <Label
                      htmlFor="reason"
                      className="text-slate-700 dark:text-slate-300 font-medium flex items-center space-x-2"
                    >
                      <FileText className="w-4 h-4" />
                      <span>Reason for Reactivation *</span>
                    </Label>
                    <div className="mt-2 space-y-2">
                      <Input
                        id="reason"
                        name="reason"
                        type="text"
                        value={reactivationData.reason}
                        onChange={handleInputChange}
                        className={`h-12 bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 ${
                          validationErrors.reason
                            ? "border-red-300 focus:ring-red-500"
                            : ""
                        }`}
                        placeholder="Brief explanation for why your account should be reactivated"
                        maxLength={1000}
                      />
                      <div className="flex justify-between items-center">
                        <div className="h-5">
                          <AnimatePresence>
                            {validationErrors.reason && (
                              <motion.p
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="text-sm text-red-600 dark:text-red-400"
                              >
                                {validationErrors.reason}
                              </motion.p>
                            )}
                          </AnimatePresence>
                        </div>
                        <span className="text-xs text-slate-500">
                          {reactivationData.reason.length}/1000
                        </span>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <Label
                      htmlFor="additionalInfo"
                      className="text-slate-700 dark:text-slate-300 font-medium flex items-center space-x-2"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>Additional Information (Optional)</span>
                    </Label>
                    <div className="mt-2">
                      <Textarea
                        id="additionalInfo"
                        name="additionalInfo"
                        value={reactivationData.additionalInfo}
                        onChange={handleInputChange}
                        className="min-h-[120px] bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 resize-none"
                        placeholder="Any additional details that might help with your reactivation request. For example, explain any misunderstandings or provide context for your situation..."
                        maxLength={2000}
                      />
                      <div className="flex justify-end mt-1">
                        <span className="text-xs text-slate-500">
                          {reactivationData.additionalInfo.length}/2000
                        </span>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div variants={itemVariants} className="space-y-4">
                    <Button
                      type="submit"
                      disabled={
                        reactivationLoading || !reactivationData.reason.trim()
                      }
                      className="w-full h-12 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 group disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {reactivationLoading ? (
                        <div className="flex items-center justify-center">
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Sending Request...
                        </div>
                      ) : (
                        <div className="flex items-center justify-center group-hover:space-x-2 transition-all duration-200">
                          <MessageSquare className="mr-2 h-5 w-5" />
                          <span>Submit Reactivation Request</span>
                        </div>
                      )}
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleBackToLogin}
                      className="w-full h-12 border-slate-200 dark:border-slate-600 bg-white/50 dark:bg-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-600/50 backdrop-blur-sm rounded-xl transition-all duration-200"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to Login
                    </Button>
                  </motion.div>
                </form>
              )}
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default RequestReactivationPage;
