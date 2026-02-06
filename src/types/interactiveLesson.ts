// ============= Enums =============

export type LessonNavigationType = 'sequential' | 'free';
export type LessonStatus = 'draft' | 'published' | 'archived';
export type SlideContentType = 'text' | 'image' | 'video' | 'text_image' | 'quiz' | 'interactive';
export type ActivityType = 'drag_drop' | 'matching' | 'ordering' | 'hotspot' | 'fill_blanks';
export type InlineQuestionType = 'multiple_choice' | 'true_false' | 'open_text';
export type LessonProgressStatus = 'not_started' | 'in_progress' | 'completed';

// ============= Inline Quiz Interfaces =============

export interface InlineQuizAnswer {
  id: number;
  quiz_id?: number;
  answer_text: string;
  is_correct: boolean;
  order_index: number;
  explanation?: string;
}

export interface InlineQuizAnswerCreate {
  answer_text: string;
  is_correct: boolean;
  order_index?: number;
  explanation?: string;
}

export interface InlineQuiz {
  id: number;
  slide_id: number;
  question_text: string;
  question_type: InlineQuestionType;
  points: number;
  explanation?: string;
  required_to_continue: boolean;
  show_feedback_immediately: boolean;
  answers: InlineQuizAnswer[];
  created_at: string;
}

export interface InlineQuizCreate {
  question_text: string;
  question_type: InlineQuestionType;
  points?: number;
  explanation?: string;
  required_to_continue?: boolean;
  show_feedback_immediately?: boolean;
  answers: InlineQuizAnswerCreate[];
}

// ============= Slide Content Interfaces =============

export interface TextContent {
  html: string;
  background_color?: string;
}

export interface ImageContent {
  url: string;
  alt_text?: string;
  caption?: string;
}

export interface VideoContent {
  url: string;
  provider?: 'youtube' | 'vimeo' | 'local';
  autoplay?: boolean;
}

export interface TextImageContent {
  text: string;
  image_url: string;
  layout?: 'left' | 'right' | 'top' | 'bottom';
}

export type SlideContent = TextContent | ImageContent | VideoContent | TextImageContent | Record<string, unknown>;

// ============= Lesson Slide Interfaces =============

export interface LessonSlide {
  id: number;
  lesson_id: number;
  title?: string;
  order_index: number;
  slide_type: SlideContentType;
  content: SlideContent;
  notes?: string;
  is_required: boolean;
  inline_quiz?: InlineQuiz;
  created_at: string;
  updated_at: string;
}

export interface LessonSlideCreate {
  lesson_id?: number;
  title?: string;
  order_index?: number;
  slide_type: SlideContentType;
  content: SlideContent;
  notes?: string;
  is_required?: boolean;
  inline_quiz?: InlineQuizCreate;
}

export interface LessonSlideUpdate {
  title?: string;
  order_index?: number;
  slide_type?: SlideContentType;
  content?: SlideContent;
  notes?: string;
  is_required?: boolean;
  inline_quiz?: InlineQuizCreate;
}

// ============= Activity Config Interfaces =============

export interface DragDropItem {
  id: string;
  content: string;
  correct_zone: string;
}

export interface DragDropZone {
  id: string;
  label: string;
  accepts?: string[];
}

export interface DragDropConfig {
  items: DragDropItem[];
  zones: DragDropZone[];
  background_image?: string;
}

export interface MatchingPair {
  id: string;
  left: string;
  right: string;
}

export interface MatchingConfig {
  pairs: MatchingPair[];
  shuffle_right?: boolean;
}

export interface OrderingItem {
  id: string;
  content: string;
  correct_position: number;
}

export interface OrderingConfig {
  items: OrderingItem[];
}

export interface Hotspot {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  is_correct: boolean;
}

export interface HotspotConfig {
  image_url: string;
  image_width?: number;
  image_height?: number;
  hotspots: Hotspot[];
  question: string;
}

export interface FillBlanksBlank {
  id: string;
  position: number;
  correct_answer: string;
  alternatives?: string[];
}

export interface FillBlanksConfig {
  text: string;
  blanks: FillBlanksBlank[];
}

export type ActivityConfig = DragDropConfig | MatchingConfig | OrderingConfig | HotspotConfig | FillBlanksConfig;

// ============= Interactive Activity Interfaces =============

export interface InteractiveActivity {
  id: number;
  lesson_id: number;
  slide_id?: number;
  title: string;
  instructions?: string;
  activity_type: ActivityType;
  order_index: number;
  config: ActivityConfig;
  points: number;
  max_attempts: number;
  show_feedback: boolean;
  time_limit_seconds?: number;
  created_at: string;
  updated_at: string;
}

export interface InteractiveActivityCreate {
  lesson_id?: number;
  slide_id?: number;
  title: string;
  instructions?: string;
  activity_type: ActivityType;
  order_index?: number;
  config: ActivityConfig;
  points?: number;
  max_attempts?: number;
  show_feedback?: boolean;
  time_limit_seconds?: number;
}

export interface InteractiveActivityUpdate {
  title?: string;
  instructions?: string;
  activity_type?: ActivityType;
  order_index?: number;
  config?: ActivityConfig;
  points?: number;
  max_attempts?: number;
  show_feedback?: boolean;
  time_limit_seconds?: number;
  slide_id?: number;
}

// ============= Interactive Lesson Interfaces =============

export interface InteractiveLesson {
  id: number;
  module_id: number;
  title: string;
  description?: string;
  thumbnail?: string;
  order_index: number;
  navigation_type: LessonNavigationType;
  status: LessonStatus;
  is_required: boolean;
  estimated_duration_minutes?: number;
  passing_score: number;
  created_by: number;
  created_at: string;
  updated_at: string;
  slides: LessonSlide[];
  activities: InteractiveActivity[];
}

export interface InteractiveLessonCreate {
  module_id: number;
  title: string;
  description?: string;
  thumbnail?: string;
  order_index?: number;
  navigation_type?: LessonNavigationType;
  is_required?: boolean;
  estimated_duration_minutes?: number;
  passing_score?: number;
  slides?: LessonSlideCreate[];
  activities?: InteractiveActivityCreate[];
}

export interface InteractiveLessonUpdate {
  title?: string;
  description?: string;
  thumbnail?: string;
  order_index?: number;
  navigation_type?: LessonNavigationType;
  status?: LessonStatus;
  is_required?: boolean;
  estimated_duration_minutes?: number;
  passing_score?: number;
}

export interface InteractiveLessonListItem {
  id: number;
  module_id: number;
  title: string;
  description?: string;
  thumbnail?: string;
  order_index: number;
  navigation_type: LessonNavigationType;
  status: LessonStatus;
  is_required: boolean;
  estimated_duration_minutes?: number;
  passing_score: number;
  created_by: number;
  created_at: string;
  updated_at: string;
  slides_count: number;
  activities_count: number;
}

// ============= Progress Interfaces =============

export interface UserSlideProgress {
  id: number;
  lesson_progress_id: number;
  slide_id: number;
  viewed: boolean;
  quiz_answered: boolean;
  quiz_correct: boolean;
  quiz_answer?: Record<string, unknown>;
  points_earned: number;
  viewed_at?: string;
  answered_at?: string;
}

export interface UserLessonProgress {
  id: number;
  user_id: number;
  lesson_id: number;
  enrollment_id: number;
  status: LessonProgressStatus;
  current_slide_index: number;
  progress_percentage: number;
  quiz_score?: number;
  quiz_total_points: number;
  quiz_earned_points: number;
  time_spent_seconds: number;
  started_at?: string;
  completed_at?: string;
  slide_progress: UserSlideProgress[];
}

export interface UserActivityAttempt {
  id: number;
  user_id: number;
  activity_id: number;
  enrollment_id: number;
  attempt_number: number;
  user_response: Record<string, unknown>;
  is_correct: boolean;
  score: number;
  time_spent_seconds?: number;
  feedback?: Record<string, unknown>;
  completed_at: string;
}

// ============= API Request/Response Interfaces =============

export interface SlideViewRequest {
  time_spent_seconds?: number;
}

export interface QuizSubmitRequest {
  selected_answer_id?: number;
  text_answer?: string;
  boolean_answer?: boolean;
}

export interface QuizSubmitResponse {
  is_correct: boolean;
  points_earned: number;
  correct_answer_id?: number;
  explanation?: string;
  feedback?: string;
  attempts_used: number;
  attempts_remaining: number;
  can_retry: boolean;
  retry_available_in_seconds?: number;  // Segundos para poder reintentar después de agotar intentos
}

export interface ActivitySubmitRequest {
  response: Record<string, unknown>;
  time_spent_seconds?: number;
}

export interface ActivitySubmitResponse {
  is_correct: boolean;
  score: number;
  points_earned: number;
  feedback?: Record<string, unknown>;
  correct_solution?: Record<string, unknown>;
  attempts_remaining: number;
}

export interface LessonProgressSummary {
  lesson_id: number;
  lesson_title: string;
  status: LessonProgressStatus;
  progress_percentage: number;
  quiz_score?: number;
  time_spent_seconds: number;
  slides_completed: number;
  total_slides: number;
  activities_completed: number;
  total_activities: number;
}

export interface SlideReorderRequest {
  slide_ids: number[];
}

export interface LessonWithProgress extends InteractiveLesson {
  user_progress?: UserLessonProgress;
}

// ============= Paginated Response =============

export interface PaginatedLessons {
  items: InteractiveLessonListItem[];
  total: number;
  skip: number;
  limit: number;
}
