/* eslint-disable no-unused-vars */
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
  onAnnouncementStatsUpdated,
} from "@/features/common/notificationSlice";
import {
  setSocketConnectionStatus as setAdminSocketConnectionStatus,
  onAnnouncementCreated,
  onAnnouncementUpdated,
  onAnnouncementDeleted,
  onAnnouncementStatsUpdated as onAdminAnnouncementStatsUpdated,
  onNotificationStatusUpdate,
} from "@/features/adminSlice/adminSystem";
import {
  setSocketConnectionStatus as setTicketSocketConnectionStatus,
  syncTicketFromNotification,
  handleSocketTicketUpdate,
} from "@/features/common/ticketSlice";

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

  const handleTicketNotification = useCallback(
    (notification) => {
      if (
        notification.type === "SUPPORT_TICKET_UPDATED" ||
        notification.type === "SUPPORT_TICKET_CREATED"
      ) {
        dispatch(syncTicketFromNotification(notification));
      }
    },
    [dispatch]
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
        dispatch(setTicketSocketConnectionStatus(true));
        reconnectAttempts.current = 0;

        socket.emit("join", { userId: user.id, role: user.role });
      });

      socket.on("disconnect", (reason) => {
        dispatch(setSocketConnectionStatus(false));
        dispatch(setAdminSocketConnectionStatus(false));
        dispatch(setTicketSocketConnectionStatus(false));

        if (reason === "io server disconnect") {
          scheduleReconnect();
        }
      });

      socket.on("connect_error", (error) => {
        dispatch(setSocketConnectionStatus(false));
        dispatch(setAdminSocketConnectionStatus(false));
        dispatch(setTicketSocketConnectionStatus(false));
        scheduleReconnect();
      });

      socket.on("notification", (notification) => {
        dispatch(addSocketNotification(notification));
        handleTicketNotification(notification);
      });

      socket.on("bulk_notifications", (notifications) => {
        dispatch(addBulkSocketNotifications(notifications));
        notifications.forEach(handleTicketNotification);
      });

      socket.on("notifications_marked_read", (data) => {
        dispatch(updateSocketNotificationRead(data));
      });

      socket.on("unread_count_updated", (data) => {
        dispatch(setSocketUnreadCount(data.count));
      });

      socket.on("announcement_stats_updated", (stats) => {
        dispatch(onAnnouncementStatsUpdated(stats));
      });

      socket.on("announcement_created", (announcement) => {
        dispatch(onAnnouncementCreated(announcement));
      });

      socket.on("announcement_updated", (announcement) => {
        dispatch(onAnnouncementUpdated(announcement));
      });

      socket.on("announcement_deleted", (data) => {
        dispatch(onAnnouncementDeleted(data));
      });

      socket.on("admin_announcement_stats_updated", (stats) => {
        dispatch(onAdminAnnouncementStatsUpdated(stats));
      });

      socket.on("notification_stats_updated", (data) => {
        dispatch(onNotificationStatusUpdate(data));
      });

      socket.on("ticket_updated", (data) => {
        dispatch(handleSocketTicketUpdate(data));
      });

      socket.on("system_maintenance", (data) => {});

      socket.on("forced_logout", () => {
        toast.error("⚠️ Session Expired", {
          description: "You have been logged out",
          duration: 5000,
        });
        localStorage.removeItem("token");
        window.location.href = "/login";
      });

      socket.on("error", (error) => {
        toast.error("Connection Error", {
          description: "Socket connection error occurred",
          duration: 3000,
        });
      });
    } catch (error) {
      console.error("🚫 Socket connection failed:", error);
      scheduleReconnect();
    }
  }, [dispatch, user, handleTicketNotification]);

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
    dispatch(setTicketSocketConnectionStatus(false));
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

  const subscribeToNotificationEvents = useCallback((handlers) => {}, []);

  const unsubscribeFromNotificationEvents = useCallback(() => {}, []);

  const subscribeToAnnouncementEvents = useCallback((handlers) => {
    if (socketRef.current?.connected && handlers) {
      if (handlers.onAnnouncementCreated) {
        socketRef.current.on(
          "announcement_created",
          handlers.onAnnouncementCreated
        );
      }
      if (handlers.onAnnouncementUpdated) {
        socketRef.current.on(
          "announcement_updated",
          handlers.onAnnouncementUpdated
        );
      }
      if (handlers.onAnnouncementDeleted) {
        socketRef.current.on(
          "announcement_deleted",
          handlers.onAnnouncementDeleted
        );
      }
      if (handlers.onAnnouncementStatsUpdated) {
        socketRef.current.on(
          "admin_announcement_stats_updated",
          handlers.onAnnouncementStatsUpdated
        );
      }
      if (handlers.onNotificationStatusUpdate) {
        socketRef.current.on(
          "notification_stats_updated",
          handlers.onNotificationStatusUpdate
        );
      }
    }
  }, []);

  const unsubscribeFromAnnouncementEvents = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.off("announcement_created");
      socketRef.current.off("announcement_updated");
      socketRef.current.off("announcement_deleted");
      socketRef.current.off("admin_announcement_stats_updated");
      socketRef.current.off("notification_stats_updated");
    }
  }, []);

  const subscribeToTicketEvents = useCallback((handlers) => {
    if (socketRef.current?.connected && handlers) {
      if (handlers.onTicketUpdated) {
        socketRef.current.on("ticket_updated", handlers.onTicketUpdated);
      }
      if (handlers.onTicketCreated) {
        socketRef.current.on("ticket_created", handlers.onTicketCreated);
      }
      if (handlers.onTicketStatusChanged) {
        socketRef.current.on(
          "ticket_status_changed",
          handlers.onTicketStatusChanged
        );
      }
      if (handlers.onTicketResponseAdded) {
        socketRef.current.on(
          "ticket_response_added",
          handlers.onTicketResponseAdded
        );
      }
    }
  }, []);

  const unsubscribeFromTicketEvents = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.off("ticket_updated");
      socketRef.current.off("ticket_created");
      socketRef.current.off("ticket_status_changed");
      socketRef.current.off("ticket_response_added");
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
    subscribeToNotificationEvents,
    unsubscribeFromNotificationEvents,
    subscribeToAnnouncementEvents,
    unsubscribeFromAnnouncementEvents,
    subscribeToTicketEvents,
    unsubscribeFromTicketEvents,
    socket: socketRef.current,
  };
};

export default useSocket;
