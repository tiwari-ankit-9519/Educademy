/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Loader2,
  Github,
  ArrowRight,
  Sparkles,
  Shield,
  Zap,
  Upload,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const RegisterPage = () => {
  const navigate = useNavigate();
  const {
    register,
    isLoading,
    error,
    clearError,
    registrationStep,
    setRegistrationStep,
  } = useAuth();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "STUDENT",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [isVisible, setIsVisible] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [socialAuthLoading, setSocialAuthLoading] = useState({
    google: false,
    github: false,
  });

  useEffect(() => {
    setIsVisible(true);
    clearError();
    // Reset registration step when component mounts to prevent unwanted navigation
    setRegistrationStep("register");
  }, [clearError, setRegistrationStep]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        clearError();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  // Navigate to verify page when registration is successful
  useEffect(() => {
    if (registrationStep === "verify-otp" && formData.email) {
      navigate("/auth/verify-user", {
        state: {
          email: formData.email,
          name: formData.firstName,
        },
        replace: true,
      });
    }
  }, [registrationStep, navigate, formData.email, formData.firstName]);

  const handleRoleChange = (value) => {
    setFormData((prev) => ({
      ...prev,
      role: value,
    }));
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
      clearError();
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        setValidationErrors((prev) => ({
          ...prev,
          profileImage: "Image size should be less than 5MB",
        }));
        return;
      }

      const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
      if (!allowedTypes.includes(file.type)) {
        setValidationErrors((prev) => ({
          ...prev,
          profileImage: "Only JPEG, PNG and GIF images are allowed",
        }));
        return;
      }

      setProfileImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);

      // Clear any previous error
      setValidationErrors((prev) => ({
        ...prev,
        profileImage: "",
      }));
    }
  };

  const removeImage = () => {
    setProfileImage(null);
    setImagePreview(null);
    setValidationErrors((prev) => ({
      ...prev,
      profileImage: "",
    }));
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.firstName.trim()) {
      errors.firstName = "First name is required";
    }

    if (!formData.lastName.trim()) {
      errors.lastName = "Last name is required";
    }

    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Please enter a valid email address";
    }

    if (!formData.password.trim()) {
      errors.password = "Password is required";
    } else if (formData.password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    }

    if (!formData.confirmPassword.trim()) {
      errors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
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
      const registrationData = new FormData();
      registrationData.append("firstName", formData.firstName);
      registrationData.append("lastName", formData.lastName);
      registrationData.append("email", formData.email);
      registrationData.append("password", formData.password);
      registrationData.append("role", formData.role);

      if (profileImage) {
        registrationData.append("profileImage", profileImage);
      }

      await register(registrationData);
    } catch (err) {
      console.error("Registration error:", err);
    }
  };

  const handleSocialAuth = async (provider) => {
    try {
      setSocialAuthLoading((prev) => ({
        ...prev,
        [provider]: true,
      }));

      // Construct the auth URL with the selected role
      const authUrl = `${window.location.origin}/auth/${provider}?role=${formData.role}`;

      // Redirect to the auth URL
      window.location.href = authUrl;
    } catch (error) {
      console.error(`${provider} auth error:`, error);
      setSocialAuthLoading((prev) => ({
        ...prev,
        [provider]: false,
      }));
    }
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
    <div className="min-h-screen flex relative overflow-hidden bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-purple-900">
      <motion.div
        className="absolute inset-0 overflow-hidden pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <motion.div
          className="absolute top-20 left-20 w-32 h-32 bg-purple-500/10 rounded-full blur-xl"
          variants={glowVariants}
          animate="animate"
        />
        <motion.div
          className="absolute top-40 right-32 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl"
          variants={glowVariants}
          animate="animate"
          style={{ animationDelay: "1s" }}
        />
        <motion.div
          className="absolute bottom-32 left-1/4 w-40 h-40 bg-blue-500/10 rounded-full blur-xl"
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
              <motion.div
                className="text-center mb-6 sm:mb-8"
                variants={itemVariants}
              >
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-2">
                  Create Your Account
                </h1>
                <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base">
                  Join thousands of learners on Educademy
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

              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                {/* Profile Image Upload */}
                <motion.div variants={itemVariants}>
                  <Label className="text-slate-700 dark:text-slate-300 font-medium">
                    Profile Image (Optional)
                  </Label>
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center space-x-4">
                      {imagePreview ? (
                        <div className="relative">
                          <img
                            src={imagePreview}
                            alt="Profile preview"
                            className="w-16 h-16 rounded-full object-cover border-2 border-slate-200 dark:border-slate-600"
                          />
                          <button
                            type="button"
                            onClick={removeImage}
                            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="w-16 h-16 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-full flex items-center justify-center">
                          <Upload className="w-6 h-6 text-slate-400" />
                        </div>
                      )}
                      <div className="flex-1">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                          id="profile-image"
                        />
                        <label
                          htmlFor="profile-image"
                          className="cursor-pointer inline-flex items-center px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Choose Image
                        </label>
                      </div>
                    </div>
                    <div className="h-5">
                      <AnimatePresence>
                        {validationErrors.profileImage && (
                          <motion.p
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="text-sm text-red-600 dark:text-red-400"
                          >
                            {validationErrors.profileImage}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </motion.div>

                {/* Role Selection - Moved up */}
                <motion.div variants={itemVariants}>
                  <Label className="text-slate-700 dark:text-slate-300 font-medium">
                    I want to join as
                  </Label>
                  <div className="mt-3">
                    <RadioGroup
                      value={formData.role}
                      onValueChange={handleRoleChange}
                      className="flex space-x-6"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem
                          value="STUDENT"
                          id="student"
                          className="border-slate-300 dark:border-slate-600 text-purple-600 focus:ring-purple-500"
                        />
                        <Label
                          htmlFor="student"
                          className="text-slate-700 dark:text-slate-300 font-medium cursor-pointer"
                        >
                          Student
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem
                          value="INSTRUCTOR"
                          id="instructor"
                          className="border-slate-300 dark:border-slate-600 text-purple-600 focus:ring-purple-500"
                        />
                        <Label
                          htmlFor="instructor"
                          className="text-slate-700 dark:text-slate-300 font-medium cursor-pointer"
                        >
                          Instructor
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                </motion.div>

                {/* Name Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <motion.div variants={itemVariants}>
                    <Label
                      htmlFor="firstName"
                      className="text-slate-700 dark:text-slate-300 font-medium"
                    >
                      First Name
                    </Label>
                    <div className="mt-2 space-y-2">
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                          <User className="h-5 w-5 text-slate-400" />
                        </div>
                        <Input
                          id="firstName"
                          name="firstName"
                          type="text"
                          autoComplete="given-name"
                          value={formData.firstName}
                          onChange={handleInputChange}
                          className={`pl-12 h-12 bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 ${
                            validationErrors.firstName
                              ? "border-red-300 focus:ring-red-500"
                              : ""
                          }`}
                          placeholder="First name"
                        />
                      </div>
                      <div className="h-5">
                        <AnimatePresence>
                          {validationErrors.firstName && (
                            <motion.p
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="text-sm text-red-600 dark:text-red-400"
                            >
                              {validationErrors.firstName}
                            </motion.p>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <Label
                      htmlFor="lastName"
                      className="text-slate-700 dark:text-slate-300 font-medium"
                    >
                      Last Name
                    </Label>
                    <div className="mt-2 space-y-2">
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                          <User className="h-5 w-5 text-slate-400" />
                        </div>
                        <Input
                          id="lastName"
                          name="lastName"
                          type="text"
                          autoComplete="family-name"
                          value={formData.lastName}
                          onChange={handleInputChange}
                          className={`pl-12 h-12 bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 ${
                            validationErrors.lastName
                              ? "border-red-300 focus:ring-red-500"
                              : ""
                          }`}
                          placeholder="Last name"
                        />
                      </div>
                      <div className="h-5">
                        <AnimatePresence>
                          {validationErrors.lastName && (
                            <motion.p
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="text-sm text-red-600 dark:text-red-400"
                            >
                              {validationErrors.lastName}
                            </motion.p>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* Email */}
                <motion.div variants={itemVariants}>
                  <Label
                    htmlFor="email"
                    className="text-slate-700 dark:text-slate-300 font-medium"
                  >
                    Email Address
                  </Label>
                  <div className="mt-2 space-y-2">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                        <Mail className="h-5 w-5 text-slate-400" />
                      </div>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className={`pl-12 h-12 bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 ${
                          validationErrors.email
                            ? "border-red-300 focus:ring-red-500"
                            : ""
                        }`}
                        placeholder="Enter your email"
                      />
                    </div>
                    <div className="h-5">
                      <AnimatePresence>
                        {validationErrors.email && (
                          <motion.p
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="text-sm text-red-600 dark:text-red-400"
                          >
                            {validationErrors.email}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </motion.div>

                {/* Password */}
                <motion.div variants={itemVariants}>
                  <Label
                    htmlFor="password"
                    className="text-slate-700 dark:text-slate-300 font-medium"
                  >
                    Password
                  </Label>
                  <div className="mt-2 space-y-2">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                        <Lock className="h-5 w-5 text-slate-400" />
                      </div>
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className={`pl-12 pr-12 h-12 bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 ${
                          validationErrors.password
                            ? "border-red-300 focus:ring-red-500"
                            : ""
                        }`}
                        placeholder="Create a password"
                      />
                      <motion.button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-4 flex items-center z-10"
                        onClick={() => setShowPassword(!showPassword)}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" />
                        ) : (
                          <Eye className="h-5 w-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" />
                        )}
                      </motion.button>
                    </div>
                    <div className="h-5">
                      <AnimatePresence>
                        {validationErrors.password && (
                          <motion.p
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="text-sm text-red-600 dark:text-red-400"
                          >
                            {validationErrors.password}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </motion.div>

                {/* Confirm Password */}
                <motion.div variants={itemVariants}>
                  <Label
                    htmlFor="confirmPassword"
                    className="text-slate-700 dark:text-slate-300 font-medium"
                  >
                    Confirm Password
                  </Label>
                  <div className="mt-2 space-y-2">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                        <Lock className="h-5 w-5 text-slate-400" />
                      </div>
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        autoComplete="new-password"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        className={`pl-12 pr-12 h-12 bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 ${
                          validationErrors.confirmPassword
                            ? "border-red-300 focus:ring-red-500"
                            : ""
                        }`}
                        placeholder="Confirm your password"
                      />
                      <motion.button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-4 flex items-center z-10"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-5 w-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" />
                        ) : (
                          <Eye className="h-5 w-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" />
                        )}
                      </motion.button>
                    </div>
                    <div className="h-5">
                      <AnimatePresence>
                        {validationErrors.confirmPassword && (
                          <motion.p
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="text-sm text-red-600 dark:text-red-400"
                          >
                            {validationErrors.confirmPassword}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </motion.div>

                <motion.div variants={itemVariants}>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-12 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 group"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center">
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Creating account...
                      </div>
                    ) : (
                      <div className="flex items-center justify-center group-hover:space-x-2 transition-all duration-200">
                        <span>Create Account</span>
                        <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
                      </div>
                    )}
                  </Button>
                </motion.div>

                <motion.div className="relative" variants={itemVariants}>
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200 dark:border-slate-600" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white/80 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 backdrop-blur-sm">
                      Or continue with
                    </span>
                  </div>
                </motion.div>

                <motion.div
                  className="grid grid-cols-2 gap-4"
                  variants={itemVariants}
                >
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleSocialAuth("google")}
                      disabled={isLoading || socialAuthLoading.google}
                      className="w-full h-12 border-slate-200 dark:border-slate-600 bg-white/50 dark:bg-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-600/50 backdrop-blur-sm rounded-xl transition-all duration-200"
                    >
                      {socialAuthLoading.google ? (
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      ) : (
                        <div className="w-5 h-5 mr-2 bg-white rounded-sm p-0.5 flex items-center justify-center">
                          <svg className="w-4 h-4" viewBox="0 0 24 24">
                            <path
                              fill="#4285F4"
                              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                              fill="#34A853"
                              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                              fill="#FBBC04"
                              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            />
                            <path
                              fill="#EA4335"
                              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            />
                          </svg>
                        </div>
                      )}
                      <div className="flex flex-col items-start">
                        <span className="text-slate-700 dark:text-slate-300 font-medium text-sm">
                          Google
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          as {formData.role.toLowerCase()}
                        </span>
                      </div>
                    </Button>
                  </motion.div>

                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleSocialAuth("github")}
                      disabled={isLoading || socialAuthLoading.github}
                      className="w-full h-12 border-slate-200 dark:border-slate-600 bg-white/50 dark:bg-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-600/50 backdrop-blur-sm rounded-xl transition-all duration-200"
                    >
                      {socialAuthLoading.github ? (
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      ) : (
                        <Github className="w-5 h-5 mr-2 text-slate-700 dark:text-slate-300" />
                      )}
                      <div className="flex flex-col items-start">
                        <span className="text-slate-700 dark:text-slate-300 font-medium text-sm">
                          GitHub
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          as {formData.role.toLowerCase()}
                        </span>
                      </div>
                    </Button>
                  </motion.div>
                </motion.div>

                <motion.div className="text-center" variants={itemVariants}>
                  <p className="text-slate-600 dark:text-slate-400 text-sm">
                    Already have an account?{" "}
                    <Link
                      to="/auth/login"
                      className="text-purple-600 hover:text-purple-500 dark:text-purple-400 dark:hover:text-purple-300 font-semibold transition-colors"
                    >
                      Sign in
                    </Link>
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
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 rounded-3xl transform rotate-12" />
              <div className="absolute inset-4 bg-gradient-to-r from-purple-600/30 to-indigo-600/30 rounded-2xl transform -rotate-6" />
              <div className="absolute inset-8 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-xl flex items-center justify-center">
                <div className="text-center">
                  <Zap className="w-16 h-16 mx-auto mb-4 text-purple-600" />
                  <div className="space-y-2">
                    <div className="h-2 bg-purple-200 dark:bg-purple-800 rounded-full" />
                    <div className="h-2 bg-indigo-200 dark:bg-indigo-800 rounded-full w-3/4 mx-auto" />
                    <div className="h-2 bg-blue-200 dark:bg-blue-800 rounded-full w-1/2 mx-auto" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Start Your Learning
              <br />
              <span className="bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Journey Today
              </span>
            </h2>
            <p className="text-slate-600 dark:text-slate-300 text-lg leading-relaxed">
              Join our community of passionate learners and unlock your
              potential with personalized courses and expert guidance.
            </p>
          </motion.div>
        </motion.div>

        <motion.div
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="flex space-x-2">
            <div className="w-2 h-2 bg-purple-400 rounded-full" />
            <div className="w-2 h-2 bg-indigo-400 rounded-full" />
            <div className="w-2 h-2 bg-blue-400 rounded-full" />
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default RegisterPage;
