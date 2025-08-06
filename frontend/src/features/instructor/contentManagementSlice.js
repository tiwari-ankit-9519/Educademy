import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "@/utils/axiosApi";
import { toast } from "sonner";

const initialState = {
  courseStructure: null,
  sections: [],
  lessons: [],
  quizzes: [],
  questions: [],
  assignments: [],
  quizAttempts: [],
  quizResults: null,
  contentStats: null,
  validationResult: null,
  previewData: null,
  searchResults: null,
  exportData: null,
  singleSection: null,
  singleLesson: null,
  singleQuiz: null,
  singleAssignment: null,
  error: null,
  loading: false,
  getCourseStructureLoading: false,
  createSectionLoading: false,
  updateSectionLoading: false,
  deleteSectionLoading: false,
  reorderSectionsLoading: false,
  createLessonLoading: false,
  updateLessonLoading: false,
  deleteLessonLoading: false,
  reorderLessonsLoading: false,
  createQuizLoading: false,
  updateQuizLoading: false,
  deleteQuizLoading: false,
  addQuizQuestionsLoading: false,
  updateQuizQuestionLoading: false,
  deleteQuizQuestionLoading: false,
  reorderQuizQuestionsLoading: false,
  createAssignmentLoading: false,
  updateAssignmentLoading: false,
  deleteAssignmentLoading: false,
  getContentStatsLoading: false,
  validateCourseContentLoading: false,
  publishAllSectionsLoading: false,
  exportCourseContentLoading: false,
  importCourseContentLoading: false,
  previewContentLoading: false,
  searchCourseContentLoading: false,
  submitQuizAttemptLoading: false,
  getQuizResultsLoading: false,
  getQuizAttemptsLoading: false,
  getQuizDetailsLoading: false,
  getCourseSectionsLoading: false,
  getSectionQuizzesLoading: false,
  getSectionLessonsLoading: false,
  getQuizQuestionsLoading: false,
  getSingleLessonLoading: false,
  getSingleQuizLoading: false,
  getAllAssignmentsLoading: false,
  sectionsPagination: {
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  },
  lessonsPagination: {
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  },
  quizzesPagination: {
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  },
  questionsPagination: {
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  },
  attemptsPagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  },
  pendingOperations: {
    sections: {},
    lessons: {},
    quizzes: {},
    questions: {},
    assignments: {},
  },
  optimisticOperations: {
    sections: {
      creates: [],
      updates: {},
      deletes: [],
    },
    lessons: {
      creates: [],
      updates: {},
      deletes: [],
    },
    quizzes: {
      creates: [],
      updates: {},
      deletes: [],
    },
    questions: {
      creates: [],
      updates: {},
      deletes: [],
    },
    assignments: {
      creates: [],
      updates: {},
      deletes: [],
    },
  },
};

export const getCourseStructure = createAsyncThunk(
  "contentManagement/getCourseStructure",
  async (courseId, { rejectWithValue }) => {
    try {
      const response = await api.get(
        `/instructor/content/course/${courseId}/structure`
      );
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(error.response?.data || { message });
    }
  }
);

export const createSection = createAsyncThunk(
  "contentManagement/createSection",
  async ({ courseId, sectionData }, { rejectWithValue }) => {
    try {
      const response = await api.post(
        `/instructor/content/course/${courseId}/sections`,
        sectionData
      );
      toast.success("Section created successfully");
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue({
        error: error.response?.data || { message },
        originalData: sectionData,
      });
    }
  }
);

export const updateSection = createAsyncThunk(
  "contentManagement/updateSection",
  async ({ sectionId, updateData }, { rejectWithValue, getState }) => {
    const state = getState();
    const originalSection = state.contentManagement.sections.find(
      (s) => s.id === sectionId
    );

    try {
      const response = await api.put(
        `/instructor/content/section/${sectionId}`,
        updateData
      );
      toast.success("Section updated successfully");
      return {
        data: response.data,
        sectionId,
        updateData,
        originalSection,
      };
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue({
        error: error.response?.data || { message },
        sectionId,
        originalSection,
        updateData,
      });
    }
  }
);

export const deleteSection = createAsyncThunk(
  "contentManagement/deleteSection",
  async (sectionId, { rejectWithValue, getState }) => {
    const state = getState();
    const originalSection = state.contentManagement.sections.find(
      (s) => s.id === sectionId
    );

    try {
      const response = await api.delete(
        `/instructor/content/section/${sectionId}`
      );
      toast.success("Section deleted successfully");
      return {
        data: response.data,
        sectionId,
        originalSection,
      };
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue({
        error: error.response?.data || { message },
        sectionId,
        originalSection,
      });
    }
  }
);

export const reorderSections = createAsyncThunk(
  "contentManagement/reorderSections",
  async ({ courseId, sectionIds }, { rejectWithValue, getState }) => {
    const state = getState();
    const originalOrder = state.contentManagement.sections.map((s) => s.id);

    try {
      const response = await api.put(
        `/instructor/content/course/${courseId}/sections/reorder`,
        { sectionIds }
      );
      toast.success("Sections reordered successfully");
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue({
        error: error.response?.data || { message },
        originalOrder,
      });
    }
  }
);

export const createLesson = createAsyncThunk(
  "contentManagement/createLesson",
  async ({ sectionId, lessonData }, { rejectWithValue }) => {
    try {
      const response = await api.post(
        `/instructor/content/section/${sectionId}/lessons`,
        lessonData
      );
      toast.success("Lesson created successfully");
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue({
        error: error.response?.data || { message },
        originalData: lessonData,
      });
    }
  }
);

export const updateLesson = createAsyncThunk(
  "contentManagement/updateLesson",
  async ({ lessonId, updateData }, { rejectWithValue, getState }) => {
    const state = getState();
    const originalLesson = state.contentManagement.lessons.find(
      (l) => l.id === lessonId
    );

    try {
      const response = await api.put(
        `/instructor/content/lesson/${lessonId}`,
        updateData
      );
      toast.success("Lesson updated successfully");
      return {
        data: response.data,
        lessonId,
        updateData,
        originalLesson,
      };
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue({
        error: error.response?.data || { message },
        lessonId,
        originalLesson,
        updateData,
      });
    }
  }
);

export const deleteLesson = createAsyncThunk(
  "contentManagement/deleteLesson",
  async (lessonId, { rejectWithValue, getState }) => {
    const state = getState();
    const originalLesson = state.contentManagement.lessons.find(
      (l) => l.id === lessonId
    );

    try {
      const response = await api.delete(
        `/instructor/content/lesson/${lessonId}`
      );
      toast.success("Lesson deleted successfully");
      return {
        data: response.data,
        lessonId,
        originalLesson,
      };
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue({
        error: error.response?.data || { message },
        lessonId,
        originalLesson,
      });
    }
  }
);

export const reorderLessons = createAsyncThunk(
  "contentManagement/reorderLessons",
  async ({ sectionId, lessonIds }, { rejectWithValue, getState }) => {
    const state = getState();
    const originalOrder = state.contentManagement.lessons
      .filter((l) => l.sectionId === sectionId)
      .map((l) => l.id);

    try {
      const response = await api.put(
        `/instructor/content/section/${sectionId}/lessons/reorder`,
        { lessonIds }
      );
      toast.success("Lessons reordered successfully");
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue({
        error: error.response?.data || { message },
        originalOrder,
        sectionId,
      });
    }
  }
);

export const createQuiz = createAsyncThunk(
  "contentManagement/createQuiz",
  async ({ sectionId, quizData }, { rejectWithValue }) => {
    try {
      const response = await api.post(
        `/instructor/content/section/${sectionId}/quizzes`,
        quizData
      );
      toast.success("Quiz created successfully");
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue({
        error: error.response?.data || { message },
        originalData: quizData,
      });
    }
  }
);

export const updateQuiz = createAsyncThunk(
  "contentManagement/updateQuiz",
  async ({ quizId, updateData }, { rejectWithValue, getState }) => {
    const state = getState();
    const originalQuiz = state.contentManagement.quizzes.find(
      (q) => q.id === quizId
    );

    try {
      const response = await api.put(
        `/instructor/content/quiz/${quizId}`,
        updateData
      );
      toast.success("Quiz updated successfully");
      return {
        data: response.data,
        quizId,
        updateData,
        originalQuiz,
      };
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue({
        error: error.response?.data || { message },
        quizId,
        originalQuiz,
        updateData,
      });
    }
  }
);

export const deleteQuiz = createAsyncThunk(
  "contentManagement/deleteQuiz",
  async (quizId, { rejectWithValue, getState }) => {
    const state = getState();
    const originalQuiz = state.contentManagement.quizzes.find(
      (q) => q.id === quizId
    );

    try {
      const response = await api.delete(`/instructor/content/quiz/${quizId}`);
      toast.success("Quiz deleted successfully");
      return {
        data: response.data,
        quizId,
        originalQuiz,
      };
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue({
        error: error.response?.data || { message },
        quizId,
        originalQuiz,
      });
    }
  }
);

export const addQuizQuestions = createAsyncThunk(
  "contentManagement/addQuizQuestions",
  async ({ quizId, questions }, { rejectWithValue }) => {
    try {
      const response = await api.post(
        `/instructor/content/quiz/${quizId}/questions`,
        { questions }
      );
      toast.success("Questions added successfully");
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue({
        error: error.response?.data || { message },
        originalData: questions,
      });
    }
  }
);

export const updateQuizQuestion = createAsyncThunk(
  "contentManagement/updateQuizQuestion",
  async ({ questionId, updateData }, { rejectWithValue, getState }) => {
    const state = getState();
    const originalQuestion = state.contentManagement.questions.find(
      (q) => q.id === questionId
    );

    try {
      const response = await api.put(
        `/instructor/content/question/${questionId}`,
        updateData
      );
      toast.success("Question updated successfully");
      return {
        data: response.data,
        questionId,
        updateData,
        originalQuestion,
      };
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue({
        error: error.response?.data || { message },
        questionId,
        originalQuestion,
        updateData,
      });
    }
  }
);

export const deleteQuizQuestion = createAsyncThunk(
  "contentManagement/deleteQuizQuestion",
  async (questionId, { rejectWithValue, getState }) => {
    const state = getState();
    const originalQuestion = state.contentManagement.questions.find(
      (q) => q.id === questionId
    );

    try {
      const response = await api.delete(
        `/instructor/content/question/${questionId}`
      );
      toast.success("Question deleted successfully");
      return {
        data: response.data,
        questionId,
        originalQuestion,
      };
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue({
        error: error.response?.data || { message },
        questionId,
        originalQuestion,
      });
    }
  }
);

export const reorderQuizQuestions = createAsyncThunk(
  "contentManagement/reorderQuizQuestions",
  async ({ quizId, questionIds }, { rejectWithValue, getState }) => {
    const state = getState();
    const originalOrder = state.contentManagement.questions
      .filter((q) => q.quizId === quizId)
      .map((q) => q.id);

    try {
      const response = await api.put(
        `/instructor/content/quiz/${quizId}/questions/reorder`,
        { questionIds }
      );
      toast.success("Questions reordered successfully");
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue({
        error: error.response?.data || { message },
        originalOrder,
        quizId,
      });
    }
  }
);

export const createAssignment = createAsyncThunk(
  "contentManagement/createAssignment",
  async ({ sectionId, assignmentData }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      Object.keys(assignmentData).forEach((key) => {
        if (key === "resources" && assignmentData[key]) {
          assignmentData[key].forEach((file) => {
            formData.append("resources", file);
          });
        } else {
          formData.append(key, assignmentData[key]);
        }
      });

      const response = await api.post(
        `/instructor/content/section/${sectionId}/assignments`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      toast.success("Assignment created successfully");
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue({
        error: error.response?.data || { message },
        originalData: assignmentData,
      });
    }
  }
);

export const updateAssignment = createAsyncThunk(
  "contentManagement/updateAssignment",
  async ({ assignmentId, updateData }, { rejectWithValue, getState }) => {
    const state = getState();
    const originalAssignment = state.contentManagement.assignments.find(
      (a) => a.id === assignmentId
    );

    try {
      const response = await api.put(
        `/instructor/content/assignment/${assignmentId}`,
        updateData
      );
      toast.success("Assignment updated successfully");
      return {
        data: response.data,
        assignmentId,
        updateData,
        originalAssignment,
      };
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue({
        error: error.response?.data || { message },
        assignmentId,
        originalAssignment,
        updateData,
      });
    }
  }
);

export const deleteAssignment = createAsyncThunk(
  "contentManagement/deleteAssignment",
  async (assignmentId, { rejectWithValue, getState }) => {
    const state = getState();
    const originalAssignment = state.contentManagement.assignments.find(
      (a) => a.id === assignmentId
    );

    try {
      const response = await api.delete(
        `/instructor/content/assignment/${assignmentId}`
      );
      toast.success("Assignment deleted successfully");
      return {
        data: response.data,
        assignmentId,
        originalAssignment,
      };
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue({
        error: error.response?.data || { message },
        assignmentId,
        originalAssignment,
      });
    }
  }
);

export const getContentStats = createAsyncThunk(
  "contentManagement/getContentStats",
  async (courseId, { rejectWithValue }) => {
    try {
      const response = await api.get(
        `/instructor/content/course/${courseId}/stats`
      );
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(error.response?.data || { message });
    }
  }
);

export const validateCourseContent = createAsyncThunk(
  "contentManagement/validateCourseContent",
  async (courseId, { rejectWithValue }) => {
    try {
      const response = await api.get(
        `/instructor/content/course/${courseId}/validate`
      );
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(error.response?.data || { message });
    }
  }
);

export const publishAllSections = createAsyncThunk(
  "contentManagement/publishAllSections",
  async (courseId, { rejectWithValue }) => {
    try {
      const response = await api.post(
        `/instructor/content/course/${courseId}/publish-sections`
      );
      toast.success("Sections published successfully");
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(error.response?.data || { message });
    }
  }
);

export const exportCourseContent = createAsyncThunk(
  "contentManagement/exportCourseContent",
  async ({ courseId, format }, { rejectWithValue }) => {
    try {
      const response = await api.get(
        `/instructor/content/course/${courseId}/export`,
        {
          params: { format },
        }
      );
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(error.response?.data || { message });
    }
  }
);

export const importCourseContent = createAsyncThunk(
  "contentManagement/importCourseContent",
  async ({ courseId, importData, replaceExisting }, { rejectWithValue }) => {
    try {
      const response = await api.post(
        `/instructor/content/course/${courseId}/import`,
        {
          importData,
          replaceExisting,
        }
      );
      toast.success("Content imported successfully");
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(error.response?.data || { message });
    }
  }
);

export const previewContent = createAsyncThunk(
  "contentManagement/previewContent",
  async (courseId, { rejectWithValue }) => {
    try {
      const response = await api.get(
        `/instructor/content/course/${courseId}/preview`
      );
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(error.response?.data || { message });
    }
  }
);

export const searchCourseContent = createAsyncThunk(
  "contentManagement/searchCourseContent",
  async ({ courseId, searchParams }, { rejectWithValue }) => {
    try {
      const response = await api.get(
        `/instructor/content/course/${courseId}/search`,
        {
          params: searchParams,
        }
      );
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(error.response?.data || { message });
    }
  }
);

export const submitQuizAttempt = createAsyncThunk(
  "contentManagement/submitQuizAttempt",
  async ({ quizId, answers }, { rejectWithValue }) => {
    try {
      const response = await api.post(
        `/instructor/content/quiz/${quizId}/submit`,
        { answers }
      );
      toast.success("Quiz submitted successfully");
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(error.response?.data || { message });
    }
  }
);

export const getQuizResults = createAsyncThunk(
  "contentManagement/getQuizResults",
  async (attemptId, { rejectWithValue }) => {
    try {
      const response = await api.get(
        `/instructor/content/quiz/attempt/${attemptId}/results`
      );
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(error.response?.data || { message });
    }
  }
);

export const getQuizAttempts = createAsyncThunk(
  "contentManagement/getQuizAttempts",
  async ({ quizId, params }, { rejectWithValue }) => {
    try {
      const response = await api.get(
        `/instructor/content/quiz/${quizId}/attempts`,
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

export const getQuizDetails = createAsyncThunk(
  "contentManagement/getQuizDetails",
  async (quizId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/instructor/content/quiz/${quizId}`);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(error.response?.data || { message });
    }
  }
);

export const getCourseSections = createAsyncThunk(
  "contentManagement/getCourseSections",
  async ({ courseId, params }, { rejectWithValue }) => {
    try {
      const response = await api.get(
        `/instructor/content/course/${courseId}/sections`,
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

export const getSectionQuizzes = createAsyncThunk(
  "contentManagement/getSectionQuizzes",
  async ({ sectionId, params }, { rejectWithValue }) => {
    try {
      const response = await api.get(
        `/instructor/content/section/${sectionId}/quizzes`,
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

export const getSectionLessons = createAsyncThunk(
  "contentManagement/getSectionLessons",
  async ({ sectionId, params }, { rejectWithValue }) => {
    try {
      const response = await api.get(
        `/instructor/content/section/${sectionId}/lessons`,
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

export const getQuizQuestions = createAsyncThunk(
  "contentManagement/getQuizQuestions",
  async ({ quizId, params }, { rejectWithValue }) => {
    try {
      const response = await api.get(
        `/instructor/content/quizzes/${quizId}/questions`,
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

export const getSingleLesson = createAsyncThunk(
  "contentManagement/getSingleLesson",
  async (lessonId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/instructor/content/lessons/${lessonId}`);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(error.response?.data || { message });
    }
  }
);

export const getSingleQuiz = createAsyncThunk(
  "contentManagement/getSingleQuiz",
  async ({ quizId, includeQuestions }, { rejectWithValue }) => {
    try {
      const response = await api.get(`/instructor/content/quizzes/${quizId}`, {
        params: { includeQuestions },
      });
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(error.response?.data || { message });
    }
  }
);

export const getAllAssignments = createAsyncThunk(
  "contentManagement/getAllAssignments",
  async (sectionId, { rejectWithValue }) => {
    try {
      const response = await api.get(
        `/instructor/content/section/${sectionId}/assignments`
      );
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(error.response?.data || { message });
    }
  }
);

const contentManagementSlice = createSlice({
  name: "contentManagement",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCourseStructure: (state) => {
      state.courseStructure = null;
    },
    clearSections: (state) => {
      state.sections = [];
    },
    clearLessons: (state) => {
      state.lessons = [];
    },
    clearQuizzes: (state) => {
      state.quizzes = [];
    },
    clearQuestions: (state) => {
      state.questions = [];
    },
    clearAssignments: (state) => {
      state.assignments = [];
    },
    clearContentStats: (state) => {
      state.contentStats = null;
    },
    clearValidationResult: (state) => {
      state.validationResult = null;
    },
    clearPreviewData: (state) => {
      state.previewData = null;
    },
    clearSearchResults: (state) => {
      state.searchResults = null;
    },
    clearExportData: (state) => {
      state.exportData = null;
    },
    clearQuizAttempts: (state) => {
      state.quizAttempts = [];
    },
    clearQuizResults: (state) => {
      state.quizResults = null;
    },
    resetContentManagementState: () => {
      return { ...initialState };
    },
    optimisticSectionUpdate: (state, action) => {
      const { sectionId, updates } = action.payload;
      state.sections = state.sections.map((section) =>
        section.id === sectionId ? { ...section, ...updates } : section
      );
      if (state.singleSection && state.singleSection.id === sectionId) {
        state.singleSection = { ...state.singleSection, ...updates };
      }
    },
    optimisticLessonUpdate: (state, action) => {
      const { lessonId, updates } = action.payload;
      state.lessons = state.lessons.map((lesson) =>
        lesson.id === lessonId ? { ...lesson, ...updates } : lesson
      );
      if (state.singleLesson && state.singleLesson.id === lessonId) {
        state.singleLesson = { ...state.singleLesson, ...updates };
      }
    },
    optimisticQuizUpdate: (state, action) => {
      const { quizId, updates } = action.payload;
      state.quizzes = state.quizzes.map((quiz) =>
        quiz.id === quizId ? { ...quiz, ...updates } : quiz
      );
      if (state.singleQuiz && state.singleQuiz.id === quizId) {
        state.singleQuiz = { ...state.singleQuiz, ...updates };
      }
    },
    optimisticQuestionUpdate: (state, action) => {
      const { questionId, updates } = action.payload;
      state.questions = state.questions.map((question) =>
        question.id === questionId ? { ...question, ...updates } : question
      );
    },
    optimisticAssignmentUpdate: (state, action) => {
      const { assignmentId, updates } = action.payload;
      state.assignments = state.assignments.map((assignment) =>
        assignment.id === assignmentId
          ? { ...assignment, ...updates }
          : assignment
      );
      if (
        state.singleAssignment &&
        state.singleAssignment.id === assignmentId
      ) {
        state.singleAssignment = { ...state.singleAssignment, ...updates };
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getCourseStructure.pending, (state) => {
        state.getCourseStructureLoading = true;
        state.loading = true;
        state.error = null;
      })
      .addCase(getCourseStructure.fulfilled, (state, action) => {
        state.getCourseStructureLoading = false;
        state.loading = false;
        state.error = null;
        state.courseStructure = action.payload.data.course;
      })
      .addCase(getCourseStructure.rejected, (state, action) => {
        state.getCourseStructureLoading = false;
        state.loading = false;
        state.error =
          action.payload?.message || "Failed to fetch course structure";
      })

      .addCase(createSection.pending, (state, action) => {
        state.createSectionLoading = true;
        state.loading = true;
        state.error = null;

        const tempSection = {
          id: `temp_${Date.now()}`,
          ...action.meta.arg.sectionData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        state.sections.unshift(tempSection);
        state.optimisticOperations.sections.creates.push(tempSection.id);
      })
      .addCase(createSection.fulfilled, (state, action) => {
        state.createSectionLoading = false;
        state.loading = false;
        state.error = null;

        const newSection = action.payload.data.section;
        const tempId = state.optimisticOperations.sections.creates[0];

        state.sections = state.sections.map((section) =>
          section.id === tempId ? newSection : section
        );

        state.optimisticOperations.sections.creates = [];
      })
      .addCase(createSection.rejected, (state, action) => {
        state.createSectionLoading = false;
        state.loading = false;
        state.error =
          action.payload?.error?.message || "Failed to create section";

        const tempId = state.optimisticOperations.sections.creates[0];
        if (tempId) {
          state.sections = state.sections.filter((s) => s.id !== tempId);
        }

        state.optimisticOperations.sections.creates = [];
      })

      .addCase(updateSection.pending, (state, action) => {
        state.updateSectionLoading = true;
        state.loading = true;
        state.error = null;

        const { sectionId, updateData } = action.meta.arg;
        state.sections = state.sections.map((section) =>
          section.id === sectionId
            ? { ...section, ...updateData, updatedAt: new Date().toISOString() }
            : section
        );

        state.optimisticOperations.sections.updates[sectionId] = updateData;
      })
      .addCase(updateSection.fulfilled, (state, action) => {
        state.updateSectionLoading = false;
        state.loading = false;
        state.error = null;

        const { sectionId } = action.payload;
        const updatedSection = action.payload.data.data.section;

        state.sections = state.sections.map((section) =>
          section.id === sectionId ? updatedSection : section
        );

        delete state.optimisticOperations.sections.updates[sectionId];
      })
      .addCase(updateSection.rejected, (state, action) => {
        state.updateSectionLoading = false;
        state.loading = false;
        state.error =
          action.payload?.error?.message || "Failed to update section";

        const { sectionId, originalSection } = action.payload;

        if (originalSection) {
          state.sections = state.sections.map((section) =>
            section.id === sectionId ? originalSection : section
          );
        }

        delete state.optimisticOperations.sections.updates[sectionId];
      })

      .addCase(deleteSection.pending, (state, action) => {
        state.deleteSectionLoading = true;
        state.loading = true;
        state.error = null;

        const sectionId = action.meta.arg;
        state.sections = state.sections.filter((s) => s.id !== sectionId);
        state.optimisticOperations.sections.deletes.push(sectionId);
      })
      .addCase(deleteSection.fulfilled, (state, action) => {
        state.deleteSectionLoading = false;
        state.loading = false;
        state.error = null;

        const { sectionId } = action.payload;
        state.optimisticOperations.sections.deletes =
          state.optimisticOperations.sections.deletes.filter(
            (id) => id !== sectionId
          );
      })
      .addCase(deleteSection.rejected, (state, action) => {
        state.deleteSectionLoading = false;
        state.loading = false;
        state.error =
          action.payload?.error?.message || "Failed to delete section";

        const { sectionId, originalSection } = action.payload;

        if (originalSection) {
          state.sections.push(originalSection);
        }

        state.optimisticOperations.sections.deletes =
          state.optimisticOperations.sections.deletes.filter(
            (id) => id !== sectionId
          );
      })

      .addCase(reorderSections.pending, (state, action) => {
        state.reorderSectionsLoading = true;
        state.loading = true;
        state.error = null;

        const { sectionIds } = action.meta.arg;
        const reorderedSections = [];
        sectionIds.forEach((id) => {
          const section = state.sections.find((s) => s.id === id);
          if (section) reorderedSections.push(section);
        });
        state.sections = reorderedSections;
      })
      .addCase(reorderSections.fulfilled, (state) => {
        state.reorderSectionsLoading = false;
        state.loading = false;
        state.error = null;
      })
      .addCase(reorderSections.rejected, (state, action) => {
        state.reorderSectionsLoading = false;
        state.loading = false;
        state.error =
          action.payload?.error?.message || "Failed to reorder sections";

        const { originalOrder } = action.payload;
        if (originalOrder) {
          const reorderedSections = [];
          originalOrder.forEach((id) => {
            const section = state.sections.find((s) => s.id === id);
            if (section) reorderedSections.push(section);
          });
          state.sections = reorderedSections;
        }
      })

      .addCase(createLesson.pending, (state, action) => {
        state.createLessonLoading = true;
        state.loading = true;
        state.error = null;

        const tempLesson = {
          id: `temp_${Date.now()}`,
          ...action.meta.arg.lessonData,
          sectionId: action.meta.arg.sectionId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        state.lessons.unshift(tempLesson);
        state.optimisticOperations.lessons.creates.push(tempLesson.id);
      })
      .addCase(createLesson.fulfilled, (state, action) => {
        state.createLessonLoading = false;
        state.loading = false;
        state.error = null;

        const newLesson = action.payload.data.lesson;
        const tempId = state.optimisticOperations.lessons.creates[0];

        state.lessons = state.lessons.map((lesson) =>
          lesson.id === tempId ? newLesson : lesson
        );

        state.optimisticOperations.lessons.creates = [];
      })
      .addCase(createLesson.rejected, (state, action) => {
        state.createLessonLoading = false;
        state.loading = false;
        state.error =
          action.payload?.error?.message || "Failed to create lesson";

        const tempId = state.optimisticOperations.lessons.creates[0];
        if (tempId) {
          state.lessons = state.lessons.filter((l) => l.id !== tempId);
        }

        state.optimisticOperations.lessons.creates = [];
      })

      .addCase(updateLesson.pending, (state, action) => {
        state.updateLessonLoading = true;
        state.loading = true;
        state.error = null;

        const { lessonId, updateData } = action.meta.arg;
        state.lessons = state.lessons.map((lesson) =>
          lesson.id === lessonId
            ? { ...lesson, ...updateData, updatedAt: new Date().toISOString() }
            : lesson
        );

        state.optimisticOperations.lessons.updates[lessonId] = updateData;
      })
      .addCase(updateLesson.fulfilled, (state, action) => {
        state.updateLessonLoading = false;
        state.loading = false;
        state.error = null;

        const { lessonId } = action.payload;
        const updatedLesson = action.payload.data.data.lesson;

        state.lessons = state.lessons.map((lesson) =>
          lesson.id === lessonId ? updatedLesson : lesson
        );

        delete state.optimisticOperations.lessons.updates[lessonId];
      })
      .addCase(updateLesson.rejected, (state, action) => {
        state.updateLessonLoading = false;
        state.loading = false;
        state.error =
          action.payload?.error?.message || "Failed to update lesson";

        const { lessonId, originalLesson } = action.payload;

        if (originalLesson) {
          state.lessons = state.lessons.map((lesson) =>
            lesson.id === lessonId ? originalLesson : lesson
          );
        }

        delete state.optimisticOperations.lessons.updates[lessonId];
      })

      .addCase(deleteLesson.pending, (state, action) => {
        state.deleteLessonLoading = true;
        state.loading = true;
        state.error = null;

        const lessonId = action.meta.arg;
        state.lessons = state.lessons.filter((l) => l.id !== lessonId);
        state.optimisticOperations.lessons.deletes.push(lessonId);
      })
      .addCase(deleteLesson.fulfilled, (state, action) => {
        state.deleteLessonLoading = false;
        state.loading = false;
        state.error = null;

        const { lessonId } = action.payload;
        state.optimisticOperations.lessons.deletes =
          state.optimisticOperations.lessons.deletes.filter(
            (id) => id !== lessonId
          );
      })
      .addCase(deleteLesson.rejected, (state, action) => {
        state.deleteLessonLoading = false;
        state.loading = false;
        state.error =
          action.payload?.error?.message || "Failed to delete lesson";

        const { lessonId, originalLesson } = action.payload;

        if (originalLesson) {
          state.lessons.push(originalLesson);
        }

        state.optimisticOperations.lessons.deletes =
          state.optimisticOperations.lessons.deletes.filter(
            (id) => id !== lessonId
          );
      })

      .addCase(reorderLessons.pending, (state, action) => {
        state.reorderLessonsLoading = true;
        state.loading = true;
        state.error = null;

        const { sectionId, lessonIds } = action.meta.arg;
        const sectionLessons = state.lessons.filter(
          (l) => l.sectionId === sectionId
        );
        const otherLessons = state.lessons.filter(
          (l) => l.sectionId !== sectionId
        );

        const reorderedLessons = [];
        lessonIds.forEach((id) => {
          const lesson = sectionLessons.find((l) => l.id === id);
          if (lesson) reorderedLessons.push(lesson);
        });

        state.lessons = [...otherLessons, ...reorderedLessons];
      })
      .addCase(reorderLessons.fulfilled, (state) => {
        state.reorderLessonsLoading = false;
        state.loading = false;
        state.error = null;
      })
      .addCase(reorderLessons.rejected, (state, action) => {
        state.reorderLessonsLoading = false;
        state.loading = false;
        state.error =
          action.payload?.error?.message || "Failed to reorder lessons";

        const { originalOrder, sectionId } = action.payload;
        if (originalOrder) {
          const otherLessons = state.lessons.filter(
            (l) => l.sectionId !== sectionId
          );
          const reorderedLessons = [];
          originalOrder.forEach((id) => {
            const lesson = state.lessons.find((l) => l.id === id);
            if (lesson) reorderedLessons.push(lesson);
          });
          state.lessons = [...otherLessons, ...reorderedLessons];
        }
      })

      .addCase(createQuiz.pending, (state, action) => {
        state.createQuizLoading = true;
        state.loading = true;
        state.error = null;

        const tempQuiz = {
          id: `temp_${Date.now()}`,
          ...action.meta.arg.quizData,
          sectionId: action.meta.arg.sectionId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        state.quizzes.unshift(tempQuiz);
        state.optimisticOperations.quizzes.creates.push(tempQuiz.id);
      })
      .addCase(createQuiz.fulfilled, (state, action) => {
        state.createQuizLoading = false;
        state.loading = false;
        state.error = null;

        const newQuiz = action.payload.data.quiz;
        const tempId = state.optimisticOperations.quizzes.creates[0];

        state.quizzes = state.quizzes.map((quiz) =>
          quiz.id === tempId ? newQuiz : quiz
        );

        state.optimisticOperations.quizzes.creates = [];
      })
      .addCase(createQuiz.rejected, (state, action) => {
        state.createQuizLoading = false;
        state.loading = false;
        state.error = action.payload?.error?.message || "Failed to create quiz";

        const tempId = state.optimisticOperations.quizzes.creates[0];
        if (tempId) {
          state.quizzes = state.quizzes.filter((q) => q.id !== tempId);
        }

        state.optimisticOperations.quizzes.creates = [];
      })

      .addCase(updateQuiz.pending, (state, action) => {
        state.updateQuizLoading = true;
        state.loading = true;
        state.error = null;

        const { quizId, updateData } = action.meta.arg;
        state.quizzes = state.quizzes.map((quiz) =>
          quiz.id === quizId
            ? { ...quiz, ...updateData, updatedAt: new Date().toISOString() }
            : quiz
        );

        state.optimisticOperations.quizzes.updates[quizId] = updateData;
      })
      .addCase(updateQuiz.fulfilled, (state, action) => {
        state.updateQuizLoading = false;
        state.loading = false;
        state.error = null;

        const { quizId } = action.payload;
        const updatedQuiz = action.payload.data.data.quiz;

        state.quizzes = state.quizzes.map((quiz) =>
          quiz.id === quizId ? updatedQuiz : quiz
        );

        delete state.optimisticOperations.quizzes.updates[quizId];
      })
      .addCase(updateQuiz.rejected, (state, action) => {
        state.updateQuizLoading = false;
        state.loading = false;
        state.error = action.payload?.error?.message || "Failed to update quiz";

        const { quizId, originalQuiz } = action.payload;

        if (originalQuiz) {
          state.quizzes = state.quizzes.map((quiz) =>
            quiz.id === quizId ? originalQuiz : quiz
          );
        }

        delete state.optimisticOperations.quizzes.updates[quizId];
      })

      .addCase(deleteQuiz.pending, (state, action) => {
        state.deleteQuizLoading = true;
        state.loading = true;
        state.error = null;

        const quizId = action.meta.arg;
        state.quizzes = state.quizzes.filter((q) => q.id !== quizId);
        state.optimisticOperations.quizzes.deletes.push(quizId);
      })
      .addCase(deleteQuiz.fulfilled, (state, action) => {
        state.deleteQuizLoading = false;
        state.loading = false;
        state.error = null;

        const { quizId } = action.payload;
        state.optimisticOperations.quizzes.deletes =
          state.optimisticOperations.quizzes.deletes.filter(
            (id) => id !== quizId
          );
      })
      .addCase(deleteQuiz.rejected, (state, action) => {
        state.deleteQuizLoading = false;
        state.loading = false;
        state.error = action.payload?.error?.message || "Failed to delete quiz";

        const { quizId, originalQuiz } = action.payload;

        if (originalQuiz) {
          state.quizzes.push(originalQuiz);
        }

        state.optimisticOperations.quizzes.deletes =
          state.optimisticOperations.quizzes.deletes.filter(
            (id) => id !== quizId
          );
      })

      .addCase(addQuizQuestions.pending, (state, action) => {
        state.addQuizQuestionsLoading = true;
        state.loading = true;
        state.error = null;

        const { quizId, questions } = action.meta.arg;
        const tempQuestions = questions.map((q, index) => ({
          id: `temp_${Date.now()}_${index}`,
          ...q,
          quizId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }));

        state.questions = [...state.questions, ...tempQuestions];
        tempQuestions.forEach((q) => {
          state.optimisticOperations.questions.creates.push(q.id);
        });
      })
      .addCase(addQuizQuestions.fulfilled, (state, action) => {
        state.addQuizQuestionsLoading = false;
        state.loading = false;
        state.error = null;

        const newQuestions = action.payload.data.questions;
        const tempIds = state.optimisticOperations.questions.creates;

        state.questions = state.questions.filter(
          (q) => !tempIds.includes(q.id)
        );
        state.questions = [...state.questions, ...newQuestions];

        state.optimisticOperations.questions.creates = [];
      })
      .addCase(addQuizQuestions.rejected, (state, action) => {
        state.addQuizQuestionsLoading = false;
        state.loading = false;
        state.error =
          action.payload?.error?.message || "Failed to add questions";

        const tempIds = state.optimisticOperations.questions.creates;
        state.questions = state.questions.filter(
          (q) => !tempIds.includes(q.id)
        );

        state.optimisticOperations.questions.creates = [];
      })

      .addCase(updateQuizQuestion.pending, (state, action) => {
        state.updateQuizQuestionLoading = true;
        state.loading = true;
        state.error = null;

        const { questionId, updateData } = action.meta.arg;
        state.questions = state.questions.map((question) =>
          question.id === questionId
            ? {
                ...question,
                ...updateData,
                updatedAt: new Date().toISOString(),
              }
            : question
        );

        state.optimisticOperations.questions.updates[questionId] = updateData;
      })
      .addCase(updateQuizQuestion.fulfilled, (state, action) => {
        state.updateQuizQuestionLoading = false;
        state.loading = false;
        state.error = null;

        const { questionId } = action.payload;
        const updatedQuestion = action.payload.data.data.question;

        state.questions = state.questions.map((question) =>
          question.id === questionId ? updatedQuestion : question
        );

        delete state.optimisticOperations.questions.updates[questionId];
      })
      .addCase(updateQuizQuestion.rejected, (state, action) => {
        state.updateQuizQuestionLoading = false;
        state.loading = false;
        state.error =
          action.payload?.error?.message || "Failed to update question";

        const { questionId, originalQuestion } = action.payload;

        if (originalQuestion) {
          state.questions = state.questions.map((question) =>
            question.id === questionId ? originalQuestion : question
          );
        }

        delete state.optimisticOperations.questions.updates[questionId];
      })

      .addCase(deleteQuizQuestion.pending, (state, action) => {
        state.deleteQuizQuestionLoading = true;
        state.loading = true;
        state.error = null;

        const questionId = action.meta.arg;
        state.questions = state.questions.filter((q) => q.id !== questionId);
        state.optimisticOperations.questions.deletes.push(questionId);
      })
      .addCase(deleteQuizQuestion.fulfilled, (state, action) => {
        state.deleteQuizQuestionLoading = false;
        state.loading = false;
        state.error = null;

        const { questionId } = action.payload;
        state.optimisticOperations.questions.deletes =
          state.optimisticOperations.questions.deletes.filter(
            (id) => id !== questionId
          );
      })
      .addCase(deleteQuizQuestion.rejected, (state, action) => {
        state.deleteQuizQuestionLoading = false;
        state.loading = false;
        state.error =
          action.payload?.error?.message || "Failed to delete question";

        const { questionId, originalQuestion } = action.payload;

        if (originalQuestion) {
          state.questions.push(originalQuestion);
        }

        state.optimisticOperations.questions.deletes =
          state.optimisticOperations.questions.deletes.filter(
            (id) => id !== questionId
          );
      })

      .addCase(reorderQuizQuestions.pending, (state, action) => {
        state.reorderQuizQuestionsLoading = true;
        state.loading = true;
        state.error = null;

        const { quizId, questionIds } = action.meta.arg;
        const quizQuestions = state.questions.filter(
          (q) => q.quizId === quizId
        );
        const otherQuestions = state.questions.filter(
          (q) => q.quizId !== quizId
        );

        const reorderedQuestions = [];
        questionIds.forEach((id) => {
          const question = quizQuestions.find((q) => q.id === id);
          if (question) reorderedQuestions.push(question);
        });

        state.questions = [...otherQuestions, ...reorderedQuestions];
      })
      .addCase(reorderQuizQuestions.fulfilled, (state) => {
        state.reorderQuizQuestionsLoading = false;
        state.loading = false;
        state.error = null;
      })
      .addCase(reorderQuizQuestions.rejected, (state, action) => {
        state.reorderQuizQuestionsLoading = false;
        state.loading = false;
        state.error =
          action.payload?.error?.message || "Failed to reorder questions";

        const { originalOrder, quizId } = action.payload;
        if (originalOrder) {
          const otherQuestions = state.questions.filter(
            (q) => q.quizId !== quizId
          );
          const reorderedQuestions = [];
          originalOrder.forEach((id) => {
            const question = state.questions.find((q) => q.id === id);
            if (question) reorderedQuestions.push(question);
          });
          state.questions = [...otherQuestions, ...reorderedQuestions];
        }
      })

      .addCase(createAssignment.pending, (state, action) => {
        state.createAssignmentLoading = true;
        state.loading = true;
        state.error = null;

        const tempAssignment = {
          id: `temp_${Date.now()}`,
          ...action.meta.arg.assignmentData,
          sectionId: action.meta.arg.sectionId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        state.assignments.unshift(tempAssignment);
        state.optimisticOperations.assignments.creates.push(tempAssignment.id);
      })
      .addCase(createAssignment.fulfilled, (state, action) => {
        state.createAssignmentLoading = false;
        state.loading = false;
        state.error = null;

        const newAssignment = action.payload.data.assignment;
        const tempId = state.optimisticOperations.assignments.creates[0];

        state.assignments = state.assignments.map((assignment) =>
          assignment.id === tempId ? newAssignment : assignment
        );

        state.optimisticOperations.assignments.creates = [];
      })
      .addCase(createAssignment.rejected, (state, action) => {
        state.createAssignmentLoading = false;
        state.loading = false;
        state.error =
          action.payload?.error?.message || "Failed to create assignment";

        const tempId = state.optimisticOperations.assignments.creates[0];
        if (tempId) {
          state.assignments = state.assignments.filter((a) => a.id !== tempId);
        }

        state.optimisticOperations.assignments.creates = [];
      })

      .addCase(updateAssignment.pending, (state, action) => {
        state.updateAssignmentLoading = true;
        state.loading = true;
        state.error = null;

        const { assignmentId, updateData } = action.meta.arg;
        state.assignments = state.assignments.map((assignment) =>
          assignment.id === assignmentId
            ? {
                ...assignment,
                ...updateData,
                updatedAt: new Date().toISOString(),
              }
            : assignment
        );

        state.optimisticOperations.assignments.updates[assignmentId] =
          updateData;
      })
      .addCase(updateAssignment.fulfilled, (state, action) => {
        state.updateAssignmentLoading = false;
        state.loading = false;
        state.error = null;

        const { assignmentId } = action.payload;
        const updatedAssignment = action.payload.data.data.assignment;

        state.assignments = state.assignments.map((assignment) =>
          assignment.id === assignmentId ? updatedAssignment : assignment
        );

        delete state.optimisticOperations.assignments.updates[assignmentId];
      })
      .addCase(updateAssignment.rejected, (state, action) => {
        state.updateAssignmentLoading = false;
        state.loading = false;
        state.error =
          action.payload?.error?.message || "Failed to update assignment";

        const { assignmentId, originalAssignment } = action.payload;

        if (originalAssignment) {
          state.assignments = state.assignments.map((assignment) =>
            assignment.id === assignmentId ? originalAssignment : assignment
          );
        }

        delete state.optimisticOperations.assignments.updates[assignmentId];
      })

      .addCase(deleteAssignment.pending, (state, action) => {
        state.deleteAssignmentLoading = true;
        state.loading = true;
        state.error = null;

        const assignmentId = action.meta.arg;
        state.assignments = state.assignments.filter(
          (a) => a.id !== assignmentId
        );
        state.optimisticOperations.assignments.deletes.push(assignmentId);
      })
      .addCase(deleteAssignment.fulfilled, (state, action) => {
        state.deleteAssignmentLoading = false;
        state.loading = false;
        state.error = null;

        const { assignmentId } = action.payload;
        state.optimisticOperations.assignments.deletes =
          state.optimisticOperations.assignments.deletes.filter(
            (id) => id !== assignmentId
          );
      })
      .addCase(deleteAssignment.rejected, (state, action) => {
        state.deleteAssignmentLoading = false;
        state.loading = false;
        state.error =
          action.payload?.error?.message || "Failed to delete assignment";

        const { assignmentId, originalAssignment } = action.payload;

        if (originalAssignment) {
          state.assignments.push(originalAssignment);
        }

        state.optimisticOperations.assignments.deletes =
          state.optimisticOperations.assignments.deletes.filter(
            (id) => id !== assignmentId
          );
      })

      .addCase(getContentStats.pending, (state) => {
        state.getContentStatsLoading = true;
        state.loading = true;
        state.error = null;
      })
      .addCase(getContentStats.fulfilled, (state, action) => {
        state.getContentStatsLoading = false;
        state.loading = false;
        state.error = null;
        state.contentStats = action.payload.data.stats;
      })
      .addCase(getContentStats.rejected, (state, action) => {
        state.getContentStatsLoading = false;
        state.loading = false;
        state.error =
          action.payload?.message || "Failed to fetch content stats";
      })

      .addCase(validateCourseContent.pending, (state) => {
        state.validateCourseContentLoading = true;
        state.loading = true;
        state.error = null;
      })
      .addCase(validateCourseContent.fulfilled, (state, action) => {
        state.validateCourseContentLoading = false;
        state.loading = false;
        state.error = null;
        state.validationResult = action.payload.data;
      })
      .addCase(validateCourseContent.rejected, (state, action) => {
        state.validateCourseContentLoading = false;
        state.loading = false;
        state.error =
          action.payload?.message || "Failed to validate course content";
      })

      .addCase(publishAllSections.pending, (state) => {
        state.publishAllSectionsLoading = true;
        state.loading = true;
        state.error = null;
      })
      .addCase(publishAllSections.fulfilled, (state, action) => {
        state.publishAllSectionsLoading = false;
        state.loading = false;
        state.error = null;

        const publishedSectionIds = action.payload.data.publishedSections;
        if (publishedSectionIds) {
          state.sections = state.sections.map((section) =>
            publishedSectionIds.includes(section.id)
              ? { ...section, isPublished: true }
              : section
          );
        }
      })
      .addCase(publishAllSections.rejected, (state, action) => {
        state.publishAllSectionsLoading = false;
        state.loading = false;
        state.error = action.payload?.message || "Failed to publish sections";
      })

      .addCase(exportCourseContent.pending, (state) => {
        state.exportCourseContentLoading = true;
        state.loading = true;
        state.error = null;
      })
      .addCase(exportCourseContent.fulfilled, (state, action) => {
        state.exportCourseContentLoading = false;
        state.loading = false;
        state.error = null;
        state.exportData = action.payload.data.exportData;
      })
      .addCase(exportCourseContent.rejected, (state, action) => {
        state.exportCourseContentLoading = false;
        state.loading = false;
        state.error =
          action.payload?.message || "Failed to export course content";
      })

      .addCase(importCourseContent.pending, (state) => {
        state.importCourseContentLoading = true;
        state.loading = true;
        state.error = null;
      })
      .addCase(importCourseContent.fulfilled, (state) => {
        state.importCourseContentLoading = false;
        state.loading = false;
        state.error = null;
      })
      .addCase(importCourseContent.rejected, (state, action) => {
        state.importCourseContentLoading = false;
        state.loading = false;
        state.error =
          action.payload?.message || "Failed to import course content";
      })

      .addCase(previewContent.pending, (state) => {
        state.previewContentLoading = true;
        state.loading = true;
        state.error = null;
      })
      .addCase(previewContent.fulfilled, (state, action) => {
        state.previewContentLoading = false;
        state.loading = false;
        state.error = null;
        state.previewData = action.payload.data;
      })
      .addCase(previewContent.rejected, (state, action) => {
        state.previewContentLoading = false;
        state.loading = false;
        state.error = action.payload?.message || "Failed to preview content";
      })

      .addCase(searchCourseContent.pending, (state) => {
        state.searchCourseContentLoading = true;
        state.loading = true;
        state.error = null;
      })
      .addCase(searchCourseContent.fulfilled, (state, action) => {
        state.searchCourseContentLoading = false;
        state.loading = false;
        state.error = null;
        state.searchResults = action.payload.data;
      })
      .addCase(searchCourseContent.rejected, (state, action) => {
        state.searchCourseContentLoading = false;
        state.loading = false;
        state.error =
          action.payload?.message || "Failed to search course content";
      })

      .addCase(submitQuizAttempt.pending, (state) => {
        state.submitQuizAttemptLoading = true;
        state.loading = true;
        state.error = null;
      })
      .addCase(submitQuizAttempt.fulfilled, (state) => {
        state.submitQuizAttemptLoading = false;
        state.loading = false;
        state.error = null;
      })
      .addCase(submitQuizAttempt.rejected, (state, action) => {
        state.submitQuizAttemptLoading = false;
        state.loading = false;
        state.error =
          action.payload?.message || "Failed to submit quiz attempt";
      })

      .addCase(getQuizResults.pending, (state) => {
        state.getQuizResultsLoading = true;
        state.loading = true;
        state.error = null;
      })
      .addCase(getQuizResults.fulfilled, (state, action) => {
        state.getQuizResultsLoading = false;
        state.loading = false;
        state.error = null;
        state.quizResults = action.payload.data;
      })
      .addCase(getQuizResults.rejected, (state, action) => {
        state.getQuizResultsLoading = false;
        state.loading = false;
        state.error = action.payload?.message || "Failed to fetch quiz results";
      })

      .addCase(getQuizAttempts.pending, (state) => {
        state.getQuizAttemptsLoading = true;
        state.loading = true;
        state.error = null;
      })
      .addCase(getQuizAttempts.fulfilled, (state, action) => {
        state.getQuizAttemptsLoading = false;
        state.loading = false;
        state.error = null;
        state.quizAttempts = action.payload.data.attempts;
        state.attemptsPagination = action.payload.data.pagination;
      })
      .addCase(getQuizAttempts.rejected, (state, action) => {
        state.getQuizAttemptsLoading = false;
        state.loading = false;
        state.error =
          action.payload?.message || "Failed to fetch quiz attempts";
      })

      .addCase(getQuizDetails.pending, (state) => {
        state.getQuizDetailsLoading = true;
        state.loading = true;
        state.error = null;
      })
      .addCase(getQuizDetails.fulfilled, (state) => {
        state.getQuizDetailsLoading = false;
        state.loading = false;
        state.error = null;
      })
      .addCase(getQuizDetails.rejected, (state, action) => {
        state.getQuizDetailsLoading = false;
        state.loading = false;
        state.error = action.payload?.message || "Failed to fetch quiz details";
      })

      .addCase(getCourseSections.pending, (state) => {
        state.getCourseSectionsLoading = true;
        state.loading = true;
        state.error = null;
      })
      .addCase(getCourseSections.fulfilled, (state, action) => {
        state.getCourseSectionsLoading = false;
        state.loading = false;
        state.error = null;
        state.sections = action.payload.data.sections;
        state.sectionsPagination = action.payload.data.pagination;
      })
      .addCase(getCourseSections.rejected, (state, action) => {
        state.getCourseSectionsLoading = false;
        state.loading = false;
        state.error =
          action.payload?.message || "Failed to fetch course sections";
      })

      .addCase(getSectionQuizzes.pending, (state) => {
        state.getSectionQuizzesLoading = true;
        state.loading = true;
        state.error = null;
      })
      .addCase(getSectionQuizzes.fulfilled, (state, action) => {
        state.getSectionQuizzesLoading = false;
        state.loading = false;
        state.error = null;
        state.quizzes = action.payload.data.quizzes;
        state.quizzesPagination = action.payload.data.pagination;
      })
      .addCase(getSectionQuizzes.rejected, (state, action) => {
        state.getSectionQuizzesLoading = false;
        state.loading = false;
        state.error =
          action.payload?.message || "Failed to fetch section quizzes";
      })

      .addCase(getSectionLessons.pending, (state) => {
        state.getSectionLessonsLoading = true;
        state.loading = true;
        state.error = null;
      })
      .addCase(getSectionLessons.fulfilled, (state, action) => {
        state.getSectionLessonsLoading = false;
        state.loading = false;
        state.error = null;
        state.lessons = action.payload.data.lessons;
        state.lessonsPagination = action.payload.data.pagination;
      })
      .addCase(getSectionLessons.rejected, (state, action) => {
        state.getSectionLessonsLoading = false;
        state.loading = false;
        state.error =
          action.payload?.message || "Failed to fetch section lessons";
      })

      .addCase(getQuizQuestions.pending, (state) => {
        state.getQuizQuestionsLoading = true;
        state.loading = true;
        state.error = null;
      })
      .addCase(getQuizQuestions.fulfilled, (state, action) => {
        state.getQuizQuestionsLoading = false;
        state.loading = false;
        state.error = null;
        state.questions = action.payload.data.questions;
        state.questionsPagination = action.payload.data.pagination;
      })
      .addCase(getQuizQuestions.rejected, (state, action) => {
        state.getQuizQuestionsLoading = false;
        state.loading = false;
        state.error =
          action.payload?.message || "Failed to fetch quiz questions";
      })

      .addCase(getSingleLesson.pending, (state) => {
        state.getSingleLessonLoading = true;
        state.loading = true;
        state.error = null;
      })
      .addCase(getSingleLesson.fulfilled, (state, action) => {
        state.getSingleLessonLoading = false;
        state.loading = false;
        state.error = null;
        state.singleLesson = action.payload.data.lesson;
      })
      .addCase(getSingleLesson.rejected, (state, action) => {
        state.getSingleLessonLoading = false;
        state.loading = false;
        state.error = action.payload?.message || "Failed to fetch lesson";
      })

      .addCase(getSingleQuiz.pending, (state) => {
        state.getSingleQuizLoading = true;
        state.loading = true;
        state.error = null;
      })
      .addCase(getSingleQuiz.fulfilled, (state, action) => {
        state.getSingleQuizLoading = false;
        state.loading = false;
        state.error = null;
        state.singleQuiz = action.payload.data.quiz;
      })
      .addCase(getSingleQuiz.rejected, (state, action) => {
        state.getSingleQuizLoading = false;
        state.loading = false;
        state.error = action.payload?.message || "Failed to fetch quiz";
      })

      .addCase(getAllAssignments.pending, (state) => {
        state.getAllAssignmentsLoading = true;
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllAssignments.fulfilled, (state, action) => {
        state.getAllAssignmentsLoading = false;
        state.loading = false;
        state.error = null;
        state.assignments = action.payload.data.assignments;
      })
      .addCase(getAllAssignments.rejected, (state, action) => {
        state.getAllAssignmentsLoading = false;
        state.loading = false;
        state.error = action.payload?.message || "Failed to fetch assignments";
      });
  },
});

export const {
  clearError,
  clearCourseStructure,
  clearSections,
  clearLessons,
  clearQuizzes,
  clearQuestions,
  clearAssignments,
  clearContentStats,
  clearValidationResult,
  clearPreviewData,
  clearSearchResults,
  clearExportData,
  clearQuizAttempts,
  clearQuizResults,
  resetContentManagementState,
  optimisticSectionUpdate,
  optimisticLessonUpdate,
  optimisticQuizUpdate,
  optimisticQuestionUpdate,
  optimisticAssignmentUpdate,
} = contentManagementSlice.actions;

const contentManagementReducer = contentManagementSlice.reducer;

export default contentManagementReducer;
