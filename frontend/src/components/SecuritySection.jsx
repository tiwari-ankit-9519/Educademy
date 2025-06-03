/* eslint-disable no-unused-vars */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lock,
  Shield,
  Key,
  Mail,
  AlertTriangle,
  CheckCircle,
  Eye,
  EyeOff,
  Loader2,
  RefreshCw,
  Calendar,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";

const SecuritySection = ({
  user,
  onRequestPasswordReset,
  onSuccess,
  isLoading,
}) => {
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [validationErrors, setValidationErrors] = useState({});
  const [resetEmailSent, setResetEmailSent] = useState(false);

  const handlePasswordChange = (field, value) => {
    setPasswordData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const validatePasswordForm = () => {
    const errors = {};

    if (!passwordData.currentPassword) {
      errors.currentPassword = "Current password is required";
    }

    if (!passwordData.newPassword) {
      errors.newPassword = "New password is required";
    } else if (passwordData.newPassword.length < 8) {
      errors.newPassword = "Password must be at least 8 characters long";
    } else if (
      !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(passwordData.newPassword)
    ) {
      errors.newPassword =
        "Password must contain at least one uppercase letter, one lowercase letter, and one number";
    }

    if (!passwordData.confirmPassword) {
      errors.confirmPassword = "Please confirm your new password";
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    if (passwordData.currentPassword === passwordData.newPassword) {
      errors.newPassword =
        "New password must be different from current password";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!validatePasswordForm()) {
      return;
    }

    // This would typically call an API to change password
    // For now, we'll just simulate success
    try {
      // await onChangePassword(passwordData);
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setShowChangePassword(false);
      onSuccess("Password changed successfully!");
    } catch (error) {
      console.error("Password change failed:", error);
    }
  };

  const handlePasswordReset = async () => {
    try {
      await onRequestPasswordReset(user.email);
      setResetEmailSent(true);
      onSuccess("Password reset instructions sent to your email!");
    } catch (error) {
      console.error("Password reset failed:", error);
    }
  };

  const cancelPasswordChange = () => {
    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setValidationErrors({});
    setShowChangePassword(false);
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3 },
    },
  };

  const getPasswordStrength = (password) => {
    if (!password) return { strength: 0, label: "No password", color: "slate" };

    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score < 3) return { strength: score, label: "Weak", color: "red" };
    if (score < 5) return { strength: score, label: "Medium", color: "yellow" };
    return { strength: score, label: "Strong", color: "green" };
  };

  const passwordStrength = getPasswordStrength(passwordData.newPassword);

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={itemVariants}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center space-x-2">
        <Lock className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
          Security Settings
        </h3>
      </div>

      <Separator />

      {/* Account Security Overview */}
      <Card className="bg-slate-50/50 dark:bg-slate-700/50 border-slate-200/50 dark:border-slate-600/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center">
            <Shield className="w-4 h-4 mr-2" />
            Account Security Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Email Verification */}
            <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg">
              <div className="flex items-center space-x-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    user.isVerified
                      ? "bg-green-100 dark:bg-green-900/50"
                      : "bg-red-100 dark:bg-red-900/50"
                  }`}
                >
                  {user.isVerified ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">
                    Email Verification
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    {user.isVerified ? "Verified" : "Not verified"}
                  </p>
                </div>
              </div>
              <Badge variant={user.isVerified ? "default" : "destructive"}>
                {user.isVerified ? "Secure" : "Action Required"}
              </Badge>
            </div>

            {/* Account Status */}
            <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg">
              <div className="flex items-center space-x-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    user.isActive
                      ? "bg-green-100 dark:bg-green-900/50"
                      : "bg-red-100 dark:bg-red-900/50"
                  }`}
                >
                  {user.isActive ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">
                    Account Status
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    {user.isActive ? "Active" : "Inactive"}
                  </p>
                </div>
              </div>
              <Badge variant={user.isActive ? "default" : "destructive"}>
                {user.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
          </div>

          {/* Last Login */}
          <div className="p-3 bg-white dark:bg-slate-800 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center">
                <Clock className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-slate-900 dark:text-white">
                  Last Login
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  {user.lastLogin
                    ? new Date(user.lastLogin).toLocaleString()
                    : "Never"}
                </p>
              </div>
            </div>
          </div>

          {/* Account Creation */}
          <div className="p-3 bg-white dark:bg-slate-800 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/50 rounded-full flex items-center justify-center">
                <Calendar className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <p className="font-medium text-slate-900 dark:text-white">
                  Account Created
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  {new Date(user.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Password Management */}
      <Card className="bg-slate-50/50 dark:bg-slate-700/50 border-slate-200/50 dark:border-slate-600/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center">
            <Key className="w-4 h-4 mr-2" />
            Password Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!showChangePassword ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">
                    Password
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Last updated:{" "}
                    {user.updatedAt
                      ? new Date(user.updatedAt).toLocaleDateString()
                      : "Unknown"}
                  </p>
                </div>
                <div className="space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowChangePassword(true)}
                  >
                    Change Password
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  Forgot your password?
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  We'll send you a secure link to reset your password via email.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePasswordReset}
                  disabled={isLoading || resetEmailSent}
                  className="text-black dark:text-white"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : resetEmailSent ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Email Sent
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      Send Reset Email
                    </>
                  )}
                </Button>
                {resetEmailSent && (
                  <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-900/20">
                    <Mail className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-700 dark:text-blue-300">
                      Password reset instructions have been sent to {user.email}
                      . Please check your email and follow the instructions.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-slate-900 dark:text-white">
                  Change Password
                </h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={cancelPasswordChange}
                >
                  Cancel
                </Button>
              </div>

              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                {/* Current Password */}
                <div className="space-y-2">
                  <Label
                    htmlFor="currentPassword"
                    className="text-slate-700 dark:text-slate-300"
                  >
                    Current Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showPasswords.current ? "text" : "password"}
                      value={passwordData.currentPassword}
                      onChange={(e) =>
                        handlePasswordChange("currentPassword", e.target.value)
                      }
                      className={`pr-10 bg-white dark:bg-slate-800 ${
                        validationErrors.currentPassword
                          ? "border-red-300 focus:ring-red-500"
                          : ""
                      }`}
                      placeholder="Enter your current password"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => togglePasswordVisibility("current")}
                    >
                      {showPasswords.current ? (
                        <EyeOff className="h-4 w-4 text-slate-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-slate-400" />
                      )}
                    </button>
                  </div>
                  <AnimatePresence>
                    {validationErrors.currentPassword && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="text-sm text-red-600 dark:text-red-400"
                      >
                        {validationErrors.currentPassword}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                {/* New Password */}
                <div className="space-y-2">
                  <Label
                    htmlFor="newPassword"
                    className="text-slate-700 dark:text-slate-300"
                  >
                    New Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showPasswords.new ? "text" : "password"}
                      value={passwordData.newPassword}
                      onChange={(e) =>
                        handlePasswordChange("newPassword", e.target.value)
                      }
                      className={`pr-10 bg-white dark:bg-slate-800 ${
                        validationErrors.newPassword
                          ? "border-red-300 focus:ring-red-500"
                          : ""
                      }`}
                      placeholder="Enter a new password"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => togglePasswordVisibility("new")}
                    >
                      {showPasswords.new ? (
                        <EyeOff className="h-4 w-4 text-slate-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-slate-400" />
                      )}
                    </button>
                  </div>

                  {/* Password Strength Indicator */}
                  {passwordData.newPassword && (
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${
                              passwordStrength.color === "red"
                                ? "bg-red-500"
                                : passwordStrength.color === "yellow"
                                ? "bg-yellow-500"
                                : "bg-green-500"
                            }`}
                            style={{
                              width: `${
                                (passwordStrength.strength / 6) * 100
                              }%`,
                            }}
                          />
                        </div>
                        <span
                          className={`text-sm font-medium ${
                            passwordStrength.color === "red"
                              ? "text-red-600"
                              : passwordStrength.color === "yellow"
                              ? "text-yellow-600"
                              : "text-green-600"
                          }`}
                        >
                          {passwordStrength.label}
                        </span>
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-400">
                        Password should contain at least 8 characters, including
                        uppercase, lowercase, and numbers.
                      </div>
                    </div>
                  )}

                  <AnimatePresence>
                    {validationErrors.newPassword && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="text-sm text-red-600 dark:text-red-400"
                      >
                        {validationErrors.newPassword}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <Label
                    htmlFor="confirmPassword"
                    className="text-slate-700 dark:text-slate-300"
                  >
                    Confirm New Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showPasswords.confirm ? "text" : "password"}
                      value={passwordData.confirmPassword}
                      onChange={(e) =>
                        handlePasswordChange("confirmPassword", e.target.value)
                      }
                      className={`pr-10 bg-white dark:bg-slate-800 ${
                        validationErrors.confirmPassword
                          ? "border-red-300 focus:ring-red-500"
                          : ""
                      }`}
                      placeholder="Confirm your new password"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => togglePasswordVisibility("confirm")}
                    >
                      {showPasswords.confirm ? (
                        <EyeOff className="h-4 w-4 text-slate-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-slate-400" />
                      )}
                    </button>
                  </div>
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

                <div className="flex justify-end space-x-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={cancelPasswordChange}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      "Update Password"
                    )}
                  </Button>
                </div>
              </form>
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* Security Tips */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200/50 dark:border-blue-800/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center">
            <Shield className="w-4 h-4 mr-2" />
            Security Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
            <li className="flex items-start space-x-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>
                Use a strong, unique password that you don't use elsewhere
              </span>
            </li>
            <li className="flex items-start space-x-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>
                Include a mix of uppercase, lowercase, numbers, and special
                characters
              </span>
            </li>
            <li className="flex items-start space-x-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Never share your password with anyone</span>
            </li>
            <li className="flex items-start space-x-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Log out from shared or public computers</span>
            </li>
            <li className="flex items-start space-x-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>
                Keep your email address verified for security notifications
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default SecuritySection;
