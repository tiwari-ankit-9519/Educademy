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
  contentStats: null,
  validationResult: null,
  previewContent: null,
  searchResults: null,
  exportData: null,
  singleLesson: null,
  singleQuiz: null,
  quizAttempts: [],
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
  getAllAssignmentsLoading: false,
  getContentStatsLoading: false,
  validateCourseContentLoading: false,
  publishAllSectionsLoading: false,
  exportCourseContentLoading: false,
  importCourseContentLoading: false,
  previewContentLoading: false,
  searchCourseContentLoading: false,
  getCourseSectionsLoading: false,
  getSectionQuizzesLoading: false,
  getSectionLessonsLoading: false,
  getQuizQuestionsLoading: false,
  getSingleLessonLoading: false,
  getSingleQuizLoading: false,
  getQuizAttemptsLoading: false,
  sectionsFilters: {
    search: "",
    courseId: "",
    sortBy: "order",
    sortOrder: "asc",
    page: 1,
    limit: 50,
  },
  sectionsPagination: {
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  },
  lessonsFilters: {
    search: "",
    sectionId: "",
    sortBy: "order",
    sortOrder: "asc",
    page: 1,
    limit: 50,
  },
  lessonsPagination: {
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  },
  quizzesFilters: {
    search: "",
    sectionId: "",
    sortBy: "order",
    sortOrder: "asc",
    page: 1,
    limit: 50,
  },
  quizzesPagination: {
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  },
  questionsFilters: {
    search: "",
    quizId: "",
    sortBy: "order",
    sortOrder: "asc",
    page: 1,
    limit: 50,
  },
  questionsPagination: {
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  },
  assignmentsFilters: {
    search: "",
    sectionId: "",
    sortBy: "order",
    sortOrder: "asc",
    page: 1,
    limit: 50,
  },
  assignmentsPagination: {
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  },
  optimisticUpdates: {},
  needsRefresh: false,
};

export const getCourseStructure = createAsyncThunk(
  "content/getCourseStructure",
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
  "content/createSection",
  async ({ courseId, sectionData }, { rejectWithValue }) => {
    const tempId = `temp_${Date.now()}`;

    try {
      const response = await api.post(
        `/instructor/content/course/${courseId}/sections`,
        sectionData
      );
      toast.success("Section created successfully");
      return {
        data: response.data,
        tempId,
      };
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue({
        error: error.response?.data || { message },
        tempId,
      });
    }
  }
);

export const updateSection = createAsyncThunk(
  "content/updateSection",
  async ({ sectionId, sectionData }, { rejectWithValue, getState }) => {
    const originalSection = getState().content.sections.find(
      (s) => s.id === sectionId
    );
    const updatedSection = {
      ...originalSection,
      ...sectionData,
      updatedAt: new Date().toISOString(),
      _isOptimistic: true,
    };

    try {
      const response = await api.put(
        `/instructor/content/section/${sectionId}`,
        sectionData
      );
      toast.success("Section updated successfully");
      return {
        data: response.data,
        sectionId,
        originalSection,
        updatedSection,
      };
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue({
        error: error.response?.data || { message },
        sectionId,
        originalSection,
        updatedSection,
      });
    }
  }
);

export const deleteSection = createAsyncThunk(
  "content/deleteSection",
  async (sectionId, { rejectWithValue, getState }) => {
    const originalSection = getState().content.sections.find(
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
  "content/reorderSections",
  async ({ courseId, sectionIds }, { rejectWithValue, getState }) => {
    const originalOrder = [...getState().content.sections];
    const reorderedSections = sectionIds.map((id, index) => {
      const section = originalOrder.find((s) => s.id === id);
      return { ...section, order: index + 1, _isOptimistic: true };
    });

    try {
      const response = await api.put(
        `/instructor/content/course/${courseId}/sections/reorder`,
        { sectionIds }
      );
      toast.success("Sections reordered successfully");
      return {
        data: response.data,
        sectionIds,
        originalOrder,
        reorderedSections,
      };
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue({
        error: error.response?.data || { message },
        sectionIds,
        originalOrder,
        reorderedSections,
      });
    }
  }
);

export const createLesson = createAsyncThunk(
  "content/createLesson",
  async ({ sectionId, lessonData }, { rejectWithValue, getState }) => {
    const tempId = `temp_${Date.now()}`;
    const optimisticLesson = {
      id: tempId,
      ...lessonData,
      sectionId,
      order:
        getState().content.lessons.filter((l) => l.sectionId === sectionId)
          .length + 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      _isOptimistic: true,
    };

    try {
      const response = await api.post(
        `/instructor/content/section/${sectionId}/lessons`,
        lessonData
      );
      toast.success("Lesson created successfully");
      return {
        data: response.data,
        tempId,
        optimisticLesson,
      };
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue({
        error: error.response?.data || { message },
        tempId,
        optimisticLesson,
      });
    }
  }
);

export const updateLesson = createAsyncThunk(
  "content/updateLesson",
  async ({ lessonId, lessonData }, { rejectWithValue, getState }) => {
    const originalLesson = getState().content.lessons.find(
      (l) => l.id === lessonId
    );
    const updatedLesson = {
      ...originalLesson,
      ...lessonData,
      updatedAt: new Date().toISOString(),
      _isOptimistic: true,
    };

    try {
      const response = await api.put(
        `/instructor/content/lesson/${lessonId}`,
        lessonData
      );
      toast.success("Lesson updated successfully");
      return {
        data: response.data,
        lessonId,
        originalLesson,
        updatedLesson,
      };
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue({
        error: error.response?.data || { message },
        lessonId,
        originalLesson,
        updatedLesson,
      });
    }
  }
);

export const deleteLesson = createAsyncThunk(
  "content/deleteLesson",
  async (lessonId, { rejectWithValue, getState }) => {
    const originalLesson = getState().content.lessons.find(
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
  "content/reorderLessons",
  async ({ sectionId, lessonIds }, { rejectWithValue, getState }) => {
    const originalOrder = [...getState().content.lessons];
    const reorderedLessons = lessonIds.map((id, index) => {
      const lesson = originalOrder.find((l) => l.id === id);
      return { ...lesson, order: index + 1, _isOptimistic: true };
    });

    try {
      const response = await api.put(
        `/instructor/content/section/${sectionId}/lessons/reorder`,
        { lessonIds }
      );
      toast.success("Lessons reordered successfully");
      return {
        data: response.data,
        lessonIds,
        originalOrder,
        reorderedLessons,
      };
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue({
        error: error.response?.data || { message },
        lessonIds,
        originalOrder,
        reorderedLessons,
      });
    }
  }
);

export const createQuiz = createAsyncThunk(
  "content/createQuiz",
  async ({ sectionId, quizData }, { rejectWithValue, getState }) => {
    const tempId = `temp_${Date.now()}`;
    const optimisticQuiz = {
      id: tempId,
      ...quizData,
      sectionId,
      order:
        getState().content.quizzes.filter((q) => q.sectionId === sectionId)
          .length + 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      _isOptimistic: true,
    };

    try {
      const response = await api.post(
        `/instructor/content/section/${sectionId}/quizzes`,
        quizData
      );
      toast.success("Quiz created successfully");
      return {
        data: response.data,
        tempId,
        optimisticQuiz,
      };
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue({
        error: error.response?.data || { message },
        tempId,
        optimisticQuiz,
      });
    }
  }
);

export const updateQuiz = createAsyncThunk(
  "content/updateQuiz",
  async ({ quizId, quizData }, { rejectWithValue, getState }) => {
    const originalQuiz = getState().content.quizzes.find(
      (q) => q.id === quizId
    );
    const updatedQuiz = {
      ...originalQuiz,
      ...quizData,
      updatedAt: new Date().toISOString(),
      _isOptimistic: true,
    };

    try {
      const response = await api.put(
        `/instructor/content/quiz/${quizId}`,
        quizData
      );
      toast.success("Quiz updated successfully");
      return {
        data: response.data,
        quizId,
        originalQuiz,
        updatedQuiz,
      };
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue({
        error: error.response?.data || { message },
        quizId,
        originalQuiz,
        updatedQuiz,
      });
    }
  }
);

export const deleteQuiz = createAsyncThunk(
  "content/deleteQuiz",
  async (quizId, { rejectWithValue, getState }) => {
    const originalQuiz = getState().content.quizzes.find(
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
  "content/addQuizQuestions",
  async ({ quizId, questions }, { rejectWithValue, getState }) => {
    const tempQuestions = questions.map((q, index) => ({
      id: `temp_${Date.now()}_${index}`,
      ...q,
      quizId,
      order:
        getState().content.questions.filter((qu) => qu.quizId === quizId)
          .length +
        index +
        1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      _isOptimistic: true,
    }));

    try {
      const response = await api.post(
        `/instructor/content/quiz/${quizId}/questions`,
        { questions }
      );
      toast.success("Questions added successfully");
      return {
        data: response.data,
        tempQuestions,
      };
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue({
        error: error.response?.data || { message },
        tempQuestions,
      });
    }
  }
);

export const updateQuizQuestion = createAsyncThunk(
  "content/updateQuizQuestion",
  async ({ questionId, questionData }, { rejectWithValue, getState }) => {
    const originalQuestion = getState().content.questions.find(
      (q) => q.id === questionId
    );
    const updatedQuestion = {
      ...originalQuestion,
      ...questionData,
      updatedAt: new Date().toISOString(),
      _isOptimistic: true,
    };

    try {
      const response = await api.put(
        `/instructor/content/question/${questionId}`,
        questionData
      );
      toast.success("Question updated successfully");
      return {
        data: response.data,
        questionId,
        originalQuestion,
        updatedQuestion,
      };
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue({
        error: error.response?.data || { message },
        questionId,
        originalQuestion,
        updatedQuestion,
      });
    }
  }
);

export const deleteQuizQuestion = createAsyncThunk(
  "content/deleteQuizQuestion",
  async (questionId, { rejectWithValue, getState }) => {
    const originalQuestion = getState().content.questions.find(
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
  "content/reorderQuizQuestions",
  async ({ quizId, questionIds }, { rejectWithValue, getState }) => {
    const originalOrder = [...getState().content.questions];
    const reorderedQuestions = questionIds.map((id, index) => {
      const question = originalOrder.find((q) => q.id === id);
      return { ...question, order: index + 1, _isOptimistic: true };
    });

    try {
      const response = await api.put(
        `/instructor/content/quiz/${quizId}/questions/reorder`,
        { questionIds }
      );
      toast.success("Questions reordered successfully");
      return {
        data: response.data,
        questionIds,
        originalOrder,
        reorderedQuestions,
      };
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue({
        error: error.response?.data || { message },
        questionIds,
        originalOrder,
        reorderedQuestions,
      });
    }
  }
);

export const createAssignment = createAsyncThunk(
  "content/createAssignment",
  async ({ sectionId, assignmentData }, { rejectWithValue, getState }) => {
    const tempId = `temp_${Date.now()}`;
    const optimisticAssignment = {
      id: tempId,
      ...assignmentData,
      sectionId,
      order:
        getState().content.assignments.filter((a) => a.sectionId === sectionId)
          .length + 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      _isOptimistic: true,
    };

    try {
      const response = await api.post(
        `/instructor/content/section/${sectionId}/assignments`,
        assignmentData
      );
      toast.success("Assignment created successfully");
      return {
        data: response.data,
        tempId,
        optimisticAssignment,
      };
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue({
        error: error.response?.data || { message },
        tempId,
        optimisticAssignment,
      });
    }
  }
);

export const updateAssignment = createAsyncThunk(
  "content/updateAssignment",
  async ({ assignmentId, assignmentData }, { rejectWithValue, getState }) => {
    const originalAssignment = getState().content.assignments.find(
      (a) => a.id === assignmentId
    );
    const updatedAssignment = {
      ...originalAssignment,
      ...assignmentData,
      updatedAt: new Date().toISOString(),
      _isOptimistic: true,
    };

    try {
      const response = await api.put(
        `/instructor/content/assignment/${assignmentId}`,
        assignmentData
      );
      toast.success("Assignment updated successfully");
      return {
        data: response.data,
        assignmentId,
        originalAssignment,
        updatedAssignment,
      };
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue({
        error: error.response?.data || { message },
        assignmentId,
        originalAssignment,
        updatedAssignment,
      });
    }
  }
);

export const deleteAssignment = createAsyncThunk(
  "content/deleteAssignment",
  async (assignmentId, { rejectWithValue, getState }) => {
    const originalAssignment = getState().content.assignments.find(
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

export const getAllAssignments = createAsyncThunk(
  "content/getAllAssignments",
  async ({ sectionId, ...params }, { rejectWithValue }) => {
    try {
      const response = await api.get(
        `/instructor/content/section/${sectionId}/assignments`,
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

export const getContentStats = createAsyncThunk(
  "content/getContentStats",
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
  "content/validateCourseContent",
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
  "content/publishAllSections",
  async (courseId, { rejectWithValue, getState }) => {
    const sectionsToUpdate = getState().content.sections.filter(
      (s) => !s.isPublished
    );
    const optimisticSections = sectionsToUpdate.map((s) => ({
      ...s,
      isPublished: true,
      _isOptimistic: true,
    }));

    try {
      const response = await api.post(
        `/instructor/content/course/${courseId}/publish-sections`
      );
      toast.success("All sections published successfully");
      return {
        data: response.data,
        sectionsToUpdate,
        optimisticSections,
      };
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue({
        error: error.response?.data || { message },
        sectionsToUpdate,
        optimisticSections,
      });
    }
  }
);

export const exportCourseContent = createAsyncThunk(
  "content/exportCourseContent",
  async ({ courseId, format }, { rejectWithValue }) => {
    try {
      const response = await api.get(
        `/instructor/content/course/${courseId}/export`,
        {
          params: { format },
        }
      );
      toast.success("Course content exported successfully");
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(error.response?.data || { message });
    }
  }
);

export const importCourseContent = createAsyncThunk(
  "content/importCourseContent",
  async ({ courseId, importData, replaceExisting }, { rejectWithValue }) => {
    try {
      const response = await api.post(
        `/instructor/content/course/${courseId}/import`,
        {
          importData,
          replaceExisting,
        }
      );
      toast.success("Course content imported successfully");
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return rejectWithValue(error.response?.data || { message });
    }
  }
);

export const previewContent = createAsyncThunk(
  "content/previewContent",
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
  "content/searchCourseContent",
  async ({ courseId, ...params }, { rejectWithValue }) => {
    try {
      const response = await api.get(
        `/instructor/content/course/${courseId}/search`,
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

export const getCourseSections = createAsyncThunk(
  "content/getCourseSections",
  async ({ courseId, ...params }, { rejectWithValue }) => {
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
  "content/getSectionQuizzes",
  async ({ sectionId, ...params }, { rejectWithValue }) => {
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
  "content/getSectionLessons",
  async ({ sectionId, ...params }, { rejectWithValue }) => {
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
  "content/getQuizQuestions",
  async ({ quizId, ...params }, { rejectWithValue }) => {
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
  "content/getSingleLesson",
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
  "content/getSingleQuiz",
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

export const getQuizAttempts = createAsyncThunk(
  "content/getQuizAttempts",
  async ({ quizId, ...params }, { rejectWithValue }) => {
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

const addToArray = (array, items) => {
  const itemsArray = Array.isArray(items) ? items : [items];
  const newItems = itemsArray.filter(
    (item) => !array.some((existing) => existing.id === item.id)
  );
  return [...array, ...newItems];
};

const removeFromArray = (array, items) => {
  const itemsArray = Array.isArray(items) ? items : [items];
  const idsToRemove = itemsArray.map((item) =>
    typeof item === "string" ? item : item.id
  );
  return array.filter((item) => !idsToRemove.includes(item.id));
};

const updateInArray = (array, items) => {
  const itemsArray = Array.isArray(items) ? items : [items];
  return array.map((item) => {
    const updatedItem = itemsArray.find((updated) => updated.id === item.id);
    return updatedItem ? { ...item, ...updatedItem } : item;
  });
};

const contentSlice = createSlice({
  name: "content",
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
    clearPreviewContent: (state) => {
      state.previewContent = null;
    },
    clearSearchResults: (state) => {
      state.searchResults = null;
    },
    clearExportData: (state) => {
      state.exportData = null;
    },
    clearSingleLesson: (state) => {
      state.singleLesson = null;
    },
    clearSingleQuiz: (state) => {
      state.singleQuiz = null;
    },
    clearQuizAttempts: (state) => {
      state.quizAttempts = [];
    },
    setSectionsFilters: (state, action) => {
      state.sectionsFilters = {
        ...state.sectionsFilters,
        ...action.payload,
      };
    },
    setLessonsFilters: (state, action) => {
      state.lessonsFilters = {
        ...state.lessonsFilters,
        ...action.payload,
      };
    },
    setQuizzesFilters: (state, action) => {
      state.quizzesFilters = {
        ...state.quizzesFilters,
        ...action.payload,
      };
    },
    setQuestionsFilters: (state, action) => {
      state.questionsFilters = {
        ...state.questionsFilters,
        ...action.payload,
      };
    },
    setAssignmentsFilters: (state, action) => {
      state.assignmentsFilters = {
        ...state.assignmentsFilters,
        ...action.payload,
      };
    },
    resetSectionsFilters: (state) => {
      state.sectionsFilters = initialState.sectionsFilters;
    },
    resetLessonsFilters: (state) => {
      state.lessonsFilters = initialState.lessonsFilters;
    },
    resetQuizzesFilters: (state) => {
      state.quizzesFilters = initialState.quizzesFilters;
    },
    resetQuestionsFilters: (state) => {
      state.questionsFilters = initialState.questionsFilters;
    },
    resetAssignmentsFilters: (state) => {
      state.assignmentsFilters = initialState.assignmentsFilters;
    },
    resetContentState: () => {
      return { ...initialState };
    },
    markForRefresh: (state) => {
      state.needsRefresh = true;
    },
    clearRefreshFlag: (state) => {
      state.needsRefresh = false;
    },
    optimisticSectionCreate: (state, action) => {
      state.sections = addToArray(state.sections, action.payload);
    },
    optimisticSectionUpdate: (state, action) => {
      state.sections = updateInArray(state.sections, action.payload);
    },
    optimisticSectionDelete: (state, action) => {
      state.sections = removeFromArray(state.sections, action.payload);
    },
    optimisticSectionReorder: (state, action) => {
      const { sectionIds } = action.payload;
      state.sections = sectionIds.map((id, index) => {
        const section = state.sections.find((s) => s.id === id);
        return { ...section, order: index + 1 };
      });
    },
    optimisticLessonCreate: (state, action) => {
      state.lessons = addToArray(state.lessons, action.payload);
    },
    optimisticLessonUpdate: (state, action) => {
      state.lessons = updateInArray(state.lessons, action.payload);
    },
    optimisticLessonDelete: (state, action) => {
      state.lessons = removeFromArray(state.lessons, action.payload);
    },
    optimisticLessonReorder: (state, action) => {
      const { lessonIds } = action.payload;
      state.lessons = lessonIds.map((id, index) => {
        const lesson = state.lessons.find((l) => l.id === id);
        return { ...lesson, order: index + 1 };
      });
    },
    optimisticQuizCreate: (state, action) => {
      state.quizzes = addToArray(state.quizzes, action.payload);
    },
    optimisticQuizUpdate: (state, action) => {
      state.quizzes = updateInArray(state.quizzes, action.payload);
    },
    optimisticQuizDelete: (state, action) => {
      state.quizzes = removeFromArray(state.quizzes, action.payload);
    },
    optimisticQuestionCreate: (state, action) => {
      state.questions = addToArray(state.questions, action.payload);
    },
    optimisticQuestionUpdate: (state, action) => {
      state.questions = updateInArray(state.questions, action.payload);
    },
    optimisticQuestionDelete: (state, action) => {
      state.questions = removeFromArray(state.questions, action.payload);
    },
    optimisticQuestionReorder: (state, action) => {
      const { questionIds } = action.payload;
      state.questions = questionIds.map((id, index) => {
        const question = state.questions.find((q) => q.id === id);
        return { ...question, order: index + 1 };
      });
    },
    optimisticAssignmentCreate: (state, action) => {
      state.assignments = addToArray(state.assignments, action.payload);
    },
    optimisticAssignmentUpdate: (state, action) => {
      state.assignments = updateInArray(state.assignments, action.payload);
    },
    optimisticAssignmentDelete: (state, action) => {
      state.assignments = removeFromArray(state.assignments, action.payload);
    },
    revertOptimisticUpdates: (state, action) => {
      const { type, data } = action.payload;
      switch (type) {
        case "section":
          if (data.originalSection) {
            state.sections = updateInArray(
              state.sections,
              data.originalSection
            );
          }
          if (data.tempId) {
            state.sections = removeFromArray(state.sections, {
              id: data.tempId,
            });
          }
          break;
        case "lesson":
          if (data.originalLesson) {
            state.lessons = updateInArray(state.lessons, data.originalLesson);
          }
          if (data.tempId) {
            state.lessons = removeFromArray(state.lessons, { id: data.tempId });
          }
          break;
        case "quiz":
          if (data.originalQuiz) {
            state.quizzes = updateInArray(state.quizzes, data.originalQuiz);
          }
          if (data.tempId) {
            state.quizzes = removeFromArray(state.quizzes, { id: data.tempId });
          }
          break;
        case "question":
          if (data.originalQuestion) {
            state.questions = updateInArray(
              state.questions,
              data.originalQuestion
            );
          }
          if (data.tempQuestions) {
            state.questions = removeFromArray(
              state.questions,
              data.tempQuestions
            );
          }
          break;
        case "assignment":
          if (data.originalAssignment) {
            state.assignments = updateInArray(
              state.assignments,
              data.originalAssignment
            );
          }
          if (data.tempId) {
            state.assignments = removeFromArray(state.assignments, {
              id: data.tempId,
            });
          }
          break;
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
        state.courseStructure = action.payload.data;
        state.needsRefresh = false;
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
        const { sectionData } = action.meta.arg;
        const tempId = `temp_${Date.now()}`;
        const optimisticSection = {
          id: tempId,
          ...sectionData,
          order: state.sections.length + 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          _isOptimistic: true,
        };
        state.sections = addToArray(state.sections, optimisticSection);
      })
      .addCase(createSection.fulfilled, (state, action) => {
        state.createSectionLoading = false;
        state.loading = false;
        state.error = null;
        const { tempId, data } = action.payload;
        state.sections = state.sections.map((section) =>
          section.id === tempId ? data.data.section : section
        );
      })
      .addCase(createSection.rejected, (state, action) => {
        state.createSectionLoading = false;
        state.loading = false;
        state.error =
          action.payload?.error?.message || "Failed to create section";
        const { tempId } = action.payload;
        state.sections = removeFromArray(state.sections, { id: tempId });
      })

      .addCase(updateSection.pending, (state, action) => {
        state.updateSectionLoading = true;
        state.loading = true;
        state.error = null;
        const { sectionId, sectionData } = action.meta.arg;
        const originalSection = state.sections.find((s) => s.id === sectionId);
        const updatedSection = {
          ...originalSection,
          ...sectionData,
          updatedAt: new Date().toISOString(),
          _isOptimistic: true,
        };
        state.sections = updateInArray(state.sections, updatedSection);
      })
      .addCase(updateSection.fulfilled, (state, action) => {
        state.updateSectionLoading = false;
        state.loading = false;
        state.error = null;
        const { data } = action.payload;
        state.sections = updateInArray(state.sections, data.data.section);
      })
      .addCase(updateSection.rejected, (state, action) => {
        state.updateSectionLoading = false;
        state.loading = false;
        state.error =
          action.payload?.error?.message || "Failed to update section";
        const { originalSection } = action.payload;
        if (originalSection) {
          state.sections = updateInArray(state.sections, originalSection);
        }
      })

      .addCase(deleteSection.pending, (state, action) => {
        state.deleteSectionLoading = true;
        state.loading = true;
        state.error = null;
        const sectionId = action.meta.arg;
        state.sections = removeFromArray(state.sections, { id: sectionId });
      })
      .addCase(deleteSection.fulfilled, (state) => {
        state.deleteSectionLoading = false;
        state.loading = false;
        state.error = null;
      })
      .addCase(deleteSection.rejected, (state, action) => {
        state.deleteSectionLoading = false;
        state.loading = false;
        state.error =
          action.payload?.error?.message || "Failed to delete section";
        const { originalSection } = action.payload;
        if (originalSection) {
          state.sections = addToArray(state.sections, originalSection);
        }
      })

      .addCase(reorderSections.pending, (state, action) => {
        state.reorderSectionsLoading = true;
        state.loading = true;
        state.error = null;
        const { sectionIds } = action.meta.arg;
        const reorderedSections = sectionIds.map((id, index) => {
          const section = state.sections.find((s) => s.id === id);
          return { ...section, order: index + 1, _isOptimistic: true };
        });
        state.sections = reorderedSections;
      })
      .addCase(reorderSections.fulfilled, (state) => {
        state.reorderSectionsLoading = false;
        state.loading = false;
        state.error = null;
        state.sections = state.sections.map((section) => ({
          ...section,
          _isOptimistic: undefined,
        }));
      })
      .addCase(reorderSections.rejected, (state, action) => {
        state.reorderSectionsLoading = false;
        state.loading = false;
        state.error =
          action.payload?.error?.message || "Failed to reorder sections";
        const { originalOrder } = action.payload;
        if (originalOrder) {
          state.sections = originalOrder;
        }
      })

      .addCase(createLesson.pending, (state, action) => {
        state.createLessonLoading = true;
        state.loading = true;
        state.error = null;
        const { sectionId, lessonData } = action.meta.arg;
        const optimisticLesson = {
          id: `temp_${Date.now()}`,
          ...lessonData,
          sectionId,
          order:
            state.lessons.filter((l) => l.sectionId === sectionId).length + 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          _isOptimistic: true,
        };
        state.lessons = addToArray(state.lessons, optimisticLesson);
      })
      .addCase(createLesson.fulfilled, (state, action) => {
        state.createLessonLoading = false;
        state.loading = false;
        state.error = null;
        const { tempId, data } = action.payload;
        state.lessons = state.lessons.map((lesson) =>
          lesson.id === tempId ? data.data.lesson : lesson
        );
      })
      .addCase(createLesson.rejected, (state, action) => {
        state.createLessonLoading = false;
        state.loading = false;
        state.error =
          action.payload?.error?.message || "Failed to create lesson";
        const { tempId } = action.payload;
        state.lessons = removeFromArray(state.lessons, { id: tempId });
      })

      .addCase(updateLesson.pending, (state, action) => {
        state.updateLessonLoading = true;
        state.loading = true;
        state.error = null;
        const { lessonId, lessonData } = action.meta.arg;
        const originalLesson = state.lessons.find((l) => l.id === lessonId);
        const updatedLesson = {
          ...originalLesson,
          ...lessonData,
          updatedAt: new Date().toISOString(),
          _isOptimistic: true,
        };
        state.lessons = updateInArray(state.lessons, updatedLesson);
      })
      .addCase(updateLesson.fulfilled, (state, action) => {
        state.updateLessonLoading = false;
        state.loading = false;
        state.error = null;
        const { data } = action.payload;
        state.lessons = updateInArray(state.lessons, data.data.lesson);
      })
      .addCase(updateLesson.rejected, (state, action) => {
        state.updateLessonLoading = false;
        state.loading = false;
        state.error =
          action.payload?.error?.message || "Failed to update lesson";
        const { originalLesson } = action.payload;
        if (originalLesson) {
          state.lessons = updateInArray(state.lessons, originalLesson);
        }
      })

      .addCase(deleteLesson.pending, (state, action) => {
        state.deleteLessonLoading = true;
        state.loading = true;
        state.error = null;
        const lessonId = action.meta.arg;
        state.lessons = removeFromArray(state.lessons, { id: lessonId });
      })
      .addCase(deleteLesson.fulfilled, (state) => {
        state.deleteLessonLoading = false;
        state.loading = false;
        state.error = null;
      })
      .addCase(deleteLesson.rejected, (state, action) => {
        state.deleteLessonLoading = false;
        state.loading = false;
        state.error =
          action.payload?.error?.message || "Failed to delete lesson";
        const { originalLesson } = action.payload;
        if (originalLesson) {
          state.lessons = addToArray(state.lessons, originalLesson);
        }
      })

      .addCase(reorderLessons.pending, (state, action) => {
        state.reorderLessonsLoading = true;
        state.loading = true;
        state.error = null;
        const { lessonIds } = action.meta.arg;
        const reorderedLessons = lessonIds.map((id, index) => {
          const lesson = state.lessons.find((l) => l.id === id);
          return { ...lesson, order: index + 1, _isOptimistic: true };
        });
        state.lessons = reorderedLessons;
      })
      .addCase(reorderLessons.fulfilled, (state) => {
        state.reorderLessonsLoading = false;
        state.loading = false;
        state.error = null;
        state.lessons = state.lessons.map((lesson) => ({
          ...lesson,
          _isOptimistic: undefined,
        }));
      })
      .addCase(reorderLessons.rejected, (state, action) => {
        state.reorderLessonsLoading = false;
        state.loading = false;
        state.error =
          action.payload?.error?.message || "Failed to reorder lessons";
        const { originalOrder } = action.payload;
        if (originalOrder) {
          state.lessons = originalOrder;
        }
      })

      .addCase(createQuiz.pending, (state, action) => {
        state.createQuizLoading = true;
        state.loading = true;
        state.error = null;
        const { sectionId, quizData } = action.meta.arg;
        const optimisticQuiz = {
          id: `temp_${Date.now()}`,
          ...quizData,
          sectionId,
          order:
            state.quizzes.filter((q) => q.sectionId === sectionId).length + 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          _isOptimistic: true,
        };
        state.quizzes = addToArray(state.quizzes, optimisticQuiz);
      })
      .addCase(createQuiz.fulfilled, (state, action) => {
        state.createQuizLoading = false;
        state.loading = false;
        state.error = null;
        const { tempId, data } = action.payload;
        state.quizzes = state.quizzes.map((quiz) =>
          quiz.id === tempId ? data.data.quiz : quiz
        );
      })
      .addCase(createQuiz.rejected, (state, action) => {
        state.createQuizLoading = false;
        state.loading = false;
        state.error = action.payload?.error?.message || "Failed to create quiz";
        const { tempId } = action.payload;
        state.quizzes = removeFromArray(state.quizzes, { id: tempId });
      })

      .addCase(updateQuiz.pending, (state, action) => {
        state.updateQuizLoading = true;
        state.loading = true;
        state.error = null;
        const { quizId, quizData } = action.meta.arg;
        const originalQuiz = state.quizzes.find((q) => q.id === quizId);
        const updatedQuiz = {
          ...originalQuiz,
          ...quizData,
          updatedAt: new Date().toISOString(),
          _isOptimistic: true,
        };
        state.quizzes = updateInArray(state.quizzes, updatedQuiz);
      })
      .addCase(updateQuiz.fulfilled, (state, action) => {
        state.updateQuizLoading = false;
        state.loading = false;
        state.error = null;
        const { data } = action.payload;
        state.quizzes = updateInArray(state.quizzes, data.data.quiz);
      })
      .addCase(updateQuiz.rejected, (state, action) => {
        state.updateQuizLoading = false;
        state.loading = false;
        state.error = action.payload?.error?.message || "Failed to update quiz";
        const { originalQuiz } = action.payload;
        if (originalQuiz) {
          state.quizzes = updateInArray(state.quizzes, originalQuiz);
        }
      })

      .addCase(deleteQuiz.pending, (state, action) => {
        state.deleteQuizLoading = true;
        state.loading = true;
        state.error = null;
        const quizId = action.meta.arg;
        state.quizzes = removeFromArray(state.quizzes, { id: quizId });
      })
      .addCase(deleteQuiz.fulfilled, (state) => {
        state.deleteQuizLoading = false;
        state.loading = false;
        state.error = null;
      })
      .addCase(deleteQuiz.rejected, (state, action) => {
        state.deleteQuizLoading = false;
        state.loading = false;
        state.error = action.payload?.error?.message || "Failed to delete quiz";
        const { originalQuiz } = action.payload;
        if (originalQuiz) {
          state.quizzes = addToArray(state.quizzes, originalQuiz);
        }
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
          order:
            state.questions.filter((qu) => qu.quizId === quizId).length +
            index +
            1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          _isOptimistic: true,
        }));
        state.questions = addToArray(state.questions, tempQuestions);
      })
      .addCase(addQuizQuestions.fulfilled, (state, action) => {
        state.addQuizQuestionsLoading = false;
        state.loading = false;
        state.error = null;
        const { data, tempQuestions } = action.payload;
        tempQuestions.forEach((tempQuestion, index) => {
          state.questions = state.questions.map((question) =>
            question.id === tempQuestion.id
              ? data.data.questions[index]
              : question
          );
        });
      })
      .addCase(addQuizQuestions.rejected, (state, action) => {
        state.addQuizQuestionsLoading = false;
        state.loading = false;
        state.error =
          action.payload?.error?.message || "Failed to add questions";
        const { tempQuestions } = action.payload;
        if (tempQuestions) {
          state.questions = removeFromArray(state.questions, tempQuestions);
        }
      })

      .addCase(updateQuizQuestion.pending, (state, action) => {
        state.updateQuizQuestionLoading = true;
        state.loading = true;
        state.error = null;
        const { questionId, questionData } = action.meta.arg;
        const originalQuestion = state.questions.find(
          (q) => q.id === questionId
        );
        const updatedQuestion = {
          ...originalQuestion,
          ...questionData,
          updatedAt: new Date().toISOString(),
          _isOptimistic: true,
        };
        state.questions = updateInArray(state.questions, updatedQuestion);
      })
      .addCase(updateQuizQuestion.fulfilled, (state, action) => {
        state.updateQuizQuestionLoading = false;
        state.loading = false;
        state.error = null;
        const { data } = action.payload;
        state.questions = updateInArray(state.questions, data.data.question);
      })
      .addCase(updateQuizQuestion.rejected, (state, action) => {
        state.updateQuizQuestionLoading = false;
        state.loading = false;
        state.error =
          action.payload?.error?.message || "Failed to update question";
        const { originalQuestion } = action.payload;
        if (originalQuestion) {
          state.questions = updateInArray(state.questions, originalQuestion);
        }
      })

      .addCase(deleteQuizQuestion.pending, (state, action) => {
        state.deleteQuizQuestionLoading = true;
        state.loading = true;
        state.error = null;
        const questionId = action.meta.arg;
        state.questions = removeFromArray(state.questions, { id: questionId });
      })
      .addCase(deleteQuizQuestion.fulfilled, (state) => {
        state.deleteQuizQuestionLoading = false;
        state.loading = false;
        state.error = null;
      })
      .addCase(deleteQuizQuestion.rejected, (state, action) => {
        state.deleteQuizQuestionLoading = false;
        state.loading = false;
        state.error =
          action.payload?.error?.message || "Failed to delete question";
        const { originalQuestion } = action.payload;
        if (originalQuestion) {
          state.questions = addToArray(state.questions, originalQuestion);
        }
      })

      .addCase(reorderQuizQuestions.pending, (state, action) => {
        state.reorderQuizQuestionsLoading = true;
        state.loading = true;
        state.error = null;
        const { questionIds } = action.meta.arg;
        const reorderedQuestions = questionIds.map((id, index) => {
          const question = state.questions.find((q) => q.id === id);
          return { ...question, order: index + 1, _isOptimistic: true };
        });
        state.questions = reorderedQuestions;
      })
      .addCase(reorderQuizQuestions.fulfilled, (state) => {
        state.reorderQuizQuestionsLoading = false;
        state.loading = false;
        state.error = null;
        state.questions = state.questions.map((question) => ({
          ...question,
          _isOptimistic: undefined,
        }));
      })
      .addCase(reorderQuizQuestions.rejected, (state, action) => {
        state.reorderQuizQuestionsLoading = false;
        state.loading = false;
        state.error =
          action.payload?.error?.message || "Failed to reorder questions";
        const { originalOrder } = action.payload;
        if (originalOrder) {
          state.questions = originalOrder;
        }
      })

      .addCase(createAssignment.pending, (state, action) => {
        state.createAssignmentLoading = true;
        state.loading = true;
        state.error = null;
        const { sectionId, assignmentData } = action.meta.arg;
        const optimisticAssignment = {
          id: `temp_${Date.now()}`,
          ...assignmentData,
          sectionId,
          order:
            state.assignments.filter((a) => a.sectionId === sectionId).length +
            1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          _isOptimistic: true,
        };
        state.assignments = addToArray(state.assignments, optimisticAssignment);
      })
      .addCase(createAssignment.fulfilled, (state, action) => {
        state.createAssignmentLoading = false;
        state.loading = false;
        state.error = null;
        const { tempId, data } = action.payload;
        state.assignments = state.assignments.map((assignment) =>
          assignment.id === tempId ? data.data.assignment : assignment
        );
      })
      .addCase(createAssignment.rejected, (state, action) => {
        state.createAssignmentLoading = false;
        state.loading = false;
        state.error =
          action.payload?.error?.message || "Failed to create assignment";
        const { tempId } = action.payload;
        state.assignments = removeFromArray(state.assignments, { id: tempId });
      })

      .addCase(updateAssignment.pending, (state, action) => {
        state.updateAssignmentLoading = true;
        state.loading = true;
        state.error = null;
        const { assignmentId, assignmentData } = action.meta.arg;
        const originalAssignment = state.assignments.find(
          (a) => a.id === assignmentId
        );
        const updatedAssignment = {
          ...originalAssignment,
          ...assignmentData,
          updatedAt: new Date().toISOString(),
          _isOptimistic: true,
        };
        state.assignments = updateInArray(state.assignments, updatedAssignment);
      })
      .addCase(updateAssignment.fulfilled, (state, action) => {
        state.updateAssignmentLoading = false;
        state.loading = false;
        state.error = null;
        const { data } = action.payload;
        state.assignments = updateInArray(
          state.assignments,
          data.data.assignment
        );
      })
      .addCase(updateAssignment.rejected, (state, action) => {
        state.updateAssignmentLoading = false;
        state.loading = false;
        state.error =
          action.payload?.error?.message || "Failed to update assignment";
        const { originalAssignment } = action.payload;
        if (originalAssignment) {
          state.assignments = updateInArray(
            state.assignments,
            originalAssignment
          );
        }
      })

      .addCase(deleteAssignment.pending, (state, action) => {
        state.deleteAssignmentLoading = true;
        state.loading = true;
        state.error = null;
        const assignmentId = action.meta.arg;
        state.assignments = removeFromArray(state.assignments, {
          id: assignmentId,
        });
      })
      .addCase(deleteAssignment.fulfilled, (state) => {
        state.deleteAssignmentLoading = false;
        state.loading = false;
        state.error = null;
      })
      .addCase(deleteAssignment.rejected, (state, action) => {
        state.deleteAssignmentLoading = false;
        state.loading = false;
        state.error =
          action.payload?.error?.message || "Failed to delete assignment";
        const { originalAssignment } = action.payload;
        if (originalAssignment) {
          state.assignments = addToArray(state.assignments, originalAssignment);
        }
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
        state.assignments = action.payload.data.assignments || [];
        state.assignmentsPagination =
          action.payload.data.pagination || state.assignmentsPagination;
      })
      .addCase(getAllAssignments.rejected, (state, action) => {
        state.getAllAssignmentsLoading = false;
        state.loading = false;
        state.error = action.payload?.message || "Failed to fetch assignments";
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
        state.contentStats = action.payload.data;
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
        const sectionsToUpdate = state.sections.filter((s) => !s.isPublished);
        const optimisticSections = sectionsToUpdate.map((s) => ({
          ...s,
          isPublished: true,
          _isOptimistic: true,
        }));
        state.sections = updateInArray(state.sections, optimisticSections);
      })
      .addCase(publishAllSections.fulfilled, (state) => {
        state.publishAllSectionsLoading = false;
        state.loading = false;
        state.error = null;
        state.sections = state.sections.map((section) => ({
          ...section,
          _isOptimistic: undefined,
        }));
      })
      .addCase(publishAllSections.rejected, (state, action) => {
        state.publishAllSectionsLoading = false;
        state.loading = false;
        state.error =
          action.payload?.error?.message || "Failed to publish sections";
        const { sectionsToUpdate } = action.payload;
        if (sectionsToUpdate) {
          state.sections = updateInArray(state.sections, sectionsToUpdate);
        }
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
        state.exportData = action.payload.data;
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
        state.needsRefresh = true;
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
        state.previewContent = action.payload.data;
      })
      .addCase(previewContent.rejected, (state, action) => {
        state.previewContentLoading = false;
        state.loading = false;
        state.error =
          action.payload?.message || "Failed to load preview content";
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

      .addCase(getCourseSections.pending, (state) => {
        state.getCourseSectionsLoading = true;
        state.loading = true;
        state.error = null;
      })
      .addCase(getCourseSections.fulfilled, (state, action) => {
        state.getCourseSectionsLoading = false;
        state.loading = false;
        state.error = null;
        state.sections = action.payload.data.sections || [];
        state.sectionsPagination =
          action.payload.data.pagination || state.sectionsPagination;
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
        state.quizzes = action.payload.data.quizzes || [];
        state.quizzesPagination =
          action.payload.data.pagination || state.quizzesPagination;
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
        state.lessons = action.payload.data.lessons || [];
        state.lessonsPagination =
          action.payload.data.pagination || state.lessonsPagination;
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
        state.questions = action.payload.data.questions || [];
        state.questionsPagination =
          action.payload.data.pagination || state.questionsPagination;
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
        state.singleLesson = action.payload.data;
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
        state.singleQuiz = action.payload.data;
      })
      .addCase(getSingleQuiz.rejected, (state, action) => {
        state.getSingleQuizLoading = false;
        state.loading = false;
        state.error = action.payload?.message || "Failed to fetch quiz";
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
        state.quizAttempts = action.payload.data.attempts || [];
      })
      .addCase(getQuizAttempts.rejected, (state, action) => {
        state.getQuizAttemptsLoading = false;
        state.loading = false;
        state.error =
          action.payload?.message || "Failed to fetch quiz attempts";
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
  clearPreviewContent,
  clearSearchResults,
  clearExportData,
  clearSingleLesson,
  clearSingleQuiz,
  clearQuizAttempts,
  setSectionsFilters,
  setLessonsFilters,
  setQuizzesFilters,
  setQuestionsFilters,
  setAssignmentsFilters,
  resetSectionsFilters,
  resetLessonsFilters,
  resetQuizzesFilters,
  resetQuestionsFilters,
  resetAssignmentsFilters,
  resetContentState,
  markForRefresh,
  clearRefreshFlag,
  optimisticSectionCreate,
  optimisticSectionUpdate,
  optimisticSectionDelete,
  optimisticSectionReorder,
  optimisticLessonCreate,
  optimisticLessonUpdate,
  optimisticLessonDelete,
  optimisticLessonReorder,
  optimisticQuizCreate,
  optimisticQuizUpdate,
  optimisticQuizDelete,
  optimisticQuestionCreate,
  optimisticQuestionUpdate,
  optimisticQuestionDelete,
  optimisticQuestionReorder,
  optimisticAssignmentCreate,
  optimisticAssignmentUpdate,
  optimisticAssignmentDelete,
  revertOptimisticUpdates,
} = contentSlice.actions;

const contentReducer = contentSlice.reducer;

export default contentReducer;
