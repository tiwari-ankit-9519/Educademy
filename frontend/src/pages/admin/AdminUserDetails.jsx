import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  Shield,
  Calendar,
  Globe,
  Phone,
  MapPin,
  Clock,
  BookOpen,
  ShoppingCart,
  Bell,
  Monitor,
  Chrome,
  AlertCircle,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Edit,
  Ban,
  UnlockKeyhole,
  Trash2,
  MoreVertical,
  Star,
  TrendingUp,
  Users,
  Timer,
  Zap,
  Sparkles,
  Link,
  Twitter,
  Github,
  Linkedin,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useTheme } from "@/components/ThemeProvider";
import { getUserDetails } from "@/features/adminSlice/adminUser";

const AdminUserDetails = () => {
  const { theme } = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { userId } = useParams();
  const { userDetails, userDetailsLoading, error } = useSelector(
    (state) => state.adminUser
  );

  useEffect(() => {
    if (userId) {
      dispatch(getUserDetails(userId));
    }
  }, [dispatch, userId]);

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  const formatDate = (dateString) => {
    if (!dateString) return "Not provided";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status) => {
    if (status) return "text-green-600 dark:text-green-400";
    return "text-red-600 dark:text-red-400";
  };

  const getStatusIcon = (status) => {
    if (status) return <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />;
    return <XCircle className="w-3 h-3 sm:w-4 sm:h-4" />;
  };

  const getRoleColor = (role) => {
    switch (role) {
      case "ADMIN":
        return "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300";
      case "INSTRUCTOR":
        return "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300";
      case "STUDENT":
        return "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300";
      default:
        return "bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300";
    }
  };

  const getSkillLevelColor = (level) => {
    switch (level) {
      case "BEGINNER":
        return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300";
      case "INTERMEDIATE":
        return "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300";
      case "ADVANCED":
        return "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300";
      default:
        return "bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300";
    }
  };

  if (userDetailsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50/80 via-indigo-50/80 to-cyan-50/80 dark:from-slate-900/80 dark:via-slate-800/80 dark:to-gray-900/80 backdrop-blur-xl flex items-center justify-center px-4">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 dark:text-indigo-400 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base">
            Loading user details...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50/80 via-indigo-50/80 to-cyan-50/80 dark:from-slate-900/80 dark:via-slate-800/80 dark:to-gray-900/80 backdrop-blur-xl flex items-center justify-center px-4">
        <Alert className="max-w-md bg-red-50/50 dark:bg-red-900/20 border border-red-200/50 dark:border-red-800/50 backdrop-blur-sm rounded-xl">
          <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
          <AlertDescription className="text-red-700 dark:text-red-400 text-sm">
            {error}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!userDetails) {
    return null;
  }

  const user = userDetails;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/80 via-indigo-50/80 to-cyan-50/80 dark:from-slate-900/80 dark:via-slate-800/80 dark:to-gray-900/80 backdrop-blur-xl">
      <div className="relative z-10 p-3 sm:p-4 lg:p-6 max-w-7xl mx-auto">
        <div className="mb-4 sm:mb-6 lg:mb-8 bg-white/30 dark:bg-slate-700/30 backdrop-blur-sm border border-white/50 dark:border-slate-700/50 shadow-lg rounded-xl p-3 sm:p-4 lg:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
            <Button
              onClick={() => navigate(-1)}
              variant="ghost"
              size="sm"
              className="text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 self-start"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Back
            </Button>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                className="text-red-600 dark:text-red-400 bg-white/30 dark:bg-slate-700/30 backdrop-blur-sm border border-white/50 dark:border-slate-700/50 text-xs sm:text-sm"
              >
                <Ban className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                {user.isBanned ? "Unban" : "Ban"}
              </Button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
            <div className="relative flex-shrink-0 self-center sm:self-start">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg">
                {user.profileImage ? (
                  <img
                    src={user.profileImage}
                    alt={user.firstName}
                    className="w-full h-full rounded-2xl object-cover"
                  />
                ) : (
                  <User className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                )}
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center shadow">
                <Sparkles className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-white" />
              </div>
            </div>

            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-800 dark:text-white">
                  {user.firstName} {user.lastName}
                </h1>
                <span
                  className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(
                    user.role
                  )}`}
                >
                  {user.role}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-3">
                <div className="flex items-center justify-center sm:justify-start gap-1">
                  <Mail className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span className="truncate">{user.email}</span>
                </div>
                <div className="flex items-center justify-center sm:justify-start gap-1">
                  <Calendar className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span className="whitespace-nowrap">
                    Joined {formatDate(user.createdAt)}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap justify-center sm:justify-start items-center gap-3 sm:gap-4">
                <div
                  className={`flex items-center gap-1 text-xs sm:text-sm ${getStatusColor(
                    user.isActive
                  )}`}
                >
                  {getStatusIcon(user.isActive)}
                  <span>{user.isActive ? "Active" : "Inactive"}</span>
                </div>
                <div
                  className={`flex items-center gap-1 text-xs sm:text-sm ${getStatusColor(
                    user.isVerified
                  )}`}
                >
                  {getStatusIcon(user.isVerified)}
                  <span>{user.isVerified ? "Verified" : "Unverified"}</span>
                </div>
                <div
                  className={`flex items-center gap-1 text-xs sm:text-sm ${getStatusColor(
                    !user.isBanned
                  )}`}
                >
                  {getStatusIcon(!user.isBanned)}
                  <span>{user.isBanned ? "Banned" : "Not Banned"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
          <div className="xl:col-span-2 space-y-4 sm:space-y-6">
            <Card className="bg-white/30 dark:bg-slate-700/30 backdrop-blur-sm border border-white/50 dark:border-slate-700/50 shadow-lg rounded-xl">
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="text-base sm:text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                  <User className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 dark:text-indigo-400" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <Label className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                      Bio
                    </Label>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 break-words">
                      {user.bio || "No bio provided"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                      Country
                    </Label>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                      <span>{user.country || "Not specified"}</span>
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                      Phone
                    </Label>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 flex items-center gap-1">
                      <Phone className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                      <span>{user.phoneNumber || "Not provided"}</span>
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                      Date of Birth
                    </Label>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                      <span>{formatDate(user.dateOfBirth)}</span>
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                      Timezone
                    </Label>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                      <span>{user.timezone}</span>
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                      Language
                    </Label>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 flex items-center gap-1">
                      <Globe className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                      <span>{user.language?.toUpperCase()}</span>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/30 dark:bg-slate-700/30 backdrop-blur-sm border border-white/50 dark:border-slate-700/50 shadow-lg rounded-xl">
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="text-base sm:text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                  <Link className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 dark:text-indigo-400" />
                  Social Profiles
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 sm:space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <Globe className="w-3 h-3 sm:w-4 sm:h-4 text-slate-500 flex-shrink-0" />
                    <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                      Website:
                    </span>
                  </div>
                  {user.website ? (
                    <a
                      href={user.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs sm:text-sm text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 truncate"
                    >
                      <span className="truncate">{user.website}</span>
                      <ExternalLink className="w-2.5 h-2.5 sm:w-3 sm:h-3 flex-shrink-0" />
                    </a>
                  ) : (
                    <span className="text-xs sm:text-sm text-slate-500">
                      Not provided
                    </span>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <Linkedin className="w-3 h-3 sm:w-4 sm:h-4 text-slate-500 flex-shrink-0" />
                    <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                      LinkedIn:
                    </span>
                  </div>
                  {user.linkedinProfile ? (
                    <a
                      href={user.linkedinProfile}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs sm:text-sm text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 truncate"
                    >
                      <span className="truncate">{user.linkedinProfile}</span>
                      <ExternalLink className="w-2.5 h-2.5 sm:w-3 sm:h-3 flex-shrink-0" />
                    </a>
                  ) : (
                    <span className="text-xs sm:text-sm text-slate-500">
                      Not provided
                    </span>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <Twitter className="w-3 h-3 sm:w-4 sm:h-4 text-slate-500 flex-shrink-0" />
                    <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                      Twitter:
                    </span>
                  </div>
                  {user.twitterProfile ? (
                    <a
                      href={user.twitterProfile}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs sm:text-sm text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 truncate"
                    >
                      <span className="truncate">{user.twitterProfile}</span>
                      <ExternalLink className="w-2.5 h-2.5 sm:w-3 sm:h-3 flex-shrink-0" />
                    </a>
                  ) : (
                    <span className="text-xs sm:text-sm text-slate-500">
                      Not provided
                    </span>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <Github className="w-3 h-3 sm:w-4 sm:h-4 text-slate-500 flex-shrink-0" />
                    <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                      GitHub:
                    </span>
                  </div>
                  {user.githubProfile ? (
                    <a
                      href={user.githubProfile}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs sm:text-sm text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 truncate"
                    >
                      <span className="truncate">{user.githubProfile}</span>
                      <ExternalLink className="w-2.5 h-2.5 sm:w-3 sm:h-3 flex-shrink-0" />
                    </a>
                  ) : (
                    <span className="text-xs sm:text-sm text-slate-500">
                      Not provided
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/30 dark:bg-slate-700/30 backdrop-blur-sm border border-white/50 dark:border-slate-700/50 shadow-lg rounded-xl">
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="text-base sm:text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                  <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 dark:text-indigo-400" />
                  Learning Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <Label className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                      Skill Level
                    </Label>
                    <span
                      className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${getSkillLevelColor(
                        user.profile?.skillLevel
                      )}`}
                    >
                      {user.profile?.skillLevel || "Not specified"}
                    </span>
                  </div>
                  <div>
                    <Label className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                      Total Learning Time
                    </Label>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 flex items-center gap-1">
                      <Timer className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                      <span>{user.profile?.totalLearningTime || 0} hours</span>
                    </p>
                  </div>
                </div>
                <div>
                  <Label className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                    Learning Goals
                  </Label>
                  <div className="mt-2">
                    {user.profile?.learningGoals?.length > 0 ? (
                      <div className="flex flex-wrap gap-1 sm:gap-2">
                        {user.profile.learningGoals.map((goal, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-xs"
                          >
                            {goal}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs sm:text-sm text-slate-500">
                        No learning goals set
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  <Label className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                    Interests
                  </Label>
                  <div className="mt-2">
                    {user.profile?.interests?.length > 0 ? (
                      <div className="flex flex-wrap gap-1 sm:gap-2">
                        {user.profile.interests.map((interest, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs"
                          >
                            {interest}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs sm:text-sm text-slate-500">
                        No interests specified
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4 sm:space-y-6">
            <Card className="bg-white/30 dark:bg-slate-700/30 backdrop-blur-sm border border-white/50 dark:border-slate-700/50 shadow-lg rounded-xl">
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="text-base sm:text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 dark:text-indigo-400" />
                  Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                <div className="grid grid-cols-2 gap-2 sm:gap-4">
                  <div className="text-center p-2 sm:p-3 bg-white/20 dark:bg-slate-800/30 backdrop-blur-sm rounded-xl border border-white/30 dark:border-slate-600/30">
                    <div className="text-lg sm:text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                      {user.stats?.totalLogins || 0}
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400">
                      Total Logins
                    </div>
                  </div>
                  <div className="text-center p-2 sm:p-3 bg-white/20 dark:bg-slate-800/30 backdrop-blur-sm rounded-xl border border-white/30 dark:border-slate-600/30">
                    <div className="text-lg sm:text-2xl font-bold text-green-600 dark:text-green-400">
                      {user.stats?.activeDevices || 0}
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400">
                      Active Devices
                    </div>
                  </div>
                  <div className="text-center p-2 sm:p-3 bg-white/20 dark:bg-slate-800/30 backdrop-blur-sm rounded-xl border border-white/30 dark:border-slate-600/30">
                    <div className="text-lg sm:text-2xl font-bold text-orange-600 dark:text-orange-400">
                      {user.stats?.totalEnrollments || 0}
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400">
                      Enrollments
                    </div>
                  </div>
                  <div className="text-center p-2 sm:p-3 bg-white/20 dark:bg-slate-800/30 backdrop-blur-sm rounded-xl border border-white/30 dark:border-slate-600/30">
                    <div className="text-lg sm:text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {user.stats?.totalCertificates || 0}
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400">
                      Certificates
                    </div>
                  </div>
                </div>
                <div className="pt-2 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                      Account Age
                    </span>
                    <span className="text-xs sm:text-sm font-medium text-slate-800 dark:text-white">
                      {user.stats?.accountAge || 0} days
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                      Unread Notifications
                    </span>
                    <span className="text-xs sm:text-sm font-medium text-slate-800 dark:text-white">
                      {user.stats?.unreadNotifications || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                      Total Reviews
                    </span>
                    <span className="text-xs sm:text-sm font-medium text-slate-800 dark:text-white">
                      {user.stats?.totalReviews || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                      Average Rating
                    </span>
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500 fill-current" />
                      <span className="text-xs sm:text-sm font-medium text-slate-800 dark:text-white">
                        {user.stats?.averageRating || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/30 dark:bg-slate-700/30 backdrop-blur-sm border border-white/50 dark:border-slate-700/50 shadow-lg rounded-xl">
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="text-base sm:text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                  <Monitor className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 dark:text-indigo-400" />
                  Active Sessions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 sm:space-y-3">
                {user.sessions?.length > 0 ? (
                  user.sessions.map((session, index) => (
                    <div
                      key={index}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 sm:p-3 bg-white/20 dark:bg-slate-800/30 backdrop-blur-sm rounded-xl border border-white/30 dark:border-slate-600/30"
                    >
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                        <Chrome className="w-3 h-3 sm:w-4 sm:h-4 text-slate-500 flex-shrink-0" />
                        <div className="min-w-0">
                          <div className="text-xs sm:text-sm font-medium text-slate-800 dark:text-white">
                            {session.browser}
                          </div>
                          <div className="text-xs text-slate-500 truncate">
                            {session.ipAddress}
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-slate-500 text-right sm:text-left">
                        {formatDate(session.lastActivity)}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs sm:text-sm text-slate-500 text-center py-4 sm:py-8">
                    No active sessions
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="bg-white/30 dark:bg-slate-700/30 backdrop-blur-sm border border-white/50 dark:border-slate-700/50 shadow-lg rounded-xl">
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="text-base sm:text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                  <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 dark:text-indigo-400" />
                  Recent Notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 sm:space-y-3">
                {user.recentNotifications?.length > 0 ? (
                  user.recentNotifications
                    .slice(0, 3)
                    .map((notification, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between gap-2 p-2 sm:p-3 bg-white/20 dark:bg-slate-800/30 backdrop-blur-sm rounded-xl border border-white/30 dark:border-slate-600/30"
                      >
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                          <div
                            className={`w-2 h-2 rounded-full flex-shrink-0 ${
                              notification.isRead
                                ? "bg-slate-300"
                                : "bg-indigo-500"
                            }`}
                          ></div>
                          <div className="min-w-0">
                            <div className="text-xs sm:text-sm font-medium text-slate-800 dark:text-white">
                              {notification.type.replace(/_/g, " ")}
                            </div>
                            <div className="text-xs text-slate-500">
                              {formatDate(notification.createdAt)}
                            </div>
                          </div>
                        </div>
                        {!notification.isRead && (
                          <div className="w-2 h-2 bg-indigo-500 rounded-full flex-shrink-0"></div>
                        )}
                      </div>
                    ))
                ) : (
                  <p className="text-xs sm:text-sm text-slate-500 text-center py-4 sm:py-8">
                    No recent notifications
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <div className="relative z-10 text-center py-4">
        <p className="text-xs text-slate-500/80 dark:text-slate-500">
          © 2023 LearnHub. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default AdminUserDetails;
