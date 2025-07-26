import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { gsap } from "gsap";
import {
  ArrowRight,
  AlertCircle,
  CheckCircle,
  Loader2,
  Shield,
  Zap,
  RotateCcw,
  Mail,
  ArrowLeft,
  Lock,
  Eye,
  EyeOff,
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useTheme } from "@/components/ThemeProvider";
import {
  requestPasswordReset,
  resetPassword,
  resendOTP,
  clearError,
} from "@/features/common/authSlice";

const ForgotPasswordPage = () => {
  const { theme } = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.auth);

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    email: "",
    otp: ["", "", "", "", "", ""],
    newPassword: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [resendTimer, setResendTimer] = useState(0);
  const [canResend, setCanResend] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const containerRef = useRef(null);
  const formRef = useRef(null);
  const titleRef = useRef(null);
  const cardRef = useRef(null);
  const backgroundRef = useRef(null);
  const particlesRef = useRef(null);
  const otpRefs = useRef([]);

  useEffect(() => {
    dispatch(clearError());
    initializeAnimations();
  }, [dispatch]);

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    } else {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const initializeAnimations = () => {
    const tl = gsap.timeline();

    gsap.set([cardRef.current, titleRef.current, formRef.current], {
      opacity: 0,
      y: 60,
      scale: 0.95,
    });

    gsap.set(".floating-shape", {
      opacity: 0,
      scale: 0,
      rotation: -180,
    });

    gsap.set(".particle", {
      opacity: 0,
      scale: 0,
    });

    gsap.set(backgroundRef.current, {
      opacity: 0,
    });

    gsap.set(particlesRef.current, {
      opacity: 0,
    });

    tl.to(backgroundRef.current, {
      duration: 1,
      opacity: 1,
      ease: "power2.out",
    })
      .to(
        particlesRef.current,
        {
          duration: 0.8,
          opacity: 1,
          ease: "power2.out",
        },
        "-=0.5"
      )
      .to(
        ".floating-shape",
        {
          duration: 1.2,
          opacity: 0.4,
          scale: 1,
          rotation: 0,
          stagger: 0.15,
          ease: "back.out(1.7)",
        },
        "-=0.5"
      )
      .to(
        cardRef.current,
        {
          duration: 1,
          opacity: 1,
          y: 0,
          scale: 1,
          ease: "power3.out",
        },
        "-=0.8"
      )
      .to(
        titleRef.current,
        {
          duration: 0.8,
          opacity: 1,
          y: 0,
          ease: "power2.out",
        },
        "-=0.6"
      )
      .to(
        formRef.current,
        {
          duration: 0.8,
          opacity: 1,
          y: 0,
          ease: "power2.out",
        },
        "-=0.4"
      )
      .to(
        ".particle",
        {
          duration: 0.6,
          opacity: 1,
          scale: 1,
          stagger: 0.05,
          ease: "power2.out",
        },
        "-=0.4"
      );

    const floatingShapes = document.querySelectorAll(".floating-shape");
    floatingShapes.forEach((shape, index) => {
      gsap.to(shape, {
        duration: 6 + index * 0.8,
        y: `${Math.random() * 30 - 15}px`,
        x: `${Math.random() * 30 - 15}px`,
        rotation: `${Math.random() * 360}deg`,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        delay: index * 0.3,
      });
    });

    const particles = document.querySelectorAll(".particle");
    particles.forEach((particle, index) => {
      gsap.to(particle, {
        duration: 4 + Math.random() * 3,
        y: `${Math.random() * 40 - 20}px`,
        x: `${Math.random() * 40 - 20}px`,
        opacity: Math.random() * 0.3 + 0.2,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        delay: index * 0.2,
      });
    });
  };

  const shakeForm = () => {
    gsap.to(formRef.current, {
      duration: 0.1,
      x: -8,
      repeat: 6,
      yoyo: true,
      ease: "power2.inOut",
    });
  };

  const successAnimation = () => {
    gsap.to(cardRef.current, {
      duration: 0.6,
      scale: 1.02,
      ease: "power2.out",
    });

    gsap.to(cardRef.current, {
      duration: 0.6,
      scale: 1,
      ease: "power2.out",
      delay: 0.6,
    });

    gsap.to(".floating-shape", {
      duration: 0.8,
      scale: 1.2,
      opacity: 0.6,
      ease: "power2.out",
      stagger: 0.1,
    });
  };

  const validateEmailStep = () => {
    const errors = {};

    if (!formData.email) {
      errors.email = "Email is required";
    } else if (
      !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email)
    ) {
      errors.email = "Please enter a valid email address";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateResetStep = () => {
    const errors = {};
    const otpString = formData.otp.join("");

    if (!otpString) {
      errors.otp = "Please enter the verification code";
    } else if (otpString.length !== 6) {
      errors.otp = "Please enter all 6 digits";
    } else if (!/^\d{6}$/.test(otpString)) {
      errors.otp = "Verification code must contain only numbers";
    }

    if (!formData.newPassword) {
      errors.newPassword = "New password is required";
    } else if (formData.newPassword.length < 6) {
      errors.newPassword = "Password must be at least 6 characters";
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.newPassword)) {
      errors.newPassword =
        "Password must contain uppercase, lowercase and number";
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = "Please confirm your password";
    } else if (formData.newPassword !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
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
      dispatch(clearError());
    }
  };

  const handleOTPChange = (value, index) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...formData.otp];
    newOtp[index] = value;
    setFormData((prev) => ({
      ...prev,
      otp: newOtp,
    }));

    if (validationErrors.otp) {
      setValidationErrors((prev) => ({
        ...prev,
        otp: "",
      }));
    }

    if (error) {
      dispatch(clearError());
    }

    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace") {
      if (!formData.otp[index] && index > 0) {
        const newOtp = [...formData.otp];
        newOtp[index - 1] = "";
        setFormData((prev) => ({
          ...prev,
          otp: newOtp,
        }));
        otpRefs.current[index - 1]?.focus();
      } else {
        const newOtp = [...formData.otp];
        newOtp[index] = "";
        setFormData((prev) => ({
          ...prev,
          otp: newOtp,
        }));
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      otpRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text/plain");
    const digits = pastedData.replace(/\D/g, "").slice(0, 6);

    if (digits.length === 6) {
      const newOtp = digits.split("");
      setFormData((prev) => ({
        ...prev,
        otp: newOtp,
      }));
      otpRefs.current[5]?.focus();
    }
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();

    if (!validateEmailStep()) {
      shakeForm();
      return;
    }

    dispatch(clearError());

    try {
      await dispatch(
        requestPasswordReset({ email: formData.email.trim().toLowerCase() })
      ).unwrap();
      setStep(2);
      setCanResend(false);
      setResendTimer(60);
    } catch (error) {
      shakeForm();
      console.log(error);
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();

    if (!validateResetStep()) {
      shakeForm();
      return;
    }

    dispatch(clearError());

    try {
      const otpString = formData.otp.join("");
      await dispatch(
        resetPassword({
          email: formData.email.trim().toLowerCase(),
          otp: otpString,
          newPassword: formData.newPassword,
        })
      ).unwrap();

      setResetSuccess(true);
      successAnimation();
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (error) {
      shakeForm();

      if (error.includes("expired") || error.includes("invalid")) {
        setCanResend(true);
        setResendTimer(0);
      }

      console.log(error);
    }
  };

  const handleResendOTP = async () => {
    if (!canResend || resendTimer > 0) return;

    dispatch(clearError());
    setCanResend(false);
    setResendTimer(60);

    try {
      await dispatch(
        resendOTP({
          email: formData.email.trim().toLowerCase(),
          type: "password_reset",
        })
      ).unwrap();
      setFormData((prev) => ({
        ...prev,
        otp: ["", "", "", "", "", ""],
      }));
      otpRefs.current[0]?.focus();
    } catch (error) {
      setCanResend(true);
      setResendTimer(0);
      console.log(error);
    }
  };

  const handleBackToLogin = () => {
    navigate("/login");
  };

  const handleBackToEmail = () => {
    setStep(1);
    setFormData((prev) => ({
      ...prev,
      otp: ["", "", "", "", "", ""],
      newPassword: "",
      confirmPassword: "",
    }));
    setValidationErrors({});
    dispatch(clearError());
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 relative overflow-hidden">
      <div
        ref={backgroundRef}
        className="absolute inset-0 overflow-hidden pointer-events-none"
      >
        <div className="floating-shape absolute top-16 left-16 w-24 h-24 bg-blue-200 dark:bg-blue-800 rounded-full opacity-30"></div>
        <div className="floating-shape absolute top-32 right-24 w-32 h-32 bg-indigo-200 dark:bg-indigo-800 rounded-2xl opacity-30"></div>
        <div className="floating-shape absolute bottom-24 left-24 w-28 h-28 bg-cyan-200 dark:bg-cyan-800 rounded-full opacity-30"></div>
        <div className="floating-shape absolute bottom-16 right-16 w-20 h-20 bg-sky-200 dark:bg-sky-800 rounded-2xl opacity-30"></div>
        <div className="floating-shape absolute top-1/2 left-1/3 w-16 h-16 bg-blue-300 dark:bg-blue-700 rounded-full opacity-20"></div>
        <div className="floating-shape absolute top-1/3 right-1/3 w-12 h-12 bg-indigo-300 dark:bg-indigo-700 rounded-2xl opacity-20"></div>
      </div>

      <div
        ref={particlesRef}
        className="absolute inset-0 overflow-hidden pointer-events-none"
      >
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="particle absolute w-1 h-1 bg-slate-400 dark:bg-slate-600 rounded-full opacity-40"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
          />
        ))}
      </div>

      <div
        ref={containerRef}
        className="flex items-center justify-center min-h-screen p-4 sm:p-6 lg:p-8"
      >
        <div className="w-full max-w-sm sm:max-w-md">
          <Card
            ref={cardRef}
            className="bg-white dark:bg-slate-800 shadow-xl border border-slate-200 dark:border-slate-700"
          >
            <CardHeader ref={titleRef} className="text-center pb-6 sm:pb-8">
              <div className="mx-auto mb-4 sm:mb-6 relative">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-blue-500 rounded-2xl sm:rounded-3xl flex items-center justify-center shadow-lg">
                  <Shield className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 bg-orange-500 rounded-full flex items-center justify-center">
                  <Zap className="w-2 h-2 sm:w-3 sm:h-3 text-white" />
                </div>
              </div>
              <CardTitle className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                {step === 1 ? "Reset Password" : "Create New Password"}
              </CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-300 text-sm sm:text-base mt-2">
                {step === 1
                  ? "Enter your email address to receive a reset code"
                  : "Enter the code sent to your email and your new password"}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6">
              {error && (
                <Alert className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
                  <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                  <AlertDescription className="text-red-700 dark:text-red-400 text-sm">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              {resetSuccess && (
                <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <AlertDescription className="text-green-700 dark:text-green-400 text-sm">
                    Password reset successfully! Redirecting to login...
                  </AlertDescription>
                </Alert>
              )}

              <div ref={formRef} className="space-y-4 sm:space-y-6">
                {step === 1 ? (
                  <>
                    <div className="space-y-2">
                      <Label
                        htmlFor="email"
                        className="text-sm font-medium text-slate-700 dark:text-slate-300"
                      >
                        Email Address
                      </Label>
                      <div className="relative group">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500 w-4 h-4 sm:w-5 sm:h-5 transition-colors group-focus-within:text-blue-500" />
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          disabled={loading}
                          className={`pl-10 sm:pl-12 pr-4 py-2 sm:py-3 h-10 sm:h-12 bg-slate-50 dark:bg-slate-700 border-2 transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base ${
                            validationErrors.email
                              ? "border-red-300 dark:border-red-500"
                              : "border-slate-200 dark:border-slate-600"
                          }`}
                          placeholder="Enter your email"
                          autoComplete="email"
                        />
                        {validationErrors.email && (
                          <AlertCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500 w-4 h-4 sm:w-5 sm:h-5" />
                        )}
                      </div>
                      {validationErrors.email && (
                        <p className="text-xs sm:text-sm text-red-600 dark:text-red-400 mt-1">
                          {validationErrors.email}
                        </p>
                      )}
                    </div>

                    <Button
                      type="button"
                      onClick={handleEmailSubmit}
                      disabled={loading}
                      className="w-full h-10 sm:h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm sm:text-base shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin mr-2" />
                          Sending Code...
                        </>
                      ) : (
                        <>
                          Send Reset Code
                          <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
                        </>
                      )}
                    </Button>

                    <div className="text-center">
                      <Button
                        type="button"
                        variant="link"
                        onClick={handleBackToLogin}
                        disabled={loading}
                        className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 hover:text-slate-500 dark:hover:text-slate-200 p-0 h-auto disabled:opacity-50"
                      >
                        <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                        Back to login
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Verification Code
                      </Label>
                      <div className="flex space-x-2 sm:space-x-3 justify-center">
                        {formData.otp.map((digit, index) => (
                          <Input
                            key={index}
                            ref={(el) => (otpRefs.current[index] = el)}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            onChange={(e) =>
                              handleOTPChange(e.target.value, index)
                            }
                            onKeyDown={(e) => handleKeyDown(e, index)}
                            onPaste={index === 0 ? handlePaste : undefined}
                            disabled={loading}
                            className={`w-10 h-10 sm:w-12 sm:h-12 text-center text-lg sm:text-xl font-semibold bg-slate-50 dark:bg-slate-700 border-2 transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed ${
                              validationErrors.otp
                                ? "border-red-300 dark:border-red-500"
                                : "border-slate-200 dark:border-slate-600"
                            }`}
                          />
                        ))}
                      </div>
                      {validationErrors.otp && (
                        <p className="text-xs sm:text-sm text-red-600 dark:text-red-400 mt-1 text-center">
                          {validationErrors.otp}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label
                          htmlFor="newPassword"
                          className="text-sm font-medium text-slate-700 dark:text-slate-300"
                        >
                          New Password
                        </Label>
                        <div className="relative group">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500 w-4 h-4 sm:w-5 sm:h-5 transition-colors group-focus-within:text-blue-500" />
                          <Input
                            id="newPassword"
                            name="newPassword"
                            type={showPassword ? "text" : "password"}
                            value={formData.newPassword}
                            onChange={handleInputChange}
                            disabled={loading}
                            className={`pl-10 sm:pl-12 pr-10 sm:pr-12 py-2 sm:py-3 h-10 sm:h-12 bg-slate-50 dark:bg-slate-700 border-2 transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base ${
                              validationErrors.newPassword
                                ? "border-red-300 dark:border-red-500"
                                : "border-slate-200 dark:border-slate-600"
                            }`}
                            placeholder="New password"
                            autoComplete="new-password"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowPassword(!showPassword)}
                            disabled={loading}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 sm:h-8 sm:w-8 p-0 hover:bg-transparent disabled:opacity-50"
                          >
                            {showPassword ? (
                              <EyeOff className="w-3 h-3 sm:w-4 sm:h-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" />
                            ) : (
                              <Eye className="w-3 h-3 sm:w-4 sm:h-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" />
                            )}
                          </Button>
                        </div>
                        {validationErrors.newPassword && (
                          <p className="text-xs sm:text-sm text-red-600 dark:text-red-400 mt-1">
                            {validationErrors.newPassword}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label
                          htmlFor="confirmPassword"
                          className="text-sm font-medium text-slate-700 dark:text-slate-300"
                        >
                          Confirm Password
                        </Label>
                        <div className="relative group">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500 w-4 h-4 sm:w-5 sm:h-5 transition-colors group-focus-within:text-blue-500" />
                          <Input
                            id="confirmPassword"
                            name="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            value={formData.confirmPassword}
                            onChange={handleInputChange}
                            disabled={loading}
                            className={`pl-10 sm:pl-12 pr-10 sm:pr-12 py-2 sm:py-3 h-10 sm:h-12 bg-slate-50 dark:bg-slate-700 border-2 transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base ${
                              validationErrors.confirmPassword
                                ? "border-red-300 dark:border-red-500"
                                : "border-slate-200 dark:border-slate-600"
                            }`}
                            placeholder="Confirm password"
                            autoComplete="new-password"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setShowConfirmPassword(!showConfirmPassword)
                            }
                            disabled={loading}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 sm:h-8 sm:w-8 p-0 hover:bg-transparent disabled:opacity-50"
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="w-3 h-3 sm:w-4 sm:h-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" />
                            ) : (
                              <Eye className="w-3 h-3 sm:w-4 sm:h-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" />
                            )}
                          </Button>
                        </div>
                        {validationErrors.confirmPassword && (
                          <p className="text-xs sm:text-sm text-red-600 dark:text-red-400 mt-1">
                            {validationErrors.confirmPassword}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="text-center">
                      <Button
                        type="button"
                        variant="link"
                        onClick={handleResendOTP}
                        disabled={loading || !canResend || resendTimer > 0}
                        className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 p-0 h-auto disabled:opacity-50"
                      >
                        {resendTimer > 0 ? (
                          `Resend code in ${formatTime(resendTimer)}`
                        ) : (
                          <>
                            <RotateCcw className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                            Resend verification code
                          </>
                        )}
                      </Button>
                    </div>

                    <Button
                      type="button"
                      onClick={handlePasswordReset}
                      disabled={loading}
                      className="w-full h-10 sm:h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm sm:text-base shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin mr-2" />
                          Resetting Password...
                        </>
                      ) : (
                        <>
                          Reset Password
                          <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
                        </>
                      )}
                    </Button>

                    <div className="flex justify-between items-center">
                      <Button
                        type="button"
                        variant="link"
                        onClick={handleBackToEmail}
                        disabled={loading}
                        className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 hover:text-slate-500 dark:hover:text-slate-200 p-0 h-auto disabled:opacity-50"
                      >
                        <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                        Change email address
                      </Button>
                      <Button
                        type="button"
                        variant="link"
                        onClick={handleBackToLogin}
                        disabled={loading}
                        className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 hover:text-slate-500 dark:hover:text-slate-200 p-0 h-auto disabled:opacity-50"
                      >
                        <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                        Back to login
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
