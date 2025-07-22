import { useEffect, useRef, useState, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { io } from "socket.io-client";
import { toast } from "sonner";
import {
  addSocketNotification,
  updateSocketNotificationRead,
  setSocketUnreadCount,
} from "@/features/common/notificationSlice";

const useSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [connectedDevices, setConnectedDevices] = useState(0);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [typingUsers, setTypingUsers] = useState(new Map());
  const [liveSessionParticipants, setLiveSessionParticipants] = useState(
    new Map()
  );
  const [courseUpdates, setCourseUpdates] = useState([]);
  const [messages, setMessages] = useState([]);

  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const typingTimeoutRef = useRef(new Map());
  const hasShownConnectedToast = useRef(false);

  const { user, token, isAuthenticated } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  const connect = useCallback(() => {
    if (!isAuthenticated || !token || !user) return;

    if (socketRef.current?.connected) {
      return;
    }

    socketRef.current = io(
      import.meta.env.REACT_APP_BACKEND_URL || "http://localhost:5000",
      {
        auth: {
          token: token,
        },
        transports: ["websocket"],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 20000,
      }
    );

    const socket = socketRef.current;

    socket.on("connect", () => {
      setIsConnected(true);
      setConnectionError(null);
      console.log("Socket connected");
    });

    socket.on("disconnect", (reason) => {
      setIsConnected(false);
      hasShownConnectedToast.current = false;
      console.log("Socket disconnected:", reason);

      if (reason === "io server disconnect") {
        socket.connect();
      }
    });

    socket.on("connect_error", (error) => {
      setConnectionError(error.message);
      setIsConnected(false);
      console.error("Socket connection error:", error);
    });

    socket.on("connected", (data) => {
      setConnectedDevices(data.connectedDevices);
      if (!hasShownConnectedToast.current) {
        toast.success("Connected successfully");
        hasShownConnectedToast.current = true;
      }
    });

    socket.on("security_alert", (data) => {
      toast.error(`Security Alert: ${data.message}`, {
        duration: 10000,
        action: {
          label: "Review",
          onClick: () => window.open("/security", "_blank"),
        },
      });
    });

    socket.on("force_disconnect", (data) => {
      toast.error(data.message);
      socket.disconnect();
    });

    socket.on("notification", (data) => {
      dispatch(addSocketNotification(data));

      switch (data.type) {
        case "payment_confirmed":
          toast.success(
            `Payment of ${data.amount} ${data.currency} confirmed!`
          );
          break;
        case "payment_failed":
          toast.error(`Payment failed: ${data.reason}`);
          break;
        case "work_graded":
          toast.info(
            `Your ${data.type} has been graded: ${data.grade}/${data.maxGrade}`
          );
          break;
        case "certificate_ready":
          toast.success("Your certificate is ready for download!");
          break;
        case "your_question_answered":
          toast.info(`Your question was answered by ${data.instructorName}`);
          break;
        case "new_student_enrolled":
          toast.success(`New student enrolled: ${data.studentName}`);
          break;
        case "course_status_update":
          toast[data.status === "approved" ? "success" : "warning"](
            `Course ${data.status}: ${data.courseName}`
          );
          break;
        case "account_action":
          toast.error(`Account ${data.action}: ${data.reason}`);
          break;
        default:
          toast.info(data.message || "New notification");
      }
    });

    socket.on("pending_notifications", (data) => {
      data.notifications.forEach((notification) => {
        dispatch(addSocketNotification(notification));
      });
      dispatch(setSocketUnreadCount(data.count));
    });

    socket.on("new_message", (data) => {
      setMessages((prev) => [data, ...prev]);
      toast.info(`New message from ${data.senderName}`);
    });

    socket.on("user_typing", (data) => {
      if (data.isTyping) {
        setTypingUsers((prev) => new Map(prev.set(data.userId, data.userName)));

        if (typingTimeoutRef.current.has(data.userId)) {
          clearTimeout(typingTimeoutRef.current.get(data.userId));
        }

        const timeout = setTimeout(() => {
          setTypingUsers((prev) => {
            const updated = new Map(prev);
            updated.delete(data.userId);
            return updated;
          });
          typingTimeoutRef.current.delete(data.userId);
        }, 3000);

        typingTimeoutRef.current.set(data.userId, timeout);
      } else {
        setTypingUsers((prev) => {
          const updated = new Map(prev);
          updated.delete(data.userId);
          return updated;
        });
      }
    });

    socket.on("user_online", (data) => {
      setOnlineUsers((prev) => new Set(prev.add(data.userId)));
    });

    socket.on("user_offline", (data) => {
      setOnlineUsers((prev) => {
        const updated = new Set(prev);
        updated.delete(data.userId);
        return updated;
      });
    });

    socket.on("online_users_list", (data) => {
      setOnlineUsers(new Set(data.userIds));
    });

    socket.on("joined_course", (data) => {
      console.log("Joined course:", data.courseId);
    });

    socket.on("left_course", (data) => {
      console.log("Left course:", data.courseId);
    });

    socket.on("course_updated", (data) => {
      setCourseUpdates((prev) => [data, ...prev.slice(0, 9)]);
      toast.info(`Course update: ${data.description}`);
    });

    socket.on("student_progress_update", (data) => {
      if (user.role === "INSTRUCTOR") {
        toast.info(`${data.studentName} completed a lesson`);
      }
    });

    socket.on("student_milestone", (data) => {
      if (user.role === "INSTRUCTOR") {
        toast.success(
          `${data.studentName} reached ${data.currentProgress}% progress`
        );
      }
    });

    socket.on("grading_required", (data) => {
      if (user.role === "INSTRUCTOR") {
        toast.info(
          `New ${data.type} submission from ${data.studentName} needs grading`
        );
      }
    });

    socket.on("student_question", (data) => {
      if (user.role === "INSTRUCTOR") {
        toast.info(
          `New question from ${data.studentName}${
            data.isUrgent ? " (URGENT)" : ""
          }`
        );
      }
    });

    socket.on("joined_live_session", (data) => {
      setLiveSessionParticipants(
        (prev) => new Map(prev.set(data.sessionId, data.totalParticipants))
      );
    });

    socket.on("user_joined_live", (data) => {
      setLiveSessionParticipants(
        (prev) => new Map(prev.set(data.sessionId, data.totalParticipants))
      );
      toast.info(`${data.userName} joined the live session`);
    });

    socket.on("user_left_live", (data) => {
      setLiveSessionParticipants(
        (prev) => new Map(prev.set(data.sessionId, data.totalParticipants))
      );
    });

    socket.on("live_interaction", (data) => {
      switch (data.type) {
        case "hand_raise":
          toast.info(`${data.userName} raised their hand`);
          break;
        case "chat":
          break;
        case "reaction":
          break;
        default:
          break;
      }
    });

    socket.on("screen_share_update", (data) => {
      if (data.isSharing) {
        toast.info(`${data.userName} started sharing their screen`);
      }
    });

    socket.on("emergency_notification", (data) => {
      toast.error(data.message, {
        duration: Infinity,
        important: true,
        action: {
          label: "Acknowledge",
          onClick: () =>
            socket.emit("emergency_acknowledged", { priority: data.priority }),
        },
      });
    });

    socket.on("maintenance_notification", (data) => {
      toast.warning(`Maintenance scheduled: ${data.description}`, {
        duration: 15000,
      });
    });

    socket.on("system_update", (data) => {
      toast.info(`System updated to v${data.version}`, {
        action: data.requiresReload
          ? {
              label: "Reload",
              onClick: () => window.location.reload(),
            }
          : undefined,
      });
    });

    socket.on("role_announcement", (data) => {
      toast.info(data.title, {
        description: data.message,
        duration: data.priority === "urgent" ? 10000 : 5000,
      });
    });

    socket.on("course_announcement", (data) => {
      toast.info(data.title, {
        description: data.message,
        duration: data.priority === "urgent" ? 10000 : 5000,
      });
    });

    socket.on("session_control", (data) => {
      switch (data.action) {
        case "start":
          toast.success("Live session started");
          break;
        case "end":
          toast.info("Live session ended");
          break;
        case "pause":
          toast.warning("Live session paused");
          break;
        case "mute_all":
          toast.info("All participants muted");
          break;
        default:
          break;
      }
    });

    socket.on("removed_from_course", (data) => {
      toast.error(data.message);
    });

    socket.on("pong", (data) => {
      console.log("Ping response time:", Date.now() - data.timestamp, "ms");
    });

    socket.on("error", (data) => {
      toast.error(data.message || "Socket error occurred");
    });

    socket.on("notifications_marked_read", (data) => {
      dispatch(updateSocketNotificationRead(data));
    });
  }, [isAuthenticated, token, user?.role, dispatch]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setIsConnected(false);
    setConnectionError(null);
    hasShownConnectedToast.current = false;
  }, []);

  const joinCourse = useCallback((courseId) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("join_course", { courseId });
    }
  }, []);

  const leaveCourse = useCallback((courseId) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("leave_course", { courseId });
    }
  }, []);

  const joinLiveSession = useCallback((sessionId, courseId) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("join_live_session", { sessionId, courseId });
    }
  }, []);

  const leaveLiveSession = useCallback((sessionId) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("leave_live_session", { sessionId });
    }
  }, []);

  const sendMessage = useCallback(
    (receiverId, content, messageType = "DIRECT", attachments = null) => {
      if (socketRef.current?.connected) {
        socketRef.current.emit("send_message", {
          receiverId,
          content,
          messageType,
          attachments,
        });
      }
    },
    []
  );

  const sendTyping = useCallback((roomId, isTyping) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("typing", { roomId, isTyping });
    }
  }, []);

  const markNotificationsRead = useCallback(
    (notificationIds) => {
      if (socketRef.current?.connected) {
        socketRef.current.emit("mark_notifications_read", { notificationIds });
        dispatch(updateSocketNotificationRead({ notificationIds }));
      }
    },
    [dispatch]
  );

  const updateNotificationSettings = useCallback((settings) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("update_notification_settings", { settings });
    }
  }, []);

  const lessonCompleted = useCallback(
    (courseId, lessonId, completionTime, progress) => {
      if (socketRef.current?.connected) {
        socketRef.current.emit("lesson_completed", {
          courseId,
          lessonId,
          completionTime,
          progress,
        });
      }
    },
    []
  );

  const updateCourseProgress = useCallback(
    (courseId, progressPercentage, milestonesReached) => {
      if (socketRef.current?.connected) {
        socketRef.current.emit("course_progress_update", {
          courseId,
          progressPercentage,
          milestonesReached,
        });
      }
    },
    []
  );

  const submitQuizForGrading = useCallback(
    (quizId, courseId, needsManualGrading, hasEssayQuestions) => {
      if (socketRef.current?.connected) {
        socketRef.current.emit("quiz_submitted_for_grading", {
          quizId,
          courseId,
          needsManualGrading,
          hasEssayQuestions,
        });
      }
    },
    []
  );

  const submitAssignment = useCallback(
    (assignmentId, courseId, submissionType) => {
      if (socketRef.current?.connected) {
        socketRef.current.emit("assignment_submitted", {
          assignmentId,
          courseId,
          submissionType,
        });
      }
    },
    []
  );

  const askQuestion = useCallback(
    (courseId, questionText, lessonId, isUrgent = false) => {
      if (socketRef.current?.connected) {
        socketRef.current.emit("question_asked", {
          courseId,
          questionText,
          lessonId,
          isUrgent,
        });
      }
    },
    []
  );

  const answerQuestion = useCallback(
    (questionId, studentId, answer, isHelpful) => {
      if (socketRef.current?.connected) {
        socketRef.current.emit("question_answered", {
          questionId,
          studentId,
          answer,
          isHelpful,
        });
      }
    },
    []
  );

  const submitGrade = useCallback((studentId, gradeData) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("grade_submitted", {
        studentId,
        gradeData,
      });
    }
  }, []);

  const updateCourseContent = useCallback(
    (courseId, updateType, newContent) => {
      if (socketRef.current?.connected) {
        socketRef.current.emit("course_content_updated", {
          courseId,
          updateType,
          newContent,
        });
      }
    },
    []
  );

  const sendLiveInteraction = useCallback((sessionId, type, content) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("live_interaction", {
        sessionId,
        type,
        content,
      });
    }
  }, []);

  const shareScreen = useCallback((sessionId, isSharing, streamId = null) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("screen_share", {
        sessionId,
        isSharing,
        streamId,
      });
    }
  }, []);

  const performAdminAction = useCallback(
    (action, targetUserId, reason, data = null) => {
      if (
        socketRef.current?.connected &&
        (user?.role === "ADMIN" || user?.role === "MODERATOR")
      ) {
        socketRef.current.emit("admin_action", {
          action,
          targetUserId,
          reason,
          data,
        });
      }
    },
    [user?.role]
  );

  const ping = useCallback(() => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("ping");
    }
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const clearCourseUpdates = useCallback(() => {
    setCourseUpdates([]);
  }, []);

  const clearOnlineUsers = useCallback(() => {
    setOnlineUsers(new Set());
  }, []);

  const getOnlineUsersCount = useCallback(() => {
    return onlineUsers.size;
  }, [onlineUsers]);

  const isUserOnline = useCallback(
    (userId) => {
      return onlineUsers.has(userId);
    },
    [onlineUsers]
  );

  useEffect(() => {
    if (isAuthenticated && token && user) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      typingTimeoutRef.current.forEach((timeout) => clearTimeout(timeout));
      typingTimeoutRef.current.clear();
      disconnect();
    };
  }, [isAuthenticated, token, user]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  return {
    isConnected,
    connectionError,
    connectedDevices,
    onlineUsers,
    typingUsers,
    liveSessionParticipants,
    courseUpdates,
    messages,

    connect,
    disconnect,
    joinCourse,
    leaveCourse,
    joinLiveSession,
    leaveLiveSession,
    sendMessage,
    sendTyping,
    markNotificationsRead,
    updateNotificationSettings,
    lessonCompleted,
    updateCourseProgress,
    submitQuizForGrading,
    submitAssignment,
    askQuestion,
    answerQuestion,
    submitGrade,
    updateCourseContent,
    sendLiveInteraction,
    shareScreen,
    performAdminAction,
    ping,
    clearMessages,
    clearCourseUpdates,
    clearOnlineUsers,
    getOnlineUsersCount,
    isUserOnline,
  };
};

export default useSocket;
