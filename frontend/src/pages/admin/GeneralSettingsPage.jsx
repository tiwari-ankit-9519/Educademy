import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
// import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  getSystemSettings,
  updateSystemSettings,
  clearError,
} from "@/features/adminSlice/adminSystem";
import {
  Settings,
  Globe,
  Shield,
  DollarSign,
  Zap,
  Database,
  Wrench,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  BookOpen,
  Upload,
  CreditCard,
  Lock,
  Activity,
  Loader2,
  Mail,
  Languages,
  MapPin,
  Palette,
  Image,
  Phone,
  HelpCircle,
  Server,
  Monitor,
  Smartphone,
  Download,
  Award,
  Tag,
  Eye,
  Key,
  UserCheck,
  Calendar,
  Gauge,
  FileText,
  BarChart,
  Timer,
  Network,
  AlertCircle,
  Construction,
  HardDrive,
  Archive,
} from "lucide-react";

const GeneralSettingsPage = () => {
  const dispatch = useDispatch();
  //   const navigate = useNavigate();

  const {
    systemSettings,
    systemSettingsLoading,
    updateSystemSettingsLoading,
    error,
  } = useSelector((state) => state.adminSystem);

  const [activeTab, setActiveTab] = useState("platform");
  const [formData, setFormData] = useState({
    platform: {},
    features: {},
    limits: {},
    payments: {},
    security: {},
    maintenance: {},
  });
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    dispatch(getSystemSettings());
  }, [dispatch]);

  useEffect(() => {
    if (systemSettings && Object.keys(systemSettings).length > 0) {
      setFormData({
        platform: systemSettings.platform || {},
        features: systemSettings.features || {},
        limits: systemSettings.limits || {},
        payments: systemSettings.payments || {},
        security: systemSettings.security || {},
        maintenance: systemSettings.maintenance || {},
      });
    }
  }, [systemSettings]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const handleInputChange = (category, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value,
      },
    }));
    setHasChanges(true);
  };

  const handleSave = async (category) => {
    try {
      await dispatch(
        updateSystemSettings({
          category,
          settings: formData[category],
        })
      ).unwrap();

      setHasChanges(false);
      toast.success(
        `${
          category.charAt(0).toUpperCase() + category.slice(1)
        } settings updated successfully`
      );
    } catch (error) {
      toast.error(error.message || `Failed to update ${category} settings`);
    }
  };

  const handleRefresh = () => {
    dispatch(getSystemSettings());
    setHasChanges(false);
  };

  const renderPlatformSettings = () => (
    <Card className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-white/50 dark:border-slate-700/50 shadow-lg rounded-2xl">
      <CardHeader className="pb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg">
            <Globe className="w-5 h-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-slate-800 dark:text-white">
              Platform Information
            </CardTitle>
            <CardDescription>
              Basic platform settings and branding
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label
              htmlFor="platform-name"
              className="flex items-center space-x-2"
            >
              <Palette className="w-4 h-4" />
              <span>Platform Name</span>
            </Label>
            <Input
              id="platform-name"
              value={formData.platform.name || ""}
              onChange={(e) =>
                handleInputChange("platform", "name", e.target.value)
              }
              placeholder="Enter platform name"
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="platform-version"
              className="flex items-center space-x-2"
            >
              <Tag className="w-4 h-4" />
              <span>Version</span>
            </Label>
            <Input
              id="platform-version"
              value={formData.platform.version || ""}
              onChange={(e) =>
                handleInputChange("platform", "version", e.target.value)
              }
              placeholder="e.g., 1.0.0"
              className="rounded-xl"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="platform-description"
            className="flex items-center space-x-2"
          >
            <FileText className="w-4 h-4" />
            <span>Description</span>
          </Label>
          <Textarea
            id="platform-description"
            value={formData.platform.description || ""}
            onChange={(e) =>
              handleInputChange("platform", "description", e.target.value)
            }
            placeholder="Platform description"
            className="rounded-xl min-h-[100px]"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label
              htmlFor="platform-logo"
              className="flex items-center space-x-2"
            >
              <Image className="w-4 h-4" />
              <span>Logo URL</span>
            </Label>
            <Input
              id="platform-logo"
              value={formData.platform.logo || ""}
              onChange={(e) =>
                handleInputChange("platform", "logo", e.target.value)
              }
              placeholder="https://example.com/logo.png"
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="platform-favicon"
              className="flex items-center space-x-2"
            >
              <Globe className="w-4 h-4" />
              <span>Favicon URL</span>
            </Label>
            <Input
              id="platform-favicon"
              value={formData.platform.favicon || ""}
              onChange={(e) =>
                handleInputChange("platform", "favicon", e.target.value)
              }
              placeholder="https://example.com/favicon.ico"
              className="rounded-xl"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label className="flex items-center space-x-2">
              <MapPin className="w-4 h-4" />
              <span>Timezone</span>
            </Label>
            <Select
              value={formData.platform.timezone || ""}
              onValueChange={(value) =>
                handleInputChange("platform", "timezone", value)
              }
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Select timezone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="UTC">UTC</SelectItem>
                <SelectItem value="Asia/Kolkata">Asia/Kolkata</SelectItem>
                <SelectItem value="America/New_York">
                  America/New_York
                </SelectItem>
                <SelectItem value="Europe/London">Europe/London</SelectItem>
                <SelectItem value="Asia/Tokyo">Asia/Tokyo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center space-x-2">
              <Languages className="w-4 h-4" />
              <span>Language</span>
            </Label>
            <Select
              value={formData.platform.language || ""}
              onValueChange={(value) =>
                handleInputChange("platform", "language", value)
              }
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="es">Spanish</SelectItem>
                <SelectItem value="fr">French</SelectItem>
                <SelectItem value="de">German</SelectItem>
                <SelectItem value="hi">Hindi</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center space-x-2">
              <DollarSign className="w-4 h-4" />
              <span>Currency</span>
            </Label>
            <Select
              value={formData.platform.currency || ""}
              onValueChange={(value) =>
                handleInputChange("platform", "currency", value)
              }
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="EUR">EUR</SelectItem>
                <SelectItem value="GBP">GBP</SelectItem>
                <SelectItem value="INR">INR</SelectItem>
                <SelectItem value="JPY">JPY</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label
              htmlFor="contact-email"
              className="flex items-center space-x-2"
            >
              <Mail className="w-4 h-4" />
              <span>Contact Email</span>
            </Label>
            <Input
              id="contact-email"
              type="email"
              value={formData.platform.contactEmail || ""}
              onChange={(e) =>
                handleInputChange("platform", "contactEmail", e.target.value)
              }
              placeholder="contact@example.com"
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="support-email"
              className="flex items-center space-x-2"
            >
              <HelpCircle className="w-4 h-4" />
              <span>Support Email</span>
            </Label>
            <Input
              id="support-email"
              type="email"
              value={formData.platform.supportEmail || ""}
              onChange={(e) =>
                handleInputChange("platform", "supportEmail", e.target.value)
              }
              placeholder="support@example.com"
              className="rounded-xl"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            onClick={() => handleSave("platform")}
            disabled={updateSystemSettingsLoading}
            className="rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white"
          >
            {updateSystemSettingsLoading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Platform Settings
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderFeaturesSettings = () => (
    <Card className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-white/50 dark:border-slate-700/50 shadow-lg rounded-2xl">
      <CardHeader className="pb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-slate-800 dark:text-white">
              Feature Toggles
            </CardTitle>
            <CardDescription>
              Enable or disable platform features
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="font-medium text-slate-700 dark:text-slate-300 flex items-center">
              <Users className="w-4 h-4 mr-2" />
              User Management
            </h4>

            <div className="flex items-center justify-between p-4 bg-white/30 dark:bg-slate-700/30 rounded-xl">
              <div>
                <Label className="font-medium">Registration</Label>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Allow new user registration
                </p>
              </div>
              <Switch
                checked={formData.features.enableRegistration ?? true}
                onCheckedChange={(checked) =>
                  handleInputChange("features", "enableRegistration", checked)
                }
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-white/30 dark:bg-slate-700/30 rounded-xl">
              <div>
                <Label className="font-medium">Social Login</Label>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Enable social media login
                </p>
              </div>
              <Switch
                checked={formData.features.enableSocialLogin ?? true}
                onCheckedChange={(checked) =>
                  handleInputChange("features", "enableSocialLogin", checked)
                }
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-white/30 dark:bg-slate-700/30 rounded-xl">
              <div>
                <Label className="font-medium">Email Verification</Label>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Require email verification
                </p>
              </div>
              <Switch
                checked={formData.features.enableEmailVerification ?? true}
                onCheckedChange={(checked) =>
                  handleInputChange(
                    "features",
                    "enableEmailVerification",
                    checked
                  )
                }
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-white/30 dark:bg-slate-700/30 rounded-xl">
              <div>
                <Label className="font-medium">Instructor Verification</Label>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Enable instructor verification
                </p>
              </div>
              <Switch
                checked={formData.features.enableInstructorVerification ?? true}
                onCheckedChange={(checked) =>
                  handleInputChange(
                    "features",
                    "enableInstructorVerification",
                    checked
                  )
                }
              />
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium text-slate-700 dark:text-slate-300 flex items-center">
              <BookOpen className="w-4 h-4 mr-2" />
              Course Features
            </h4>

            <div className="flex items-center justify-between p-4 bg-white/30 dark:bg-slate-700/30 rounded-xl">
              <div>
                <Label className="font-medium">Course Reviews</Label>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Allow course reviews
                </p>
              </div>
              <Switch
                checked={formData.features.enableCourseReview ?? true}
                onCheckedChange={(checked) =>
                  handleInputChange("features", "enableCourseReview", checked)
                }
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-white/30 dark:bg-slate-700/30 rounded-xl">
              <div>
                <Label className="font-medium">Live Streaming</Label>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Enable live streaming
                </p>
              </div>
              <Switch
                checked={formData.features.enableLiveStreaming ?? false}
                onCheckedChange={(checked) =>
                  handleInputChange("features", "enableLiveStreaming", checked)
                }
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-white/30 dark:bg-slate-700/30 rounded-xl">
              <div>
                <Label className="font-medium">Certificates</Label>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Enable course certificates
                </p>
              </div>
              <Switch
                checked={formData.features.enableCertificates ?? true}
                onCheckedChange={(checked) =>
                  handleInputChange("features", "enableCertificates", checked)
                }
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-white/30 dark:bg-slate-700/30 rounded-xl">
              <div>
                <Label className="font-medium">Coupons</Label>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Enable coupon system
                </p>
              </div>
              <Switch
                checked={formData.features.enableCoupons ?? true}
                onCheckedChange={(checked) =>
                  handleInputChange("features", "enableCoupons", checked)
                }
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="font-medium text-slate-700 dark:text-slate-300 flex items-center">
              <Smartphone className="w-4 h-4 mr-2" />
              Mobile & Offline
            </h4>

            <div className="flex items-center justify-between p-4 bg-white/30 dark:bg-slate-700/30 rounded-xl">
              <div>
                <Label className="font-medium">Mobile App</Label>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Enable mobile app features
                </p>
              </div>
              <Switch
                checked={formData.features.enableMobileApp ?? false}
                onCheckedChange={(checked) =>
                  handleInputChange("features", "enableMobileApp", checked)
                }
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-white/30 dark:bg-slate-700/30 rounded-xl">
              <div>
                <Label className="font-medium">Offline Download</Label>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Allow offline content downloads
                </p>
              </div>
              <Switch
                checked={formData.features.enableOfflineDownload ?? false}
                onCheckedChange={(checked) =>
                  handleInputChange(
                    "features",
                    "enableOfflineDownload",
                    checked
                  )
                }
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            onClick={() => handleSave("features")}
            disabled={updateSystemSettingsLoading}
            className="rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
          >
            {updateSystemSettingsLoading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2 text-white" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Feature Settings
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderLimitsSettings = () => (
    <Card className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-white/50 dark:border-slate-700/50 shadow-lg rounded-2xl">
      <CardHeader className="pb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg">
            <Gauge className="w-5 h-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-slate-800 dark:text-white">
              System Limits
            </CardTitle>
            <CardDescription>
              Configure platform limits and constraints
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label
              htmlFor="max-courses"
              className="flex items-center space-x-2"
            >
              <BookOpen className="w-4 h-4" />
              <span>Max Courses per Instructor</span>
            </Label>
            <Input
              id="max-courses"
              type="number"
              value={formData.limits.maxCoursesPerInstructor || ""}
              onChange={(e) =>
                handleInputChange(
                  "limits",
                  "maxCoursesPerInstructor",
                  parseInt(e.target.value) || 0
                )
              }
              placeholder="100"
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="max-students"
              className="flex items-center space-x-2"
            >
              <Users className="w-4 h-4" />
              <span>Max Students per Course</span>
            </Label>
            <Input
              id="max-students"
              type="number"
              value={formData.limits.maxStudentsPerCourse || ""}
              onChange={(e) =>
                handleInputChange(
                  "limits",
                  "maxStudentsPerCourse",
                  parseInt(e.target.value) || 0
                )
              }
              placeholder="10000"
              className="rounded-xl"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label
              htmlFor="max-file-size"
              className="flex items-center space-x-2"
            >
              <Upload className="w-4 h-4" />
              <span>Max File Upload Size (MB)</span>
            </Label>
            <Input
              id="max-file-size"
              type="number"
              value={formData.limits.maxFileUploadSize || ""}
              onChange={(e) =>
                handleInputChange(
                  "limits",
                  "maxFileUploadSize",
                  parseInt(e.target.value) || 0
                )
              }
              placeholder="100"
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="max-video-length"
              className="flex items-center space-x-2"
            >
              <Timer className="w-4 h-4" />
              <span>Max Video Length (minutes)</span>
            </Label>
            <Input
              id="max-video-length"
              type="number"
              value={formData.limits.maxVideoLength || ""}
              onChange={(e) =>
                handleInputChange(
                  "limits",
                  "maxVideoLength",
                  parseInt(e.target.value) || 0
                )
              }
              placeholder="240"
              className="rounded-xl"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label
              htmlFor="max-course-price"
              className="flex items-center space-x-2"
            >
              <DollarSign className="w-4 h-4" />
              <span>Max Course Price</span>
            </Label>
            <Input
              id="max-course-price"
              type="number"
              value={formData.limits.maxCoursePrice || ""}
              onChange={(e) =>
                handleInputChange(
                  "limits",
                  "maxCoursePrice",
                  parseInt(e.target.value) || 0
                )
              }
              placeholder="100000"
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="min-course-price"
              className="flex items-center space-x-2"
            >
              <DollarSign className="w-4 h-4" />
              <span>Min Course Price</span>
            </Label>
            <Input
              id="min-course-price"
              type="number"
              value={formData.limits.minCoursePrice || ""}
              onChange={(e) =>
                handleInputChange(
                  "limits",
                  "minCoursePrice",
                  parseInt(e.target.value) || 0
                )
              }
              placeholder="0"
              className="rounded-xl"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label
              htmlFor="session-timeout"
              className="flex items-center space-x-2"
            >
              <Clock className="w-4 h-4" />
              <span>Session Timeout (seconds)</span>
            </Label>
            <Input
              id="session-timeout"
              type="number"
              value={formData.limits.sessionTimeout || ""}
              onChange={(e) =>
                handleInputChange(
                  "limits",
                  "sessionTimeout",
                  parseInt(e.target.value) || 0
                )
              }
              placeholder="2592000"
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rate-limit" className="flex items-center space-x-2">
              <Network className="w-4 h-4" />
              <span>Rate Limit (requests/hour)</span>
            </Label>
            <Input
              id="rate-limit"
              type="number"
              value={formData.limits.rateLimitRequests || ""}
              onChange={(e) =>
                handleInputChange(
                  "limits",
                  "rateLimitRequests",
                  parseInt(e.target.value) || 0
                )
              }
              placeholder="1000"
              className="rounded-xl"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            onClick={() => handleSave("limits")}
            disabled={updateSystemSettingsLoading}
            className="rounded-xl bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
          >
            {updateSystemSettingsLoading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2 text-white" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Limit Settings
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderPaymentsSettings = () => (
    <Card className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-white/50 dark:border-slate-700/50 shadow-lg rounded-2xl">
      <CardHeader className="pb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
            <CreditCard className="w-5 h-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-slate-800 dark:text-white">
              Payment Settings
            </CardTitle>
            <CardDescription>
              Configure payment gateways and policies
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h4 className="font-medium text-slate-700 dark:text-slate-300 flex items-center">
            <CreditCard className="w-4 h-4 mr-2" />
            Payment Gateways
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center justify-between p-4 bg-white/30 dark:bg-slate-700/30 rounded-xl">
              <div>
                <Label className="font-medium">Razorpay</Label>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Enable Razorpay payments
                </p>
              </div>
              <Switch
                checked={formData.payments.enableRazorpay ?? false}
                onCheckedChange={(checked) =>
                  handleInputChange("payments", "enableRazorpay", checked)
                }
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-white/30 dark:bg-slate-700/30 rounded-xl">
              <div>
                <Label className="font-medium">Stripe</Label>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Enable Stripe payments
                </p>
              </div>
              <Switch
                checked={formData.payments.enableStripe ?? false}
                onCheckedChange={(checked) =>
                  handleInputChange("payments", "enableStripe", checked)
                }
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-white/30 dark:bg-slate-700/30 rounded-xl">
              <div>
                <Label className="font-medium">PayPal</Label>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Enable PayPal payments
                </p>
              </div>
              <Switch
                checked={formData.payments.enablePaypal ?? false}
                onCheckedChange={(checked) =>
                  handleInputChange("payments", "enablePaypal", checked)
                }
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label
              htmlFor="default-commission"
              className="flex items-center space-x-2"
            >
              <BarChart className="w-4 h-4" />
              <span>Default Commission (0-1)</span>
            </Label>
            <Input
              id="default-commission"
              type="number"
              step="0.01"
              min="0"
              max="1"
              value={formData.payments.defaultCommission || ""}
              onChange={(e) =>
                handleInputChange(
                  "payments",
                  "defaultCommission",
                  parseFloat(e.target.value) || 0
                )
              }
              placeholder="0.3"
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="min-payout" className="flex items-center space-x-2">
              <DollarSign className="w-4 h-4" />
              <span>Min Payout Amount</span>
            </Label>
            <Input
              id="min-payout"
              type="number"
              value={formData.payments.minPayoutAmount || ""}
              onChange={(e) =>
                handleInputChange(
                  "payments",
                  "minPayoutAmount",
                  parseInt(e.target.value) || 0
                )
              }
              placeholder="1000"
              className="rounded-xl"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="flex items-center space-x-2">
            <Calendar className="w-4 h-4" />
            <span>Payout Schedule</span>
          </Label>
          <Select
            value={formData.payments.payoutSchedule || ""}
            onValueChange={(value) =>
              handleInputChange("payments", "payoutSchedule", value)
            }
          >
            <SelectTrigger className="rounded-xl">
              <SelectValue placeholder="Select payout schedule" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-center justify-between p-4 bg-white/30 dark:bg-slate-700/30 rounded-xl">
            <div>
              <Label className="font-medium">Instant Payout</Label>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Enable instant payouts
              </p>
            </div>
            <Switch
              checked={formData.payments.enableInstantPayout ?? false}
              onCheckedChange={(checked) =>
                handleInputChange("payments", "enableInstantPayout", checked)
              }
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-white/30 dark:bg-slate-700/30 rounded-xl">
            <div>
              <Label className="font-medium">Refunds</Label>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Enable refund system
              </p>
            </div>
            <Switch
              checked={formData.payments.enableRefunds ?? true}
              onCheckedChange={(checked) =>
                handleInputChange("payments", "enableRefunds", checked)
              }
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="refund-window"
            className="flex items-center space-x-2"
          >
            <Clock className="w-4 h-4" />
            <span>Refund Window (days)</span>
          </Label>
          <Input
            id="refund-window"
            type="number"
            value={formData.payments.refundWindow || ""}
            onChange={(e) =>
              handleInputChange(
                "payments",
                "refundWindow",
                parseInt(e.target.value) || 0
              )
            }
            placeholder="30"
            className="rounded-xl"
          />
        </div>

        <div className="flex justify-end">
          <Button
            onClick={() => handleSave("payments")}
            disabled={updateSystemSettingsLoading}
            className="rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
          >
            {updateSystemSettingsLoading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Payment Settings
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderSecuritySettings = () => (
    <Card className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-white/50 dark:border-slate-700/50 shadow-lg rounded-2xl">
      <CardHeader className="pb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-br from-red-500 to-rose-500 rounded-lg">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-slate-800 dark:text-white">
              Security Settings
            </CardTitle>
            <CardDescription>
              Configure security policies and authentication
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="font-medium text-slate-700 dark:text-slate-300 flex items-center">
              <Lock className="w-4 h-4 mr-2" />
              Authentication
            </h4>

            <div className="flex items-center justify-between p-4 bg-white/30 dark:bg-slate-700/30 rounded-xl">
              <div>
                <Label className="font-medium">Two-Factor Authentication</Label>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Enable 2FA for users
                </p>
              </div>
              <Switch
                checked={formData.security.enableTwoFactor ?? false}
                onCheckedChange={(checked) =>
                  handleInputChange("security", "enableTwoFactor", checked)
                }
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="password-length"
                className="flex items-center space-x-2"
              >
                <Key className="w-4 h-4" />
                <span>Min Password Length</span>
              </Label>
              <Input
                id="password-length"
                type="number"
                value={formData.security.passwordMinLength || ""}
                onChange={(e) =>
                  handleInputChange(
                    "security",
                    "passwordMinLength",
                    parseInt(e.target.value) || 0
                  )
                }
                placeholder="8"
                className="rounded-xl"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-white/30 dark:bg-slate-700/30 rounded-xl">
              <div>
                <Label className="font-medium">
                  Require Special Characters
                </Label>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Require special chars in password
                </p>
              </div>
              <Switch
                checked={formData.security.passwordRequireSpecial ?? true}
                onCheckedChange={(checked) =>
                  handleInputChange(
                    "security",
                    "passwordRequireSpecial",
                    checked
                  )
                }
              />
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium text-slate-700 dark:text-slate-300 flex items-center">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Access Control
            </h4>

            <div className="space-y-2">
              <Label
                htmlFor="max-login-attempts"
                className="flex items-center space-x-2"
              >
                <UserCheck className="w-4 h-4" />
                <span>Max Login Attempts</span>
              </Label>
              <Input
                id="max-login-attempts"
                type="number"
                value={formData.security.maxLoginAttempts || ""}
                onChange={(e) =>
                  handleInputChange(
                    "security",
                    "maxLoginAttempts",
                    parseInt(e.target.value) || 0
                  )
                }
                placeholder="5"
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="lockout-duration"
                className="flex items-center space-x-2"
              >
                <Timer className="w-4 h-4" />
                <span>Lockout Duration (seconds)</span>
              </Label>
              <Input
                id="lockout-duration"
                type="number"
                value={formData.security.lockoutDuration || ""}
                onChange={(e) =>
                  handleInputChange(
                    "security",
                    "lockoutDuration",
                    parseInt(e.target.value) || 0
                  )
                }
                placeholder="900"
                className="rounded-xl"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-white/30 dark:bg-slate-700/30 rounded-xl">
              <div>
                <Label className="font-medium">IP Whitelist</Label>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Enable IP whitelisting
                </p>
              </div>
              <Switch
                checked={formData.security.enableIPWhitelist ?? false}
                onCheckedChange={(checked) =>
                  handleInputChange("security", "enableIPWhitelist", checked)
                }
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-center justify-between p-4 bg-white/30 dark:bg-slate-700/30 rounded-xl">
            <div>
              <Label className="font-medium">CAPTCHA</Label>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Enable CAPTCHA verification
              </p>
            </div>
            <Switch
              checked={formData.security.enableCaptcha ?? false}
              onCheckedChange={(checked) =>
                handleInputChange("security", "enableCaptcha", checked)
              }
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-white/30 dark:bg-slate-700/30 rounded-xl">
            <div>
              <Label className="font-medium">Audit Log</Label>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Enable audit logging
              </p>
            </div>
            <Switch
              checked={formData.security.enableAuditLog ?? true}
              onCheckedChange={(checked) =>
                handleInputChange("security", "enableAuditLog", checked)
              }
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            onClick={() => handleSave("security")}
            disabled={updateSystemSettingsLoading}
            className="rounded-xl bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white"
          >
            {updateSystemSettingsLoading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Security Settings
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderMaintenanceSettings = () => (
    <Card className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-white/50 dark:border-slate-700/50 shadow-lg rounded-2xl">
      <CardHeader className="pb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg">
            <Wrench className="w-5 h-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-slate-800 dark:text-white">
              Maintenance Settings
            </CardTitle>
            <CardDescription>
              System maintenance and backup configuration
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert
          className={cn(
            "rounded-xl border-0",
            formData.maintenance.maintenanceMode
              ? "bg-yellow-50/50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200"
              : "bg-green-50/50 dark:bg-green-900/20 text-green-800 dark:text-green-200"
          )}
        >
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {formData.maintenance.maintenanceMode
              ? "Maintenance mode is currently enabled. Users will see the maintenance message."
              : "System is running normally. Maintenance mode is disabled."}
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-white/30 dark:bg-slate-700/30 rounded-xl">
            <div>
              <Label className="font-medium flex items-center space-x-2">
                <Construction className="w-4 h-4" />
                <span>Maintenance Mode</span>
              </Label>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Put the system in maintenance mode
              </p>
            </div>
            <Switch
              checked={formData.maintenance.maintenanceMode ?? false}
              onCheckedChange={(checked) =>
                handleInputChange("maintenance", "maintenanceMode", checked)
              }
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="maintenance-message"
              className="flex items-center space-x-2"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Maintenance Message</span>
            </Label>
            <Textarea
              id="maintenance-message"
              value={formData.maintenance.maintenanceMessage || ""}
              onChange={(e) =>
                handleInputChange(
                  "maintenance",
                  "maintenanceMessage",
                  e.target.value
                )
              }
              placeholder="System is currently under maintenance..."
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="allowed-ips"
              className="flex items-center space-x-2"
            >
              <Network className="w-4 h-4" />
              <span>Allowed IPs (comma-separated)</span>
            </Label>
            <Input
              id="allowed-ips"
              value={formData.maintenance.allowedIPs?.join(", ") || ""}
              onChange={(e) =>
                handleInputChange(
                  "maintenance",
                  "allowedIPs",
                  e.target.value.split(",").map((ip) => ip.trim())
                )
              }
              placeholder="192.168.1.1, 10.0.0.1"
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="scheduled-maintenance"
              className="flex items-center space-x-2"
            >
              <Calendar className="w-4 h-4" />
              <span>Scheduled Maintenance</span>
            </Label>
            <Input
              id="scheduled-maintenance"
              type="datetime-local"
              value={formData.maintenance.scheduledMaintenance || ""}
              onChange={(e) =>
                handleInputChange(
                  "maintenance",
                  "scheduledMaintenance",
                  e.target.value
                )
              }
              className="rounded-xl"
            />
          </div>
        </div>

        <Separator className="bg-white/30 dark:bg-slate-700/50" />

        <div className="space-y-4">
          <h4 className="font-medium text-slate-700 dark:text-slate-300 flex items-center">
            <HardDrive className="w-4 h-4 mr-2" />
            Backup & Logs
          </h4>

          <div className="space-y-2">
            <Label className="flex items-center space-x-2">
              <Archive className="w-4 h-4" />
              <span>Backup Frequency</span>
            </Label>
            <Select
              value={formData.maintenance.backupFrequency || ""}
              onValueChange={(value) =>
                handleInputChange("maintenance", "backupFrequency", value)
              }
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Select backup frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hourly">Hourly</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="log-retention"
              className="flex items-center space-x-2"
            >
              <FileText className="w-4 h-4" />
              <span>Log Retention (days)</span>
            </Label>
            <Input
              id="log-retention"
              type="number"
              value={formData.maintenance.logRetention || ""}
              onChange={(e) =>
                handleInputChange(
                  "maintenance",
                  "logRetention",
                  parseInt(e.target.value) || 0
                )
              }
              placeholder="90"
              className="rounded-xl"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            onClick={() => handleSave("maintenance")}
            disabled={updateSystemSettingsLoading}
            className="rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white"
          >
            {updateSystemSettingsLoading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Maintenance Settings
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  if (systemSettingsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-indigo-50/30 to-cyan-50/30 dark:from-slate-900/30 dark:via-slate-800/30 dark:to-gray-900/30">
        <div className="container mx-auto px-4 py-8">
          <div className="space-y-6">
            <Skeleton className="h-12 w-64 rounded-xl" />
            <div className="grid gap-6">
              <Skeleton className="h-96 rounded-2xl" />
              <Skeleton className="h-96 rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-indigo-50/30 to-cyan-50/30 dark:from-slate-900/30 dark:via-slate-800/30 dark:to-gray-900/30">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div className="flex items-center space-x-4 mb-4 lg:mb-0">
            <div className="p-3 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-2xl shadow-lg">
              <Settings className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-800 dark:text-white">
                General Settings
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Configure your platform's core settings and preferences
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={systemSettingsLoading}
              className="rounded-xl border-white/50 dark:border-slate-700/50 hover:bg-white/50 dark:hover:bg-slate-700/50"
            >
              <RefreshCw
                className={cn(
                  "w-4 h-4 mr-2",
                  systemSettingsLoading && "animate-spin"
                )}
              />
              Refresh
            </Button>

            {hasChanges && (
              <Badge
                variant="secondary"
                className="rounded-xl bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200"
              >
                Unsaved Changes
              </Badge>
            )}
          </div>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <div className="bg-white/30 dark:bg-slate-800/30 backdrop-blur-sm border border-white/50 dark:border-slate-700/50 rounded-2xl p-2">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-6 bg-transparent gap-2">
              <TabsTrigger
                value="platform"
                className="rounded-xl data-[state=active]:bg-white/70 dark:data-[state=active]:bg-slate-700/70"
              >
                <Globe className="w-4 h-4 mr-2" />
                Platform
              </TabsTrigger>
              <TabsTrigger
                value="features"
                className="rounded-xl data-[state=active]:bg-white/70 dark:data-[state=active]:bg-slate-700/70"
              >
                <Zap className="w-4 h-4 mr-2" />
                Features
              </TabsTrigger>
              <TabsTrigger
                value="limits"
                className="rounded-xl data-[state=active]:bg-white/70 dark:data-[state=active]:bg-slate-700/70"
              >
                <Gauge className="w-4 h-4 mr-2" />
                Limits
              </TabsTrigger>
              <TabsTrigger
                value="payments"
                className="rounded-xl data-[state=active]:bg-white/70 dark:data-[state=active]:bg-slate-700/70"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Payments
              </TabsTrigger>
              <TabsTrigger
                value="security"
                className="rounded-xl data-[state=active]:bg-white/70 dark:data-[state=active]:bg-slate-700/70"
              >
                <Shield className="w-4 h-4 mr-2" />
                Security
              </TabsTrigger>
              <TabsTrigger
                value="maintenance"
                className="rounded-xl data-[state=active]:bg-white/70 dark:data-[state=active]:bg-slate-700/70"
              >
                <Wrench className="w-4 h-4 mr-2" />
                Maintenance
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="platform" className="mt-6">
            {renderPlatformSettings()}
          </TabsContent>

          <TabsContent value="features" className="mt-6">
            {renderFeaturesSettings()}
          </TabsContent>

          <TabsContent value="limits" className="mt-6">
            {renderLimitsSettings()}
          </TabsContent>

          <TabsContent value="payments" className="mt-6">
            {renderPaymentsSettings()}
          </TabsContent>

          <TabsContent value="security" className="mt-6">
            {renderSecuritySettings()}
          </TabsContent>

          <TabsContent value="maintenance" className="mt-6">
            {renderMaintenanceSettings()}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default GeneralSettingsPage;
