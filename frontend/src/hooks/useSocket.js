import { useEffect, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { io } from "socket.io-client";
import { toast } from "sonner";
import {
  setSocketConnectionStatus,
  addSocketNotification,
  addBulkSocketNotifications,
  updateSocketNotificationRead,
  setSocketUnreadCount,
} from "@/features/common/notificationSlice";
import {
  setSocketConnectionStatus as setAdminSocketConnectionStatus,
  onAnnouncementCreated,
  onAnnouncementUpdated,
  onAnnouncementDeleted,
  onAnnouncementStatsUpdated,
  onNotificationStatusUpdate,
} from "@/features/adminSlice/adminSystem";

const SOCKET_URL = import.meta.env.PUBLIC_SOCKET_URL || "http://localhost:5000";

const useSocket = () => {
  const dispatch = useDispatch();
  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const baseReconnectDelay = 1000;

  const { user } = useSelector((state) => state.auth || {});
  const { socketConnectionStatus } = useSelector(
    (state) => state.notification || {}
  );

  const connect = useCallback(() => {
    if (socketRef.current?.connected) return;

    try {
      const token = localStorage.getItem("token");
      if (!token || !user?.id) {
        return;
      }

      socketRef.current = io(SOCKET_URL, {
        auth: { token },
        autoConnect: true,
        transports: ["websocket", "polling"],
        timeout: 60000,
        pingTimeout: 30000,
        pingInterval: 10000,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        maxReconnectionAttempts: 5,
        randomizationFactor: 0.5,
      });

      const socket = socketRef.current;

      socket.on("connect", () => {
        dispatch(setSocketConnectionStatus(true));
        dispatch(setAdminSocketConnectionStatus(true));
        reconnectAttempts.current = 0;

        socket.emit("join", { userId: user.id, role: user.role });
      });

      socket.on("disconnect", (reason) => {
        dispatch(setSocketConnectionStatus(false));
        dispatch(setAdminSocketConnectionStatus(false));

        if (reason === "io server disconnect") {
          scheduleReconnect();
        }
      });

      socket.on("connect_error", () => {
        dispatch(setSocketConnectionStatus(false));
        dispatch(setAdminSocketConnectionStatus(false));
        scheduleReconnect();
      });

      socket.on("notification", (notification) => {
        dispatch(addSocketNotification(notification));

        if (!notification.isRead) {
          toast.info(notification.title, {
            description:
              notification.message.substring(0, 100) +
              (notification.message.length > 100 ? "..." : ""),
            duration: 5000,
          });
        }
      });

      socket.on("bulk_notifications", (notifications) => {
        dispatch(addBulkSocketNotifications(notifications));

        const announcementNotifications = notifications.filter(
          (n) => n.type === "SYSTEM_ANNOUNCEMENT"
        );
        if (announcementNotifications.length > 0) {
          const firstAnnouncement = announcementNotifications[0];
          toast.info("📢 New Announcement", {
            description: firstAnnouncement.title,
            duration: 6000,
          });
        }
      });

      socket.on("notifications_marked_read", (data) => {
        dispatch(updateSocketNotificationRead(data));
      });

      socket.on("unread_count_updated", (data) => {
        dispatch(setSocketUnreadCount(data.count));
      });

      socket.on("announcement_created", (announcement) => {
        dispatch(onAnnouncementCreated(announcement));

        if (user?.role === "ADMIN" || user?.role === "MODERATOR") {
          toast.success("📢 New Announcement", {
            description: `"${announcement.title}" has been published`,
            duration: 4000,
          });
        }
      });

      socket.on("announcement_updated", (announcement) => {
        dispatch(onAnnouncementUpdated(announcement));

        if (user?.role === "ADMIN" || user?.role === "MODERATOR") {
          toast.info("📝 Announcement Updated", {
            description: `"${announcement.title}" has been updated`,
            duration: 4000,
          });
        }
      });

      socket.on("announcement_deleted", (data) => {
        dispatch(onAnnouncementDeleted(data));

        if (user?.role === "ADMIN" || user?.role === "MODERATOR") {
          toast.warning("🗑️ Announcement Deleted", {
            description: `"${
              data.deletedAnnouncement?.title || "Announcement"
            }" has been deleted`,
            duration: 4000,
          });
        }
      });

      socket.on("announcement_stats_updated", (stats) => {
        dispatch(onAnnouncementStatsUpdated(stats));
      });

      socket.on("notification_stats_updated", (data) => {
        dispatch(onNotificationStatusUpdate(data));
      });

      socket.on("system_maintenance", (data) => {
        toast.warning("🔧 System Maintenance", {
          description:
            data.message || "System will be under maintenance shortly",
          duration: 10000,
        });
      });

      socket.on("forced_logout", () => {
        toast.error("⚠️ Session Expired", {
          description: "You have been logged out",
          duration: 5000,
        });
        localStorage.removeItem("token");
        window.location.href = "/login";
      });

      socket.on("error", () => {
        toast.error("Connection Error", {
          description: "Socket connection error occurred",
          duration: 3000,
        });
      });
    } catch (error) {
      console.error(error);
      scheduleReconnect();
    }
  }, [dispatch, user]);

  const scheduleReconnect = useCallback(() => {
    if (reconnectAttempts.current >= maxReconnectAttempts) {
      return;
    }

    const delay = baseReconnectDelay * Math.pow(2, reconnectAttempts.current);

    reconnectTimeoutRef.current = setTimeout(() => {
      reconnectAttempts.current++;
      connect();
    }, delay);
  }, [connect]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    dispatch(setSocketConnectionStatus(false));
    dispatch(setAdminSocketConnectionStatus(false));
  }, [dispatch]);

  const markNotificationsRead = useCallback((notificationIds) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("mark_notifications_read", { notificationIds });
    }
  }, []);

  const emitAnnouncementCreated = useCallback((announcement) => {
    if (socketRef.current?.connected) {
      try {
        socketRef.current.emit("announcement_created", announcement);
      } catch (error) {
        console.error(
          "Socket: Failed to broadcast announcement creation",
          error
        );
        toast.error("Failed to broadcast announcement to other admins");
      }
    } else {
      toast.warning("Announcement created but not broadcasted (disconnected)");
    }
  }, []);

  const emitAnnouncementUpdated = useCallback((announcement) => {
    if (socketRef.current?.connected) {
      try {
        socketRef.current.emit("announcement_updated", announcement);
      } catch (error) {
        console.error("Socket: Failed to broadcast announcement update", error);
        toast.error("Failed to broadcast announcement update to other admins");
      }
    } else {
      toast.warning("Announcement updated but not broadcasted (disconnected)");
    }
  }, []);

  const emitAnnouncementDeleted = useCallback((data) => {
    if (socketRef.current?.connected) {
      try {
        socketRef.current.emit("announcement_deleted", data);
      } catch (error) {
        console.error(
          "Socket: Failed to broadcast announcement deletion",
          error
        );
        toast.error(
          "Failed to broadcast announcement deletion to other admins"
        );
      }
    } else {
      toast.warning("Announcement deleted but not broadcasted (disconnected)");
    }
  }, []);

  useEffect(() => {
    if (user?.id) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [user?.id, connect, disconnect]);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    isConnected: socketConnectionStatus,
    connect,
    disconnect,
    markNotificationsRead,
    emitAnnouncementCreated,
    emitAnnouncementUpdated,
    emitAnnouncementDeleted,
    socket: socketRef.current,
  };
};

export default useSocket;
