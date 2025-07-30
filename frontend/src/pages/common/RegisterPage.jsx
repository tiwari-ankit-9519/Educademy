import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  ArrowRight,
  AlertCircle,
  CheckCircle,
  Loader2,
  Zap,
  User,
  Upload,
  X,
  UserCheck,
  GraduationCap,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { registerUser, clearError } from "@/features/common/authSlice";
import { useNavigate } from "react-router-dom";
import SocialLogin from "@/components/SocialLogin";

const RegisterPage = () => {
  const dispatch = useDispatch();
  const { loading, error, isAuthenticated } = useSelector(
    (state) => state.auth
  );

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "STUDENT",
    profileImage: null,
    termsAccepted: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [imagePreview, setImagePreview] = useState(null);
  const navigate = useNavigate();

  const formRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  useEffect(() => {
    console.log("FormData role changed:", formData.role);
  }, [formData.role]);

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

    if (!formData.firstName.trim()) {
      errors.firstName = "First name is required";
    } else if (formData.firstName.trim().length < 2) {
      errors.firstName = "First name must be at least 2 characters";
    }

    if (!formData.lastName.trim()) {
      errors.lastName = "Last name is required";
    } else if (formData.lastName.trim().length < 2) {
      errors.lastName = "Last name must be at least 2 characters";
    }

    if (!formData.email) {
      errors.email = "Email is required";
    } else if (
      !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email)
    ) {
      errors.email = "Please enter a valid email address";
    }

    if (!formData.password) {
      errors.password = "Password is required";
    } else if (formData.password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      errors.password = "Password must contain uppercase, lowercase and number";
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    if (!formData.termsAccepted) {
      errors.termsAccepted = "You must accept the terms and conditions";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === "checkbox" ? checked : value;

    setFormData((prev) => {
      const updated = {
        ...prev,
        [name]: newValue,
      };
      console.log(`Field ${name} updated to:`, newValue);
      return updated;
    });

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

  const handleRoleChange = (value) => {
    console.log("Role dropdown changed to:", value);
    setFormData((prev) => {
      const updated = {
        ...prev,
        role: value,
      };
      console.log("FormData after role change:", updated);
      return updated;
    });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setValidationErrors((prev) => ({
          ...prev,
          profileImage: "Image size must be less than 5MB",
        }));
        return;
      }

      if (!file.type.startsWith("image/")) {
        setValidationErrors((prev) => ({
          ...prev,
          profileImage: "Please select a valid image file",
        }));
        return;
      }

      setFormData((prev) => ({
        ...prev,
        profileImage: file,
      }));

      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);

      setValidationErrors((prev) => ({
        ...prev,
        profileImage: "",
      }));
    }
  };

  const removeImage = () => {
    setFormData((prev) => ({
      ...prev,
      profileImage: null,
    }));
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
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
      const submitData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        role: formData.role,
      };

      if (formData.profileImage) {
        submitData.profileImage = formData.profileImage;
      }

      await dispatch(registerUser(submitData)).unwrap();
      localStorage.setItem("verificationEmail", submitData.email);
      navigate("/verify-otp");
    } catch (error) {
      shakeForm();
      console.log(error);
    }
  };

  const handleLogin = () => {
    navigate("/login");
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-cyan-50 dark:from-slate-900 dark:via-slate-800 dark:to-gray-900">
      <div className="flex items-center justify-center min-h-screen p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-sm sm:max-w-md lg:max-w-lg">
          <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 shadow-xl rounded-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 dark:via-slate-700/10 to-transparent"></div>
            <CardHeader className="text-center pb-6 sm:pb-8 relative z-10">
              <div className="mx-auto mb-4 sm:mb-6 relative">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-2xl sm:rounded-3xl flex items-center justify-center shadow-lg shadow-indigo-300/30 dark:shadow-indigo-500/20">
                  <UserCheck className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center shadow">
                  <Zap className="w-2 h-2 sm:w-3 sm:h-3 text-white" />
                </div>
              </div>
              <CardTitle className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white">
                Create Account
              </CardTitle>
              <CardDescription className="text-slate-500 dark:text-slate-400 text-sm sm:text-base mt-2">
                Join us today and start your learning journey
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
                    Registration successful! Please check your email for
                    verification.
                  </AlertDescription>
                </Alert>
              )}

              <div
                ref={formRef}
                className="space-y-4 sm:space-y-6 transition-transform duration-100"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="firstName"
                      className="text-sm font-medium text-slate-700 dark:text-slate-300"
                    >
                      First Name
                    </Label>
                    <div className="relative group">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500 w-4 h-4 sm:w-5 sm:h-5" />
                      <Input
                        id="firstName"
                        name="firstName"
                        type="text"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        disabled={loading}
                        className={`pl-10 sm:pl-12 pr-4 py-2 sm:py-3 h-10 sm:h-12 bg-white/70 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl transition-all duration-200 focus:ring-0 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base ${
                          validationErrors.firstName
                            ? "border-red-300 dark:border-red-500/50"
                            : ""
                        }`}
                        placeholder="John"
                        autoComplete="given-name"
                      />
                      {validationErrors.firstName && (
                        <AlertCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500 w-4 h-4 sm:w-5 sm:h-5" />
                      )}
                    </div>
                    {validationErrors.firstName && (
                      <p className="text-xs sm:text-sm text-red-500 dark:text-red-400 mt-1">
                        {validationErrors.firstName}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="lastName"
                      className="text-sm font-medium text-slate-700 dark:text-slate-300"
                    >
                      Last Name
                    </Label>
                    <div className="relative group">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500 w-4 h-4 sm:w-5 sm:h-5" />
                      <Input
                        id="lastName"
                        name="lastName"
                        type="text"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        disabled={loading}
                        className={`pl-10 sm:pl-12 pr-4 py-2 sm:py-3 h-10 sm:h-12 bg-white/70 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl transition-all duration-200 focus:ring-0 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base ${
                          validationErrors.lastName
                            ? "border-red-300 dark:border-red-500/50"
                            : ""
                        }`}
                        placeholder="Doe"
                        autoComplete="family-name"
                      />
                      {validationErrors.lastName && (
                        <AlertCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500 w-4 h-4 sm:w-5 sm:h-5" />
                      )}
                    </div>
                    {validationErrors.lastName && (
                      <p className="text-xs sm:text-sm text-red-500 dark:text-red-400 mt-1">
                        {validationErrors.lastName}
                      </p>
                    )}
                  </div>
                </div>

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
                  <Label
                    htmlFor="role"
                    className="text-sm font-medium text-slate-700 dark:text-slate-300"
                  >
                    I want to join as
                  </Label>
                  <Select
                    value={formData.role}
                    onValueChange={handleRoleChange}
                    disabled={loading}
                  >
                    <SelectTrigger className="h-10 sm:h-12 bg-white/70 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500/30">
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg">
                      <SelectItem
                        value="STUDENT"
                        className="hover:bg-slate-100 dark:hover:bg-slate-700"
                      >
                        <div className="flex items-center space-x-2">
                          <GraduationCap className="w-4 h-4 text-indigo-500" />
                          <span>Student</span>
                        </div>
                      </SelectItem>
                      <SelectItem
                        value="INSTRUCTOR"
                        className="hover:bg-slate-100 dark:hover:bg-slate-700"
                      >
                        <div className="flex items-center space-x-2">
                          <UserCheck className="w-4 h-4 text-indigo-500" />
                          <span>Instructor</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Current role: {formData.role}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="password"
                      className="text-sm font-medium text-slate-700 dark:text-slate-300"
                    >
                      Password
                    </Label>
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
                        autoComplete="new-password"
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

                  <div className="space-y-2">
                    <Label
                      htmlFor="confirmPassword"
                      className="text-sm font-medium text-slate-700 dark:text-slate-300"
                    >
                      Confirm Password
                    </Label>
                    <div className="relative group">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500 w-4 h-4 sm:w-5 sm:h-5" />
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        disabled={loading}
                        className={`pl-10 sm:pl-12 pr-10 sm:pr-12 py-2 sm:py-3 h-10 sm:h-12 bg-white/70 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl transition-all duration-200 focus:ring-0 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base ${
                          validationErrors.confirmPassword
                            ? "border-red-300 dark:border-red-500/50"
                            : ""
                        }`}
                        placeholder="••••••••"
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
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 sm:h-8 sm:w-8 p-0 hover:bg-transparent text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 disabled:opacity-50"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        ) : (
                          <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        )}
                      </Button>
                    </div>
                    {validationErrors.confirmPassword && (
                      <p className="text-xs sm:text-sm text-red-500 dark:text-red-400 mt-1">
                        {validationErrors.confirmPassword}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Profile Picture (Optional)
                  </Label>
                  <div className="flex items-center space-x-4">
                    {imagePreview ? (
                      <div className="relative">
                        <img
                          src={imagePreview}
                          alt="Profile preview"
                          className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-slate-200 dark:border-slate-600 shadow-sm"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={removeImage}
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 shadow-md"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-slate-100 dark:bg-slate-700 border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center">
                        <Upload className="w-6 h-6 sm:w-8 sm:h-8 text-slate-400 dark:text-slate-500" />
                      </div>
                    )}
                    <div className="flex-1">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        disabled={loading}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={loading}
                        className="border border-slate-300 dark:border-slate-600 bg-white/50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700"
                      >
                        <Upload className="w-4 h-4 mr-2 text-slate-600 dark:text-slate-300" />
                        Choose Image
                      </Button>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        JPG, PNG up to 5MB
                      </p>
                    </div>
                  </div>
                  {validationErrors.profileImage && (
                    <p className="text-xs sm:text-sm text-red-500 dark:text-red-400 mt-1">
                      {validationErrors.profileImage}
                    </p>
                  )}
                </div>

                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="termsAccepted"
                    name="termsAccepted"
                    checked={formData.termsAccepted}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({
                        ...prev,
                        termsAccepted: checked,
                      }))
                    }
                    disabled={loading}
                    className="mt-1 border-slate-300 dark:border-slate-600"
                  />
                  <div className="flex-1">
                    <Label
                      htmlFor="termsAccepted"
                      className="text-sm text-slate-600 dark:text-slate-400 cursor-pointer"
                    >
                      I agree to the{" "}
                      <button
                        type="button"
                        className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 font-semibold transition-colors"
                      >
                        Terms of Service
                      </button>{" "}
                      and{" "}
                      <button
                        type="button"
                        className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 font-semibold transition-colors"
                      >
                        Privacy Policy
                      </button>
                    </Label>
                    {validationErrors.termsAccepted && (
                      <p className="text-xs sm:text-sm text-red-500 dark:text-red-400 mt-1">
                        {validationErrors.termsAccepted}
                      </p>
                    )}
                  </div>
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
                        Creating Account...
                      </>
                    ) : (
                      <>
                        Create Account
                        <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2 transition-transform group-hover:translate-x-1" />
                      </>
                    )}
                  </span>
                  <span className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                </Button>
              </div>
              <div className="text-center pt-2">
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                  Already have an account?{" "}
                  <Button
                    type="button"
                    variant="link"
                    onClick={handleLogin}
                    disabled={loading}
                    className="text-xs sm:text-sm text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 p-0 h-auto font-semibold disabled:opacity-50"
                  >
                    Sign in here
                  </Button>
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

export default RegisterPage;
