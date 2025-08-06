import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "@/utils/axiosApi";
import { toast } from "sonner";

const initialState = {
  earnings: [],
  earning: null,
  earningsOverview: null,
  earningsStats: null,
  detailedEarnings: [],
  courseEarnings: null,
  payouts: [],
  payout: null,
  payoutHistory: [],
  revenueAnalytics: null,
  paymentBreakdown: null,
  financialReport: null,
  financialDashboard: null,
  paymentDetails: null,
  error: null,
  loading: false,
  getEarningsOverviewLoading: false,
  getEarningsStatsLoading: false,
  getDetailedEarningsLoading: false,
  getCourseEarningsLoading: false,
  requestPayoutLoading: false,
  getPayoutHistoryLoading: false,
  getRevenueAnalyticsLoading: false,
  getPaymentBreakdownLoading: false,
  generateFinancialReportLoading: false,
  updatePaymentDetailsLoading: false,
  getFinancialDashboardLoading: false,
  earningsPagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  },
  payoutsPagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  },
  earningsFilters: {
    search: "",
    status: "",
    startDate: "",
    endDate: "",
    courseId: "",
    sortBy: "createdAt",
    sortOrder: "desc",
  },
  payoutsFilters: {
    status: "",
    startDate: "",
    endDate: "",
    sortBy: "requestedAt",
    sortOrder: "desc",
  },
  earningsSummary: {
    totalEarnings: 0,
    availableBalance: 0,
    currentMonthEarnings: 0,
    yearlyEarnings: 0,
    totalTransactions: 0,
  },
  payoutsSummary: {
    pendingAmount: 0,
    pendingCount: 0,
    totalPaidOut: 0,
    totalPayouts: 0,
  },
  pendingPayoutRequest: null,
  pendingPaymentDetailsUpdate: null,
  pendingRequests: {
    payouts: [],
    updates: {},
  },
  needsRefresh: false,
  optimisticOperations: {
    payouts: [],
    updates: {},
  },
};

export const getEarningsOverview = createAsyncThunk(
  "earning/getEarningsOverview",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get("/instructor/earnings/overview", {
        params,
      });
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(error.response?.data || { message });
    }
  }
);

export const getEarningsStats = createAsyncThunk(
  "earning/getEarningsStats",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get("/instructor/earnings/stats", { params });
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(error.response?.data || { message });
    }
  }
);

export const getDetailedEarnings = createAsyncThunk(
  "earning/getDetailedEarnings",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get("/instructor/earnings/detailed", {
        params,
      });
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(error.response?.data || { message });
    }
  }
);

export const getCourseEarnings = createAsyncThunk(
  "earning/getCourseEarnings",
  async ({ courseId, params = {} }, { rejectWithValue }) => {
    try {
      const response = await api.get(
        `/instructor/earnings/course/${courseId}`,
        { params }
      );
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(error.response?.data || { message });
    }
  }
);

export const requestPayout = createAsyncThunk(
  "earning/requestPayout",
  async (payoutData, { rejectWithValue }) => {
    try {
      const response = await api.post(
        "/instructor/earnings/payout/request",
        payoutData
      );
      toast.success("Payout request submitted successfully");
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue({
        error: error.response?.data || { message },
        originalData: payoutData,
      });
    }
  }
);

export const getPayoutHistory = createAsyncThunk(
  "earning/getPayoutHistory",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get("/instructor/earnings/payout/history", {
        params,
      });
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(error.response?.data || { message });
    }
  }
);

export const getRevenueAnalytics = createAsyncThunk(
  "earning/getRevenueAnalytics",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get("/instructor/earnings/analytics/revenue", {
        params,
      });
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(error.response?.data || { message });
    }
  }
);

export const getPaymentBreakdown = createAsyncThunk(
  "earning/getPaymentBreakdown",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get(
        "/instructor/earnings/breakdown/payments",
        { params }
      );
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(error.response?.data || { message });
    }
  }
);

export const generateFinancialReport = createAsyncThunk(
  "earning/generateFinancialReport",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get("/instructor/earnings/reports/financial", {
        params,
      });
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(error.response?.data || { message });
    }
  }
);

export const updatePaymentDetails = createAsyncThunk(
  "earning/updatePaymentDetails",
  async (paymentDetailsData, { rejectWithValue, getState }) => {
    const state = getState();
    const originalPaymentDetails = state.earning.paymentDetails;

    try {
      const response = await api.put(
        "/instructor/earnings/payment-details",
        paymentDetailsData
      );
      toast.success("Payment details updated successfully");
      return {
        data: response.data,
        updateData: paymentDetailsData,
        originalPaymentDetails,
      };
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue({
        error: error.response?.data || { message },
        originalPaymentDetails,
        updateData: paymentDetailsData,
      });
    }
  }
);

export const getFinancialDashboard = createAsyncThunk(
  "earning/getFinancialDashboard",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get("/instructor/earnings/dashboard", {
        params,
      });
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(error.response?.data || { message });
    }
  }
);

const addToArray = (array, items) => {
  const itemsArray = Array.isArray(items) ? items : [items];
  const newItems = itemsArray.filter((item) => !array.includes(item));
  return [...array, ...newItems];
};

const removeFromArray = (array, items) => {
  const itemsArray = Array.isArray(items) ? items : [items];
  return array.filter((item) => !itemsArray.includes(item));
};

const updatePaginationAfterAddition = (pagination, addedCount) => {
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

const updateEarningsSummaryAfterPayout = (summary, payoutAmount) => {
  return {
    ...summary,
    availableBalance: Math.max(0, summary.availableBalance - payoutAmount),
  };
};

const updatePayoutsSummaryAfterRequest = (summary, payoutAmount) => {
  return {
    ...summary,
    pendingAmount: summary.pendingAmount + payoutAmount,
    pendingCount: summary.pendingCount + 1,
    totalPayouts: summary.totalPayouts + 1,
  };
};

const earningSlice = createSlice({
  name: "earning",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearEarnings: (state) => {
      state.earnings = [];
    },
    clearEarning: (state) => {
      state.earning = null;
    },
    clearEarningsOverview: (state) => {
      state.earningsOverview = null;
    },
    clearEarningsStats: (state) => {
      state.earningsStats = null;
    },
    clearDetailedEarnings: (state) => {
      state.detailedEarnings = [];
    },
    clearCourseEarnings: (state) => {
      state.courseEarnings = null;
    },
    clearPayouts: (state) => {
      state.payouts = [];
    },
    clearPayout: (state) => {
      state.payout = null;
    },
    clearPayoutHistory: (state) => {
      state.payoutHistory = [];
    },
    clearRevenueAnalytics: (state) => {
      state.revenueAnalytics = null;
    },
    clearPaymentBreakdown: (state) => {
      state.paymentBreakdown = null;
    },
    clearFinancialReport: (state) => {
      state.financialReport = null;
    },
    clearFinancialDashboard: (state) => {
      state.financialDashboard = null;
    },
    clearPaymentDetails: (state) => {
      state.paymentDetails = null;
    },
    setEarningsFilters: (state, action) => {
      state.earningsFilters = {
        ...state.earningsFilters,
        ...action.payload,
      };
    },
    resetEarningsFilters: (state) => {
      state.earningsFilters = initialState.earningsFilters;
    },
    setPayoutsFilters: (state, action) => {
      state.payoutsFilters = {
        ...state.payoutsFilters,
        ...action.payload,
      };
    },
    resetPayoutsFilters: (state) => {
      state.payoutsFilters = initialState.payoutsFilters;
    },
    resetEarningState: () => {
      return { ...initialState };
    },
    markForRefresh: (state) => {
      state.needsRefresh = true;
    },
    clearRefreshFlag: (state) => {
      state.needsRefresh = false;
    },
    addToPendingPayoutRequest: (state, action) => {
      state.pendingPayoutRequest = action.payload;
    },
    removeFromPendingPayoutRequest: (state) => {
      state.pendingPayoutRequest = null;
    },
    addToPendingPaymentDetailsUpdate: (state, action) => {
      state.pendingPaymentDetailsUpdate = action.payload;
    },
    removeFromPendingPaymentDetailsUpdate: (state) => {
      state.pendingPaymentDetailsUpdate = null;
    },
    addToPendingPayouts: (state, action) => {
      state.pendingRequests.payouts = addToArray(
        state.pendingRequests.payouts,
        action.payload
      );
    },
    removeFromPendingPayouts: (state, action) => {
      state.pendingRequests.payouts = removeFromArray(
        state.pendingRequests.payouts,
        action.payload
      );
    },
    addToPendingUpdates: (state, action) => {
      const { type, data } = action.payload;
      state.pendingRequests.updates[type] = data;
    },
    removeFromPendingUpdates: (state, action) => {
      const type = action.payload;
      delete state.pendingRequests.updates[type];
    },
    optimisticPayoutAdd: (state, action) => {
      const newPayout = action.payload;
      state.payouts.unshift(newPayout);
      state.payoutsPagination = updatePaginationAfterAddition(
        state.payoutsPagination,
        1
      );
      state.payoutsSummary = updatePayoutsSummaryAfterRequest(
        state.payoutsSummary,
        newPayout.amount
      );
      state.earningsSummary = updateEarningsSummaryAfterPayout(
        state.earningsSummary,
        newPayout.amount
      );
    },
    optimisticPaymentDetailsUpdate: (state, action) => {
      const updatedDetails = action.payload;
      state.paymentDetails = {
        ...state.paymentDetails,
        ...updatedDetails,
        updatedAt: new Date().toISOString(),
      };
    },
    revertOptimisticUpdates: (state, action) => {
      const { type, data } = action.payload;

      switch (type) {
        case "payout":
          if (data.originalPayout) {
            const tempId = state.optimisticOperations.payouts[0];
            state.payouts = state.payouts.filter((p) => p.id !== tempId);
            state.payoutsPagination = {
              ...state.payoutsPagination,
              total: Math.max(0, state.payoutsPagination.total - 1),
            };
            state.payoutsSummary = {
              ...state.payoutsSummary,
              pendingAmount: Math.max(
                0,
                state.payoutsSummary.pendingAmount - data.originalData.amount
              ),
              pendingCount: Math.max(0, state.payoutsSummary.pendingCount - 1),
              totalPayouts: Math.max(0, state.payoutsSummary.totalPayouts - 1),
            };
            state.earningsSummary = {
              ...state.earningsSummary,
              availableBalance:
                state.earningsSummary.availableBalance +
                data.originalData.amount,
            };
          }
          break;
        case "paymentDetails":
          if (data.originalPaymentDetails) {
            state.paymentDetails = data.originalPaymentDetails;
          }
          break;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getEarningsOverview.pending, (state) => {
        state.getEarningsOverviewLoading = true;
        state.loading = true;
        state.error = null;
      })
      .addCase(getEarningsOverview.fulfilled, (state, action) => {
        state.getEarningsOverviewLoading = false;
        state.loading = false;
        state.error = null;
        state.earningsOverview = action.payload.data;
        if (action.payload.data.summary) {
          state.earningsSummary = {
            ...state.earningsSummary,
            ...action.payload.data.summary,
          };
        }
        if (action.payload.data.payouts) {
          state.payoutsSummary = {
            ...state.payoutsSummary,
            ...action.payload.data.payouts,
          };
        }
      })
      .addCase(getEarningsOverview.rejected, (state, action) => {
        state.getEarningsOverviewLoading = false;
        state.loading = false;
        state.error =
          action.payload?.message || "Failed to fetch earnings overview";
      })

      .addCase(getEarningsStats.pending, (state) => {
        state.getEarningsStatsLoading = true;
        state.loading = true;
        state.error = null;
      })
      .addCase(getEarningsStats.fulfilled, (state, action) => {
        state.getEarningsStatsLoading = false;
        state.loading = false;
        state.error = null;
        state.earningsStats = action.payload.data;
      })
      .addCase(getEarningsStats.rejected, (state, action) => {
        state.getEarningsStatsLoading = false;
        state.loading = false;
        state.error =
          action.payload?.message || "Failed to fetch earnings statistics";
      })

      .addCase(getDetailedEarnings.pending, (state) => {
        state.getDetailedEarningsLoading = true;
        state.loading = true;
        state.error = null;
      })
      .addCase(getDetailedEarnings.fulfilled, (state, action) => {
        state.getDetailedEarningsLoading = false;
        state.loading = false;
        state.error = null;
        state.detailedEarnings = action.payload.data.earnings || [];
        state.earningsPagination =
          action.payload.data.pagination || state.earningsPagination;
        if (action.payload.data.summary) {
          state.earningsSummary = {
            ...state.earningsSummary,
            ...action.payload.data.summary,
          };
        }
      })
      .addCase(getDetailedEarnings.rejected, (state, action) => {
        state.getDetailedEarningsLoading = false;
        state.loading = false;
        state.error =
          action.payload?.message || "Failed to fetch detailed earnings";
      })

      .addCase(getCourseEarnings.pending, (state) => {
        state.getCourseEarningsLoading = true;
        state.loading = true;
        state.error = null;
      })
      .addCase(getCourseEarnings.fulfilled, (state, action) => {
        state.getCourseEarningsLoading = false;
        state.loading = false;
        state.error = null;
        state.courseEarnings = action.payload.data;
      })
      .addCase(getCourseEarnings.rejected, (state, action) => {
        state.getCourseEarningsLoading = false;
        state.loading = false;
        state.error =
          action.payload?.message || "Failed to fetch course earnings";
      })

      .addCase(requestPayout.pending, (state, action) => {
        state.requestPayoutLoading = true;
        state.loading = true;
        state.error = null;

        const payoutData = action.meta.arg;
        const tempPayout = {
          id: `temp_${Date.now()}`,
          amount: payoutData.amount,
          currency: payoutData.currency || "INR",
          status: "PENDING",
          requestedAt: new Date().toISOString(),
          reference: `temp_ref_${Date.now()}`,
        };

        state.pendingPayoutRequest = tempPayout;
        state.payouts.unshift(tempPayout);
        state.payoutsPagination = updatePaginationAfterAddition(
          state.payoutsPagination,
          1
        );
        state.payoutsSummary = updatePayoutsSummaryAfterRequest(
          state.payoutsSummary,
          payoutData.amount
        );
        state.earningsSummary = updateEarningsSummaryAfterPayout(
          state.earningsSummary,
          payoutData.amount
        );
        state.optimisticOperations.payouts.push(tempPayout.id);
      })
      .addCase(requestPayout.fulfilled, (state, action) => {
        state.requestPayoutLoading = false;
        state.loading = false;
        state.error = null;

        const newPayout = action.payload.data.payout;
        const tempId = state.optimisticOperations.payouts[0];

        state.payouts = state.payouts.map((payout) =>
          payout.id === tempId ? newPayout : payout
        );

        state.pendingPayoutRequest = null;
        state.optimisticOperations.payouts = [];
      })
      .addCase(requestPayout.rejected, (state, action) => {
        state.requestPayoutLoading = false;
        state.loading = false;
        state.error =
          action.payload?.error?.message || "Failed to request payout";

        const tempId = state.optimisticOperations.payouts[0];
        const originalAmount = action.payload?.originalData?.amount || 0;

        if (tempId) {
          state.payouts = state.payouts.filter((p) => p.id !== tempId);
          state.payoutsPagination = {
            ...state.payoutsPagination,
            total: Math.max(0, state.payoutsPagination.total - 1),
          };
          state.payoutsSummary = {
            ...state.payoutsSummary,
            pendingAmount: Math.max(
              0,
              state.payoutsSummary.pendingAmount - originalAmount
            ),
            pendingCount: Math.max(0, state.payoutsSummary.pendingCount - 1),
            totalPayouts: Math.max(0, state.payoutsSummary.totalPayouts - 1),
          };
          state.earningsSummary = {
            ...state.earningsSummary,
            availableBalance:
              state.earningsSummary.availableBalance + originalAmount,
          };
        }

        state.pendingPayoutRequest = null;
        state.optimisticOperations.payouts = [];
      })

      .addCase(getPayoutHistory.pending, (state) => {
        state.getPayoutHistoryLoading = true;
        state.loading = true;
        state.error = null;
      })
      .addCase(getPayoutHistory.fulfilled, (state, action) => {
        state.getPayoutHistoryLoading = false;
        state.loading = false;
        state.error = null;
        state.payoutHistory = action.payload.data.payouts || [];
        state.payoutsPagination =
          action.payload.data.pagination || state.payoutsPagination;
        if (action.payload.data.summary) {
          state.payoutsSummary = {
            ...state.payoutsSummary,
            ...action.payload.data.summary,
          };
        }
      })
      .addCase(getPayoutHistory.rejected, (state, action) => {
        state.getPayoutHistoryLoading = false;
        state.loading = false;
        state.error =
          action.payload?.message || "Failed to fetch payout history";
      })

      .addCase(getRevenueAnalytics.pending, (state) => {
        state.getRevenueAnalyticsLoading = true;
        state.loading = true;
        state.error = null;
      })
      .addCase(getRevenueAnalytics.fulfilled, (state, action) => {
        state.getRevenueAnalyticsLoading = false;
        state.loading = false;
        state.error = null;
        state.revenueAnalytics = action.payload.data;
      })
      .addCase(getRevenueAnalytics.rejected, (state, action) => {
        state.getRevenueAnalyticsLoading = false;
        state.loading = false;
        state.error =
          action.payload?.message || "Failed to fetch revenue analytics";
      })

      .addCase(getPaymentBreakdown.pending, (state) => {
        state.getPaymentBreakdownLoading = true;
        state.loading = true;
        state.error = null;
      })
      .addCase(getPaymentBreakdown.fulfilled, (state, action) => {
        state.getPaymentBreakdownLoading = false;
        state.loading = false;
        state.error = null;
        state.paymentBreakdown = action.payload.data;
      })
      .addCase(getPaymentBreakdown.rejected, (state, action) => {
        state.getPaymentBreakdownLoading = false;
        state.loading = false;
        state.error =
          action.payload?.message || "Failed to fetch payment breakdown";
      })

      .addCase(generateFinancialReport.pending, (state) => {
        state.generateFinancialReportLoading = true;
        state.loading = true;
        state.error = null;
      })
      .addCase(generateFinancialReport.fulfilled, (state, action) => {
        state.generateFinancialReportLoading = false;
        state.loading = false;
        state.error = null;
        state.financialReport = action.payload.data;
      })
      .addCase(generateFinancialReport.rejected, (state, action) => {
        state.generateFinancialReportLoading = false;
        state.loading = false;
        state.error =
          action.payload?.message || "Failed to generate financial report";
      })

      .addCase(updatePaymentDetails.pending, (state, action) => {
        state.updatePaymentDetailsLoading = true;
        state.loading = true;
        state.error = null;

        const updatedDetails = action.meta.arg.paymentDetails;
        state.pendingPaymentDetailsUpdate = updatedDetails;

        state.paymentDetails = {
          ...state.paymentDetails,
          ...updatedDetails,
          updatedAt: new Date().toISOString(),
        };

        state.optimisticOperations.updates.paymentDetails = updatedDetails;
      })
      .addCase(updatePaymentDetails.fulfilled, (state, action) => {
        state.updatePaymentDetailsLoading = false;
        state.loading = false;
        state.error = null;

        const updatedPaymentDetails = action.payload.data.data.paymentDetails;
        state.paymentDetails = updatedPaymentDetails;
        state.pendingPaymentDetailsUpdate = null;
        delete state.optimisticOperations.updates.paymentDetails;
      })
      .addCase(updatePaymentDetails.rejected, (state, action) => {
        state.updatePaymentDetailsLoading = false;
        state.loading = false;
        state.error =
          action.payload?.error?.message || "Failed to update payment details";

        const { originalPaymentDetails } = action.payload;
        if (originalPaymentDetails) {
          state.paymentDetails = originalPaymentDetails;
        }

        state.pendingPaymentDetailsUpdate = null;
        delete state.optimisticOperations.updates.paymentDetails;
      })

      .addCase(getFinancialDashboard.pending, (state) => {
        state.getFinancialDashboardLoading = true;
        state.loading = true;
        state.error = null;
      })
      .addCase(getFinancialDashboard.fulfilled, (state, action) => {
        state.getFinancialDashboardLoading = false;
        state.loading = false;
        state.error = null;
        state.financialDashboard = action.payload.data;
        if (action.payload.data.quickStats) {
          state.earningsSummary = {
            ...state.earningsSummary,
            currentMonthEarnings:
              action.payload.data.quickStats.last30DaysEarningsRaw || 0,
            totalTransactions:
              action.payload.data.quickStats.totalStudents || 0,
          };
        }
      })
      .addCase(getFinancialDashboard.rejected, (state, action) => {
        state.getFinancialDashboardLoading = false;
        state.loading = false;
        state.error =
          action.payload?.message || "Failed to fetch financial dashboard";
      });
  },
});

export const {
  clearError,
  clearEarnings,
  clearEarning,
  clearEarningsOverview,
  clearEarningsStats,
  clearDetailedEarnings,
  clearCourseEarnings,
  clearPayouts,
  clearPayout,
  clearPayoutHistory,
  clearRevenueAnalytics,
  clearPaymentBreakdown,
  clearFinancialReport,
  clearFinancialDashboard,
  clearPaymentDetails,
  setEarningsFilters,
  resetEarningsFilters,
  setPayoutsFilters,
  resetPayoutsFilters,
  resetEarningState,
  markForRefresh,
  clearRefreshFlag,
  addToPendingPayoutRequest,
  removeFromPendingPayoutRequest,
  addToPendingPaymentDetailsUpdate,
  removeFromPendingPaymentDetailsUpdate,
  addToPendingPayouts,
  removeFromPendingPayouts,
  addToPendingUpdates,
  removeFromPendingUpdates,
  optimisticPayoutAdd,
  optimisticPaymentDetailsUpdate,
  revertOptimisticUpdates,
} = earningSlice.actions;

const earningReducer = earningSlice.reducer;

export default earningReducer;
