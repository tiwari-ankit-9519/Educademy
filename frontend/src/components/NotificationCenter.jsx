import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  Bell,
  X,
  CheckCheck,
  AlertCircle,
  Star,
  DollarSign,
  BookOpen,
  MessageCircle,
  Award,
  Shield,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  getNotifications,
  getUnreadCount,
  markNotificationsAsRead,
  clearNotifications,
} from "@/features/notificationSlice";

const NotificationCenter = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dispatch = useDispatch();

  const { notifications, unreadCount, notificationsLoading, markReadLoading } =
    useSelector((state) => state.notification);

  useEffect(() => {
    if (isOpen && notifications.length === 0) {
      dispatch(getNotifications({ page: 1, limit: 20 }));
    }
    dispatch(getUnreadCount());
  }, [dispatch, isOpen, notifications.length]);

  const getNotificationIcon = (type) => {
    const iconMap = {
      payment_confirmed: DollarSign,
      payment_failed: AlertCircle,
      work_graded: Star,
      certificate_ready: Award,
      your_question_answered: MessageCircle,
      new_student_enrolled: Users,
      course_status_update: BookOpen,
      account_action: Shield,
      new_message: MessageCircle,
      course_updated: BookOpen,
      default: Bell,
    };

    const IconComponent = iconMap[type] || iconMap.default;
    return <IconComponent className="w-4 h-4" />;
  };

  const getNotificationColor = (type) => {
    const colorMap = {
      payment_confirmed: "text-green-600",
      payment_failed: "text-red-600",
      work_graded: "text-yellow-600",
      certificate_ready: "text-purple-600",
      your_question_answered: "text-blue-600",
      new_student_enrolled: "text-indigo-600",
      course_status_update: "text-orange-600",
      account_action: "text-red-600",
      new_message: "text-blue-600",
      course_updated: "text-green-600",
      default: "text-slate-600",
    };

    return colorMap[type] || colorMap.default;
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.floor((now - time) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const handleMarkAllRead = () => {
    const unreadIds = notifications
      .filter((notif) => !notif.isRead)
      .map((notif) => notif.id);

    if (unreadIds.length > 0) {
      dispatch(markNotificationsAsRead({ notificationIds: unreadIds }));
    }
  };

  const handleMarkRead = (notificationId) => {
    dispatch(markNotificationsAsRead({ notificationIds: [notificationId] }));
  };

  const handleClearAll = () => {
    dispatch(clearNotifications());
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <Card className="absolute right-0 top-full mt-2 w-80 max-w-sm shadow-lg border z-50 bg-white dark:bg-slate-800">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">
                Notifications
              </CardTitle>
              <div className="flex items-center space-x-2">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleMarkAllRead}
                    disabled={markReadLoading}
                    className="text-xs"
                  >
                    <CheckCheck className="w-3 h-3 mr-1" />
                    Mark all read
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {notificationsLoading ? (
              <div className="p-6 text-center text-slate-500 dark:text-slate-400">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-sm">Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-6 text-center text-slate-500 dark:text-slate-400">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No notifications</p>
              </div>
            ) : (
              <ScrollArea className="h-96">
                <div className="space-y-1 p-2">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id || notification.timestamp}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-700 ${
                        notification.isRead
                          ? "bg-transparent border-transparent"
                          : "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                      }`}
                      onClick={() =>
                        !notification.isRead && handleMarkRead(notification.id)
                      }
                    >
                      <div className="flex items-start space-x-3">
                        <div
                          className={`mt-1 ${getNotificationColor(
                            notification.type
                          )}`}
                        >
                          {getNotificationIcon(notification.type)}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                              {notification.title ||
                                getNotificationTitle(notification.type)}
                            </p>
                            {!notification.isRead && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 ml-2" />
                            )}
                          </div>

                          <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                            {notification.message ||
                              getNotificationMessage(notification)}
                          </p>

                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              {formatTime(
                                notification.timestamp || notification.createdAt
                              )}
                            </span>

                            {notification.actionUrl && (
                              <Button
                                variant="link"
                                size="sm"
                                className="h-auto p-0 text-xs"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(notification.actionUrl, "_blank");
                                }}
                              >
                                View
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>

          {notifications.length > 0 && (
            <div className="p-3 border-t border-slate-200 dark:border-slate-700">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                className="w-full text-xs"
              >
                Clear all notifications
              </Button>
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

const getNotificationTitle = (type) => {
  const titleMap = {
    payment_confirmed: "Payment Confirmed",
    payment_failed: "Payment Failed",
    work_graded: "Work Graded",
    certificate_ready: "Certificate Ready",
    your_question_answered: "Question Answered",
    new_student_enrolled: "New Student",
    course_status_update: "Course Update",
    account_action: "Account Alert",
    new_message: "New Message",
    course_updated: "Course Updated",
    refund_processed: "Refund Processed",
    payout_processed: "Payout Processed",
    emergency_notification: "Emergency Alert",
    maintenance_notification: "Maintenance Notice",
    system_update: "System Update",
  };

  return titleMap[type] || "Notification";
};

const getNotificationMessage = (notification) => {
  switch (notification.type) {
    case "payment_confirmed":
      return `Payment of ${notification.amount} ${notification.currency} confirmed`;
    case "payment_failed":
      return `Payment failed: ${notification.reason}`;
    case "work_graded":
      return `Grade: ${notification.grade}/${notification.maxGrade} (${notification.percentage}%)`;
    case "certificate_ready":
      return `Certificate for ${notification.courseName} is ready`;
    case "your_question_answered":
      return `${notification.instructorName} answered your question`;
    case "new_student_enrolled":
      return `${notification.studentName} enrolled in your course`;
    case "course_status_update":
      return `Course ${notification.status}: ${notification.courseName}`;
    case "account_action":
      return `Account ${notification.action}: ${notification.reason}`;
    case "new_message":
      return `New message from ${notification.senderName}`;
    case "course_updated":
      return notification.description;
    default:
      return notification.message || "You have a new notification";
  }
};

export default NotificationCenter;
