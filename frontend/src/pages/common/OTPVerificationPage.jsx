/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import { gsap } from "gsap";
import {
  ArrowRight,
  AlertCircle,
  CheckCircle,
  Loader2,
  Zap,
  RotateCcw,
  Mail,
  ArrowLeft,
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
import { verifyUser, resendOTP, clearError } from "@/features/authSlice";

const OTPVerificationPage = () => {
  const { theme } = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { loading, error, isAuthenticated, user } = useSelector(
    (state) => state.auth
  );

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [email, setEmail] = useState(localStorage.getItem("verificationEmail"));
  const [validationErrors, setValidationErrors] = useState({});
  const [resendTimer, setResendTimer] = useState(0);
  const [canResend, setCanResend] = useState(true);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [isTokenVerification, setIsTokenVerification] = useState(false);
  const [tokenVerifying, setTokenVerifying] = useState(false);

  const containerRef = useRef(null);
  const formRef = useRef(null);
  const titleRef = useRef(null);
  const cardRef = useRef(null);
  const backgroundRef = useRef(null);
  const particlesRef = useRef(null);
  const gradientRef = useRef(null);
  const otpRefs = useRef([]);

  const initializeAnimations = useCallback(() => {
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
          opacity: theme === "dark" ? 0.15 : 0.1,
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
        duration: 8 + index * 0.8,
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
        duration: 5 + Math.random() * 3,
        y: `${Math.random() * 40 - 20}px`,
        x: `${Math.random() * 40 - 20}px`,
        opacity: Math.random() * 0.3 + 0.2,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        delay: index * 0.2,
      });
    });
  }, [theme]);

  const animateGradient = useCallback(() => {
    gsap.to(gradientRef.current, {
      backgroundPosition: "100% 100%",
      duration: 15,
      repeat: -1,
      yoyo: true,
      ease: "linear",
    });
  }, []);

  const handleTokenVerification = useCallback(
    async (token) => {
      setTokenVerifying(true);
      try {
        await dispatch(verifyUser({ token })).unwrap();
      } catch (error) {
        setIsTokenVerification(false);
        setTokenVerifying(false);
        initializeAnimations();
        animateGradient();
        console.log(error);
      }
    },
    [animateGradient, dispatch, initializeAnimations]
  );

  useEffect(() => {
    dispatch(clearError());

    const token = searchParams.get("token");
    if (token) {
      setIsTokenVerification(true);
      handleTokenVerification(token);
    } else {
      initializeAnimations();
      animateGradient();
      const savedEmail = localStorage.getItem("verificationEmail") || "";
      setEmail(savedEmail);
      if (otpRefs.current[0]) {
        otpRefs.current[0].focus();
      }
    }
  }, [
    dispatch,
    searchParams,
    initializeAnimations,
    animateGradient,
    handleTokenVerification,
  ]);

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
      gsap.to(gradientRef.current, {
        background: "linear-gradient(135deg, #0f172a, #1e293b, #0f172a)",
        duration: 1,
      });
    } else {
      document.documentElement.classList.remove("dark");
      gsap.to(gradientRef.current, {
        background: "linear-gradient(135deg, #e0f2fe, #f0f9ff, #e0f2fe)",
        duration: 1,
      });
    }
  }, [theme]);

  useEffect(() => {
    if (isAuthenticated && user) {
      successAnimation();
      setTimeout(() => {
        navigate("/");
      }, 1500);
    }
  }, [isAuthenticated, user, navigate]);

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

  const validateOTP = () => {
    const errors = {};
    const otpString = otp.join("");

    if (!email) {
      errors.email = "Email is required";
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email)) {
      errors.email = "Please enter a valid email address";
    }

    if (!otpString) {
      errors.otp = "Please enter the verification code";
    } else if (otpString.length !== 6) {
      errors.otp = "Please enter all 6 digits";
    } else if (!/^\d{6}$/.test(otpString)) {
      errors.otp = "Verification code must contain only numbers";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleOTPChange = (value, index) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

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
      if (!otp[index] && index > 0) {
        const newOtp = [...otp];
        newOtp[index - 1] = "";
        setOtp(newOtp);
        otpRefs.current[index - 1]?.focus();
      } else {
        const newOtp = [...otp];
        newOtp[index] = "";
        setOtp(newOtp);
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
      setOtp(newOtp);
      otpRefs.current[5]?.focus();
    }
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);

    if (validationErrors.email) {
      setValidationErrors((prev) => ({
        ...prev,
        email: "",
      }));
    }

    if (error) {
      dispatch(clearError());
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateOTP()) {
      shakeForm();
      return;
    }

    dispatch(clearError());

    try {
      const otpString = otp.join("");
      await dispatch(
        verifyUser({ email: email.trim().toLowerCase(), otp: otpString })
      ).unwrap();
    } catch (error) {
      shakeForm();

      if (error.data?.code === "OTP_EXPIRED") {
        setCanResend(true);
        setResendTimer(0);
      } else if (error.data?.code === "OTP_VERIFICATION_FAILED") {
        if (error.data?.data?.remainingTimeSeconds > 0) {
          setResendTimer(0);
        } else {
          setCanResend(true);
          setResendTimer(0);
        }
      } else if (error.data?.code === "OTP_ATTEMPTS_EXCEEDED") {
        setCanResend(true);
        setResendTimer(0);
        setOtp(["", "", "", "", "", ""]);
      }

      console.log(error);
    }
  };

  const handleResendOTP = async () => {
    if (!canResend || resendTimer > 0) return;

    if (!email) {
      setValidationErrors({ email: "Please enter your email address" });
      return;
    }

    dispatch(clearError());
    setCanResend(false);
    setResendTimer(60);

    try {
      await dispatch(
        resendOTP({ email: email.trim().toLowerCase(), type: "verification" })
      ).unwrap();
      setOtp(["", "", "", "", "", ""]);
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

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (isTokenVerification) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-cyan-50 dark:from-slate-900 dark:via-slate-800 dark:to-gray-900 flex items-center justify-center p-4">
        <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 shadow-xl rounded-2xl w-full max-w-md">
          <CardContent className="p-8 text-center relative z-10">
            <div className="mx-auto mb-6 w-16 h-16 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-300/30 dark:shadow-indigo-500/20">
              <Mail className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">
              Verifying Your Email
            </h2>
            {tokenVerifying ? (
              <>
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-indigo-500" />
                <p className="text-slate-600 dark:text-slate-400">
                  Please wait while we verify your email address...
                </p>
              </>
            ) : (
              <>
                {error && (
                  <Alert className="bg-red-50/80 dark:bg-red-900/30 border-red-200 dark:border-red-700/50 backdrop-blur-sm mb-4">
                    <AlertCircle className="h-4 w-4 text-red-500 dark:text-red-400" />
                    <AlertDescription className="text-red-700 dark:text-red-300 text-sm">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}
                {isAuthenticated && (
                  <Alert className="bg-green-50/80 dark:bg-green-900/30 border-green-200 dark:border-green-700/50 backdrop-blur-sm mb-4">
                    <CheckCircle className="h-4 w-4 text-green-500 dark:text-green-400" />
                    <AlertDescription className="text-green-700 dark:text-green-300 text-sm">
                      Email verified successfully! Redirecting...
                    </AlertDescription>
                  </Alert>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div
      ref={gradientRef}
      className="min-h-screen relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-cyan-50 dark:from-slate-900 dark:via-slate-800 dark:to-gray-900"
    >
      <div
        ref={backgroundRef}
        className="absolute inset-0 overflow-hidden pointer-events-none"
      >
        <div className="floating-shape absolute top-16 left-16 w-24 h-24 bg-indigo-300/20 dark:bg-indigo-500/10 rounded-full"></div>
        <div className="floating-shape absolute top-32 right-24 w-32 h-32 bg-blue-300/20 dark:bg-blue-500/10 rounded-2xl"></div>
        <div className="floating-shape absolute bottom-24 left-24 w-28 h-28 bg-cyan-300/20 dark:bg-cyan-500/10 rounded-full"></div>
        <div className="floating-shape absolute bottom-16 right-16 w-20 h-20 bg-violet-300/20 dark:bg-violet-500/10 rounded-2xl"></div>
        <div className="floating-shape absolute top-1/2 left-1/3 w-16 h-16 bg-teal-300/10 dark:bg-teal-500/5 rounded-full"></div>
        <div className="floating-shape absolute top-1/3 right-1/3 w-12 h-12 bg-sky-300/10 dark:bg-sky-500/5 rounded-2xl"></div>
      </div>

      <div
        ref={particlesRef}
        className="absolute inset-0 overflow-hidden pointer-events-none"
      >
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="particle absolute w-1.5 h-1.5 bg-indigo-300/30 dark:bg-indigo-500/20 rounded-full"
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
            className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 shadow-xl rounded-2xl overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 dark:via-slate-700/10 to-transparent"></div>
            <CardHeader
              ref={titleRef}
              className="text-center pb-6 sm:pb-8 relative z-10"
            >
              <div className="mx-auto mb-4 sm:mb-6 relative">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-2xl sm:rounded-3xl flex items-center justify-center shadow-lg shadow-indigo-300/30 dark:shadow-indigo-500/20">
                  <Mail className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center shadow">
                  <Zap className="w-2 h-2 sm:w-3 sm:h-3 text-white" />
                </div>
              </div>
              <CardTitle className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white">
                Verify Your Email
              </CardTitle>
              <CardDescription className="text-slate-500 dark:text-slate-400 text-sm sm:text-base mt-2">
                Enter the 6-digit code sent to your email address
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6 relative z-10">
              {error && (
                <Alert className="bg-red-50/80 dark:bg-red-900/30 border-red-200 dark:border-red-700/50 backdrop-blur-sm">
                  <AlertCircle className="h-4 w-4 text-red-500 dark:text-red-400" />
                  <AlertDescription className="text-red-700 dark:text-red-300 text-sm">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              {isAuthenticated && (
                <Alert className="bg-green-50/80 dark:bg-green-900/30 border-green-200 dark:border-green-700/50 backdrop-blur-sm">
                  <CheckCircle className="h-4 w-4 text-green-500 dark:text-green-400" />
                  <AlertDescription className="text-green-700 dark:text-green-300 text-sm">
                    Email verified successfully! Redirecting...
                  </AlertDescription>
                </Alert>
              )}

              <div ref={formRef} className="space-y-4 sm:space-y-6">
                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className="text-sm font-medium text-slate-700 dark:text-slate-300"
                  >
                    Email Address
                  </Label>
                  <div className="relative group">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500 w-4 h-4 sm:w-5 sm:h-5 transition-colors group-focus-within:text-indigo-500" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={email}
                      onChange={handleEmailChange}
                      disabled={loading}
                      className={`pl-10 sm:pl-12 pr-4 py-2 sm:py-3 h-10 sm:h-12 bg-white/70 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl transition-all duration-200 focus:ring-0 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base ${
                        validationErrors.email
                          ? "border-red-300 dark:border-red-500/50"
                          : ""
                      }`}
                      placeholder="you@example.com"
                      autoComplete="email"
                    />
                    {validationErrors.email && (
                      <AlertCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500 w-4 h-4 sm:w-5 sm:h-5" />
                    )}
                  </div>
                  {validationErrors.email && (
                    <p className="text-xs sm:text-sm text-red-500 dark:text-red-400 mt-1">
                      {validationErrors.email}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Verification Code
                  </Label>
                  <div className="flex space-x-2 sm:space-x-3 justify-center">
                    {otp.map((digit, index) => (
                      <Input
                        key={index}
                        ref={(el) => (otpRefs.current[index] = el)}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOTPChange(e.target.value, index)}
                        onKeyDown={(e) => handleKeyDown(e, index)}
                        onPaste={index === 0 ? handlePaste : undefined}
                        onFocus={() => setFocusedIndex(index)}
                        disabled={loading}
                        className={`w-10 h-10 sm:w-12 sm:h-12 text-center text-lg sm:text-xl font-semibold bg-white/70 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl transition-all duration-200 focus:ring-2 focus:ring-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed ${
                          validationErrors.otp
                            ? "border-red-300 dark:border-red-500/50"
                            : ""
                        }`}
                      />
                    ))}
                  </div>
                  {validationErrors.otp && (
                    <p className="text-xs sm:text-sm text-red-500 dark:text-red-400 mt-1 text-center">
                      {validationErrors.otp}
                    </p>
                  )}
                </div>

                <div className="text-center">
                  <Button
                    type="button"
                    variant="link"
                    onClick={handleResendOTP}
                    disabled={loading || !canResend || resendTimer > 0}
                    className="text-xs sm:text-sm text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 p-0 h-auto disabled:opacity-50"
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
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full h-10 sm:h-12 bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-white font-semibold text-sm sm:text-base rounded-xl shadow-md hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden"
                >
                  <span className="relative z-10 flex items-center justify-center">
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin mr-2" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        Verify Email
                        <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2 transition-transform group-hover:translate-x-1" />
                      </>
                    )}
                  </span>
                  <span className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                </Button>

                <div className="text-center">
                  <Button
                    type="button"
                    variant="link"
                    onClick={handleBackToLogin}
                    disabled={loading}
                    className="text-xs sm:text-sm text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-300 p-0 h-auto disabled:opacity-50"
                  >
                    <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                    Back to login
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="absolute bottom-4 left-0 right-0 text-center">
        <p className="text-xs text-slate-500/80 dark:text-slate-500">
          © 2023 LearnHub. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default OTPVerificationPage;
