import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  User,
  Mail,
  Phone,
  Globe,
  Calendar,
  MapPin,
  Camera,
  X,
  Save,
  Edit3,
  Shield,
  GraduationCap,
  UserCheck,
  Loader2,
  Github,
  Linkedin,
  Twitter,
  AlertCircle,
  CheckCircle,
  Star,
  Award,
  Users,
  BookOpen,
  DollarSign,
  Settings,
  Bell,
  BellOff,
  MessageSquare,
  CreditCard,
  UserX,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  getUserProfile,
  updateUserProfile,
  updateProfileImage,
  removeProfileImage,
  getUserSessions,
  invalidateAllSessions,
  clearError,
} from "@/features/authSlice";

const ProfilePage = () => {
  const dispatch = useDispatch();
  const {
    user,
    profileLoading,
    imageLoading,
    sessionsLoading,
    error,
    sessions,
  } = useSelector((state) => state.auth);

  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [imagePreview, setImagePreview] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [notificationSettings, setNotificationSettings] = useState({
    inApp: true,
    email: true,
    push: false,
    discussionUpdates: true,
    assignmentUpdates: true,
    courseUpdates: true,
    paymentUpdates: true,
    accountUpdates: true,
    securityAlerts: true,
    marketingEmails: false,
    weeklyDigest: true,
    instantNotifications: true,
    quietHours: false,
    quietHoursStart: "22:00",
    quietHoursEnd: "08:00",
  });
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    bio: "",
    phoneNumber: "",
    dateOfBirth: "",
    website: "",
    linkedinProfile: "",
    twitterProfile: "",
    githubProfile: "",
    timezone: "UTC",
    language: "en",
    country: "",
    learningGoals: [],
    interests: [],
    skillLevel: "BEGINNER",
    title: "",
    expertise: [],
    yearsExperience: "",
    education: "",
    biography: "",
    department: "",
  });

  const fileInputRef = useRef(null);

  useEffect(() => {
    dispatch(clearError());
    dispatch(getUserProfile());
    dispatch(getUserSessions());
  }, [dispatch]);

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        bio: user.bio || "",
        phoneNumber: user.phoneNumber || "",
        dateOfBirth: user.dateOfBirth ? user.dateOfBirth.split("T")[0] : "",
        website: user.website || "",
        linkedinProfile: user.linkedinProfile || "",
        twitterProfile: user.twitterProfile || "",
        githubProfile: user.githubProfile || "",
        timezone: user.timezone || "UTC",
        language: user.language || "en",
        country: user.country || "",
        learningGoals: user.profile?.learningGoals || [],
        interests: user.profile?.interests || [],
        skillLevel: user.profile?.skillLevel || "BEGINNER",
        title: user.profile?.title || "",
        expertise: user.profile?.expertise || [],
        yearsExperience: user.profile?.yearsExperience || "",
        education: user.profile?.education || "",
        biography: user.profile?.biography || "",
        department: user.profile?.department || "",
      });
      setImagePreview(user.profileImage);

      if (user.notificationSettings) {
        setNotificationSettings({
          ...notificationSettings,
          ...user.notificationSettings,
        });
      }
    }
  }, [user, notificationSettings]);

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
    } else if (
      !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email)
    ) {
      errors.email = "Please enter a valid email address";
    }

    if (formData.website && !/^https?:\/\/.+/.test(formData.website)) {
      errors.website = "Please enter a valid URL";
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

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleArrayChange = (name, value) => {
    const array = value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    setFormData((prev) => ({
      ...prev,
      [name]: array,
    }));
  };

  const handleNotificationChange = (setting, value) => {
    setNotificationSettings((prev) => ({
      ...prev,
      [setting]: value,
    }));
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

      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);

      dispatch(updateProfileImage(file));

      setValidationErrors((prev) => ({
        ...prev,
        profileImage: "",
      }));
    }
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    dispatch(removeProfileImage());
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      const {
        skillLevel,
        interests,
        learningGoals,
        title,
        expertise,
        yearsExperience,
        education,
        biography,
        department,
        ...userFields
      } = formData;

      const profileData = {
        skillLevel,
        interests,
        learningGoals,
        title,
        expertise,
        yearsExperience,
        education,
        biography,
        department,
      };

      const hasProfileData = Object.values(profileData).some((value) => {
        if (Array.isArray(value)) {
          return value.length > 0;
        }
        return value !== null && value !== undefined && value !== "";
      });

      const updateData = {
        ...userFields,
        ...(hasProfileData && { profileData }),
      };

      await dispatch(updateUserProfile(updateData)).unwrap();
      setIsEditing(false);
    } catch (error) {
      console.error("Profile update failed:", error);
    }
  };

  const handleSaveNotificationSettings = async () => {
    try {
      await dispatch(updateUserProfile({ notificationSettings })).unwrap();
    } catch (error) {
      console.error("Notification settings update failed:", error);
    }
  };

  const handleInvalidateOtherSessions = () => {
    const nonCurrentSessions = sessions?.filter(
      (session) => !session.isCurrent
    );
    if (nonCurrentSessions && nonCurrentSessions.length > 0) {
      const sessionTokens = nonCurrentSessions.map((session) => session.token);
      dispatch(invalidateAllSessions({ sessionTokens, excludeCurrent: true }));
    }
  };

  const getRoleIcon = () => {
    switch (user?.role?.toLowerCase()) {
      case "admin":
        return Shield;
      case "instructor":
        return UserCheck;
      case "student":
        return GraduationCap;
      default:
        return User;
    }
  };

  const getRoleBadgeColor = () => {
    switch (user?.role?.toLowerCase()) {
      case "admin":
        return "destructive";
      case "instructor":
        return "default";
      case "student":
        return "secondary";
      default:
        return "outline";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleDateString();
  };

  const getRoleSpecificTitle = () => {
    switch (user?.role?.toLowerCase()) {
      case "student":
        return "Learning";
      case "instructor":
        return "Teaching";
      case "admin":
        return "Admin";
      default:
        return "Role";
    }
  };

  const formatDeviceName = (session) => {
    if (session.browser && session.operatingSystem) {
      return `${session.browser} on ${session.operatingSystem}`;
    }
    return session.deviceType || "Unknown Device";
  };

  const formatLocation = (session) => {
    return session.location || "Unknown Location";
  };

  const tabOptions = [
    { value: "profile", label: "Profile", icon: User },
    { value: "social", label: "Social", icon: Globe },
    {
      value: "role-specific",
      label: getRoleSpecificTitle(),
      icon: getRoleIcon(),
    },
    { value: "notifications", label: "Notifications", icon: Bell },
    { value: "security", label: "Security", icon: Shield },
  ];

  const RoleIcon = getRoleIcon();

  return (
    <div className="min-h-full bg-gradient-to-br from-blue-50 via-indigo-50 to-cyan-50 dark:from-slate-900 dark:via-slate-800 dark:to-gray-900">
      <div className="flex items-center justify-center min-h-full py-4 sm:py-8 px-2 sm:px-4 lg:px-8">
        <div className="w-full max-w-5xl">
          <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 shadow-xl rounded-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 dark:via-slate-700/10 to-transparent"></div>

            <CardHeader className="text-center pb-4 sm:pb-6 lg:pb-8 relative z-10 px-4 sm:px-6">
              <div className="flex flex-col items-center space-y-3 sm:space-y-4">
                <div className="relative">
                  <Avatar className="w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28">
                    <AvatarImage src={imagePreview || user?.profileImage} />
                    <AvatarFallback className="text-2xl sm:text-3xl bg-gradient-to-br from-indigo-100 to-blue-100 dark:from-slate-700 dark:to-slate-600">
                      {user?.firstName?.charAt(0)?.toUpperCase() || "U"}
                      {user?.lastName?.charAt(0)?.toUpperCase() || ""}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -top-1 -right-1 w-8 h-8 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-full flex items-center justify-center shadow-lg">
                    <RoleIcon className="w-4 h-4 text-white" />
                  </div>
                  {isEditing && (
                    <div className="absolute -bottom-2 -right-2 flex space-x-1">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        disabled={imageLoading}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        className="h-8 w-8 rounded-full p-0 bg-white/80 dark:bg-slate-700/80 backdrop-blur-sm border border-white/50 dark:border-slate-600/50"
                        disabled={profileLoading}
                      >
                        <Camera className="w-4 h-4" />
                      </Button>
                      {imagePreview && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={handleRemoveImage}
                          className="h-6 w-6 rounded-full p-0"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                <div className="text-center space-y-2">
                  <CardTitle className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-800 dark:text-white">
                    {user?.firstName} {user?.lastName}
                  </CardTitle>
                  <div className="flex items-center justify-center space-x-2 flex-wrap gap-1">
                    <Badge variant={getRoleBadgeColor()}>{user?.role}</Badge>
                    {user?.isVerified && (
                      <Badge variant="outline" className="text-green-600">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm lg:text-base px-2 sm:px-4">
                    {user?.bio || "No bio provided"}
                  </CardDescription>
                </div>

                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
                  {!isEditing ? (
                    <Button
                      onClick={() => setIsEditing(true)}
                      disabled={profileLoading}
                      className="bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-300"
                    >
                      <Edit3 className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Button>
                  ) : (
                    <div className="flex space-x-2">
                      <Button
                        onClick={handleSave}
                        disabled={profileLoading}
                        className="bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-300"
                      >
                        {profileLoading ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4 mr-2" />
                        )}
                        Save Changes
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setIsEditing(false)}
                        disabled={imageLoading}
                        className="rounded-xl"
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 sm:space-y-6 relative z-10 px-4 sm:px-6">
              {error && (
                <Alert className="bg-red-50/80 dark:bg-red-900/30 border-red-200 dark:border-red-700/50 backdrop-blur-sm rounded-xl">
                  <AlertCircle className="h-4 w-4 text-red-500 dark:text-red-400" />
                  <AlertDescription className="text-red-700 dark:text-red-300">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              <div className="block md:hidden">
                <Select value={activeTab} onValueChange={setActiveTab}>
                  <SelectTrigger className="w-full bg-white/70 dark:bg-slate-700/50 backdrop-blur-sm border border-white/50 dark:border-slate-600/50 rounded-xl">
                    <div className="flex items-center">
                      {React.createElement(
                        tabOptions.find((tab) => tab.value === activeTab)
                          ?.icon || User,
                        { className: "w-4 h-4 mr-2" }
                      )}
                      <SelectValue>
                        {
                          tabOptions.find((tab) => tab.value === activeTab)
                            ?.label
                        }
                      </SelectValue>
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {tabOptions.map((tab) => (
                      <SelectItem key={tab.value} value={tab.value}>
                        <div className="flex items-center">
                          {React.createElement(tab.icon, {
                            className: "w-4 h-4 mr-2",
                          })}
                          {tab.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
              >
                <TabsList className="hidden md:grid w-full grid-cols-5 bg-white/50 dark:bg-slate-700/30 backdrop-blur-sm border border-white/50 dark:border-slate-600/50 rounded-xl">
                  <TabsTrigger value="profile" className="rounded-lg">
                    Profile
                  </TabsTrigger>
                  <TabsTrigger value="social" className="rounded-lg">
                    Social
                  </TabsTrigger>
                  <TabsTrigger value="role-specific" className="rounded-lg">
                    {getRoleSpecificTitle()}
                  </TabsTrigger>
                  <TabsTrigger value="notifications" className="rounded-lg">
                    Notifications
                  </TabsTrigger>
                  <TabsTrigger value="security" className="rounded-lg">
                    Security
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="profile" className="space-y-4 sm:space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    <div className="space-y-2">
                      <Label
                        htmlFor="firstName"
                        className="text-sm font-medium text-slate-700 dark:text-slate-300"
                      >
                        First Name
                      </Label>
                      <div className="relative group">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500 w-4 h-4 transition-colors group-focus-within:text-indigo-500" />
                        <Input
                          id="firstName"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleInputChange}
                          disabled={!isEditing || profileLoading}
                          className={`pl-10 pr-4 py-2 sm:py-3 h-10 sm:h-12 bg-white/70 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl transition-all duration-200 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base ${
                            validationErrors.firstName
                              ? "border-red-300 dark:border-red-500/50"
                              : ""
                          }`}
                          placeholder="First name"
                        />
                      </div>
                      {validationErrors.firstName && (
                        <p className="text-xs sm:text-sm text-red-500 dark:text-red-400">
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
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500 w-4 h-4 transition-colors group-focus-within:text-indigo-500" />
                        <Input
                          id="lastName"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleInputChange}
                          disabled={!isEditing || profileLoading}
                          className={`pl-10 pr-4 py-2 sm:py-3 h-10 sm:h-12 bg-white/70 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl transition-all duration-200 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base ${
                            validationErrors.lastName
                              ? "border-red-300 dark:border-red-500/50"
                              : ""
                          }`}
                          placeholder="Last name"
                        />
                      </div>
                      {validationErrors.lastName && (
                        <p className="text-xs sm:text-sm text-red-500 dark:text-red-400">
                          {validationErrors.lastName}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="email"
                        className="text-sm font-medium text-slate-700 dark:text-slate-300"
                      >
                        Email
                      </Label>
                      <div className="relative group">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500 w-4 h-4 transition-colors group-focus-within:text-indigo-500" />
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          disabled={!isEditing || profileLoading}
                          className={`pl-10 pr-4 py-2 sm:py-3 h-10 sm:h-12 bg-white/70 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl transition-all duration-200 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base ${
                            validationErrors.email
                              ? "border-red-300 dark:border-red-500/50"
                              : ""
                          }`}
                          placeholder="Email address"
                        />
                      </div>
                      {validationErrors.email && (
                        <p className="text-xs sm:text-sm text-red-500 dark:text-red-400">
                          {validationErrors.email}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="phoneNumber"
                        className="text-sm font-medium text-slate-700 dark:text-slate-300"
                      >
                        Phone Number
                      </Label>
                      <div className="relative group">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500 w-4 h-4 transition-colors group-focus-within:text-indigo-500" />
                        <Input
                          id="phoneNumber"
                          name="phoneNumber"
                          value={formData.phoneNumber}
                          onChange={handleInputChange}
                          disabled={!isEditing || profileLoading}
                          className="pl-10 pr-4 py-2 sm:py-3 h-10 sm:h-12 bg-white/70 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl transition-all duration-200 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                          placeholder="Phone number"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="dateOfBirth"
                        className="text-sm font-medium text-slate-700 dark:text-slate-300"
                      >
                        Date of Birth
                      </Label>
                      <div className="relative group">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500 w-4 h-4 transition-colors group-focus-within:text-indigo-500" />
                        <Input
                          id="dateOfBirth"
                          name="dateOfBirth"
                          type="date"
                          value={formData.dateOfBirth}
                          onChange={handleInputChange}
                          disabled={!isEditing || profileLoading}
                          className="pl-10 pr-4 py-2 sm:py-3 h-10 sm:h-12 bg-white/70 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl transition-all duration-200 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="country"
                        className="text-sm font-medium text-slate-700 dark:text-slate-300"
                      >
                        Country
                      </Label>
                      <div className="relative group">
                        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500 w-4 h-4 transition-colors group-focus-within:text-indigo-500" />
                        <Input
                          id="country"
                          name="country"
                          value={formData.country}
                          onChange={handleInputChange}
                          disabled={!isEditing || profileLoading}
                          className="pl-10 pr-4 py-2 sm:py-3 h-10 sm:h-12 bg-white/70 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl transition-all duration-200 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                          placeholder="Country"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="timezone"
                        className="text-sm font-medium text-slate-700 dark:text-slate-300"
                      >
                        Timezone
                      </Label>
                      <Select
                        value={formData.timezone}
                        onValueChange={(value) =>
                          handleSelectChange("timezone", value)
                        }
                        disabled={!isEditing || profileLoading}
                      >
                        <SelectTrigger className="h-10 sm:h-12 bg-white/70 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl">
                          <SelectValue placeholder="Select timezone" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="UTC">UTC</SelectItem>
                          <SelectItem value="America/New_York">
                            Eastern Time
                          </SelectItem>
                          <SelectItem value="America/Chicago">
                            Central Time
                          </SelectItem>
                          <SelectItem value="America/Denver">
                            Mountain Time
                          </SelectItem>
                          <SelectItem value="America/Los_Angeles">
                            Pacific Time
                          </SelectItem>
                          <SelectItem value="Europe/London">London</SelectItem>
                          <SelectItem value="Europe/Paris">Paris</SelectItem>
                          <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                          <SelectItem value="Asia/Kolkata">Kolkata</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="language"
                        className="text-sm font-medium text-slate-700 dark:text-slate-300"
                      >
                        Language
                      </Label>
                      <Select
                        value={formData.language}
                        onValueChange={(value) =>
                          handleSelectChange("language", value)
                        }
                        disabled={!isEditing || profileLoading}
                      >
                        <SelectTrigger className="h-10 sm:h-12 bg-white/70 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl">
                          <SelectValue placeholder="Select language" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="es">Spanish</SelectItem>
                          <SelectItem value="fr">French</SelectItem>
                          <SelectItem value="de">German</SelectItem>
                          <SelectItem value="zh">Chinese</SelectItem>
                          <SelectItem value="ja">Japanese</SelectItem>
                          <SelectItem value="hi">Hindi</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="bio"
                      className="text-sm font-medium text-slate-700 dark:text-slate-300"
                    >
                      Bio
                    </Label>
                    <Textarea
                      id="bio"
                      name="bio"
                      value={formData.bio}
                      onChange={handleInputChange}
                      disabled={!isEditing || profileLoading}
                      rows={3}
                      className="bg-white/70 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl transition-all duration-200 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base resize-none"
                      placeholder="Tell us about yourself..."
                    />
                  </div>
                </TabsContent>

                <TabsContent value="social" className="space-y-4 sm:space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    <div className="space-y-2">
                      <Label
                        htmlFor="website"
                        className="text-sm font-medium text-slate-700 dark:text-slate-300"
                      >
                        Website
                      </Label>
                      <div className="relative group">
                        <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500 w-4 h-4 transition-colors group-focus-within:text-indigo-500" />
                        <Input
                          id="website"
                          name="website"
                          value={formData.website}
                          onChange={handleInputChange}
                          disabled={!isEditing || profileLoading}
                          className={`pl-10 pr-4 py-2 sm:py-3 h-10 sm:h-12 bg-white/70 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl transition-all duration-200 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base ${
                            validationErrors.website
                              ? "border-red-300 dark:border-red-500/50"
                              : ""
                          }`}
                          placeholder="https://yourwebsite.com"
                        />
                      </div>
                      {validationErrors.website && (
                        <p className="text-xs sm:text-sm text-red-500 dark:text-red-400">
                          {validationErrors.website}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="linkedinProfile"
                        className="text-sm font-medium text-slate-700 dark:text-slate-300"
                      >
                        LinkedIn Profile
                      </Label>
                      <div className="relative group">
                        <Linkedin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500 w-4 h-4 transition-colors group-focus-within:text-indigo-500" />
                        <Input
                          id="linkedinProfile"
                          name="linkedinProfile"
                          value={formData.linkedinProfile}
                          onChange={handleInputChange}
                          disabled={!isEditing || profileLoading}
                          className="pl-10 pr-4 py-2 sm:py-3 h-10 sm:h-12 bg-white/70 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl transition-all duration-200 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                          placeholder="LinkedIn profile URL"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="twitterProfile"
                        className="text-sm font-medium text-slate-700 dark:text-slate-300"
                      >
                        Twitter Profile
                      </Label>
                      <div className="relative group">
                        <Twitter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500 w-4 h-4 transition-colors group-focus-within:text-indigo-500" />
                        <Input
                          id="twitterProfile"
                          name="twitterProfile"
                          value={formData.twitterProfile}
                          onChange={handleInputChange}
                          disabled={!isEditing || profileLoading}
                          className="pl-10 pr-4 py-2 sm:py-3 h-10 sm:h-12 bg-white/70 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl transition-all duration-200 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                          placeholder="Twitter profile URL"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="githubProfile"
                        className="text-sm font-medium text-slate-700 dark:text-slate-300"
                      >
                        GitHub Profile
                      </Label>
                      <div className="relative group">
                        <Github className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500 w-4 h-4 transition-colors group-focus-within:text-indigo-500" />
                        <Input
                          id="githubProfile"
                          name="githubProfile"
                          value={formData.githubProfile}
                          onChange={handleInputChange}
                          disabled={!isEditing || profileLoading}
                          className="pl-10 pr-4 py-2 sm:py-3 h-10 sm:h-12 bg-white/70 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl transition-all duration-200 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                          placeholder="GitHub profile URL"
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent
                  value="role-specific"
                  className="space-y-4 sm:space-y-6"
                >
                  {user?.role?.toLowerCase() === "student" && (
                    <div className="space-y-4 sm:space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                        <Card className="bg-white/50 dark:bg-slate-700/30 backdrop-blur-sm border border-white/50 dark:border-slate-600/50">
                          <CardContent className="p-4 text-center">
                            <BookOpen className="w-8 h-8 mx-auto mb-2 text-indigo-500" />
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              Learning Time
                            </p>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">
                              {Math.floor(
                                (user?.profile?.totalLearningTime || 0) / 60
                              )}
                              h {(user?.profile?.totalLearningTime || 0) % 60}m
                            </p>
                          </CardContent>
                        </Card>
                        <Card className="bg-white/50 dark:bg-slate-700/30 backdrop-blur-sm border border-white/50 dark:border-slate-600/50">
                          <CardContent className="p-4 text-center">
                            <Star className="w-8 h-8 mx-auto mb-2 text-indigo-500" />
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              Skill Level
                            </p>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">
                              {user?.profile?.skillLevel || "Beginner"}
                            </p>
                          </CardContent>
                        </Card>
                        <Card className="bg-white/50 dark:bg-slate-700/30 backdrop-blur-sm border border-white/50 dark:border-slate-600/50">
                          <CardContent className="p-4 text-center">
                            <Award className="w-8 h-8 mx-auto mb-2 text-indigo-500" />
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              Interests
                            </p>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">
                              {user?.profile?.interests?.length || 0}
                            </p>
                          </CardContent>
                        </Card>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label
                            htmlFor="skillLevel"
                            className="text-sm font-medium text-slate-700 dark:text-slate-300"
                          >
                            Skill Level
                          </Label>
                          <Select
                            value={formData.skillLevel}
                            onValueChange={(value) =>
                              handleSelectChange("skillLevel", value)
                            }
                            disabled={!isEditing || profileLoading}
                          >
                            <SelectTrigger className="h-10 sm:h-12 bg-white/70 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl">
                              <SelectValue placeholder="Select skill level" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="BEGINNER">Beginner</SelectItem>
                              <SelectItem value="INTERMEDIATE">
                                Intermediate
                              </SelectItem>
                              <SelectItem value="ADVANCED">Advanced</SelectItem>
                              <SelectItem value="EXPERT">Expert</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label
                            htmlFor="interests"
                            className="text-sm font-medium text-slate-700 dark:text-slate-300"
                          >
                            Interests (comma-separated)
                          </Label>
                          <Input
                            id="interests"
                            name="interests"
                            value={formData.interests.join(", ")}
                            onChange={(e) =>
                              handleArrayChange("interests", e.target.value)
                            }
                            disabled={!isEditing || profileLoading}
                            className="h-10 sm:h-12 bg-white/70 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl transition-all duration-200 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                            placeholder="Programming, Design, Marketing"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label
                            htmlFor="learningGoals"
                            className="text-sm font-medium text-slate-700 dark:text-slate-300"
                          >
                            Learning Goals (comma-separated)
                          </Label>
                          <Textarea
                            id="learningGoals"
                            name="learningGoals"
                            value={formData.learningGoals.join(", ")}
                            onChange={(e) =>
                              handleArrayChange("learningGoals", e.target.value)
                            }
                            disabled={!isEditing || profileLoading}
                            rows={3}
                            className="bg-white/70 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl transition-all duration-200 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base resize-none"
                            placeholder="Learn React, Master Python, Build a portfolio"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {user?.role?.toLowerCase() === "instructor" && (
                    <div className="space-y-4 sm:space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                        <Card className="bg-white/50 dark:bg-slate-700/30 backdrop-blur-sm border border-white/50 dark:border-slate-600/50">
                          <CardContent className="p-4 text-center">
                            <Star className="w-8 h-8 mx-auto mb-2 text-indigo-500" />
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              Rating
                            </p>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">
                              {user?.profile?.rating || 0}/5
                            </p>
                          </CardContent>
                        </Card>
                        <Card className="bg-white/50 dark:bg-slate-700/30 backdrop-blur-sm border border-white/50 dark:border-slate-600/50">
                          <CardContent className="p-4 text-center">
                            <Users className="w-8 h-8 mx-auto mb-2 text-indigo-500" />
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              Students
                            </p>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">
                              {user?.profile?.totalStudents || 0}
                            </p>
                          </CardContent>
                        </Card>
                        <Card className="bg-white/50 dark:bg-slate-700/30 backdrop-blur-sm border border-white/50 dark:border-slate-600/50">
                          <CardContent className="p-4 text-center">
                            <BookOpen className="w-8 h-8 mx-auto mb-2 text-indigo-500" />
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              Courses
                            </p>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">
                              {user?.profile?.totalCourses || 0}
                            </p>
                          </CardContent>
                        </Card>
                        <Card className="bg-white/50 dark:bg-slate-700/30 backdrop-blur-sm border border-white/50 dark:border-slate-600/50">
                          <CardContent className="p-4 text-center">
                            <DollarSign className="w-8 h-8 mx-auto mb-2 text-indigo-500" />
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              Revenue
                            </p>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">
                              ${user?.profile?.totalRevenue || "0"}
                            </p>
                          </CardContent>
                        </Card>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label
                            htmlFor="title"
                            className="text-sm font-medium text-slate-700 dark:text-slate-300"
                          >
                            Professional Title
                          </Label>
                          <Input
                            id="title"
                            name="title"
                            value={formData.title}
                            onChange={handleInputChange}
                            disabled={!isEditing || profileLoading}
                            className="h-10 sm:h-12 bg-white/70 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl transition-all duration-200 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                            placeholder="Senior Developer, Design Expert, etc."
                          />
                        </div>

                        <div className="space-y-2">
                          <Label
                            htmlFor="yearsExperience"
                            className="text-sm font-medium text-slate-700 dark:text-slate-300"
                          >
                            Years of Experience
                          </Label>
                          <Input
                            id="yearsExperience"
                            name="yearsExperience"
                            type="number"
                            value={formData.yearsExperience}
                            onChange={handleInputChange}
                            disabled={!isEditing || profileLoading}
                            className="h-10 sm:h-12 bg-white/70 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl transition-all duration-200 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                            placeholder="5"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label
                            htmlFor="expertise"
                            className="text-sm font-medium text-slate-700 dark:text-slate-300"
                          >
                            Expertise Areas (comma-separated)
                          </Label>
                          <Input
                            id="expertise"
                            name="expertise"
                            value={formData.expertise.join(", ")}
                            onChange={(e) =>
                              handleArrayChange("expertise", e.target.value)
                            }
                            disabled={!isEditing || profileLoading}
                            className="h-10 sm:h-12 bg-white/70 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl transition-all duration-200 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                            placeholder="JavaScript, React, Node.js"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label
                            htmlFor="education"
                            className="text-sm font-medium text-slate-700 dark:text-slate-300"
                          >
                            Education
                          </Label>
                          <Textarea
                            id="education"
                            name="education"
                            value={formData.education}
                            onChange={handleInputChange}
                            disabled={!isEditing || profileLoading}
                            rows={3}
                            className="bg-white/70 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl transition-all duration-200 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base resize-none"
                            placeholder="Your educational background..."
                          />
                        </div>

                        <div className="space-y-2">
                          <Label
                            htmlFor="biography"
                            className="text-sm font-medium text-slate-700 dark:text-slate-300"
                          >
                            Teaching Biography
                          </Label>
                          <Textarea
                            id="biography"
                            name="biography"
                            value={formData.biography}
                            onChange={handleInputChange}
                            disabled={!isEditing || profileLoading}
                            rows={4}
                            className="bg-white/70 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl transition-all duration-200 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base resize-none"
                            placeholder="Tell students about your teaching experience..."
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {user?.role?.toLowerCase() === "admin" && (
                    <div className="space-y-4 sm:space-y-6">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label
                            htmlFor="department"
                            className="text-sm font-medium text-slate-700 dark:text-slate-300"
                          >
                            Department
                          </Label>
                          <Input
                            id="department"
                            name="department"
                            value={formData.department}
                            onChange={handleInputChange}
                            disabled={!isEditing || profileLoading}
                            className="h-10 sm:h-12 bg-white/70 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl transition-all duration-200 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                            placeholder="Technology, Marketing, Operations"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            Permissions
                          </Label>
                          <div className="flex flex-wrap gap-2">
                            {user?.profile?.permissions?.map(
                              (permission, index) => (
                                <Badge key={index} variant="outline">
                                  {permission}
                                </Badge>
                              )
                            ) || (
                              <p className="text-sm text-slate-600 dark:text-slate-400">
                                No permissions assigned
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent
                  value="notifications"
                  className="space-y-4 sm:space-y-6"
                >
                  <div className="space-y-4 sm:space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-medium text-slate-900 dark:text-white">
                            Notification Preferences
                          </h3>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            Choose how you want to receive notifications
                          </p>
                        </div>
                        <Button
                          onClick={handleSaveNotificationSettings}
                          disabled={profileLoading}
                          size="sm"
                          className="bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-white rounded-xl"
                        >
                          {profileLoading ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Save className="w-4 h-4 mr-2" />
                          )}
                          Save Settings
                        </Button>
                      </div>

                      <Separator />

                      <div className="space-y-4">
                        <h4 className="font-medium flex items-center text-slate-900 dark:text-white">
                          <Bell className="w-4 h-4 mr-2" />
                          Notification Channels
                        </h4>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <Label className="font-medium text-slate-900 dark:text-white">
                                In-App Notifications
                              </Label>
                              <p className="text-sm text-slate-600 dark:text-slate-400">
                                Receive notifications within the application
                              </p>
                            </div>
                            <Switch
                              checked={notificationSettings.inApp}
                              onCheckedChange={(value) =>
                                handleNotificationChange("inApp", value)
                              }
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <div>
                              <Label className="font-medium text-slate-900 dark:text-white">
                                Email Notifications
                              </Label>
                              <p className="text-sm text-slate-600 dark:text-slate-400">
                                Receive notifications via email
                              </p>
                            </div>
                            <Switch
                              checked={notificationSettings.email}
                              onCheckedChange={(value) =>
                                handleNotificationChange("email", value)
                              }
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <div>
                              <Label className="font-medium text-slate-900 dark:text-white">
                                Push Notifications
                              </Label>
                              <p className="text-sm text-slate-600 dark:text-slate-400">
                                Receive push notifications on your device
                              </p>
                            </div>
                            <Switch
                              checked={notificationSettings.push}
                              onCheckedChange={(value) =>
                                handleNotificationChange("push", value)
                              }
                            />
                          </div>
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-4">
                        <h4 className="font-medium flex items-center text-slate-900 dark:text-white">
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Learning & Course Notifications
                        </h4>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <Label className="font-medium text-slate-900 dark:text-white">
                                Discussion Updates
                              </Label>
                              <p className="text-sm text-slate-600 dark:text-slate-400">
                                Q&A responses and discussion activity
                              </p>
                            </div>
                            <Switch
                              checked={notificationSettings.discussionUpdates}
                              onCheckedChange={(value) =>
                                handleNotificationChange(
                                  "discussionUpdates",
                                  value
                                )
                              }
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <div>
                              <Label className="font-medium text-slate-900 dark:text-white">
                                Assignment Updates
                              </Label>
                              <p className="text-sm text-slate-600 dark:text-slate-400">
                                Grading results and assignment feedback
                              </p>
                            </div>
                            <Switch
                              checked={notificationSettings.assignmentUpdates}
                              onCheckedChange={(value) =>
                                handleNotificationChange(
                                  "assignmentUpdates",
                                  value
                                )
                              }
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <div>
                              <Label className="font-medium text-slate-900 dark:text-white">
                                Course Updates
                              </Label>
                              <p className="text-sm text-slate-600 dark:text-slate-400">
                                New content and course announcements
                              </p>
                            </div>
                            <Switch
                              checked={notificationSettings.courseUpdates}
                              onCheckedChange={(value) =>
                                handleNotificationChange("courseUpdates", value)
                              }
                            />
                          </div>
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-4">
                        <h4 className="font-medium flex items-center text-slate-900 dark:text-white">
                          <CreditCard className="w-4 h-4 mr-2" />
                          Financial Notifications
                        </h4>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <Label className="font-medium text-slate-900 dark:text-white">
                                Payment Updates
                              </Label>
                              <p className="text-sm text-slate-600 dark:text-slate-400">
                                Payment confirmations, failures, and refunds
                              </p>
                            </div>
                            <Switch
                              checked={notificationSettings.paymentUpdates}
                              onCheckedChange={(value) =>
                                handleNotificationChange(
                                  "paymentUpdates",
                                  value
                                )
                              }
                            />
                          </div>
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-4">
                        <h4 className="font-medium flex items-center text-slate-900 dark:text-white">
                          <Settings className="w-4 h-4 mr-2" />
                          Account & System
                        </h4>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <Label className="font-medium text-slate-900 dark:text-white">
                                Account Updates
                              </Label>
                              <p className="text-sm text-slate-600 dark:text-slate-400">
                                Account changes and system maintenance
                              </p>
                            </div>
                            <Switch
                              checked={notificationSettings.accountUpdates}
                              onCheckedChange={(value) =>
                                handleNotificationChange(
                                  "accountUpdates",
                                  value
                                )
                              }
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <div>
                              <Label className="font-medium text-slate-900 dark:text-white">
                                Security Alerts
                              </Label>
                              <p className="text-sm text-slate-600 dark:text-slate-400">
                                Login alerts and security notifications
                              </p>
                            </div>
                            <Switch
                              checked={notificationSettings.securityAlerts}
                              onCheckedChange={(value) =>
                                handleNotificationChange(
                                  "securityAlerts",
                                  value
                                )
                              }
                            />
                          </div>
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-4">
                        <h4 className="font-medium flex items-center text-slate-900 dark:text-white">
                          <Mail className="w-4 h-4 mr-2" />
                          Email Preferences
                        </h4>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <Label className="font-medium text-slate-900 dark:text-white">
                                Marketing Emails
                              </Label>
                              <p className="text-sm text-slate-600 dark:text-slate-400">
                                Promotional content and new feature
                                announcements
                              </p>
                            </div>
                            <Switch
                              checked={notificationSettings.marketingEmails}
                              onCheckedChange={(value) =>
                                handleNotificationChange(
                                  "marketingEmails",
                                  value
                                )
                              }
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <div>
                              <Label className="font-medium text-slate-900 dark:text-white">
                                Weekly Digest
                              </Label>
                              <p className="text-sm text-slate-600 dark:text-slate-400">
                                Weekly summary of your activity and progress
                              </p>
                            </div>
                            <Switch
                              checked={notificationSettings.weeklyDigest}
                              onCheckedChange={(value) =>
                                handleNotificationChange("weeklyDigest", value)
                              }
                            />
                          </div>
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-4">
                        <h4 className="font-medium flex items-center text-slate-900 dark:text-white">
                          <BellOff className="w-4 h-4 mr-2" />
                          Quiet Hours
                        </h4>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <Label className="font-medium text-slate-900 dark:text-white">
                                Enable Quiet Hours
                              </Label>
                              <p className="text-sm text-slate-600 dark:text-slate-400">
                                Pause non-urgent notifications during set hours
                              </p>
                            </div>
                            <Switch
                              checked={notificationSettings.quietHours}
                              onCheckedChange={(value) =>
                                handleNotificationChange("quietHours", value)
                              }
                            />
                          </div>

                          {notificationSettings.quietHours && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 ml-0 sm:ml-4 mt-4">
                              <div className="space-y-2">
                                <Label
                                  htmlFor="quietHoursStart"
                                  className="text-sm font-medium text-slate-700 dark:text-slate-300"
                                >
                                  Start Time
                                </Label>
                                <Input
                                  id="quietHoursStart"
                                  type="time"
                                  value={notificationSettings.quietHoursStart}
                                  onChange={(e) =>
                                    handleNotificationChange(
                                      "quietHoursStart",
                                      e.target.value
                                    )
                                  }
                                  className="bg-white/70 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label
                                  htmlFor="quietHoursEnd"
                                  className="text-sm font-medium text-slate-700 dark:text-slate-300"
                                >
                                  End Time
                                </Label>
                                <Input
                                  id="quietHoursEnd"
                                  type="time"
                                  value={notificationSettings.quietHoursEnd}
                                  onChange={(e) =>
                                    handleNotificationChange(
                                      "quietHoursEnd",
                                      e.target.value
                                    )
                                  }
                                  className="bg-white/70 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent
                  value="security"
                  className="space-y-4 sm:space-y-6"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-white/50 dark:bg-slate-700/30 backdrop-blur-sm border border-white/50 dark:border-slate-600/50 rounded-xl">
                      <div>
                        <h3 className="font-medium text-slate-900 dark:text-white">
                          Account Status
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Your account is{" "}
                          {user?.isActive ? "active" : "inactive"}
                        </p>
                      </div>
                      <Badge
                        variant={user?.isActive ? "default" : "destructive"}
                      >
                        {user?.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-white/50 dark:bg-slate-700/30 backdrop-blur-sm border border-white/50 dark:border-slate-600/50 rounded-xl">
                      <div>
                        <h3 className="font-medium text-slate-900 dark:text-white">
                          Email Verification
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Your email is{" "}
                          {user?.isVerified ? "verified" : "not verified"}
                        </p>
                      </div>
                      <Badge
                        variant={user?.isVerified ? "default" : "destructive"}
                      >
                        {user?.isVerified ? "Verified" : "Not Verified"}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-white/50 dark:bg-slate-700/30 backdrop-blur-sm border border-white/50 dark:border-slate-600/50 rounded-xl">
                      <div>
                        <h3 className="font-medium text-slate-900 dark:text-white">
                          Last Login
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {formatDate(user?.lastLogin)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-white/50 dark:bg-slate-700/30 backdrop-blur-sm border border-white/50 dark:border-slate-600/50 rounded-xl">
                      <div>
                        <h3 className="font-medium text-slate-900 dark:text-white">
                          Account Created
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {formatDate(user?.createdAt)}
                        </p>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h3 className="font-medium text-slate-900 dark:text-white">
                        Active Sessions
                      </h3>
                      {sessions?.length > 0 ? (
                        <div className="space-y-2">
                          {sessions.map((session, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-3 bg-white/50 dark:bg-slate-700/30 backdrop-blur-sm border border-white/50 dark:border-slate-600/50 rounded-xl"
                            >
                              <div>
                                <p className="font-medium text-slate-900 dark:text-white">
                                  {formatDeviceName(session)}
                                </p>
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                  {formatLocation(session)} •{" "}
                                  {formatDate(session.lastActivity)}
                                </p>
                              </div>
                              <Badge variant="outline">
                                {session.isCurrent ? "Current" : "Active"}
                              </Badge>
                            </div>
                          ))}
                          {sessions.filter((session) => !session.isCurrent)
                            .length > 0 && (
                            <Button
                              variant="destructive"
                              onClick={handleInvalidateOtherSessions}
                              disabled={sessionsLoading}
                              className="w-full rounded-xl"
                            >
                              {sessionsLoading ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              ) : (
                                <UserX className="w-4 h-4 mr-2" />
                              )}
                              Invalidate Other Sessions
                            </Button>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          No active sessions found
                        </p>
                      )}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="text-center py-4 px-4">
        <p className="text-xs text-slate-500/80 dark:text-slate-500">
          © 2023 LearnHub. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default ProfilePage;
