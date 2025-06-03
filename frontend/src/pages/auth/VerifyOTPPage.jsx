/* eslint-disable no-unused-vars */
import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import {
  Mail,
  Loader2,
  ArrowRight,
  Sparkles,
  Shield,
  CheckCircle,
  RefreshCw,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ModeToggle } from "@/components/ModeToggle";

const VerifyOTPPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    verifyOtp,
    register,
    isLoading,
    error,
    clearError,
    registrationStep,
    setRegistrationStep,
    isAuthenticated,
    user,
  } = useAuth();

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isResending, setIsResending] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [validationErrors, setValidationErrors] = useState({});
  const [isVisible, setIsVisible] = useState(false);
  const inputRefs = useRef([]);

  // Get email and name from navigation state or redirect if missing
  const email = location.state?.email;
  const name = location.state?.name;

  useEffect(() => {
    if (!email) {
      // If no email is provided, redirect to register page and reset registration step
      setRegistrationStep("register");
      navigate("/auth/register", { replace: true });
      return;
    }
    setIsVisible(true);
    clearError();

    // Start initial timer
    setResendTimer(60);
  }, [email, navigate, clearError, setRegistrationStep]);

  // Handle successful authentication - redirect based on role
  useEffect(() => {
    if (isAuthenticated && user) {
      const userRole = user?.role?.toLowerCase();
      console.log("User authenticated with role:", userRole); // Debug log

      // Define role-based navigation routes
      const roleRoutes = {
        student: "/student/dashboard",
        instructor: "/instructor/dashboard",
        admin: "/admin/dashboard",
      };

      const navigationTarget = roleRoutes[userRole] || "/dashboard";
      console.log("Navigating authenticated user to:", navigationTarget); // Debug log

      navigate(navigationTarget, { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        clearError();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  // Timer countdown effect
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => {
        setResendTimer(resendTimer - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleOtpChange = (index, value) => {
    // Only allow numbers and single character
    if (!/^\d*$/.test(value) || value.length > 1) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Clear validation error when user starts typing
    if (validationErrors.otp) {
      setValidationErrors({});
    }

    if (error) {
      clearError();
    }

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6);

    if (!/^\d+$/.test(pastedData)) return;

    const newOtp = [...otp];
    for (let i = 0; i < pastedData.length && i < 6; i++) {
      newOtp[i] = pastedData[i];
    }
    setOtp(newOtp);

    // Focus the next empty input or the last one
    const nextEmptyIndex = newOtp.findIndex(
      (digit, index) => !digit && index < 6
    );
    const focusIndex = nextEmptyIndex !== -1 ? nextEmptyIndex : 5;
    inputRefs.current[focusIndex]?.focus();
  };

  const validateOtp = () => {
    const otpString = otp.join("");
    const errors = {};

    if (otpString.length !== 6) {
      errors.otp = "Please enter the complete 6-digit OTP";
    } else if (!/^\d{6}$/.test(otpString)) {
      errors.otp = "OTP must contain only numbers";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateOtp()) {
      return;
    }

    try {
      const otpString = otp.join("");
      const result = await verifyOtp({ email, otp: otpString });

      if (result.type === "auth/verifyOTP/fulfilled") {
        // Reset registration step after successful verification
        setRegistrationStep("register");
        // Navigation will be handled by the authentication state change
      }
    } catch (err) {
      console.error("OTP verification error:", err);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0 || isResending) return;

    setIsResending(true);
    try {
      // Create a minimal registration data for resend
      const resendData = new FormData();
      resendData.append("email", email);

      const result = await register(resendData);

      if (result.type === "auth/registerUser/fulfilled") {
        setResendTimer(60); // Reset timer
        setOtp(["", "", "", "", "", ""]); // Clear current OTP
        // Focus first input
        inputRefs.current[0]?.focus();
      }
    } catch (err) {
      console.error("Resend OTP error:", err);
    } finally {
      setIsResending(false);
    }
  };

  const handleBackToRegister = () => {
    setRegistrationStep("register");
    navigate("/auth/register", { replace: true });
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

  const floatingVariants = {
    animate: {
      y: [-10, 10, -10],
      rotate: [0, 5, -5, 0],
      transition: {
        duration: 6,
        repeat: Infinity,
        ease: "easeInOut",
      },
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

  return (
    <div className="min-h-screen flex relative overflow-hidden bg-gradient-to-br from-slate-50 via-green-50 to-emerald-100 dark:from-slate-900 dark:via-slate-800 dark:to-emerald-900">
      <motion.div
        className="absolute inset-0 overflow-hidden pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <motion.div
          className="absolute top-20 left-20 w-32 h-32 bg-emerald-500/10 rounded-full blur-xl"
          variants={glowVariants}
          animate="animate"
        />
        <motion.div
          className="absolute top-40 right-32 w-24 h-24 bg-green-500/10 rounded-full blur-xl"
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
          className="w-full max-w-md"
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
              <div className="flex items-center justify-between mb-6 sm:mb-8">
                <motion.div
                  className="flex items-center space-x-2"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-green-600 rounded-lg flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                    Educademy
                  </span>
                </motion.div>

                <motion.div className="ml-auto">
                  <ModeToggle />
                </motion.div>
              </div>

              {/* Back button */}
              <motion.div className="mb-6" variants={itemVariants}>
                <Button
                  variant="ghost"
                  onClick={handleBackToRegister}
                  className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 p-0"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to registration
                </Button>
              </motion.div>

              <motion.div
                className="text-center mb-6 sm:mb-8"
                variants={itemVariants}
              >
                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-2">
                  Verify Your Email
                </h1>
                <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base">
                  We've sent a 6-digit verification code to
                </p>
                <p className="text-emerald-600 dark:text-emerald-400 font-semibold">
                  {email}
                </p>
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
                      <Shield className="w-4 h-4 flex-shrink-0" />
                      <span>{error}</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleSubmit} className="space-y-6">
                <motion.div variants={itemVariants}>
                  <Label className="text-slate-700 dark:text-slate-300 font-medium text-center block mb-4">
                    Enter verification code
                  </Label>

                  <div className="flex justify-center space-x-2 sm:space-x-3">
                    {otp.map((digit, index) => (
                      <Input
                        key={index}
                        ref={(el) => (inputRefs.current[index] = el)}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        onPaste={handlePaste}
                        className={`w-12 h-12 sm:w-14 sm:h-14 text-center text-lg font-semibold bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 ${
                          validationErrors.otp
                            ? "border-red-300 focus:ring-red-500"
                            : ""
                        }`}
                        placeholder="0"
                      />
                    ))}
                  </div>

                  <div className="h-5 mt-2">
                    <AnimatePresence>
                      {validationErrors.otp && (
                        <motion.p
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="text-sm text-red-600 dark:text-red-400 text-center"
                        >
                          {validationErrors.otp}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>

                <motion.div variants={itemVariants}>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-12 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 group"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center">
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Verifying...
                      </div>
                    ) : (
                      <div className="flex items-center justify-center group-hover:space-x-2 transition-all duration-200">
                        <CheckCircle className="mr-2 h-5 w-5" />
                        <span>Verify Email</span>
                        <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
                      </div>
                    )}
                  </Button>
                </motion.div>

                <motion.div
                  className="text-center space-y-3"
                  variants={itemVariants}
                >
                  <p className="text-slate-600 dark:text-slate-400 text-sm">
                    Didn't receive the code?
                  </p>

                  {resendTimer > 0 ? (
                    <p className="text-emerald-600 dark:text-emerald-400 text-sm font-medium">
                      Resend code in {resendTimer}s
                    </p>
                  ) : (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={handleResendOtp}
                      disabled={isResending}
                      className="text-emerald-600 hover:text-emerald-500 dark:text-emerald-400 dark:hover:text-emerald-300 font-semibold"
                    >
                      {isResending ? (
                        <div className="flex items-center">
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Resend code
                        </div>
                      )}
                    </Button>
                  )}
                </motion.div>

                <motion.div className="text-center" variants={itemVariants}>
                  <p className="text-slate-600 dark:text-slate-400 text-sm">
                    Wrong email?{" "}
                    <button
                      onClick={handleBackToRegister}
                      className="text-emerald-600 hover:text-emerald-500 dark:text-emerald-400 dark:hover:text-emerald-300 font-semibold transition-colors underline"
                    >
                      Change email
                    </button>
                  </p>
                </motion.div>
              </form>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>

      <div className="hidden lg:flex flex-1 items-center justify-center relative overflow-hidden -ml-8">
        <motion.div
          className="relative z-10 text-center max-w-md -ml-16"
          variants={containerVariants}
          initial="hidden"
          animate={isVisible ? "visible" : "hidden"}
        >
          <motion.div
            className="mb-8"
            variants={floatingVariants}
            animate="animate"
          >
            <div className="w-64 h-64 mx-auto relative">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-green-500/20 rounded-3xl transform rotate-12" />
              <div className="absolute inset-4 bg-gradient-to-r from-emerald-600/30 to-green-600/30 rounded-2xl transform -rotate-6" />
              <div className="absolute inset-8 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-xl flex items-center justify-center">
                <div className="text-center">
                  <CheckCircle className="w-16 h-16 mx-auto mb-4 text-emerald-600" />
                  <div className="space-y-2">
                    <div className="h-2 bg-emerald-200 dark:bg-emerald-800 rounded-full" />
                    <div className="h-2 bg-green-200 dark:bg-green-800 rounded-full w-3/4 mx-auto" />
                    <div className="h-2 bg-teal-200 dark:bg-teal-800 rounded-full w-1/2 mx-auto" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Almost There,
              <br />
              <span className="bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                {name || "Learner"}!
              </span>
            </h2>
            <p className="text-slate-600 dark:text-slate-300 text-lg leading-relaxed">
              Just one more step to activate your account and join our learning
              community.
            </p>
          </motion.div>
        </motion.div>

        <motion.div
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="flex space-x-2">
            <div className="w-2 h-2 bg-emerald-400 rounded-full" />
            <div className="w-2 h-2 bg-green-400 rounded-full" />
            <div className="w-2 h-2 bg-teal-400 rounded-full" />
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default VerifyOTPPage;
