import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  ArrowRight,
  AlertCircle,
  CheckCircle,
  Loader2,
  Shield,
  Zap,
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
import { loginUser, clearError } from "@/features/common/authSlice";
import SocialLogin from "@/components/SocialLogin";

const LoginPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, isAuthenticated } = useSelector(
    (state) => state.auth
  );

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  const formRef = useRef(null);

  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  const shakeForm = () => {
    if (formRef.current) {
      formRef.current.style.transform = "translateX(-8px)";
      setTimeout(() => {
        if (formRef.current) {
          formRef.current.style.transform = "translateX(8px)";
          setTimeout(() => {
            if (formRef.current) {
              formRef.current.style.transform = "translateX(-8px)";
              setTimeout(() => {
                if (formRef.current) {
                  formRef.current.style.transform = "translateX(8px)";
                  setTimeout(() => {
                    if (formRef.current) {
                      formRef.current.style.transform = "translateX(-8px)";
                      setTimeout(() => {
                        if (formRef.current) {
                          formRef.current.style.transform = "translateX(8px)";
                          setTimeout(() => {
                            if (formRef.current) {
                              formRef.current.style.transform =
                                "translateX(0px)";
                            }
                          }, 100);
                        }
                      }, 100);
                    }
                  }, 100);
                }
              }, 100);
            }
          }, 100);
        }
      }, 100);
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.email) {
      errors.email = "Email is required";
    } else if (
      !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email)
    ) {
      errors.email = "Please enter a valid email address";
    }

    if (!formData.password) {
      errors.password = "Password is required";
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      shakeForm();
      return;
    }

    dispatch(clearError());

    try {
      const res = await dispatch(
        loginUser({
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
        })
      ).unwrap();

      const loggedInUser = res.data.user;
      console.log(loggedInUser.role);

      if (loggedInUser.role === "STUDENT") {
        navigate("/");
      } else if (loggedInUser.role === "INSTRUCTOR") {
        navigate("/instructor/dashboard");
      } else {
        navigate("/admin/dashboard");
      }
    } catch (error) {
      shakeForm();
      console.log(error);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-cyan-50 dark:from-slate-900 dark:via-slate-800 dark:to-gray-900">
      <div className="flex items-center justify-center min-h-screen p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-sm sm:max-w-md">
          <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 shadow-xl rounded-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 dark:via-slate-700/10 to-transparent"></div>
            <CardHeader className="text-center pb-6 sm:pb-8 relative z-10">
              <div className="mx-auto mb-4 sm:mb-6 relative">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-2xl sm:rounded-3xl flex items-center justify-center shadow-lg shadow-indigo-300/30 dark:shadow-indigo-500/20">
                  <Shield className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center shadow">
                  <Zap className="w-2 h-2 sm:w-3 sm:h-3 text-white" />
                </div>
              </div>
              <CardTitle className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white">
                Welcome Back
              </CardTitle>
              <CardDescription className="text-slate-500 dark:text-slate-400 text-sm sm:text-base mt-2">
                Sign in to continue your learning journey
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
                    Login successful! Redirecting...
                  </AlertDescription>
                </Alert>
              )}

              <div
                ref={formRef}
                className="space-y-4 sm:space-y-6 transition-transform duration-100"
              >
                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className="text-sm font-medium text-slate-700 dark:text-slate-300"
                  >
                    Email Address
                  </Label>
                  <div className="relative group">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500 w-4 h-4 sm:w-5 sm:h-5" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
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
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="password"
                      className="text-sm font-medium text-slate-700 dark:text-slate-300"
                    >
                      Password
                    </Label>
                    <Link
                      to="/forgot-password"
                      className="text-xs sm:text-sm text-indigo-500 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium transition-colors"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500 w-4 h-4 sm:w-5 sm:h-5" />
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={handleInputChange}
                      disabled={loading}
                      className={`pl-10 sm:pl-12 pr-10 sm:pr-12 py-2 sm:py-3 h-10 sm:h-12 bg-white/70 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl transition-all duration-200 focus:ring-0 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base ${
                        validationErrors.password
                          ? "border-red-300 dark:border-red-500/50"
                          : ""
                      }`}
                      placeholder="••••••••"
                      autoComplete="current-password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={loading}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 sm:h-8 sm:w-8 p-0 hover:bg-transparent text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 disabled:opacity-50"
                    >
                      {showPassword ? (
                        <EyeOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      ) : (
                        <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      )}
                    </Button>
                  </div>
                  {validationErrors.password && (
                    <p className="text-xs sm:text-sm text-red-500 dark:text-red-400 mt-1">
                      {validationErrors.password}
                    </p>
                  )}
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
                        Signing in...
                      </>
                    ) : (
                      <>
                        Sign in
                        <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2 transition-transform group-hover:translate-x-1" />
                      </>
                    )}
                  </span>
                  <span className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                </Button>
              </div>

              <div>
                <SocialLogin disabled={loading} />
              </div>

              <div className="text-center pt-2">
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                  Don't have an account?{" "}
                  <Link
                    to="/register"
                    className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 font-semibold transition-colors"
                  >
                    Create one
                  </Link>
                </p>
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

export default LoginPage;
