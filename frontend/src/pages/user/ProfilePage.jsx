/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useSelector } from "react-redux";
import {
  User,
  Camera,
  Settings,
  Shield,
  Bell,
  Globe,
  Calendar,
  Phone,
  MapPin,
  Briefcase,
  GraduationCap,
  Award,
  Loader2,
  Edit3,
  Save,
  X,
  Eye,
  EyeOff,
  Lock,
  Mail,
  AlertCircle,
  CheckCircle,
  Upload,
  Trash2,
  Link as LinkIcon,
  Github,
  Twitter,
  Linkedin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

// Import sub-components
import ProfileImageSection from "@/components/ProfileImageSection";
import PersonalInfoSection from "@/components/PersonalInfoSection";
import RoleSpecificSection from "@/components/RoleSpecificSection";
import SecuritySection from "@/components/SecuritySection";
import NotificationSettings from "@/components/NotificationSettings";

const ProfilePage = () => {
  const {
    user,
    isLoading,
    error,
    clearError,
    updateProfile, // ✅ Changed from updateUserProfile to updateProfile
    uploadProfileImage, // ✅ Changed from updateProfileImage to uploadProfileImage
    deleteProfileImage, // ✅ Changed from removeProfileImage to deleteProfileImage
    requestReset, // ✅ Changed from requestPasswordReset to requestReset
    profileLoading,
    imageUploadLoading,
  } = useAuth();

  const [activeTab, setActiveTab] = useState("personal");
  const [isVisible, setIsVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    setIsVisible(true);
    clearError();
  }, [clearError]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        clearError();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const handleSuccess = (message) => {
    setSuccessMessage(message);
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
      scale: [1, 1.1, 1],
      opacity: [0.3, 0.6, 0.3],
      transition: {
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900">
        <div className="flex items-center space-x-2">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <span className="text-slate-600 dark:text-slate-300">
            Loading profile...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900 relative overflow-hidden">
      {/* Background Effects */}
      <motion.div
        className="absolute inset-0 overflow-hidden pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <motion.div
          className="absolute top-20 left-20 w-32 h-32 bg-blue-500/10 rounded-full blur-xl"
          variants={glowVariants}
          animate="animate"
        />
        <motion.div
          className="absolute top-40 right-32 w-24 h-24 bg-purple-500/10 rounded-full blur-xl"
          variants={glowVariants}
          animate="animate"
          style={{ animationDelay: "1s" }}
        />
        <motion.div
          className="absolute bottom-32 left-1/4 w-40 h-40 bg-indigo-500/10 rounded-full blur-xl"
          variants={glowVariants}
          animate="animate"
          style={{ animationDelay: "2s" }}
        />
      </motion.div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isVisible ? "visible" : "hidden"}
          className="space-y-6"
        >
          {/* Header */}
          <motion.div variants={itemVariants}>
            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-white/20 dark:border-slate-700/50 shadow-xl">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                  <div className="flex items-center space-x-4">
                    <Avatar className="w-16 h-16 border-4 border-white/50 shadow-lg">
                      <AvatarImage
                        src={user.profileImage}
                        alt={`${user.firstName} ${user.lastName}`}
                      />
                      <AvatarFallback className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-xl font-bold">
                        {user.firstName?.[0]}
                        {user.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                        {user.firstName} {user.lastName}
                      </h1>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge
                          variant={
                            user.role === "ADMIN"
                              ? "destructive"
                              : user.role === "INSTRUCTOR"
                              ? "default"
                              : "secondary"
                          }
                          className="capitalize"
                        >
                          {user.role?.toLowerCase()}
                        </Badge>
                        {user.isVerified && (
                          <Badge
                            variant="outline"
                            className="text-green-600 border-green-600"
                          >
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                      </div>
                      <p className="text-slate-600 dark:text-slate-300 text-sm mt-1">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-slate-200 dark:border-slate-600"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Settings
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Success/Error Messages */}
          <AnimatePresence>
            {(error || successMessage) && (
              <motion.div
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -10, height: 0 }}
              >
                <Alert
                  className={
                    error
                      ? "border-red-200 bg-red-50 dark:bg-red-900/20"
                      : "border-green-200 bg-green-50 dark:bg-green-900/20"
                  }
                >
                  {error ? (
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  ) : (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  )}
                  <AlertDescription
                    className={
                      error
                        ? "text-red-700 dark:text-red-300"
                        : "text-green-700 dark:text-green-300"
                    }
                  >
                    {error || successMessage}
                  </AlertDescription>
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main Content */}
          <motion.div variants={itemVariants}>
            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-white/20 dark:border-slate-700/50 shadow-xl">
              <CardContent className="p-6">
                <Tabs
                  value={activeTab}
                  onValueChange={setActiveTab}
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 mb-6 bg-slate-100/50 dark:bg-slate-700/50">
                    <TabsTrigger
                      value="personal"
                      className="flex items-center space-x-2"
                    >
                      <User className="w-4 h-4" />
                      <span className="hidden sm:inline">Personal</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="profile"
                      className="flex items-center space-x-2"
                    >
                      <Camera className="w-4 h-4" />
                      <span className="hidden sm:inline">Profile</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="role"
                      className="flex items-center space-x-2"
                    >
                      {user.role === "STUDENT" ? (
                        <GraduationCap className="w-4 h-4" />
                      ) : user.role === "INSTRUCTOR" ? (
                        <Briefcase className="w-4 h-4" />
                      ) : (
                        <Shield className="w-4 h-4" />
                      )}
                      <span className="hidden sm:inline">
                        {user.role === "STUDENT"
                          ? "Learning"
                          : user.role === "INSTRUCTOR"
                          ? "Teaching"
                          : "Admin"}
                      </span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="security"
                      className="flex items-center space-x-2"
                    >
                      <Lock className="w-4 h-4" />
                      <span className="hidden sm:inline">Security</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="notifications"
                      className="flex items-center space-x-2"
                    >
                      <Bell className="w-4 h-4" />
                      <span className="hidden sm:inline">Notifications</span>
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="personal" className="space-y-6">
                    <PersonalInfoSection
                      user={user}
                      onUpdate={updateProfile}
                      onSuccess={handleSuccess}
                      isLoading={profileLoading}
                    />
                  </TabsContent>

                  <TabsContent value="profile" className="space-y-6">
                    <ProfileImageSection
                      user={user}
                      onUpdateImage={uploadProfileImage}
                      onRemoveImage={deleteProfileImage}
                      onSuccess={handleSuccess}
                      isLoading={imageUploadLoading}
                    />
                  </TabsContent>

                  <TabsContent value="role" className="space-y-6">
                    <RoleSpecificSection
                      user={user}
                      onUpdate={updateProfile}
                      onSuccess={handleSuccess}
                      isLoading={profileLoading}
                    />
                  </TabsContent>

                  <TabsContent value="security" className="space-y-6">
                    <SecuritySection
                      user={user}
                      onRequestPasswordReset={requestReset}
                      onSuccess={handleSuccess}
                      isLoading={isLoading}
                    />
                  </TabsContent>

                  <TabsContent value="notifications" className="space-y-6">
                    <NotificationSettings
                      user={user}
                      onUpdate={updateProfile}
                      onSuccess={handleSuccess}
                      isLoading={profileLoading}
                    />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default ProfilePage;
