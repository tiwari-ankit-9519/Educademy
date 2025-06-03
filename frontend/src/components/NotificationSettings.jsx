/* eslint-disable no-unused-vars */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Mail,
  MessageSquare,
  BookOpen,
  Users,
  Award,
  TrendingUp,
  Shield,
  Save,
  Loader2,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const NotificationSettings = ({ user, onUpdate, onSuccess, isLoading }) => {
  const [settings, setSettings] = useState(() => {
    const notificationSettings = user.notificationSettings || {};

    return {
      // Email Notifications
      emailNewCourse: notificationSettings.emailNewCourse ?? true,
      emailCourseUpdates: notificationSettings.emailCourseUpdates ?? true,
      emailAssignments: notificationSettings.emailAssignments ?? true,
      emailMessages: notificationSettings.emailMessages ?? true,
      emailAchievements: notificationSettings.emailAchievements ?? true,
      emailMarketing: notificationSettings.emailMarketing ?? false,
      emailWeeklyDigest: notificationSettings.emailWeeklyDigest ?? true,

      // Push Notifications (if supported)
      pushNewCourse: notificationSettings.pushNewCourse ?? true,
      pushCourseUpdates: notificationSettings.pushCourseUpdates ?? true,
      pushAssignments: notificationSettings.pushAssignments ?? true,
      pushMessages: notificationSettings.pushMessages ?? true,
      pushAchievements: notificationSettings.pushAchievements ?? true,

      // In-App Notifications
      inAppMessages: notificationSettings.inAppMessages ?? true,
      inAppCourseUpdates: notificationSettings.inAppCourseUpdates ?? true,
      inAppAchievements: notificationSettings.inAppAchievements ?? true,
      inAppSystemUpdates: notificationSettings.inAppSystemUpdates ?? true,

      // Sound Settings
      soundEnabled: notificationSettings.soundEnabled ?? true,
      soundVolume: notificationSettings.soundVolume ?? "medium",

      // Frequency Settings
      digestFrequency: notificationSettings.digestFrequency ?? "weekly",
      quietHoursEnabled: notificationSettings.quietHoursEnabled ?? false,
      quietHoursStart: notificationSettings.quietHoursStart ?? "22:00",
      quietHoursEnd: notificationSettings.quietHoursEnd ?? "07:00",
    };
  });

  const [hasChanges, setHasChanges] = useState(false);

  const handleSettingChange = (key, value) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      await onUpdate({ notificationSettings: settings });
      setHasChanges(false);
      onSuccess("Notification settings updated successfully!");
    } catch (error) {
      console.error("Failed to update notification settings:", error);
    }
  };

  const handleReset = () => {
    const notificationSettings = user.notificationSettings || {};

    setSettings({
      emailNewCourse: notificationSettings.emailNewCourse ?? true,
      emailCourseUpdates: notificationSettings.emailCourseUpdates ?? true,
      emailAssignments: notificationSettings.emailAssignments ?? true,
      emailMessages: notificationSettings.emailMessages ?? true,
      emailAchievements: notificationSettings.emailAchievements ?? true,
      emailMarketing: notificationSettings.emailMarketing ?? false,
      emailWeeklyDigest: notificationSettings.emailWeeklyDigest ?? true,

      pushNewCourse: notificationSettings.pushNewCourse ?? true,
      pushCourseUpdates: notificationSettings.pushCourseUpdates ?? true,
      pushAssignments: notificationSettings.pushAssignments ?? true,
      pushMessages: notificationSettings.pushMessages ?? true,
      pushAchievements: notificationSettings.pushAchievements ?? true,

      inAppMessages: notificationSettings.inAppMessages ?? true,
      inAppCourseUpdates: notificationSettings.inAppCourseUpdates ?? true,
      inAppAchievements: notificationSettings.inAppAchievements ?? true,
      inAppSystemUpdates: notificationSettings.inAppSystemUpdates ?? true,

      soundEnabled: notificationSettings.soundEnabled ?? true,
      soundVolume: notificationSettings.soundVolume ?? "medium",

      digestFrequency: notificationSettings.digestFrequency ?? "weekly",
      quietHoursEnabled: notificationSettings.quietHoursEnabled ?? false,
      quietHoursStart: notificationSettings.quietHoursStart ?? "22:00",
      quietHoursEnd: notificationSettings.quietHoursEnd ?? "07:00",
    });
    setHasChanges(false);
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3 },
    },
  };

  const SettingRow = ({
    icon: Icon,
    title,
    description,
    setting,
    onChange,
    disabled = false,
  }) => (
    <div
      className={`flex items-center justify-between p-4 rounded-lg transition-colors ${
        disabled
          ? "opacity-50"
          : "hover:bg-slate-100/50 dark:hover:bg-slate-600/50"
      }`}
    >
      <div className="flex items-start space-x-3 flex-1">
        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center">
          <Icon className="w-5 h-36 text-black dark:text-white" />
        </div>
        <div className="flex-1">
          <p className="font-medium text-slate-900 dark:text-white">{title}</p>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {description}
          </p>
        </div>
      </div>
      <Switch
        checked={setting}
        onCheckedChange={onChange}
        disabled={disabled}
        className="data-[state=checked]:bg-blue-600"
      />
    </div>
  );

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={itemVariants}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Bell className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Notification Preferences
          </h3>
        </div>

        <AnimatePresence>
          {hasChanges && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex space-x-2"
            >
              <Button variant="outline" size="sm" onClick={handleReset}>
                Reset
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isLoading}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Separator />

      {/* Email Notifications */}
      <Card className="bg-slate-50/50 dark:bg-slate-700/50 border-slate-200/50 dark:border-slate-600/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center">
            <Mail className="w-4 h-4 mr-2" />
            Email Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <SettingRow
            icon={BookOpen}
            title="New Course Notifications"
            description="Get notified when new courses are available"
            setting={settings.emailNewCourse}
            onChange={(checked) =>
              handleSettingChange("emailNewCourse", checked)
            }
          />

          <SettingRow
            icon={TrendingUp}
            title="Course Updates"
            description="Receive updates about your enrolled courses"
            setting={settings.emailCourseUpdates}
            onChange={(checked) =>
              handleSettingChange("emailCourseUpdates", checked)
            }
          />

          <SettingRow
            icon={BookOpen}
            title="Assignment Reminders"
            description="Get reminded about upcoming assignments and deadlines"
            setting={settings.emailAssignments}
            onChange={(checked) =>
              handleSettingChange("emailAssignments", checked)
            }
          />

          <SettingRow
            icon={MessageSquare}
            title="Messages"
            description="Receive notifications for new messages and replies"
            setting={settings.emailMessages}
            onChange={(checked) =>
              handleSettingChange("emailMessages", checked)
            }
          />

          <SettingRow
            icon={Award}
            title="Achievements"
            description="Get notified when you earn badges or complete milestones"
            setting={settings.emailAchievements}
            onChange={(checked) =>
              handleSettingChange("emailAchievements", checked)
            }
          />

          <SettingRow
            icon={TrendingUp}
            title="Weekly Digest"
            description="Receive a weekly summary of your learning progress"
            setting={settings.emailWeeklyDigest}
            onChange={(checked) =>
              handleSettingChange("emailWeeklyDigest", checked)
            }
          />

          <SettingRow
            icon={Mail}
            title="Marketing Emails"
            description="Receive promotional content and course recommendations"
            setting={settings.emailMarketing}
            onChange={(checked) =>
              handleSettingChange("emailMarketing", checked)
            }
          />
        </CardContent>
      </Card>

      {/* Push Notifications */}
      <Card className="bg-slate-50/50 dark:bg-slate-700/50 border-slate-200/50 dark:border-slate-600/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center">
            <Bell className="w-4 h-4 mr-2" />
            Push Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <SettingRow
            icon={BookOpen}
            title="New Course Alerts"
            description="Push notifications for new course releases"
            setting={settings.pushNewCourse}
            onChange={(checked) =>
              handleSettingChange("pushNewCourse", checked)
            }
          />

          <SettingRow
            icon={TrendingUp}
            title="Course Progress"
            description="Updates about your course progress and milestones"
            setting={settings.pushCourseUpdates}
            onChange={(checked) =>
              handleSettingChange("pushCourseUpdates", checked)
            }
          />

          <SettingRow
            icon={BookOpen}
            title="Assignment Deadlines"
            description="Push reminders for upcoming assignments"
            setting={settings.pushAssignments}
            onChange={(checked) =>
              handleSettingChange("pushAssignments", checked)
            }
          />

          <SettingRow
            icon={MessageSquare}
            title="Direct Messages"
            description="Instant notifications for new messages"
            setting={settings.pushMessages}
            onChange={(checked) => handleSettingChange("pushMessages", checked)}
          />

          <SettingRow
            icon={Award}
            title="Achievement Unlocked"
            description="Celebrate your achievements with push notifications"
            setting={settings.pushAchievements}
            onChange={(checked) =>
              handleSettingChange("pushAchievements", checked)
            }
          />
        </CardContent>
      </Card>

      {/* In-App Notifications */}
      <Card className="bg-slate-50/50 dark:bg-slate-700/50 border-slate-200/50 dark:border-slate-600/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center">
            <Bell className="w-4 h-4 mr-2" />
            In-App Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <SettingRow
            icon={MessageSquare}
            title="Messages & Comments"
            description="Show notifications for messages and course comments"
            setting={settings.inAppMessages}
            onChange={(checked) =>
              handleSettingChange("inAppMessages", checked)
            }
          />

          <SettingRow
            icon={BookOpen}
            title="Course Activities"
            description="Notifications for course updates and new content"
            setting={settings.inAppCourseUpdates}
            onChange={(checked) =>
              handleSettingChange("inAppCourseUpdates", checked)
            }
          />

          <SettingRow
            icon={Award}
            title="Achievements & Badges"
            description="In-app celebration of your learning achievements"
            setting={settings.inAppAchievements}
            onChange={(checked) =>
              handleSettingChange("inAppAchievements", checked)
            }
          />

          <SettingRow
            icon={Shield}
            title="System Updates"
            description="Important announcements and system maintenance notices"
            setting={settings.inAppSystemUpdates}
            onChange={(checked) =>
              handleSettingChange("inAppSystemUpdates", checked)
            }
          />
        </CardContent>
      </Card>

      {/* Sound & Advanced Settings */}
      <Card className="bg-slate-50/50 dark:bg-slate-700/50 border-slate-200/50 dark:border-slate-600/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center">
            <Volume2 className="w-4 h-4 mr-2 text-white" />
            Sound & Advanced Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Sound Settings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center">
                  {settings.soundEnabled ? (
                    <Volume2 className="w-4 h-4 text-white" />
                  ) : (
                    <VolumeX className="w-4 h-4 text-black" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">
                    Notification Sounds
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Play sounds for notifications
                  </p>
                </div>
              </div>
              <Switch
                checked={settings.soundEnabled}
                onCheckedChange={(checked) =>
                  handleSettingChange("soundEnabled", checked)
                }
                className="data-[state=checked]:bg-blue-600"
              />
            </div>

            {settings.soundEnabled && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="ml-11"
              >
                <Label className="text-sm text-slate-700 dark:text-slate-300">
                  Sound Volume
                </Label>
                <Select
                  value={settings.soundVolume}
                  onValueChange={(value) =>
                    handleSettingChange("soundVolume", value)
                  }
                >
                  <SelectTrigger className="bg-white dark:bg-slate-800 mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </motion.div>
            )}
          </div>

          <Separator />

          {/* Digest Frequency */}
          <div className="space-y-4">
            <div>
              <p className="font-medium text-slate-900 dark:text-white">
                Email Digest Frequency
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                How often would you like to receive summary emails?
              </p>
            </div>
            <Select
              value={settings.digestFrequency}
              onValueChange={(value) =>
                handleSettingChange("digestFrequency", value)
              }
            >
              <SelectTrigger className="bg-white dark:bg-slate-800">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="never">Never</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Quiet Hours */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900 dark:text-white">
                  Quiet Hours
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Disable notifications during specific hours
                </p>
              </div>
              <Switch
                checked={settings.quietHoursEnabled}
                onCheckedChange={(checked) =>
                  handleSettingChange("quietHoursEnabled", checked)
                }
                className="data-[state=checked]:bg-blue-600"
              />
            </div>

            <AnimatePresence>
              {settings.quietHoursEnabled && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="grid grid-cols-2 gap-4"
                >
                  <div>
                    <Label className="text-sm text-slate-700 dark:text-slate-300">
                      Start Time
                    </Label>
                    <Select
                      value={settings.quietHoursStart}
                      onValueChange={(value) =>
                        handleSettingChange("quietHoursStart", value)
                      }
                    >
                      <SelectTrigger className="bg-white dark:bg-slate-800 mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 24 }, (_, i) => {
                          const hour = i.toString().padStart(2, "0");
                          return (
                            <SelectItem key={`${hour}:00`} value={`${hour}:00`}>
                              {hour}:00
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm text-slate-700 dark:text-slate-300">
                      End Time
                    </Label>
                    <Select
                      value={settings.quietHoursEnd}
                      onValueChange={(value) =>
                        handleSettingChange("quietHoursEnd", value)
                      }
                    >
                      <SelectTrigger className="bg-white dark:bg-slate-800 mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 24 }, (_, i) => {
                          const hour = i.toString().padStart(2, "0");
                          return (
                            <SelectItem key={`${hour}:00`} value={`${hour}:00`}>
                              {hour}:00
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200/50 dark:border-blue-800/50">
        <CardHeader>
          <CardTitle className="text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // Enable all essential notifications
                const essentialSettings = {
                  emailCourseUpdates: true,
                  emailAssignments: true,
                  emailMessages: true,
                  pushCourseUpdates: true,
                  pushAssignments: true,
                  pushMessages: true,
                  inAppMessages: true,
                  inAppCourseUpdates: true,
                  soundEnabled: true,
                };

                setSettings((prev) => ({ ...prev, ...essentialSettings }));
                setHasChanges(true);
              }}
              className="justify-start"
            >
              <Bell className="w-4 h-4 mr-2" />
              Enable Essential
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // Disable all marketing and non-essential notifications
                const minimalSettings = {
                  emailMarketing: false,
                  emailWeeklyDigest: false,
                  emailNewCourse: false,
                  pushNewCourse: false,
                  pushAchievements: false,
                  inAppAchievements: false,
                  soundEnabled: false,
                };

                setSettings((prev) => ({ ...prev, ...minimalSettings }));
                setHasChanges(true);
              }}
              className="justify-start"
            >
              <VolumeX className="w-4 h-4 mr-2" />
              Minimal Mode
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // Enable all notifications
                const allSettings = Object.keys(settings).reduce((acc, key) => {
                  if (typeof settings[key] === "boolean") {
                    acc[key] = true;
                  } else {
                    acc[key] = settings[key]; // Keep non-boolean values as is
                  }
                  return acc;
                }, {});

                setSettings((prev) => ({ ...prev, ...allSettings }));
                setHasChanges(true);
              }}
              className="justify-start"
            >
              <Volume2 className="w-4 h-4 mr-2" />
              Enable All
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Save Button (Fixed at bottom) */}
      <AnimatePresence>
        {hasChanges && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="sticky bottom-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 shadow-lg"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                You have unsaved changes to your notification preferences.
              </p>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" onClick={handleReset}>
                  Discard
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={isLoading}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default NotificationSettings;
