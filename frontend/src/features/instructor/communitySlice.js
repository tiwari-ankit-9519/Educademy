import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "@/utils/axiosApi";
import { toast } from "sonner";

const initialState = {
  reviews: [],
  qnaQuestions: [],
  currentReview: null,
  currentQuestion: null,
  communityOverview: null,
  error: null,
  loading: false,
  getQnAQuestionsLoading: false,
  answerQuestionLoading: false,
  updateAnswerLoading: false,
  deleteAnswerLoading: false,
  getCourseReviewsLoading: false,
  replyToReviewLoading: false,
  updateReplyLoading: false,
  deleteReplyLoading: false,
  getCommunityOverviewLoading: false,
  bulkAnswerQuestionsLoading: false,
  markQuestionAsResolvedLoading: false,
  reviewsPagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  },
  qnaPagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  },
  reviewsFilters: {
    search: "",
    rating: "",
    sortBy: "createdAt",
    sortOrder: "desc",
    hasReply: "",
  },
  qnaFilters: {
    search: "",
    status: "",
    sortBy: "createdAt",
    sortOrder: "desc",
    isResolved: "",
  },
  reviewsStats: {
    totalReviews: 0,
    repliedReviews: 0,
    unrepliedReviews: 0,
    replyRate: 0,
  },
  qnaStats: {
    totalQuestions: 0,
    answeredQuestions: 0,
    unansweredQuestions: 0,
    responseRate: 0,
  },
  pendingAnswers: {},
  pendingUpdateAnswers: {},
  pendingDeleteAnswers: [],
  pendingReplies: {},
  pendingUpdateReplies: {},
  pendingDeleteReplies: [],
  pendingBulkAnswers: [],
  needsRefresh: false,
  optimisticOperations: {
    answerCreates: {},
    answerUpdates: {},
    answerDeletes: [],
    replyCreates: {},
    replyUpdates: {},
    replyDeletes: [],
    bulkAnswers: [],
  },
};

export const getQnAQuestions = createAsyncThunk(
  "instructorCommunity/getQnAQuestions",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get("/instructor/community/qna/questions", {
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

export const answerQuestion = createAsyncThunk(
  "instructorCommunity/answerQuestion",
  async ({ questionId, answerData }, { rejectWithValue, getState }) => {
    const state = getState();
    const originalQuestion = state.instructorCommunity.qnaQuestions.find(
      (q) => q.id === questionId
    );

    try {
      const response = await api.post(
        `/instructor/community/qna/questions/${questionId}/answer`,
        answerData
      );
      toast.success("Answer posted successfully");
      return {
        data: response.data,
        questionId,
        answerData,
        originalQuestion,
      };
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue({
        error: error.response?.data || { message },
        questionId,
        answerData,
        originalQuestion,
      });
    }
  }
);

export const updateAnswer = createAsyncThunk(
  "instructorCommunity/updateAnswer",
  async ({ answerId, updateData }, { rejectWithValue, getState }) => {
    const state = getState();
    const originalAnswer =
      state.instructorCommunity.pendingUpdateAnswers[answerId];

    try {
      const response = await api.put(
        `/instructor/community/qna/answers/${answerId}`,
        updateData
      );
      toast.success("Answer updated successfully");
      return {
        data: response.data,
        answerId,
        updateData,
        originalAnswer,
      };
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue({
        error: error.response?.data || { message },
        answerId,
        updateData,
        originalAnswer,
      });
    }
  }
);

export const deleteAnswer = createAsyncThunk(
  "instructorCommunity/deleteAnswer",
  async (answerId, { rejectWithValue, getState }) => {
    const state = getState();
    const originalAnswer = state.instructorCommunity.qnaQuestions
      .flatMap((q) => q.answers || [])
      .find((a) => a.id === answerId);

    try {
      const response = await api.delete(
        `/instructor/community/qna/answers/${answerId}`
      );
      toast.success("Answer deleted successfully");
      return {
        data: response.data,
        answerId,
        originalAnswer,
      };
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue({
        error: error.response?.data || { message },
        answerId,
        originalAnswer,
      });
    }
  }
);

export const getCourseReviews = createAsyncThunk(
  "instructorCommunity/getCourseReviews",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get("/instructor/community/reviews", {
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

export const replyToReview = createAsyncThunk(
  "instructorCommunity/replyToReview",
  async ({ reviewId, replyData }, { rejectWithValue, getState }) => {
    const state = getState();
    const originalReview = state.instructorCommunity.reviews.find(
      (r) => r.id === reviewId
    );

    try {
      const response = await api.post(
        `/instructor/community/reviews/${reviewId}/reply`,
        replyData
      );
      toast.success("Reply posted successfully");
      return {
        data: response.data,
        reviewId,
        replyData,
        originalReview,
      };
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue({
        error: error.response?.data || { message },
        reviewId,
        replyData,
        originalReview,
      });
    }
  }
);

export const updateReply = createAsyncThunk(
  "instructorCommunity/updateReply",
  async ({ replyId, updateData }, { rejectWithValue, getState }) => {
    const state = getState();
    const originalReply =
      state.instructorCommunity.pendingUpdateReplies[replyId];

    try {
      const response = await api.put(
        `/instructor/community/reviews/replies/${replyId}`,
        updateData
      );
      toast.success("Reply updated successfully");
      return {
        data: response.data,
        replyId,
        updateData,
        originalReply,
      };
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue({
        error: error.response?.data || { message },
        replyId,
        updateData,
        originalReply,
      });
    }
  }
);

export const deleteReply = createAsyncThunk(
  "instructorCommunity/deleteReply",
  async (replyId, { rejectWithValue, getState }) => {
    const state = getState();
    const originalReply = state.instructorCommunity.reviews
      .flatMap((r) => r.replies || [])
      .find((reply) => reply.id === replyId);

    try {
      const response = await api.delete(
        `/instructor/community/reviews/replies/${replyId}`
      );
      toast.success("Reply deleted successfully");
      return {
        data: response.data,
        replyId,
        originalReply,
      };
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue({
        error: error.response?.data || { message },
        replyId,
        originalReply,
      });
    }
  }
);

export const getCommunityOverview = createAsyncThunk(
  "instructorCommunity/getCommunityOverview",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/instructor/community/overview");
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(error.response?.data || { message });
    }
  }
);

export const bulkAnswerQuestions = createAsyncThunk(
  "instructorCommunity/bulkAnswerQuestions",
  async (answersData, { rejectWithValue }) => {
    try {
      const response = await api.post(
        "/instructor/community/qna/bulk-answer",
        answersData
      );
      toast.success("Questions answered successfully");
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue({
        error: error.response?.data || { message },
        answersData,
      });
    }
  }
);

export const markQuestionAsResolved = createAsyncThunk(
  "instructorCommunity/markQuestionAsResolved",
  async ({ questionId, isResolved }, { rejectWithValue, getState }) => {
    const state = getState();
    const originalQuestion = state.instructorCommunity.qnaQuestions.find(
      (q) => q.id === questionId
    );

    try {
      const response = await api.patch(
        `/instructor/community/qna/questions/${questionId}/resolve`,
        {
          isResolved,
        }
      );
      toast.success(
        `Question marked as ${isResolved ? "resolved" : "unresolved"}`
      );
      return {
        data: response.data,
        questionId,
        isResolved,
        originalQuestion,
      };
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue({
        error: error.response?.data || { message },
        questionId,
        isResolved,
        originalQuestion,
      });
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

const updateQnAStatsAfterAnswer = (stats) => {
  return {
    ...stats,
    answeredQuestions: stats.answeredQuestions + 1,
    unansweredQuestions: Math.max(0, stats.unansweredQuestions - 1),
    responseRate: stats.totalQuestions
      ? Math.round(((stats.answeredQuestions + 1) / stats.totalQuestions) * 100)
      : 0,
  };
};

const updateReviewStatsAfterReply = (stats) => {
  return {
    ...stats,
    repliedReviews: stats.repliedReviews + 1,
    unrepliedReviews: Math.max(0, stats.unrepliedReviews - 1),
    replyRate: stats.totalReviews
      ? Math.round(((stats.repliedReviews + 1) / stats.totalReviews) * 100)
      : 0,
  };
};

const instructorCommunitySlice = createSlice({
  name: "instructorCommunity",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearReviews: (state) => {
      state.reviews = [];
    },
    clearQnAQuestions: (state) => {
      state.qnaQuestions = [];
    },
    clearCurrentReview: (state) => {
      state.currentReview = null;
    },
    clearCurrentQuestion: (state) => {
      state.currentQuestion = null;
    },
    clearCommunityOverview: (state) => {
      state.communityOverview = null;
    },
    setReviewsFilters: (state, action) => {
      state.reviewsFilters = {
        ...state.reviewsFilters,
        ...action.payload,
      };
    },
    setQnAFilters: (state, action) => {
      state.qnaFilters = {
        ...state.qnaFilters,
        ...action.payload,
      };
    },
    resetReviewsFilters: (state) => {
      state.reviewsFilters = initialState.reviewsFilters;
    },
    resetQnAFilters: (state) => {
      state.qnaFilters = initialState.qnaFilters;
    },
    resetCommunityState: () => {
      return { ...initialState };
    },
    markForRefresh: (state) => {
      state.needsRefresh = true;
    },
    clearRefreshFlag: (state) => {
      state.needsRefresh = false;
    },
    optimisticAnswerUpdate: (state, action) => {
      const { questionId, answer } = action.payload;

      state.qnaQuestions = state.qnaQuestions.map((question) =>
        question.id === questionId
          ? {
              ...question,
              myAnswer: answer,
              hasMyAnswer: true,
              totalAnswers: (question.totalAnswers || 0) + 1,
              isResolved: answer.isAccepted || question.isResolved,
            }
          : question
      );

      if (state.currentQuestion && state.currentQuestion.id === questionId) {
        state.currentQuestion = {
          ...state.currentQuestion,
          myAnswer: answer,
          hasMyAnswer: true,
          totalAnswers: (state.currentQuestion.totalAnswers || 0) + 1,
          isResolved: answer.isAccepted || state.currentQuestion.isResolved,
        };
      }
    },
    optimisticReplyUpdate: (state, action) => {
      const { reviewId, reply } = action.payload;

      state.reviews = state.reviews.map((review) =>
        review.id === reviewId
          ? {
              ...review,
              myReply: reply,
              hasMyReply: true,
              totalReplies: (review.totalReplies || 0) + 1,
            }
          : review
      );

      if (state.currentReview && state.currentReview.id === reviewId) {
        state.currentReview = {
          ...state.currentReview,
          myReply: reply,
          hasMyReply: true,
          totalReplies: (state.currentReview.totalReplies || 0) + 1,
        };
      }
    },
    optimisticQuestionResolve: (state, action) => {
      const { questionId, isResolved } = action.payload;

      state.qnaQuestions = state.qnaQuestions.map((question) =>
        question.id === questionId ? { ...question, isResolved } : question
      );

      if (state.currentQuestion && state.currentQuestion.id === questionId) {
        state.currentQuestion = { ...state.currentQuestion, isResolved };
      }
    },
    revertOptimisticUpdates: (state, action) => {
      const { type, data } = action.payload;

      switch (type) {
        case "answerCreate":
          if (data.originalQuestion) {
            state.qnaQuestions = state.qnaQuestions.map((question) =>
              question.id === data.questionId ? data.originalQuestion : question
            );
            if (
              state.currentQuestion &&
              state.currentQuestion.id === data.questionId
            ) {
              state.currentQuestion = data.originalQuestion;
            }
          }
          break;
        case "replyCreate":
          if (data.originalReview) {
            state.reviews = state.reviews.map((review) =>
              review.id === data.reviewId ? data.originalReview : review
            );
            if (
              state.currentReview &&
              state.currentReview.id === data.reviewId
            ) {
              state.currentReview = data.originalReview;
            }
          }
          break;
        case "questionResolve":
          if (data.originalQuestion) {
            state.qnaQuestions = state.qnaQuestions.map((question) =>
              question.id === data.questionId ? data.originalQuestion : question
            );
            if (
              state.currentQuestion &&
              state.currentQuestion.id === data.questionId
            ) {
              state.currentQuestion = data.originalQuestion;
            }
          }
          break;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getQnAQuestions.pending, (state) => {
        state.getQnAQuestionsLoading = true;
        state.loading = true;
        state.error = null;
      })
      .addCase(getQnAQuestions.fulfilled, (state, action) => {
        state.getQnAQuestionsLoading = false;
        state.loading = false;
        state.error = null;
        state.qnaQuestions = action.payload.data.questions || [];
        state.qnaPagination =
          action.payload.data.pagination || state.qnaPagination;
        state.qnaStats = action.payload.data.stats || state.qnaStats;
        state.needsRefresh = false;
      })
      .addCase(getQnAQuestions.rejected, (state, action) => {
        state.getQnAQuestionsLoading = false;
        state.loading = false;
        state.error =
          action.payload?.message || "Failed to fetch Q&A questions";
      })

      .addCase(answerQuestion.pending, (state, action) => {
        state.answerQuestionLoading = true;
        state.loading = true;
        state.error = null;

        const { questionId, answerData } = action.meta.arg;

        const tempAnswer = {
          id: `temp_answer_${Date.now()}`,
          content: answerData.content,
          isAccepted: answerData.markAsAccepted || false,
          createdAt: new Date().toISOString(),
          instructor: {
            name: "You",
          },
        };

        state.pendingAnswers[questionId] = tempAnswer;

        state.qnaQuestions = state.qnaQuestions.map((question) =>
          question.id === questionId
            ? {
                ...question,
                myAnswer: tempAnswer,
                hasMyAnswer: true,
                totalAnswers: (question.totalAnswers || 0) + 1,
                isResolved: tempAnswer.isAccepted || question.isResolved,
              }
            : question
        );

        if (state.currentQuestion && state.currentQuestion.id === questionId) {
          state.currentQuestion = {
            ...state.currentQuestion,
            myAnswer: tempAnswer,
            hasMyAnswer: true,
            totalAnswers: (state.currentQuestion.totalAnswers || 0) + 1,
            isResolved:
              tempAnswer.isAccepted || state.currentQuestion.isResolved,
          };
        }

        state.qnaStats = updateQnAStatsAfterAnswer(state.qnaStats);
        state.optimisticOperations.answerCreates[questionId] = tempAnswer;
      })
      .addCase(answerQuestion.fulfilled, (state, action) => {
        state.answerQuestionLoading = false;
        state.loading = false;
        state.error = null;

        const { questionId } = action.payload;
        const newAnswer = action.payload.data.data.answer;

        state.qnaQuestions = state.qnaQuestions.map((question) =>
          question.id === questionId
            ? { ...question, myAnswer: newAnswer }
            : question
        );

        if (state.currentQuestion && state.currentQuestion.id === questionId) {
          state.currentQuestion = {
            ...state.currentQuestion,
            myAnswer: newAnswer,
          };
        }

        delete state.pendingAnswers[questionId];
        delete state.optimisticOperations.answerCreates[questionId];
      })
      .addCase(answerQuestion.rejected, (state, action) => {
        state.answerQuestionLoading = false;
        state.loading = false;
        state.error =
          action.payload?.error?.message || "Failed to answer question";

        const { questionId, originalQuestion } = action.payload;

        if (originalQuestion) {
          state.qnaQuestions = state.qnaQuestions.map((question) =>
            question.id === questionId ? originalQuestion : question
          );

          if (
            state.currentQuestion &&
            state.currentQuestion.id === questionId
          ) {
            state.currentQuestion = originalQuestion;
          }
        }

        delete state.pendingAnswers[questionId];
        delete state.optimisticOperations.answerCreates[questionId];
      })

      .addCase(updateAnswer.pending, (state, action) => {
        state.updateAnswerLoading = true;
        state.loading = true;
        state.error = null;

        const { answerId, updateData } = action.meta.arg;
        state.pendingUpdateAnswers[answerId] = updateData;

        state.qnaQuestions = state.qnaQuestions.map((question) => ({
          ...question,
          myAnswer:
            question.myAnswer?.id === answerId
              ? {
                  ...question.myAnswer,
                  ...updateData,
                  updatedAt: new Date().toISOString(),
                }
              : question.myAnswer,
        }));

        state.optimisticOperations.answerUpdates[answerId] = updateData;
      })
      .addCase(updateAnswer.fulfilled, (state, action) => {
        state.updateAnswerLoading = false;
        state.loading = false;
        state.error = null;

        const { answerId } = action.payload;
        const updatedAnswer = action.payload.data.data.answer;

        state.qnaQuestions = state.qnaQuestions.map((question) => ({
          ...question,
          myAnswer:
            question.myAnswer?.id === answerId
              ? updatedAnswer
              : question.myAnswer,
        }));

        delete state.pendingUpdateAnswers[answerId];
        delete state.optimisticOperations.answerUpdates[answerId];
      })
      .addCase(updateAnswer.rejected, (state, action) => {
        state.updateAnswerLoading = false;
        state.loading = false;
        state.error =
          action.payload?.error?.message || "Failed to update answer";

        const { answerId, originalAnswer } = action.payload;

        if (originalAnswer) {
          state.qnaQuestions = state.qnaQuestions.map((question) => ({
            ...question,
            myAnswer:
              question.myAnswer?.id === answerId
                ? originalAnswer
                : question.myAnswer,
          }));
        }

        delete state.pendingUpdateAnswers[answerId];
        delete state.optimisticOperations.answerUpdates[answerId];
      })

      .addCase(deleteAnswer.pending, (state, action) => {
        state.deleteAnswerLoading = true;
        state.loading = true;
        state.error = null;

        const answerId = action.meta.arg;
        state.pendingDeleteAnswers = addToArray(
          state.pendingDeleteAnswers,
          answerId
        );

        state.qnaQuestions = state.qnaQuestions.map((question) => ({
          ...question,
          myAnswer:
            question.myAnswer?.id === answerId ? null : question.myAnswer,
          hasMyAnswer:
            question.myAnswer?.id === answerId ? false : question.hasMyAnswer,
          totalAnswers:
            question.myAnswer?.id === answerId
              ? Math.max(0, (question.totalAnswers || 1) - 1)
              : question.totalAnswers,
        }));

        state.optimisticOperations.answerDeletes.push(answerId);
      })
      .addCase(deleteAnswer.fulfilled, (state, action) => {
        state.deleteAnswerLoading = false;
        state.loading = false;
        state.error = null;

        const { answerId } = action.payload;
        state.pendingDeleteAnswers = removeFromArray(
          state.pendingDeleteAnswers,
          answerId
        );
        state.optimisticOperations.answerDeletes =
          state.optimisticOperations.answerDeletes.filter(
            (id) => id !== answerId
          );
      })
      .addCase(deleteAnswer.rejected, (state, action) => {
        state.deleteAnswerLoading = false;
        state.loading = false;
        state.error =
          action.payload?.error?.message || "Failed to delete answer";

        const { answerId, originalAnswer } = action.payload;

        if (originalAnswer) {
          state.qnaQuestions = state.qnaQuestions.map((question) => ({
            ...question,
            myAnswer:
              question.myAnswer?.id === answerId
                ? originalAnswer
                : question.myAnswer,
            hasMyAnswer:
              question.myAnswer?.id === answerId ? true : question.hasMyAnswer,
            totalAnswers:
              question.myAnswer?.id === answerId
                ? (question.totalAnswers || 0) + 1
                : question.totalAnswers,
          }));
        }

        state.pendingDeleteAnswers = removeFromArray(
          state.pendingDeleteAnswers,
          answerId
        );
        state.optimisticOperations.answerDeletes =
          state.optimisticOperations.answerDeletes.filter(
            (id) => id !== answerId
          );
      })

      .addCase(getCourseReviews.pending, (state) => {
        state.getCourseReviewsLoading = true;
        state.loading = true;
        state.error = null;
      })
      .addCase(getCourseReviews.fulfilled, (state, action) => {
        state.getCourseReviewsLoading = false;
        state.loading = false;
        state.error = null;
        state.reviews = action.payload.data.reviews || [];
        state.reviewsPagination =
          action.payload.data.pagination || state.reviewsPagination;
        state.reviewsStats = action.payload.data.stats || state.reviewsStats;
        state.needsRefresh = false;
      })
      .addCase(getCourseReviews.rejected, (state, action) => {
        state.getCourseReviewsLoading = false;
        state.loading = false;
        state.error = action.payload?.message || "Failed to fetch reviews";
      })

      .addCase(replyToReview.pending, (state, action) => {
        state.replyToReviewLoading = true;
        state.loading = true;
        state.error = null;

        const { reviewId, replyData } = action.meta.arg;

        const tempReply = {
          id: `temp_reply_${Date.now()}`,
          content: replyData.content,
          createdAt: new Date().toISOString(),
          author: {
            name: "You",
          },
        };

        state.pendingReplies[reviewId] = tempReply;

        state.reviews = state.reviews.map((review) =>
          review.id === reviewId
            ? {
                ...review,
                myReply: tempReply,
                hasMyReply: true,
                totalReplies: (review.totalReplies || 0) + 1,
              }
            : review
        );

        if (state.currentReview && state.currentReview.id === reviewId) {
          state.currentReview = {
            ...state.currentReview,
            myReply: tempReply,
            hasMyReply: true,
            totalReplies: (state.currentReview.totalReplies || 0) + 1,
          };
        }

        state.reviewsStats = updateReviewStatsAfterReply(state.reviewsStats);
        state.optimisticOperations.replyCreates[reviewId] = tempReply;
      })
      .addCase(replyToReview.fulfilled, (state, action) => {
        state.replyToReviewLoading = false;
        state.loading = false;
        state.error = null;

        const { reviewId } = action.payload;
        const newReply = action.payload.data.data.reply;

        state.reviews = state.reviews.map((review) =>
          review.id === reviewId ? { ...review, myReply: newReply } : review
        );

        if (state.currentReview && state.currentReview.id === reviewId) {
          state.currentReview = { ...state.currentReview, myReply: newReply };
        }

        delete state.pendingReplies[reviewId];
        delete state.optimisticOperations.replyCreates[reviewId];
      })
      .addCase(replyToReview.rejected, (state, action) => {
        state.replyToReviewLoading = false;
        state.loading = false;
        state.error =
          action.payload?.error?.message || "Failed to reply to review";

        const { reviewId, originalReview } = action.payload;

        if (originalReview) {
          state.reviews = state.reviews.map((review) =>
            review.id === reviewId ? originalReview : review
          );

          if (state.currentReview && state.currentReview.id === reviewId) {
            state.currentReview = originalReview;
          }
        }

        delete state.pendingReplies[reviewId];
        delete state.optimisticOperations.replyCreates[reviewId];
      })

      .addCase(updateReply.pending, (state, action) => {
        state.updateReplyLoading = true;
        state.loading = true;
        state.error = null;

        const { replyId, updateData } = action.meta.arg;
        state.pendingUpdateReplies[replyId] = updateData;

        state.reviews = state.reviews.map((review) => ({
          ...review,
          myReply:
            review.myReply?.id === replyId
              ? {
                  ...review.myReply,
                  ...updateData,
                  updatedAt: new Date().toISOString(),
                }
              : review.myReply,
        }));

        state.optimisticOperations.replyUpdates[replyId] = updateData;
      })
      .addCase(updateReply.fulfilled, (state, action) => {
        state.updateReplyLoading = false;
        state.loading = false;
        state.error = null;

        const { replyId } = action.payload;
        const updatedReply = action.payload.data.data.reply;

        state.reviews = state.reviews.map((review) => ({
          ...review,
          myReply:
            review.myReply?.id === replyId ? updatedReply : review.myReply,
        }));

        delete state.pendingUpdateReplies[replyId];
        delete state.optimisticOperations.replyUpdates[replyId];
      })
      .addCase(updateReply.rejected, (state, action) => {
        state.updateReplyLoading = false;
        state.loading = false;
        state.error =
          action.payload?.error?.message || "Failed to update reply";

        const { replyId, originalReply } = action.payload;

        if (originalReply) {
          state.reviews = state.reviews.map((review) => ({
            ...review,
            myReply:
              review.myReply?.id === replyId ? originalReply : review.myReply,
          }));
        }

        delete state.pendingUpdateReplies[replyId];
        delete state.optimisticOperations.replyUpdates[replyId];
      })

      .addCase(deleteReply.pending, (state, action) => {
        state.deleteReplyLoading = true;
        state.loading = true;
        state.error = null;

        const replyId = action.meta.arg;
        state.pendingDeleteReplies = addToArray(
          state.pendingDeleteReplies,
          replyId
        );

        state.reviews = state.reviews.map((review) => ({
          ...review,
          myReply: review.myReply?.id === replyId ? null : review.myReply,
          hasMyReply:
            review.myReply?.id === replyId ? false : review.hasMyReply,
          totalReplies:
            review.myReply?.id === replyId
              ? Math.max(0, (review.totalReplies || 1) - 1)
              : review.totalReplies,
        }));

        state.optimisticOperations.replyDeletes.push(replyId);
      })
      .addCase(deleteReply.fulfilled, (state, action) => {
        state.deleteReplyLoading = false;
        state.loading = false;
        state.error = null;

        const { replyId } = action.payload;
        state.pendingDeleteReplies = removeFromArray(
          state.pendingDeleteReplies,
          replyId
        );
        state.optimisticOperations.replyDeletes =
          state.optimisticOperations.replyDeletes.filter(
            (id) => id !== replyId
          );
      })
      .addCase(deleteReply.rejected, (state, action) => {
        state.deleteReplyLoading = false;
        state.loading = false;
        state.error =
          action.payload?.error?.message || "Failed to delete reply";

        const { replyId, originalReply } = action.payload;

        if (originalReply) {
          state.reviews = state.reviews.map((review) => ({
            ...review,
            myReply:
              review.myReply?.id === replyId ? originalReply : review.myReply,
            hasMyReply:
              review.myReply?.id === replyId ? true : review.hasMyReply,
            totalReplies:
              review.myReply?.id === replyId
                ? (review.totalReplies || 0) + 1
                : review.totalReplies,
          }));
        }

        state.pendingDeleteReplies = removeFromArray(
          state.pendingDeleteReplies,
          replyId
        );
        state.optimisticOperations.replyDeletes =
          state.optimisticOperations.replyDeletes.filter(
            (id) => id !== replyId
          );
      })

      .addCase(getCommunityOverview.pending, (state) => {
        state.getCommunityOverviewLoading = true;
        state.loading = true;
        state.error = null;
      })
      .addCase(getCommunityOverview.fulfilled, (state, action) => {
        state.getCommunityOverviewLoading = false;
        state.loading = false;
        state.error = null;
        state.communityOverview = action.payload.data;
        state.needsRefresh = false;
      })
      .addCase(getCommunityOverview.rejected, (state, action) => {
        state.getCommunityOverviewLoading = false;
        state.loading = false;
        state.error =
          action.payload?.message || "Failed to fetch community overview";
      })

      .addCase(bulkAnswerQuestions.pending, (state, action) => {
        state.bulkAnswerQuestionsLoading = true;
        state.loading = true;
        state.error = null;

        const answersData = action.meta.arg;
        state.pendingBulkAnswers = addToArray(
          state.pendingBulkAnswers,
          answersData
        );
        state.optimisticOperations.bulkAnswers.push(answersData);
      })
      .addCase(bulkAnswerQuestions.fulfilled, (state, action) => {
        state.bulkAnswerQuestionsLoading = false;
        state.loading = false;
        state.error = null;

        const answers = action.payload.data.answers || [];

        answers.forEach((answer) => {
          state.qnaQuestions = state.qnaQuestions.map((question) =>
            question.id === answer.questionId
              ? {
                  ...question,
                  myAnswer: { id: answer.answerId, content: answer.content },
                  hasMyAnswer: true,
                  totalAnswers: (question.totalAnswers || 0) + 1,
                }
              : question
          );
        });

        state.pendingBulkAnswers = [];
        state.optimisticOperations.bulkAnswers = [];
      })
      .addCase(bulkAnswerQuestions.rejected, (state, action) => {
        state.bulkAnswerQuestionsLoading = false;
        state.loading = false;
        state.error =
          action.payload?.error?.message || "Failed to answer questions";

        state.pendingBulkAnswers = [];
        state.optimisticOperations.bulkAnswers = [];
      })

      .addCase(markQuestionAsResolved.pending, (state, action) => {
        state.markQuestionAsResolvedLoading = true;
        state.loading = true;
        state.error = null;

        const { questionId, isResolved } = action.meta.arg;

        state.qnaQuestions = state.qnaQuestions.map((question) =>
          question.id === questionId ? { ...question, isResolved } : question
        );

        if (state.currentQuestion && state.currentQuestion.id === questionId) {
          state.currentQuestion = { ...state.currentQuestion, isResolved };
        }
      })
      .addCase(markQuestionAsResolved.fulfilled, (state) => {
        state.markQuestionAsResolvedLoading = false;
        state.loading = false;
        state.error = null;
      })
      .addCase(markQuestionAsResolved.rejected, (state, action) => {
        state.markQuestionAsResolvedLoading = false;
        state.loading = false;
        state.error =
          action.payload?.error?.message || "Failed to update question status";

        const { questionId, originalQuestion } = action.payload;

        if (originalQuestion) {
          state.qnaQuestions = state.qnaQuestions.map((question) =>
            question.id === questionId ? originalQuestion : question
          );

          if (
            state.currentQuestion &&
            state.currentQuestion.id === questionId
          ) {
            state.currentQuestion = originalQuestion;
          }
        }
      });
  },
});

export const {
  clearError,
  clearReviews,
  clearQnAQuestions,
  clearCurrentReview,
  clearCurrentQuestion,
  clearCommunityOverview,
  setReviewsFilters,
  setQnAFilters,
  resetReviewsFilters,
  resetQnAFilters,
  resetCommunityState,
  markForRefresh,
  clearRefreshFlag,
  optimisticAnswerUpdate,
  optimisticReplyUpdate,
  optimisticQuestionResolve,
  revertOptimisticUpdates,
} = instructorCommunitySlice.actions;

const instructorCommunityReducer = instructorCommunitySlice.reducer;

export default instructorCommunityReducer;
