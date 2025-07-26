import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "@/utils/axiosApi";
import { toast } from "sonner";

const initialState = {
  transactions: [],
  transactionDetails: null,
  payouts: [],
  revenueOverview: null,
  financialAnalytics: null,
  paymentStats: null,
  error: null,
  loading: false,
  transactionsLoading: false,
  transactionDetailsLoading: false,
  processRefundLoading: false,
  payoutsLoading: false,
  processPayoutLoading: false,
  revenueOverviewLoading: false,
  financialAnalyticsLoading: false,
  paymentStatsLoading: false,
  needsRefresh: false,
  transactionsPagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  },
  transactionsFilters: {
    status: "",
    method: "",
    gateway: "",
    dateFrom: "",
    dateTo: "",
    minAmount: "",
    maxAmount: "",
    search: "",
    sortBy: "createdAt",
    sortOrder: "desc",
  },
  payoutsPagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  },
  payoutsFilters: {
    status: "",
    dateFrom: "",
    dateTo: "",
    minAmount: "",
    maxAmount: "",
    instructorId: "",
    sortBy: "createdAt",
    sortOrder: "desc",
  },
};

export const getAllTransactions = createAsyncThunk(
  "adminPayment/getAllTransactions",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get("/admin/payments/transactions", {
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

export const getTransactionDetails = createAsyncThunk(
  "adminPayment/getTransactionDetails",
  async (transactionId, { rejectWithValue }) => {
    try {
      const response = await api.get(
        `/admin/payments/transactions/${transactionId}`
      );
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(error.response?.data || { message });
    }
  }
);

export const processRefund = createAsyncThunk(
  "adminPayment/processRefund",
  async ({ transactionId, refundData }, { rejectWithValue, getState }) => {
    const state = getState();
    const existingTransaction = state.adminPayment.transactions.find(
      (t) => t.id === transactionId
    );

    const optimisticUpdate = {
      ...existingTransaction,
      refundAmount:
        parseFloat(existingTransaction?.refundAmount || 0) +
        parseFloat(refundData.refundAmount),
      status:
        parseFloat(existingTransaction?.refundAmount || 0) +
          parseFloat(refundData.refundAmount) >=
        parseFloat(existingTransaction?.amount || 0)
          ? "REFUNDED"
          : "PARTIALLY_REFUNDED",
      refundedAt: new Date().toISOString(),
      refundReason: refundData.refundReason,
      updatedAt: new Date().toISOString(),
    };

    try {
      const response = await api.post(
        `/admin/payments/transactions/${transactionId}/refund`,
        refundData
      );
      toast.success(response.data.message);
      return {
        data: response.data.data,
        transactionId,
        optimisticUpdate,
      };
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue({
        error: error.response?.data || { message },
        transactionId,
        originalTransaction: existingTransaction,
      });
    }
  }
);

export const getAllPayouts = createAsyncThunk(
  "adminPayment/getAllPayouts",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get("/admin/payments/payouts", { params });
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(error.response?.data || { message });
    }
  }
);

export const processPayout = createAsyncThunk(
  "adminPayment/processPayout",
  async (payoutId, { rejectWithValue, getState }) => {
    const state = getState();
    const existingPayout = state.adminPayment.payouts.find(
      (p) => p.id === payoutId
    );

    const optimisticUpdate = {
      ...existingPayout,
      status: "COMPLETED",
      processedAt: new Date().toISOString(),
      gatewayId: `payout_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`,
    };

    try {
      const response = await api.post(
        `/admin/payments/payouts/${payoutId}/process`
      );
      toast.success(response.data.message);
      return {
        data: response.data.data,
        payoutId,
        optimisticUpdate,
      };
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue({
        error: error.response?.data || { message },
        payoutId,
        originalPayout: existingPayout,
      });
    }
  }
);

export const getRevenueOverview = createAsyncThunk(
  "adminPayment/getRevenueOverview",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get("/admin/payments/revenue/overview", {
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

export const getFinancialAnalytics = createAsyncThunk(
  "adminPayment/getFinancialAnalytics",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get("/admin/payments/analytics", { params });
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(error.response?.data || { message });
    }
  }
);

export const getPaymentStats = createAsyncThunk(
  "adminPayment/getPaymentStats",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/admin/payments/stats");
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(error.response?.data || { message });
    }
  }
);

const adminPaymentSlice = createSlice({
  name: "adminPayment",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearTransactions: (state) => {
      state.transactions = [];
    },
    clearTransactionDetails: (state) => {
      state.transactionDetails = null;
    },
    clearPayouts: (state) => {
      state.payouts = [];
    },
    clearRevenueOverview: (state) => {
      state.revenueOverview = null;
    },
    clearFinancialAnalytics: (state) => {
      state.financialAnalytics = null;
    },
    clearPaymentStats: (state) => {
      state.paymentStats = null;
    },
    setTransactionsFilters: (state, action) => {
      state.transactionsFilters = {
        ...state.transactionsFilters,
        ...action.payload,
      };
    },
    resetTransactionsFilters: (state) => {
      state.transactionsFilters = initialState.transactionsFilters;
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
    resetAdminPaymentState: () => {
      return { ...initialState };
    },
    markForRefresh: (state) => {
      state.needsRefresh = true;
    },
    clearRefreshFlag: (state) => {
      state.needsRefresh = false;
    },
    optimisticTransactionUpdate: (state, action) => {
      const { transactionId, updates } = action.payload;
      state.transactions = state.transactions.map((transaction) =>
        transaction.id === transactionId
          ? { ...transaction, ...updates }
          : transaction
      );

      if (
        state.transactionDetails &&
        state.transactionDetails.id === transactionId
      ) {
        state.transactionDetails = {
          ...state.transactionDetails,
          ...updates,
        };
      }
    },
    optimisticPayoutUpdate: (state, action) => {
      const { payoutId, updates } = action.payload;
      state.payouts = state.payouts.map((payout) =>
        payout.id === payoutId ? { ...payout, ...updates } : payout
      );
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getAllTransactions.pending, (state) => {
        state.transactionsLoading = true;
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllTransactions.fulfilled, (state, action) => {
        state.transactionsLoading = false;
        state.loading = false;
        state.transactions = action.payload.data.transactions || [];
        state.transactionsPagination =
          action.payload.data.pagination || state.transactionsPagination;
        state.transactionsFilters = {
          ...state.transactionsFilters,
          ...action.payload.data.filters,
        };
        state.needsRefresh = false;
        state.error = null;
      })
      .addCase(getAllTransactions.rejected, (state, action) => {
        state.transactionsLoading = false;
        state.loading = false;
        state.error = action.payload?.message || "Failed to fetch transactions";
      })

      .addCase(getTransactionDetails.pending, (state) => {
        state.transactionDetailsLoading = true;
        state.loading = true;
        state.error = null;
      })
      .addCase(getTransactionDetails.fulfilled, (state, action) => {
        state.transactionDetailsLoading = false;
        state.loading = false;
        state.transactionDetails = action.payload.data;
        state.error = null;
      })
      .addCase(getTransactionDetails.rejected, (state, action) => {
        state.transactionDetailsLoading = false;
        state.loading = false;
        state.error =
          action.payload?.message || "Failed to fetch transaction details";
      })

      .addCase(processRefund.pending, (state, action) => {
        state.processRefundLoading = true;
        state.loading = true;
        state.error = null;

        const { transactionId, refundData } = action.meta.arg;
        const existingTransaction = state.transactions.find(
          (t) => t.id === transactionId
        );

        if (existingTransaction) {
          const newRefundAmount =
            parseFloat(existingTransaction.refundAmount || 0) +
            parseFloat(refundData.refundAmount);
          const newStatus =
            newRefundAmount >= parseFloat(existingTransaction.amount || 0)
              ? "REFUNDED"
              : "PARTIALLY_REFUNDED";

          state.transactions = state.transactions.map((transaction) =>
            transaction.id === transactionId
              ? {
                  ...transaction,
                  refundAmount: newRefundAmount,
                  status: newStatus,
                  refundedAt: new Date().toISOString(),
                  refundReason: refundData.refundReason,
                  updatedAt: new Date().toISOString(),
                }
              : transaction
          );

          if (
            state.transactionDetails &&
            state.transactionDetails.id === transactionId
          ) {
            state.transactionDetails = {
              ...state.transactionDetails,
              refundAmount: newRefundAmount,
              status: newStatus,
              refundedAt: new Date().toISOString(),
              refundReason: refundData.refundReason,
              updatedAt: new Date().toISOString(),
            };
          }
        }
      })
      .addCase(processRefund.fulfilled, (state, action) => {
        state.processRefundLoading = false;
        state.loading = false;

        const { transactionId, data } = action.payload;

        state.transactions = state.transactions.map((transaction) =>
          transaction.id === transactionId
            ? {
                ...transaction,
                refundAmount: data.totalRefunded,
                status: data.status,
                refundedAt: data.refundedAt,
                updatedAt: new Date().toISOString(),
              }
            : transaction
        );

        if (
          state.transactionDetails &&
          state.transactionDetails.id === transactionId
        ) {
          state.transactionDetails = {
            ...state.transactionDetails,
            refundAmount: data.totalRefunded,
            status: data.status,
            refundedAt: data.refundedAt,
            updatedAt: new Date().toISOString(),
          };
        }

        state.error = null;
      })
      .addCase(processRefund.rejected, (state, action) => {
        state.processRefundLoading = false;
        state.loading = false;

        if (action.payload?.originalTransaction) {
          state.transactions = state.transactions.map((transaction) =>
            transaction.id === action.payload.originalTransaction.id
              ? action.payload.originalTransaction
              : transaction
          );

          if (
            state.transactionDetails &&
            state.transactionDetails.id ===
              action.payload.originalTransaction.id
          ) {
            state.transactionDetails = action.payload.originalTransaction;
          }
        }

        state.error =
          action.payload?.error?.message || "Failed to process refund";
      })

      .addCase(getAllPayouts.pending, (state) => {
        state.payoutsLoading = true;
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllPayouts.fulfilled, (state, action) => {
        state.payoutsLoading = false;
        state.loading = false;
        state.payouts = action.payload.data.payouts || [];
        state.payoutsPagination =
          action.payload.data.pagination || state.payoutsPagination;
        state.payoutsFilters = {
          ...state.payoutsFilters,
          ...action.payload.data.filters,
        };
        state.error = null;
      })
      .addCase(getAllPayouts.rejected, (state, action) => {
        state.payoutsLoading = false;
        state.loading = false;
        state.error = action.payload?.message || "Failed to fetch payouts";
      })

      .addCase(processPayout.pending, (state, action) => {
        state.processPayoutLoading = true;
        state.loading = true;
        state.error = null;

        const payoutId = action.meta.arg;

        state.payouts = state.payouts.map((payout) =>
          payout.id === payoutId
            ? {
                ...payout,
                status: "COMPLETED",
                processedAt: new Date().toISOString(),
                gatewayId: `payout_${Date.now()}_${Math.random()
                  .toString(36)
                  .substr(2, 9)}`,
              }
            : payout
        );
      })
      .addCase(processPayout.fulfilled, (state, action) => {
        state.processPayoutLoading = false;
        state.loading = false;

        const { payoutId, data } = action.payload;

        state.payouts = state.payouts.map((payout) =>
          payout.id === payoutId
            ? {
                ...payout,
                status: data.status,
                processedAt: data.processedAt,
                gatewayId: data.gatewayId,
              }
            : payout
        );

        state.error = null;
      })
      .addCase(processPayout.rejected, (state, action) => {
        state.processPayoutLoading = false;
        state.loading = false;

        if (action.payload?.originalPayout) {
          state.payouts = state.payouts.map((payout) =>
            payout.id === action.payload.originalPayout.id
              ? action.payload.originalPayout
              : payout
          );
        }

        state.error =
          action.payload?.error?.message || "Failed to process payout";
      })

      .addCase(getRevenueOverview.pending, (state) => {
        state.revenueOverviewLoading = true;
        state.loading = true;
        state.error = null;
      })
      .addCase(getRevenueOverview.fulfilled, (state, action) => {
        state.revenueOverviewLoading = false;
        state.loading = false;
        state.revenueOverview = action.payload.data;
        state.error = null;
      })
      .addCase(getRevenueOverview.rejected, (state, action) => {
        state.revenueOverviewLoading = false;
        state.loading = false;
        state.error =
          action.payload?.message || "Failed to fetch revenue overview";
      })

      .addCase(getFinancialAnalytics.pending, (state) => {
        state.financialAnalyticsLoading = true;
        state.loading = true;
        state.error = null;
      })
      .addCase(getFinancialAnalytics.fulfilled, (state, action) => {
        state.financialAnalyticsLoading = false;
        state.loading = false;
        state.financialAnalytics = action.payload.data;
        state.error = null;
      })
      .addCase(getFinancialAnalytics.rejected, (state, action) => {
        state.financialAnalyticsLoading = false;
        state.loading = false;
        state.error =
          action.payload?.message || "Failed to fetch financial analytics";
      })

      .addCase(getPaymentStats.pending, (state) => {
        state.paymentStatsLoading = true;
        state.loading = true;
        state.error = null;
      })
      .addCase(getPaymentStats.fulfilled, (state, action) => {
        state.paymentStatsLoading = false;
        state.loading = false;
        state.paymentStats = action.payload.data;
        state.error = null;
      })
      .addCase(getPaymentStats.rejected, (state, action) => {
        state.paymentStatsLoading = false;
        state.loading = false;
        state.error =
          action.payload?.message || "Failed to fetch payment statistics";
      });
  },
});

export const {
  clearError,
  clearTransactions,
  clearTransactionDetails,
  clearPayouts,
  clearRevenueOverview,
  clearFinancialAnalytics,
  clearPaymentStats,
  setTransactionsFilters,
  resetTransactionsFilters,
  setPayoutsFilters,
  resetPayoutsFilters,
  resetAdminPaymentState,
  markForRefresh,
  clearRefreshFlag,
  optimisticTransactionUpdate,
  optimisticPayoutUpdate,
} = adminPaymentSlice.actions;

const adminPaymentReducer = adminPaymentSlice.reducer;

export default adminPaymentReducer;
