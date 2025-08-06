import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "@/utils/axiosApi";
import { toast } from "sonner";

const initialState = {
  tickets: [],
  ticketDetails: null,
  ticketStats: null,
  supportCategories: null,
  error: null,
  loading: false,
  ticketsLoading: false,
  ticketDetailsLoading: false,
  createTicketLoading: false,
  addResponseLoading: false,
  updateStatusLoading: false,
  ticketStatsLoading: false,
  supportCategoriesLoading: false,
  needsRefresh: false,
  socketConnected: false,
  ticketsPagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  },
  ticketsFilters: {
    status: "",
    category: "",
    priority: "",
    startDate: "",
    endDate: "",
    search: "",
    sortBy: "createdAt",
    sortOrder: "desc",
  },
  ticketsSummary: {
    byStatus: {},
    byPriority: {},
  },
};

export const createSupportTicket = createAsyncThunk(
  "ticketSupport/createSupportTicket",
  async (ticketData, { rejectWithValue }) => {
    try {
      const formData = new FormData();

      Object.keys(ticketData).forEach((key) => {
        if (key === "attachments" && ticketData[key]) {
          Array.from(ticketData[key]).forEach((file) => {
            formData.append("attachments", file);
          });
        } else if (ticketData[key] !== null && ticketData[key] !== undefined) {
          formData.append(key, ticketData[key]);
        }
      });

      const response = await api.post("/support/tickets", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success(response.data.message);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      if (error.response?.data?.code === "ACCESS_DENIED") {
        toast.error("You don't have permission to perform this action");
      } else {
        toast.error(message);
      }
      return rejectWithValue(error.response?.data || { message });
    }
  }
);

export const getSupportTickets = createAsyncThunk(
  "ticketSupport/getSupportTickets",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get("/support/tickets", { params });
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      if (error.response?.data?.code === "ACCESS_DENIED") {
        toast.error("You don't have permission to view these tickets");
      } else {
        toast.error(message);
      }
      return rejectWithValue(error.response?.data || { message });
    }
  }
);

export const getSupportTicket = createAsyncThunk(
  "ticketSupport/getSupportTicket",
  async (ticketId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/support/tickets/${ticketId}`);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      if (error.response?.data?.code === "ACCESS_DENIED") {
        toast.error("You don't have permission to view this ticket");
      } else {
        toast.error(message);
      }
      return rejectWithValue(error.response?.data || { message });
    }
  }
);

export const addTicketResponse = createAsyncThunk(
  "ticketSupport/addTicketResponse",
  async ({ ticketId, responseData }, { rejectWithValue, getState }) => {
    const state = getState();
    const existingTicket = state.ticketSupport.tickets.find(
      (t) => t.id === ticketId
    );

    const optimisticResponse = {
      id: `temp_${Date.now()}`,
      message: responseData.message,
      isStaffResponse: false,
      attachments: responseData.attachments?.length || 0,
      createdAt: new Date().toISOString(),
      user: {
        name: "You",
        profileImage: null,
        role: "USER",
      },
    };

    try {
      const formData = new FormData();

      Object.keys(responseData).forEach((key) => {
        if (key === "attachments" && responseData[key]) {
          Array.from(responseData[key]).forEach((file) => {
            formData.append("attachments", file);
          });
        } else if (
          responseData[key] !== null &&
          responseData[key] !== undefined
        ) {
          formData.append(key, responseData[key]);
        }
      });

      const response = await api.post(
        `/support/tickets/${ticketId}/responses`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      toast.success(response.data.message);
      return {
        data: response.data.data,
        ticketId,
        optimisticResponse,
      };
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      if (error.response?.data?.code === "ACCESS_DENIED") {
        toast.error("You don't have permission to respond to this ticket");
      } else if (error.response?.data?.code === "TICKET_CLOSED") {
        toast.error("Cannot add response to a closed ticket");
      } else {
        toast.error(message);
      }
      return rejectWithValue({
        error: error.response?.data || { message },
        ticketId,
        optimisticResponse,
        originalTicket: existingTicket,
      });
    }
  }
);

export const updateTicketStatus = createAsyncThunk(
  "ticketSupport/updateTicketStatus",
  async ({ ticketId, status, resolvedBy }, { rejectWithValue, getState }) => {
    const state = getState();
    const existingTicket = state.ticketSupport.tickets.find(
      (t) => t.id === ticketId
    );

    const optimisticUpdate = {
      ...existingTicket,
      status: status.toUpperCase(),
      updatedAt: new Date().toISOString(),
      resolvedAt: ["RESOLVED", "CLOSED"].includes(status.toUpperCase())
        ? new Date().toISOString()
        : null,
      resolvedBy: ["RESOLVED", "CLOSED"].includes(status.toUpperCase())
        ? resolvedBy
        : null,
    };

    try {
      const response = await api.put(`/support/tickets/${ticketId}/status`, {
        status,
        resolvedBy,
      });

      toast.success(response.data.message);
      return {
        data: response.data.data,
        ticketId,
        optimisticUpdate,
      };
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      if (error.response?.data?.code === "ACCESS_DENIED") {
        toast.error("You don't have permission to update ticket status");
      } else {
        toast.error(message);
      }
      return rejectWithValue({
        error: error.response?.data || { message },
        ticketId,
        originalTicket: existingTicket,
      });
    }
  }
);

export const getSupportCategories = createAsyncThunk(
  "ticketSupport/getSupportCategories",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/support/categories");
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(error.response?.data || { message });
    }
  }
);

export const getSupportStats = createAsyncThunk(
  "ticketSupport/getSupportStats",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get("/support/stats", { params });
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      if (error.response?.data?.code === "ACCESS_DENIED") {
        toast.error("You don't have permission to view these statistics");
      } else {
        toast.error(message);
      }
      return rejectWithValue(error.response?.data || { message });
    }
  }
);

const updatePaginationAfterAddition = (pagination, addedCount = 1) => {
  const newTotal = pagination.total + addedCount;
  const newTotalPages = Math.max(1, Math.ceil(newTotal / pagination.limit));

  return {
    ...pagination,
    total: newTotal,
    totalPages: newTotalPages,
    hasNext: pagination.page < newTotalPages,
    hasPrev: pagination.page > 1,
  };
};

const ticketSupportSlice = createSlice({
  name: "ticketSupport",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearTickets: (state) => {
      state.tickets = [];
    },
    clearTicketDetails: (state) => {
      state.ticketDetails = null;
    },
    clearTicketStats: (state) => {
      state.ticketStats = null;
    },
    clearSupportCategories: (state) => {
      state.supportCategories = null;
    },
    setTicketsFilters: (state, action) => {
      state.ticketsFilters = {
        ...state.ticketsFilters,
        ...action.payload,
      };
    },
    resetTicketsFilters: (state) => {
      state.ticketsFilters = initialState.ticketsFilters;
    },
    resetTicketSupportState: () => {
      return { ...initialState };
    },
    markForRefresh: (state) => {
      state.needsRefresh = true;
    },
    clearRefreshFlag: (state) => {
      state.needsRefresh = false;
    },
    setSocketConnectionStatus: (state, action) => {
      state.socketConnected = action.payload;
    },
    handleSocketTicketUpdate: (state, action) => {
      const { updateType, ticket, ...additionalData } = action.payload;

      switch (updateType) {
        case "STATUS_UPDATED": {
          state.tickets = state.tickets.map((t) =>
            t.id === ticket.id
              ? {
                  ...t,
                  status: ticket.status,
                  updatedAt: ticket.updatedAt,
                  resolvedAt: ticket.resolvedAt,
                  resolvedBy: ticket.resolvedBy,
                }
              : t
          );

          if (
            state.ticketDetails &&
            state.ticketDetails.ticket.id === ticket.id
          ) {
            state.ticketDetails.ticket = {
              ...state.ticketDetails.ticket,
              status: ticket.status,
              updatedAt: ticket.updatedAt,
              resolvedAt: ticket.resolvedAt,
              resolvedBy: ticket.resolvedBy,
            };
          }
          break;
        }

        case "RESPONSE_ADDED": {
          state.tickets = state.tickets.map((t) =>
            t.id === ticket.id
              ? {
                  ...t,
                  responseCount: ticket.responseCount,
                  updatedAt: ticket.updatedAt,
                  status: ticket.status,
                  lastResponse: {
                    id: additionalData.responseId,
                    createdAt: ticket.updatedAt,
                    isStaffResponse: additionalData.isStaffResponse,
                  },
                }
              : t
          );

          if (
            state.ticketDetails &&
            state.ticketDetails.ticket.id === ticket.id
          ) {
            state.ticketDetails.ticket.responseCount = ticket.responseCount;
            state.ticketDetails.ticket.updatedAt = ticket.updatedAt;
            state.ticketDetails.ticket.status = ticket.status;
          }
          break;
        }

        case "TICKET_CREATED": {
          const existingTicket = state.tickets.find((t) => t.id === ticket.id);
          if (!existingTicket) {
            state.tickets.unshift(ticket);
            state.ticketsPagination = updatePaginationAfterAddition(
              state.ticketsPagination,
              1
            );
          }
          break;
        }

        default:
          break;
      }
    },
    handleSocketTicketResponseUpdate: (state, action) => {
      const { ticketId, response } = action.payload;

      if (state.ticketDetails && state.ticketDetails.ticket.id === ticketId) {
        const existingResponseIndex =
          state.ticketDetails.ticket.responses.findIndex(
            (r) => r.id === response.id
          );

        if (existingResponseIndex === -1) {
          state.ticketDetails.ticket.responses.push(response);
          state.ticketDetails.ticket.responseCount =
            (state.ticketDetails.ticket.responseCount || 0) + 1;
        }
      }
    },
    optimisticTicketUpdate: (state, action) => {
      const { ticketId, updates } = action.payload;
      state.tickets = state.tickets.map((ticket) =>
        ticket.id === ticketId ? { ...ticket, ...updates } : ticket
      );

      if (state.ticketDetails && state.ticketDetails.ticket.id === ticketId) {
        state.ticketDetails.ticket = {
          ...state.ticketDetails.ticket,
          ...updates,
        };
      }
    },
    optimisticTicketAdd: (state, action) => {
      const newTicket = action.payload;
      state.tickets.unshift(newTicket);
      state.ticketsPagination = updatePaginationAfterAddition(
        state.ticketsPagination,
        1
      );
    },
    optimisticResponseAdd: (state, action) => {
      const { ticketId, response } = action.payload;

      if (state.ticketDetails && state.ticketDetails.ticket.id === ticketId) {
        state.ticketDetails.ticket.responses = [
          ...state.ticketDetails.ticket.responses,
          response,
        ];
        state.ticketDetails.ticket.responseCount =
          (state.ticketDetails.ticket.responseCount || 0) + 1;
      }

      state.tickets = state.tickets.map((ticket) =>
        ticket.id === ticketId
          ? {
              ...ticket,
              responseCount: (ticket.responseCount || 0) + 1,
              lastResponse: {
                id: response.id,
                createdAt: response.createdAt,
                isStaffResponse: response.isStaffResponse,
              },
              updatedAt: response.createdAt,
            }
          : ticket
      );
    },
    removeOptimisticResponse: (state, action) => {
      const { ticketId, responseId } = action.payload;

      if (state.ticketDetails && state.ticketDetails.ticket.id === ticketId) {
        state.ticketDetails.ticket.responses =
          state.ticketDetails.ticket.responses.filter(
            (response) => response.id !== responseId
          );
      }
    },
    updateTicketPriority: (state, action) => {
      const { ticketId, priority } = action.payload;
      state.tickets = state.tickets.map((ticket) =>
        ticket.id === ticketId ? { ...ticket, priority } : ticket
      );

      if (state.ticketDetails && state.ticketDetails.ticket.id === ticketId) {
        state.ticketDetails.ticket.priority = priority;
      }
    },
    syncTicketFromNotification: (state, action) => {
      const notification = action.payload;

      if (notification.type === "SUPPORT_TICKET_UPDATED" && notification.data) {
        if (notification.data.updateType && notification.data.ticket) {
          const { updateType, ticket, ...additionalData } = notification.data;

          switch (updateType) {
            case "STATUS_UPDATED": {
              state.tickets = state.tickets.map((t) =>
                t.id === ticket.id
                  ? {
                      ...t,
                      status: ticket.status,
                      updatedAt: ticket.updatedAt,
                      resolvedAt: ticket.resolvedAt,
                      resolvedBy: ticket.resolvedBy,
                    }
                  : t
              );

              if (
                state.ticketDetails &&
                state.ticketDetails.ticket.id === ticket.id
              ) {
                state.ticketDetails.ticket = {
                  ...state.ticketDetails.ticket,
                  status: ticket.status,
                  updatedAt: ticket.updatedAt,
                  resolvedAt: ticket.resolvedAt,
                  resolvedBy: ticket.resolvedBy,
                };
              }
              break;
            }

            case "RESPONSE_ADDED": {
              state.tickets = state.tickets.map((t) =>
                t.id === ticket.id
                  ? {
                      ...t,
                      responseCount: ticket.responseCount,
                      updatedAt: ticket.updatedAt,
                      status: ticket.status,
                      lastResponse: {
                        id: additionalData.responseId,
                        createdAt: ticket.updatedAt,
                        isStaffResponse: additionalData.isStaffResponse,
                      },
                    }
                  : t
              );

              if (
                state.ticketDetails &&
                state.ticketDetails.ticket.id === ticket.id
              ) {
                state.ticketDetails.ticket.responseCount = ticket.responseCount;
                state.ticketDetails.ticket.updatedAt = ticket.updatedAt;
                state.ticketDetails.ticket.status = ticket.status;
              }
              break;
            }

            default:
              break;
          }
        }
      } else if (
        notification.type === "SUPPORT_TICKET_CREATED" &&
        notification.data?.ticket
      ) {
        const ticket = notification.data.ticket;
        const existingTicket = state.tickets.find((t) => t.id === ticket.id);

        if (!existingTicket) {
          state.tickets.unshift(ticket);
          state.ticketsPagination = updatePaginationAfterAddition(
            state.ticketsPagination,
            1
          );
        }
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createSupportTicket.pending, (state) => {
        state.createTicketLoading = true;
        state.loading = true;
        state.error = null;
      })
      .addCase(createSupportTicket.fulfilled, (state, action) => {
        state.createTicketLoading = false;
        state.loading = false;

        const newTicket = action.payload.data.ticket;
        state.tickets.unshift({
          ...newTicket,
          responseCount: 0,
          lastResponse: null,
          isOverdue: false,
        });

        state.ticketsPagination = updatePaginationAfterAddition(
          state.ticketsPagination,
          1
        );

        state.needsRefresh = true;
        state.error = null;
      })
      .addCase(createSupportTicket.rejected, (state, action) => {
        state.createTicketLoading = false;
        state.loading = false;
        state.error =
          action.payload?.message || "Failed to create support ticket";
      })

      .addCase(getSupportTickets.pending, (state) => {
        state.ticketsLoading = true;
        state.loading = true;
        state.error = null;
      })
      .addCase(getSupportTickets.fulfilled, (state, action) => {
        state.ticketsLoading = false;
        state.loading = false;
        state.tickets = action.payload.data.tickets || [];
        state.ticketsPagination =
          action.payload.data.pagination || state.ticketsPagination;
        state.ticketsSummary =
          action.payload.data.summary || state.ticketsSummary;
        state.needsRefresh = false;
        state.error = null;
      })
      .addCase(getSupportTickets.rejected, (state, action) => {
        state.ticketsLoading = false;
        state.loading = false;
        state.error =
          action.payload?.message || "Failed to fetch support tickets";
      })

      .addCase(getSupportTicket.pending, (state) => {
        state.ticketDetailsLoading = true;
        state.loading = true;
        state.error = null;
      })
      .addCase(getSupportTicket.fulfilled, (state, action) => {
        state.ticketDetailsLoading = false;
        state.loading = false;
        state.ticketDetails = action.payload.data;
        state.error = null;
      })
      .addCase(getSupportTicket.rejected, (state, action) => {
        state.ticketDetailsLoading = false;
        state.loading = false;
        state.error =
          action.payload?.message || "Failed to fetch ticket details";
      })

      .addCase(addTicketResponse.pending, (state, action) => {
        state.addResponseLoading = true;
        state.loading = true;
        state.error = null;

        const { ticketId, responseData } = action.meta.arg;
        const optimisticResponse = {
          id: `temp_${Date.now()}`,
          message: responseData.message,
          isStaffResponse: false,
          attachments: responseData.attachments?.length || 0,
          createdAt: new Date().toISOString(),
          user: {
            name: "You",
            profileImage: null,
            role: "USER",
          },
        };

        if (state.ticketDetails && state.ticketDetails.ticket.id === ticketId) {
          state.ticketDetails.ticket.responses = [
            ...state.ticketDetails.ticket.responses,
            optimisticResponse,
          ];
          state.ticketDetails.ticket.responseCount =
            (state.ticketDetails.ticket.responseCount || 0) + 1;
        }

        state.tickets = state.tickets.map((ticket) =>
          ticket.id === ticketId
            ? {
                ...ticket,
                responseCount: (ticket.responseCount || 0) + 1,
                lastResponse: {
                  id: optimisticResponse.id,
                  createdAt: optimisticResponse.createdAt,
                  isStaffResponse: optimisticResponse.isStaffResponse,
                },
                updatedAt: optimisticResponse.createdAt,
                status: ticket.status === "RESOLVED" ? "OPEN" : ticket.status,
              }
            : ticket
        );
      })
      .addCase(addTicketResponse.fulfilled, (state, action) => {
        state.addResponseLoading = false;
        state.loading = false;

        const { data, ticketId, optimisticResponse } = action.payload;
        const actualResponse = data.response;

        if (state.ticketDetails && state.ticketDetails.ticket.id === ticketId) {
          state.ticketDetails.ticket.responses =
            state.ticketDetails.ticket.responses.map((response) =>
              response.id === optimisticResponse.id ? actualResponse : response
            );
          state.ticketDetails.ticket.status = data.ticketStatus;
        }

        state.tickets = state.tickets.map((ticket) =>
          ticket.id === ticketId
            ? {
                ...ticket,
                status: data.ticketStatus,
                lastResponse: {
                  id: actualResponse.id,
                  createdAt: actualResponse.createdAt,
                  isStaffResponse: actualResponse.isStaffResponse,
                },
                updatedAt: actualResponse.createdAt,
              }
            : ticket
        );

        state.error = null;
      })
      .addCase(addTicketResponse.rejected, (state, action) => {
        state.addResponseLoading = false;
        state.loading = false;

        const { ticketId, optimisticResponse, originalTicket } = action.payload;

        if (state.ticketDetails && state.ticketDetails.ticket.id === ticketId) {
          state.ticketDetails.ticket.responses =
            state.ticketDetails.ticket.responses.filter(
              (response) => response.id !== optimisticResponse.id
            );
          state.ticketDetails.ticket.responseCount = Math.max(
            0,
            (state.ticketDetails.ticket.responseCount || 1) - 1
          );
        }

        if (originalTicket) {
          state.tickets = state.tickets.map((ticket) =>
            ticket.id === ticketId ? originalTicket : ticket
          );
        } else {
          state.tickets = state.tickets.map((ticket) =>
            ticket.id === ticketId
              ? {
                  ...ticket,
                  responseCount: Math.max(0, (ticket.responseCount || 1) - 1),
                }
              : ticket
          );
        }

        state.error =
          action.payload?.error?.message || "Failed to add response";
      })

      .addCase(updateTicketStatus.pending, (state, action) => {
        state.updateStatusLoading = true;
        state.loading = true;
        state.error = null;

        const { ticketId, status } = action.meta.arg;
        const statusUpper = status.toUpperCase();

        state.tickets = state.tickets.map((ticket) =>
          ticket.id === ticketId
            ? {
                ...ticket,
                status: statusUpper,
                updatedAt: new Date().toISOString(),
                resolvedAt: ["RESOLVED", "CLOSED"].includes(statusUpper)
                  ? new Date().toISOString()
                  : null,
              }
            : ticket
        );

        if (state.ticketDetails && state.ticketDetails.ticket.id === ticketId) {
          state.ticketDetails.ticket = {
            ...state.ticketDetails.ticket,
            status: statusUpper,
            updatedAt: new Date().toISOString(),
            resolvedAt: ["RESOLVED", "CLOSED"].includes(statusUpper)
              ? new Date().toISOString()
              : null,
          };
        }
      })
      .addCase(updateTicketStatus.fulfilled, (state, action) => {
        state.updateStatusLoading = false;
        state.loading = false;

        const { data, ticketId } = action.payload;
        const updatedTicket = data.ticket;

        state.tickets = state.tickets.map((ticket) =>
          ticket.id === ticketId
            ? {
                ...ticket,
                status: updatedTicket.status,
                resolvedAt: updatedTicket.resolvedAt,
                resolvedBy: updatedTicket.resolvedBy,
                updatedAt: updatedTicket.updatedAt,
              }
            : ticket
        );

        if (state.ticketDetails && state.ticketDetails.ticket.id === ticketId) {
          state.ticketDetails.ticket = {
            ...state.ticketDetails.ticket,
            status: updatedTicket.status,
            resolvedAt: updatedTicket.resolvedAt,
            resolvedBy: updatedTicket.resolvedBy,
            updatedAt: updatedTicket.updatedAt,
          };
        }

        state.error = null;
      })
      .addCase(updateTicketStatus.rejected, (state, action) => {
        state.updateStatusLoading = false;
        state.loading = false;

        if (action.payload?.originalTicket) {
          const { ticketId, originalTicket } = action.payload;

          state.tickets = state.tickets.map((ticket) =>
            ticket.id === ticketId ? originalTicket : ticket
          );

          if (
            state.ticketDetails &&
            state.ticketDetails.ticket.id === ticketId
          ) {
            state.ticketDetails.ticket = originalTicket;
          }
        }

        state.error =
          action.payload?.error?.message || "Failed to update ticket status";
      })

      .addCase(getSupportCategories.pending, (state) => {
        state.supportCategoriesLoading = true;
        state.loading = true;
        state.error = null;
      })
      .addCase(getSupportCategories.fulfilled, (state, action) => {
        state.supportCategoriesLoading = false;
        state.loading = false;
        state.supportCategories = action.payload.data;
        state.error = null;
      })
      .addCase(getSupportCategories.rejected, (state, action) => {
        state.supportCategoriesLoading = false;
        state.loading = false;
        state.error =
          action.payload?.message || "Failed to fetch support categories";
      })

      .addCase(getSupportStats.pending, (state) => {
        state.ticketStatsLoading = true;
        state.loading = true;
        state.error = null;
      })
      .addCase(getSupportStats.fulfilled, (state, action) => {
        state.ticketStatsLoading = false;
        state.loading = false;
        state.ticketStats = action.payload.data;
        state.error = null;
      })
      .addCase(getSupportStats.rejected, (state, action) => {
        state.ticketStatsLoading = false;
        state.loading = false;
        state.error =
          action.payload?.message || "Failed to fetch support statistics";
      });
  },
});

export const {
  clearError,
  clearTickets,
  clearTicketDetails,
  clearTicketStats,
  clearSupportCategories,
  setTicketsFilters,
  resetTicketsFilters,
  resetTicketSupportState,
  markForRefresh,
  clearRefreshFlag,
  setSocketConnectionStatus,
  handleSocketTicketUpdate,
  handleSocketTicketResponseUpdate,
  optimisticTicketUpdate,
  optimisticTicketAdd,
  optimisticResponseAdd,
  removeOptimisticResponse,
  updateTicketPriority,
  syncTicketFromNotification,
} = ticketSupportSlice.actions;

const ticketSupportReducer = ticketSupportSlice.reducer;

export default ticketSupportReducer;
