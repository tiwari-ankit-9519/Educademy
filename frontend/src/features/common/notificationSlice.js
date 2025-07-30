import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "@/utils/axiosApi";
import { toast } from "sonner";

const initialState = {
  notifications: [],
  socketNotifications: [],
  unreadCount: 0,
  notificationStats: null,
  notificationSettings: null,
  notificationPreferences: null,
  announcementStats: {},
  error: null,
  loading: false,
  notificationsLoading: false,
  unreadCountLoading: false,
  notificationStatsLoading: false,
  markReadLoading: false,
  deleteNotificationLoading: false,
  deleteAllReadLoading: false,
  notificationSettingsLoading: false,
  updateSettingsLoading: false,
  sendTestLoading: false,
  notificationPreferencesLoading: false,
  needsRefresh: false,
  notificationsPagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  },
  notificationsFilters: {
    isRead: undefined,
    type: "",
    priority: "",
    startDate: "",
    endDate: "",
    search: "",
  },
  socketConnectionStatus: false,
  pendingMarkAsRead: [],
  pendingDeletes: [],
  lastAnnouncementNotification: null,
  announcementDisplayQueue: [],
  isAnnouncementDisplaying: false,
  realtimeUpdates: {
    enabled: true,
    lastUpdate: null,
    updateCount: 0,
  },
};

export const getNotifications = createAsyncThunk(
  "notification/getNotifications",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get("/notifications", { params });
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(error.response?.data || { message });
    }
  }
);

export const getUnreadCount = createAsyncThunk(
  "notification/getUnreadCount",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/notifications/unread-count");
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      return rejectWithValue(error.response?.data || { message });
    }
  }
);

export const getNotificationStats = createAsyncThunk(
  "notification/getNotificationStats",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/notifications/stats");
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(error.response?.data || { message });
    }
  }
);

export const markNotificationsAsRead = createAsyncThunk(
  "notification/markNotificationsAsRead",
  async (
    { notificationIds, markAll = false },
    { rejectWithValue, getState }
  ) => {
    const state = getState();
    const affectedNotifications = markAll
      ? state.notification.notifications.filter((n) => !n.isRead)
      : state.notification.notifications.filter((n) =>
          notificationIds.includes(n.id)
        );

    const optimisticUpdates = affectedNotifications.map((notification) => ({
      ...notification,
      isRead: true,
      readAt: new Date().toISOString(),
    }));

    try {
      const response = await api.put("/notifications/mark-read", {
        notificationIds: markAll ? undefined : notificationIds,
        markAll,
      });
      return {
        data: response.data.data,
        notificationIds: markAll
          ? affectedNotifications.map((n) => n.id)
          : notificationIds,
        markAll,
        optimisticUpdates,
        affectedNotifications,
      };
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue({
        error: error.response?.data || { message },
        notificationIds: markAll
          ? affectedNotifications.map((n) => n.id)
          : notificationIds,
        originalNotifications: affectedNotifications,
      });
    }
  }
);

export const deleteNotification = createAsyncThunk(
  "notification/deleteNotification",
  async (notificationId, { rejectWithValue, getState }) => {
    const state = getState();
    const existingNotification = state.notification.notifications.find(
      (n) => n.id === notificationId
    );

    try {
      const response = await api.delete(`/notifications/${notificationId}`);
      return {
        data: response.data.data,
        notificationId,
        existingNotification,
      };
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue({
        error: error.response?.data || { message },
        notificationId,
        originalNotification: existingNotification,
      });
    }
  }
);

export const deleteAllReadNotifications = createAsyncThunk(
  "notification/deleteAllReadNotifications",
  async (_, { rejectWithValue, getState }) => {
    const state = getState();
    const readNotifications = state.notification.notifications.filter(
      (n) => n.isRead
    );
    const readNotificationIds = readNotifications.map((n) => n.id);

    try {
      const response = await api.delete("/notifications/read/all");
      return {
        data: response.data.data,
        deletedNotificationIds: readNotificationIds,
        deletedNotifications: readNotifications,
      };
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue({
        error: error.response?.data || { message },
        originalNotifications: readNotifications,
      });
    }
  }
);

export const getNotificationSettings = createAsyncThunk(
  "notification/getNotificationSettings",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/notifications/settings");
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(error.response?.data || { message });
    }
  }
);

export const updateNotificationSettings = createAsyncThunk(
  "notification/updateNotificationSettings",
  async (settings, { rejectWithValue, getState }) => {
    const state = getState();
    const currentSettings = state.notification.notificationSettings;

    const optimisticSettings = {
      ...currentSettings,
      ...settings,
    };

    try {
      const response = await api.put("/notifications/settings", settings);
      return {
        data: response.data.data,
        optimisticSettings,
      };
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue({
        error: error.response?.data || { message },
        originalSettings: currentSettings,
      });
    }
  }
);

export const sendTestNotification = createAsyncThunk(
  "notification/sendTestNotification",
  async (testData, { rejectWithValue }) => {
    try {
      const response = await api.post("/notifications/test", testData);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(error.response?.data || { message });
    }
  }
);

export const getNotificationPreferences = createAsyncThunk(
  "notification/getNotificationPreferences",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/notifications/preferences");
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(error.response?.data || { message });
    }
  }
);

const updateStatsAfterMarkRead = (state, notificationIds) => {
  if (!state.notificationStats) return;

  const markedNotifications = state.notifications.filter(
    (n) => notificationIds.includes(n.id) && !n.isRead
  );

  const unreadCount = markedNotifications.length;

  const updatedByPriority = { ...state.notificationStats.byPriority };
  markedNotifications.forEach((notification) => {
    const priority = notification.priority;
    if (priority && updatedByPriority[priority]) {
      updatedByPriority[priority] = Math.max(
        0,
        updatedByPriority[priority] - 1
      );
    }
  });

  state.notificationStats = {
    ...state.notificationStats,
    unread: Math.max(0, state.notificationStats.unread - unreadCount),
    byPriority: updatedByPriority,
  };

  state.unreadCount = Math.max(0, state.unreadCount - unreadCount);
};

const updateStatsAfterDelete = (state, deletedNotifications) => {
  if (!state.notificationStats) return;

  const unreadDeleted = deletedNotifications.filter((n) => !n.isRead).length;
  const totalDeleted = deletedNotifications.length;

  const updatedByPriority = { ...state.notificationStats.byPriority };
  deletedNotifications.forEach((notification) => {
    const priority = notification.priority;
    if (priority && updatedByPriority[priority]) {
      if (!notification.isRead) {
        updatedByPriority[priority] = Math.max(
          0,
          updatedByPriority[priority] - 1
        );
      }
    }
  });

  state.notificationStats = {
    ...state.notificationStats,
    total: Math.max(0, state.notificationStats.total - totalDeleted),
    unread: Math.max(0, state.notificationStats.unread - unreadDeleted),
    byPriority: updatedByPriority,
  };

  state.unreadCount = Math.max(0, state.unreadCount - unreadDeleted);
};

const updatePaginationAfterRemoval = (pagination, removedCount) => {
  const newTotal = Math.max(0, pagination.total - removedCount);
  const newTotalPages = Math.max(1, Math.ceil(newTotal / pagination.limit));

  return {
    ...pagination,
    total: newTotal,
    totalPages: newTotalPages,
    hasNext: pagination.page < newTotalPages,
    hasPrev: pagination.page > 1,
  };
};

const addToArray = (array, items) => {
  const itemsArray = Array.isArray(items) ? items : [items];
  const newItems = itemsArray.filter((item) => !array.includes(item));
  return [...array, ...newItems];
};

const removeFromArray = (array, items) => {
  const itemsArray = Array.isArray(items) ? items : [items];
  return array.filter((item) => !itemsArray.includes(item));
};

const processAnnouncementNotification = (state, notification) => {
  if (notification.type === "SYSTEM_ANNOUNCEMENT") {
    if (!state.isAnnouncementDisplaying) {
      state.lastAnnouncementNotification = notification;
      state.isAnnouncementDisplaying = true;
    } else {
      state.announcementDisplayQueue.push(notification);
    }

    if (notification.data?.announcementId) {
      state.announcementStats[notification.data.announcementId] = {
        ...state.announcementStats[notification.data.announcementId],
        totalNotifications:
          (state.announcementStats[notification.data.announcementId]
            ?.totalNotifications || 0) + 1,
        unreadCount:
          (state.announcementStats[notification.data.announcementId]
            ?.unreadCount || 0) + (!notification.isRead ? 1 : 0),
      };
    }
  }
};

const notificationSlice = createSlice({
  name: "notification",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearNotifications: (state) => {
      state.notifications = [];
    },
    clearSocketNotifications: (state) => {
      state.socketNotifications = [];
    },
    clearNotificationStats: (state) => {
      state.notificationStats = null;
    },
    clearNotificationSettings: (state) => {
      state.notificationSettings = null;
    },
    clearNotificationPreferences: (state) => {
      state.notificationPreferences = null;
    },
    setNotificationsFilters: (state, action) => {
      state.notificationsFilters = {
        ...state.notificationsFilters,
        ...action.payload,
      };
    },
    resetNotificationsFilters: (state) => {
      state.notificationsFilters = initialState.notificationsFilters;
    },
    resetNotificationState: () => {
      return { ...initialState };
    },
    markForRefresh: (state) => {
      state.needsRefresh = true;
    },
    clearRefreshFlag: (state) => {
      state.needsRefresh = false;
    },
    setSocketConnectionStatus: (state, action) => {
      state.socketConnectionStatus = action.payload;
    },
    addSocketNotification: (state, action) => {
      const notification = action.payload;
      const existingIndex = state.socketNotifications.findIndex(
        (n) => n.id === notification.id
      );

      if (existingIndex === -1) {
        state.socketNotifications.unshift(notification);
        if (!notification.isRead) {
          state.unreadCount += 1;
        }
      }

      const mainNotificationIndex = state.notifications.findIndex(
        (n) => n.id === notification.id
      );
      if (mainNotificationIndex === -1) {
        state.notifications.unshift(notification);
        state.notificationsPagination = {
          ...state.notificationsPagination,
          total: state.notificationsPagination.total + 1,
        };
      }

      if (state.notificationStats) {
        state.notificationStats = {
          ...state.notificationStats,
          total: state.notificationStats.total + 1,
          unread:
            state.notificationStats.unread + (!notification.isRead ? 1 : 0),
          byPriority: {
            ...state.notificationStats.byPriority,
            [notification.priority]:
              (state.notificationStats.byPriority[notification.priority] || 0) +
              (!notification.isRead ? 1 : 0),
          },
        };
      }

      processAnnouncementNotification(state, notification);

      state.realtimeUpdates.lastUpdate = new Date().toISOString();
      state.realtimeUpdates.updateCount += 1;
    },
    updateSocketNotificationRead: (state, action) => {
      const { notificationIds } = action.payload;

      state.socketNotifications = state.socketNotifications.map(
        (notification) =>
          notificationIds.includes(notification.id)
            ? {
                ...notification,
                isRead: true,
                readAt: new Date().toISOString(),
              }
            : notification
      );

      state.notifications = state.notifications.map((notification) =>
        notificationIds.includes(notification.id)
          ? { ...notification, isRead: true, readAt: new Date().toISOString() }
          : notification
      );

      const unreadCount = Math.max(
        0,
        state.unreadCount - notificationIds.length
      );
      state.unreadCount = unreadCount;

      notificationIds.forEach((notificationId) => {
        const notification = state.notifications.find(
          (n) => n.id === notificationId
        );
        if (
          notification?.type === "SYSTEM_ANNOUNCEMENT" &&
          notification.data?.announcementId
        ) {
          const announcementId = notification.data.announcementId;
          if (state.announcementStats[announcementId]) {
            state.announcementStats[announcementId] = {
              ...state.announcementStats[announcementId],
              readCount:
                (state.announcementStats[announcementId].readCount || 0) + 1,
              unreadCount: Math.max(
                0,
                (state.announcementStats[announcementId].unreadCount || 0) - 1
              ),
            };
          }
        }
      });

      state.realtimeUpdates.lastUpdate = new Date().toISOString();
      state.realtimeUpdates.updateCount += 1;
    },
    addBulkSocketNotifications: (state, action) => {
      const notifications = action.payload;
      const announcementNotifications = [];

      notifications.forEach((notification) => {
        const existingIndex = state.socketNotifications.findIndex(
          (n) => n.id === notification.id
        );

        if (existingIndex === -1) {
          state.socketNotifications.unshift(notification);
        }

        const mainNotificationIndex = state.notifications.findIndex(
          (n) => n.id === notification.id
        );
        if (mainNotificationIndex === -1) {
          state.notifications.unshift(notification);
        }

        if (notification.type === "SYSTEM_ANNOUNCEMENT") {
          announcementNotifications.push(notification);

          if (notification.data?.announcementId) {
            const announcementId = notification.data.announcementId;
            if (!state.announcementStats[announcementId]) {
              state.announcementStats[announcementId] = {
                totalNotifications: 0,
                readCount: 0,
                unreadCount: 0,
              };
            }
            state.announcementStats[announcementId] = {
              ...state.announcementStats[announcementId],
              totalNotifications:
                state.announcementStats[announcementId].totalNotifications + 1,
              unreadCount:
                state.announcementStats[announcementId].unreadCount +
                (!notification.isRead ? 1 : 0),
            };
          }
        }
      });

      if (announcementNotifications.length > 0) {
        const latestAnnouncement = announcementNotifications[0];
        if (!state.isAnnouncementDisplaying) {
          state.lastAnnouncementNotification = latestAnnouncement;
          state.isAnnouncementDisplaying = true;
        } else {
          state.announcementDisplayQueue.push(...announcementNotifications);
        }
      }

      const newUnreadCount = notifications.filter((n) => !n.isRead).length;
      state.unreadCount += newUnreadCount;

      if (state.notificationStats) {
        const priorityCounts = {};
        notifications.forEach((notification) => {
          if (!notification.isRead && notification.priority) {
            priorityCounts[notification.priority] =
              (priorityCounts[notification.priority] || 0) + 1;
          }
        });

        const updatedByPriority = { ...state.notificationStats.byPriority };
        Object.keys(priorityCounts).forEach((priority) => {
          updatedByPriority[priority] =
            (updatedByPriority[priority] || 0) + priorityCounts[priority];
        });

        state.notificationStats = {
          ...state.notificationStats,
          total: state.notificationStats.total + notifications.length,
          unread: state.notificationStats.unread + newUnreadCount,
          byPriority: updatedByPriority,
        };
      }

      state.notificationsPagination = {
        ...state.notificationsPagination,
        total: state.notificationsPagination.total + notifications.length,
      };

      state.realtimeUpdates.lastUpdate = new Date().toISOString();
      state.realtimeUpdates.updateCount += 1;
    },
    onAnnouncementStatsUpdated: (state, action) => {
      const stats = action.payload;
      const { announcementId } = stats;

      if (announcementId) {
        state.announcementStats[announcementId] = {
          ...state.announcementStats[announcementId],
          ...stats,
        };

        state.realtimeUpdates.lastUpdate = new Date().toISOString();
        state.realtimeUpdates.updateCount += 1;
      }
    },
    clearLastAnnouncementNotification: (state) => {
      state.lastAnnouncementNotification = null;
      state.isAnnouncementDisplaying = false;

      if (state.announcementDisplayQueue.length > 0) {
        const nextAnnouncement = state.announcementDisplayQueue.shift();
        state.lastAnnouncementNotification = nextAnnouncement;
        state.isAnnouncementDisplaying = true;
      }
    },
    setSocketUnreadCount: (state, action) => {
      state.unreadCount = action.payload;
    },
    optimisticNotificationUpdate: (state, action) => {
      const { notificationId, updates } = action.payload;

      state.notifications = state.notifications.map((notification) =>
        notification.id === notificationId
          ? { ...notification, ...updates }
          : notification
      );

      state.socketNotifications = state.socketNotifications.map(
        (notification) =>
          notification.id === notificationId
            ? { ...notification, ...updates }
            : notification
      );
    },
    optimisticNotificationRemove: (state, action) => {
      const notificationIds = Array.isArray(action.payload)
        ? action.payload
        : [action.payload];

      const removedNotifications = state.notifications.filter((notification) =>
        notificationIds.includes(notification.id)
      );

      removedNotifications.forEach((notification) => {
        if (
          notification.type === "SYSTEM_ANNOUNCEMENT" &&
          notification.data?.announcementId
        ) {
          const announcementId = notification.data.announcementId;
          if (state.announcementStats[announcementId]) {
            state.announcementStats[announcementId] = {
              ...state.announcementStats[announcementId],
              totalNotifications: Math.max(
                0,
                state.announcementStats[announcementId].totalNotifications - 1
              ),
              unreadCount: Math.max(
                0,
                state.announcementStats[announcementId].unreadCount -
                  (!notification.isRead ? 1 : 0)
              ),
            };
          }
        }
      });

      state.notifications = state.notifications.filter(
        (notification) => !notificationIds.includes(notification.id)
      );

      state.socketNotifications = state.socketNotifications.filter(
        (notification) => !notificationIds.includes(notification.id)
      );

      state.notificationsPagination = updatePaginationAfterRemoval(
        state.notificationsPagination,
        notificationIds.length
      );
    },
    addToPendingMarkAsRead: (state, action) => {
      state.pendingMarkAsRead = addToArray(
        state.pendingMarkAsRead,
        action.payload
      );
    },
    removeFromPendingMarkAsRead: (state, action) => {
      state.pendingMarkAsRead = removeFromArray(
        state.pendingMarkAsRead,
        action.payload
      );
    },
    addToPendingDeletes: (state, action) => {
      state.pendingDeletes = addToArray(state.pendingDeletes, action.payload);
    },
    removeFromPendingDeletes: (state, action) => {
      state.pendingDeletes = removeFromArray(
        state.pendingDeletes,
        action.payload
      );
    },
    toggleRealtimeUpdates: (state) => {
      state.realtimeUpdates.enabled = !state.realtimeUpdates.enabled;
    },
    updateAnnouncementNotificationStats: (state, action) => {
      const { announcementId, readCount, totalNotifications } = action.payload;

      if (state.announcementStats[announcementId]) {
        state.announcementStats[announcementId] = {
          ...state.announcementStats[announcementId],
          readCount: readCount || 0,
          totalNotifications: totalNotifications || 0,
          unreadCount: Math.max(
            0,
            (totalNotifications || 0) - (readCount || 0)
          ),
          readPercentage:
            totalNotifications > 0
              ? Math.round((readCount / totalNotifications) * 100)
              : 0,
        };
      }
    },
    resetAnnouncementDisplay: (state) => {
      state.isAnnouncementDisplaying = false;
      state.announcementDisplayQueue = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getNotifications.pending, (state) => {
        state.notificationsLoading = true;
        state.loading = true;
        state.error = null;
      })
      .addCase(getNotifications.fulfilled, (state, action) => {
        state.notificationsLoading = false;
        state.loading = false;
        state.notifications = action.payload.data.notifications || [];
        state.notificationsPagination =
          action.payload.data.pagination || state.notificationsPagination;
        state.notificationsFilters = {
          ...state.notificationsFilters,
          ...action.payload.data.filters,
        };
        state.needsRefresh = false;
        state.error = null;
      })
      .addCase(getNotifications.rejected, (state, action) => {
        state.notificationsLoading = false;
        state.loading = false;
        state.error =
          action.payload?.message || "Failed to fetch notifications";
      })

      .addCase(getUnreadCount.pending, (state) => {
        state.unreadCountLoading = true;
        state.error = null;
      })
      .addCase(getUnreadCount.fulfilled, (state, action) => {
        state.unreadCountLoading = false;
        state.unreadCount = action.payload.data.unreadCount;
        state.error = null;
      })
      .addCase(getUnreadCount.rejected, (state, action) => {
        state.unreadCountLoading = false;
        state.error = action.payload?.message || "Failed to fetch unread count";
      })

      .addCase(getNotificationStats.pending, (state) => {
        state.notificationStatsLoading = true;
        state.loading = true;
        state.error = null;
      })
      .addCase(getNotificationStats.fulfilled, (state, action) => {
        state.notificationStatsLoading = false;
        state.loading = false;
        state.notificationStats = action.payload.data;
        state.error = null;
      })
      .addCase(getNotificationStats.rejected, (state, action) => {
        state.notificationStatsLoading = false;
        state.loading = false;
        state.error =
          action.payload?.message || "Failed to fetch notification stats";
      })

      .addCase(markNotificationsAsRead.pending, (state, action) => {
        state.markReadLoading = true;
        state.loading = true;
        state.error = null;

        const { notificationIds, markAll } = action.meta.arg;
        const idsToMark = markAll
          ? state.notifications.filter((n) => !n.isRead).map((n) => n.id)
          : notificationIds;

        state.pendingMarkAsRead = addToArray(
          state.pendingMarkAsRead,
          idsToMark
        );

        updateStatsAfterMarkRead(state, idsToMark);

        state.notifications = state.notifications.map((notification) =>
          idsToMark.includes(notification.id)
            ? {
                ...notification,
                isRead: true,
                readAt: new Date().toISOString(),
              }
            : notification
        );

        state.socketNotifications = state.socketNotifications.map(
          (notification) =>
            idsToMark.includes(notification.id)
              ? {
                  ...notification,
                  isRead: true,
                  readAt: new Date().toISOString(),
                }
              : notification
        );
      })
      .addCase(markNotificationsAsRead.fulfilled, (state, action) => {
        state.markReadLoading = false;
        state.loading = false;

        const { notificationIds } = action.payload;
        state.pendingMarkAsRead = removeFromArray(
          state.pendingMarkAsRead,
          notificationIds
        );
        state.error = null;
      })
      .addCase(markNotificationsAsRead.rejected, (state, action) => {
        state.markReadLoading = false;
        state.loading = false;

        if (action.payload?.originalNotifications) {
          const originalNotificationsMap = new Map(
            action.payload.originalNotifications.map((notification) => [
              notification.id,
              notification,
            ])
          );

          state.notifications = state.notifications.map((notification) =>
            originalNotificationsMap.has(notification.id)
              ? originalNotificationsMap.get(notification.id)
              : notification
          );

          state.socketNotifications = state.socketNotifications.map(
            (notification) =>
              originalNotificationsMap.has(notification.id)
                ? originalNotificationsMap.get(notification.id)
                : notification
          );

          const unreadReverted = action.payload.originalNotifications.filter(
            (n) => !n.isRead
          ).length;

          if (state.notificationStats) {
            const updatedByPriority = { ...state.notificationStats.byPriority };
            action.payload.originalNotifications.forEach((notification) => {
              if (
                !notification.isRead &&
                notification.priority &&
                updatedByPriority[notification.priority] !== undefined
              ) {
                updatedByPriority[notification.priority] =
                  updatedByPriority[notification.priority] + 1;
              }
            });

            state.notificationStats = {
              ...state.notificationStats,
              unread: state.notificationStats.unread + unreadReverted,
              byPriority: updatedByPriority,
            };
          }
          state.unreadCount = state.unreadCount + unreadReverted;
        }

        const notificationIds = action.payload?.notificationIds || [];
        state.pendingMarkAsRead = removeFromArray(
          state.pendingMarkAsRead,
          notificationIds
        );
        state.error =
          action.payload?.error?.message ||
          "Failed to mark notifications as read";
      })

      .addCase(deleteNotification.pending, (state, action) => {
        state.deleteNotificationLoading = true;
        state.loading = true;
        state.error = null;

        const notificationId = action.meta.arg;
        const notificationToDelete = state.notifications.find(
          (n) => n.id === notificationId
        );

        state.pendingDeletes = addToArray(state.pendingDeletes, notificationId);

        if (notificationToDelete) {
          updateStatsAfterDelete(state, [notificationToDelete]);
        }

        state.notifications = state.notifications.filter(
          (n) => n.id !== notificationId
        );
        state.socketNotifications = state.socketNotifications.filter(
          (n) => n.id !== notificationId
        );
        state.notificationsPagination = updatePaginationAfterRemoval(
          state.notificationsPagination,
          1
        );
      })
      .addCase(deleteNotification.fulfilled, (state, action) => {
        state.deleteNotificationLoading = false;
        state.loading = false;

        const { notificationId } = action.payload;
        state.pendingDeletes = removeFromArray(
          state.pendingDeletes,
          notificationId
        );
        state.error = null;
      })
      .addCase(deleteNotification.rejected, (state, action) => {
        state.deleteNotificationLoading = false;
        state.loading = false;

        if (action.payload?.originalNotification) {
          state.notifications.push(action.payload.originalNotification);
          state.socketNotifications.push(action.payload.originalNotification);

          if (state.notificationStats) {
            const updatedByPriority = { ...state.notificationStats.byPriority };
            const notification = action.payload.originalNotification;

            if (
              !notification.isRead &&
              notification.priority &&
              updatedByPriority[notification.priority] !== undefined
            ) {
              updatedByPriority[notification.priority] =
                updatedByPriority[notification.priority] + 1;
            }

            state.notificationStats = {
              ...state.notificationStats,
              total: state.notificationStats.total + 1,
              unread: !notification.isRead
                ? state.notificationStats.unread + 1
                : state.notificationStats.unread,
              byPriority: updatedByPriority,
            };
          }

          if (!action.payload.originalNotification.isRead) {
            state.unreadCount = state.unreadCount + 1;
          }
        }

        const notificationId = action.payload?.notificationId;
        if (notificationId) {
          state.pendingDeletes = removeFromArray(
            state.pendingDeletes,
            notificationId
          );
        }
        state.error =
          action.payload?.error?.message || "Failed to delete notification";
      })

      .addCase(deleteAllReadNotifications.pending, (state) => {
        state.deleteAllReadLoading = true;
        state.loading = true;
        state.error = null;

        const readNotifications = state.notifications.filter((n) => n.isRead);
        const readNotificationIds = readNotifications.map((n) => n.id);

        state.pendingDeletes = addToArray(
          state.pendingDeletes,
          readNotificationIds
        );

        updateStatsAfterDelete(state, readNotifications);

        state.notifications = state.notifications.filter((n) => !n.isRead);
        state.socketNotifications = state.socketNotifications.filter(
          (n) => !n.isRead
        );
        state.notificationsPagination = updatePaginationAfterRemoval(
          state.notificationsPagination,
          readNotificationIds.length
        );
      })
      .addCase(deleteAllReadNotifications.fulfilled, (state, action) => {
        state.deleteAllReadLoading = false;
        state.loading = false;

        const { deletedNotificationIds } = action.payload;
        state.pendingDeletes = removeFromArray(
          state.pendingDeletes,
          deletedNotificationIds
        );
        state.error = null;
      })
      .addCase(deleteAllReadNotifications.rejected, (state, action) => {
        state.deleteAllReadLoading = false;
        state.loading = false;

        if (action.payload?.originalNotifications) {
          action.payload.originalNotifications.forEach((notification) => {
            state.notifications.push(notification);
            state.socketNotifications.push(notification);
          });

          const restoredCount = action.payload.originalNotifications.length;
          if (state.notificationStats) {
            const updatedByPriority = { ...state.notificationStats.byPriority };

            action.payload.originalNotifications.forEach((notification) => {
              if (
                !notification.isRead &&
                notification.priority &&
                updatedByPriority[notification.priority] !== undefined
              ) {
                updatedByPriority[notification.priority] =
                  updatedByPriority[notification.priority] + 1;
              }
            });

            state.notificationStats = {
              ...state.notificationStats,
              total: state.notificationStats.total + restoredCount,
              byPriority: updatedByPriority,
            };
          }

          const deletedIds = action.payload.originalNotifications.map(
            (n) => n.id
          );
          state.pendingDeletes = removeFromArray(
            state.pendingDeletes,
            deletedIds
          );
        }

        state.error =
          action.payload?.error?.message ||
          "Failed to delete read notifications";
      })

      .addCase(getNotificationSettings.pending, (state) => {
        state.notificationSettingsLoading = true;
        state.loading = true;
        state.error = null;
      })
      .addCase(getNotificationSettings.fulfilled, (state, action) => {
        state.notificationSettingsLoading = false;
        state.loading = false;
        state.notificationSettings = action.payload.data.settings;
        state.error = null;
      })
      .addCase(getNotificationSettings.rejected, (state, action) => {
        state.notificationSettingsLoading = false;
        state.loading = false;
        state.error =
          action.payload?.message || "Failed to fetch notification settings";
      })

      .addCase(updateNotificationSettings.pending, (state, action) => {
        state.updateSettingsLoading = true;
        state.loading = true;
        state.error = null;

        const settings = action.meta.arg;
        state.notificationSettings = {
          ...state.notificationSettings,
          ...settings,
        };
      })
      .addCase(updateNotificationSettings.fulfilled, (state, action) => {
        state.updateSettingsLoading = false;
        state.loading = false;
        state.notificationSettings = action.payload.data.settings;
        state.error = null;
      })
      .addCase(updateNotificationSettings.rejected, (state, action) => {
        state.updateSettingsLoading = false;
        state.loading = false;

        if (action.payload?.originalSettings) {
          state.notificationSettings = action.payload.originalSettings;
        }

        state.error =
          action.payload?.error?.message ||
          "Failed to update notification settings";
      })

      .addCase(sendTestNotification.pending, (state) => {
        state.sendTestLoading = true;
        state.loading = true;
        state.error = null;
      })
      .addCase(sendTestNotification.fulfilled, (state) => {
        state.sendTestLoading = false;
        state.loading = false;
        state.error = null;
      })
      .addCase(sendTestNotification.rejected, (state, action) => {
        state.sendTestLoading = false;
        state.loading = false;
        state.error =
          action.payload?.message || "Failed to send test notification";
      })

      .addCase(getNotificationPreferences.pending, (state) => {
        state.notificationPreferencesLoading = true;
        state.loading = true;
        state.error = null;
      })
      .addCase(getNotificationPreferences.fulfilled, (state, action) => {
        state.notificationPreferencesLoading = false;
        state.loading = false;
        state.notificationPreferences = action.payload.data;
        state.error = null;
      })
      .addCase(getNotificationPreferences.rejected, (state, action) => {
        state.notificationPreferencesLoading = false;
        state.loading = false;
        state.error =
          action.payload?.message || "Failed to fetch notification preferences";
      });
  },
});

export const {
  clearError,
  clearNotifications,
  clearSocketNotifications,
  clearNotificationStats,
  clearNotificationSettings,
  clearNotificationPreferences,
  setNotificationsFilters,
  resetNotificationsFilters,
  resetNotificationState,
  markForRefresh,
  clearRefreshFlag,
  setSocketConnectionStatus,
  addSocketNotification,
  addBulkSocketNotifications,
  updateSocketNotificationRead,
  setSocketUnreadCount,
  optimisticNotificationUpdate,
  optimisticNotificationRemove,
  addToPendingMarkAsRead,
  removeFromPendingMarkAsRead,
  addToPendingDeletes,
  removeFromPendingDeletes,
  clearLastAnnouncementNotification,
  onAnnouncementStatsUpdated,
  toggleRealtimeUpdates,
  updateAnnouncementNotificationStats,
  resetAnnouncementDisplay,
} = notificationSlice.actions;

const notificationReducer = notificationSlice.reducer;

export default notificationReducer;
