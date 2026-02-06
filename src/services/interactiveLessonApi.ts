import api from './api';
import {
  InteractiveLesson,
  InteractiveLessonCreate,
  InteractiveLessonUpdate,
  InteractiveLessonListItem,
  LessonSlide,
  LessonSlideCreate,
  LessonSlideUpdate,
  InteractiveActivity,
  InteractiveActivityCreate,
  InteractiveActivityUpdate,
  UserLessonProgress,
  UserSlideProgress,
  QuizSubmitRequest,
  QuizSubmitResponse,
  ActivitySubmitRequest,
  ActivitySubmitResponse,
  SlideViewRequest,
  SlideReorderRequest,
  PaginatedLessons,
} from '../types/interactiveLesson';

const BASE_URL = '/interactive-lessons';

// ==================== Lesson CRUD ====================

export const getLessons = async (params?: {
  module_id?: number;
  status?: string;
  skip?: number;
  limit?: number;
}): Promise<PaginatedLessons> => {
  const response = await api.get(BASE_URL, { params });
  return response.data;
};

export const getLesson = async (lessonId: number): Promise<InteractiveLesson> => {
  const response = await api.get(`${BASE_URL}/${lessonId}`);
  return response.data;
};

export const createLesson = async (data: InteractiveLessonCreate): Promise<InteractiveLesson> => {
  const response = await api.post(BASE_URL, data);
  return response.data;
};

export const updateLesson = async (
  lessonId: number,
  data: InteractiveLessonUpdate
): Promise<InteractiveLesson> => {
  const response = await api.put(`${BASE_URL}/${lessonId}`, data);
  return response.data;
};

export const deleteLesson = async (lessonId: number): Promise<void> => {
  await api.delete(`${BASE_URL}/${lessonId}`);
};

// ==================== Slide CRUD ====================

export const getSlides = async (lessonId: number): Promise<LessonSlide[]> => {
  const response = await api.get(`${BASE_URL}/${lessonId}/slides`);
  return response.data;
};

export const createSlide = async (
  lessonId: number,
  data: LessonSlideCreate
): Promise<LessonSlide> => {
  const response = await api.post(`${BASE_URL}/${lessonId}/slides`, data);
  return response.data;
};

export const updateSlide = async (
  slideId: number,
  data: LessonSlideUpdate
): Promise<LessonSlide> => {
  const response = await api.put(`${BASE_URL}/slides/${slideId}`, data);
  return response.data;
};

export const deleteSlide = async (slideId: number): Promise<void> => {
  await api.delete(`${BASE_URL}/slides/${slideId}`);
};

export const reorderSlides = async (
  lessonId: number,
  data: SlideReorderRequest
): Promise<LessonSlide[]> => {
  const response = await api.put(`${BASE_URL}/${lessonId}/slides/reorder`, data);
  return response.data;
};

// ==================== Activity CRUD ====================

export const getActivities = async (lessonId: number): Promise<InteractiveActivity[]> => {
  const response = await api.get(`${BASE_URL}/${lessonId}/activities`);
  return response.data;
};

export const createActivity = async (
  lessonId: number,
  data: InteractiveActivityCreate
): Promise<InteractiveActivity> => {
  const response = await api.post(`${BASE_URL}/${lessonId}/activities`, data);
  return response.data;
};

export const updateActivity = async (
  activityId: number,
  data: InteractiveActivityUpdate
): Promise<InteractiveActivity> => {
  const response = await api.put(`${BASE_URL}/activities/${activityId}`, data);
  return response.data;
};

export const deleteActivity = async (activityId: number): Promise<void> => {
  await api.delete(`${BASE_URL}/activities/${activityId}`);
};

// ==================== Student Progress ====================

export const startLesson = async (lessonId: number): Promise<UserLessonProgress> => {
  const response = await api.post(`${BASE_URL}/${lessonId}/start`);
  return response.data;
};

export const markSlideViewed = async (
  lessonId: number,
  slideId: number,
  data?: SlideViewRequest
): Promise<UserSlideProgress> => {
  const response = await api.post(`${BASE_URL}/${lessonId}/slide/${slideId}/view`, data || {});
  return response.data;
};

export const submitQuizAnswer = async (
  lessonId: number,
  slideId: number,
  data: QuizSubmitRequest
): Promise<QuizSubmitResponse> => {
  const response = await api.post(`${BASE_URL}/${lessonId}/slide/${slideId}/quiz`, data);
  return response.data;
};

export const submitActivityResponse = async (
  lessonId: number,
  activityId: number,
  data: ActivitySubmitRequest
): Promise<ActivitySubmitResponse> => {
  const response = await api.post(`${BASE_URL}/${lessonId}/activity/${activityId}`, data);
  return response.data;
};

export const completeLesson = async (lessonId: number): Promise<UserLessonProgress> => {
  const response = await api.post(`${BASE_URL}/${lessonId}/complete`);
  return response.data;
};

export const getLessonProgress = async (lessonId: number): Promise<UserLessonProgress> => {
  const response = await api.get(`${BASE_URL}/${lessonId}/progress`);
  return response.data;
};

// ==================== AI Content Generation ====================

export interface GenerateContentRequest {
  tema: string;
  descripcion?: string;
  num_slides?: number;
  incluir_quiz?: boolean;
  incluir_actividad?: boolean;
}

export interface GenerateContentResponse {
  success: boolean;
  message: string;
  lesson_id: number;
  slides_created: number;
  quizzes_created: number;
  activities_created: number;
}

export const generateContent = async (
  lessonId: number,
  data: GenerateContentRequest
): Promise<GenerateContentResponse> => {
  const response = await api.post(`${BASE_URL}/${lessonId}/generate-content`, data);
  return response.data;
};

// ==================== Helper Functions ====================

export const getLessonsByModule = async (moduleId: number): Promise<InteractiveLessonListItem[]> => {
  const response = await getLessons({ module_id: moduleId });
  return response.items;
};

export const publishLesson = async (lessonId: number): Promise<InteractiveLesson> => {
  return updateLesson(lessonId, { status: 'published' });
};

export const archiveLesson = async (lessonId: number): Promise<InteractiveLesson> => {
  return updateLesson(lessonId, { status: 'archived' });
};

export const unpublishLesson = async (lessonId: number): Promise<InteractiveLesson> => {
  return updateLesson(lessonId, { status: 'draft' });
};

// Default export with all functions
const interactiveLessonApi = {
  // Lessons
  getLessons,
  getLesson,
  createLesson,
  updateLesson,
  deleteLesson,
  getLessonsByModule,
  publishLesson,
  archiveLesson,
  unpublishLesson,
  // Slides
  getSlides,
  createSlide,
  updateSlide,
  deleteSlide,
  reorderSlides,
  // Activities
  getActivities,
  createActivity,
  updateActivity,
  deleteActivity,
  // Progress
  startLesson,
  markSlideViewed,
  submitQuizAnswer,
  submitActivityResponse,
  completeLesson,
  getLessonProgress,
  // AI Content Generation
  generateContent,
};

export default interactiveLessonApi;
