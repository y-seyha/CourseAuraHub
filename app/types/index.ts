declare module '#app' {
  interface PageMeta {
    requiresAdmin?: boolean
  }
}

export interface Course {
  id: number
  slug: string
  title: string
  description: string
  instructor: string
  price: number
  originalPrice: number
  status: 'published' | 'draft' | 'archived' | 'pending_review'
  category: string
  level: 'Beginner' | 'Intermediate' | 'Advanced'
  thumbnail: string
  rating: number
  totalStudents: number
  totalLessons: number
  totalHours: number
  revenue: number
  completionRate: number
  tags: string[]
  createdAt: string
  updatedAt: string
  monthlyEnrollments: number[]
  monthlyRevenue: number[]
  enrolledStudentList?: Student[]
  // Whether the caller is enrolled; only set on the course detail response
  enrolled?: boolean | null
  // The running sale. price already includes it, except for admins, who see the regular price
  sale?: CourseSale | null
}

export interface CourseSale {
  salePrice: number
  discountType: string
  discountValue: number
  // Null when the sale has no end date
  endsAt: string | null
}

export interface CourseDiscount {
  id: number
  courseSlug: string
  courseTitle: string
  discountType: string
  discountValue: number
  regularPrice: number
  salePrice: number
  startsAt: string
  endsAt: string | null
  active: boolean
  // Whether learners are getting this price right now
  running: boolean
  createdAt: string
}

export interface CourseDiscountCreate {
  courseSlug: string
  discountType: string
  discountValue: number
  startsAt?: string
  endsAt?: string
}

export type CourseDiscountUpdate = Partial<Omit<CourseDiscountCreate, 'courseSlug'>> & { active?: boolean }

export type CourseFormData = Omit<
  Course,
  'id' | 'slug' | 'rating' | 'totalStudents' | 'revenue' | 'completionRate' | 'createdAt' | 'updatedAt' | 'monthlyEnrollments' | 'monthlyRevenue' | 'enrolledStudentList' | 'sale'
>

export interface AppNotification {
  id: number
  type: 'enrolled' | 'payment_failed' | 'order_refunded' | 'certificate_issued' | 'new_lesson' | 'new_enrollment' | 'course_completed' | 'member_card' | 'lesson_question' | 'assignment' | 'course_review' | 'course_reminder' | 'weekly_report'
  title: string
  message: string
  // Frontend path to open, such as a course page
  link: string | null
  read: boolean
  createdAt: string
}

export interface NotificationPage {
  items: AppNotification[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export interface NotificationStreamEvent {
  notification: AppNotification
  unreadCount: number
}

export interface Coupon {
  id: number
  code: string
  discountType: string
  discountValue: number
  courseSlug: string | null
  maxRedemptions: number | null
  paidRedemptions: number
  startsAt: string | null
  expiresAt: string | null
  active: boolean
  createdAt: string
}

export interface CouponCreate {
  code: string
  discountType: string
  discountValue: number
  courseSlug?: string
  maxRedemptions?: number
  startsAt?: string
  expiresAt?: string
}

export interface CouponUpdate {
  active?: boolean
  maxRedemptions?: number
  expiresAt?: string
}

export interface CouponPreview {
  code: string
  listAmount: number
  discountAmount: number
  finalAmount: number
}

export type OrderStatus = 'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED' | 'REFUNDED'

export interface Order {
  orderNumber: string
  courseSlug: string
  courseTitle: string
  thumbnail: string
  // Price before any coupon
  listAmount: number
  discountAmount: number
  couponCode: string | null
  // What the learner pays
  amount: number
  currency: string
  status: OrderStatus
  // Where to pay; null once the order is no longer pending
  checkoutUrl: string | null
  createdAt: string
  paidAt: string | null
  refundedAt: string | null
}

export interface AdminOrder {
  order: Order
  studentId: number
  studentEmail: string
  provider: string | null
  providerReference: string | null
}

export interface AdminOrderPage {
  items: AdminOrder[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export interface Student {
  id: number
  name: string
  email: string
  avatar: string
  enrolledCourses: number[]
  totalSpent: number
  joinedAt: string
  lastActive: string
  status: 'active' | 'inactive'
  completedCourses: number[]
  country: string
  // The sign-in account; null for sample learners without one
  userId: string | null
}

export interface Enrollment {
  id: number
  studentId: number
  studentName?: string
  courseId: number
  courseTitle?: string
  courseSlug?: string
  enrolledAt: string
  amount: number
}

export interface RecentEnrollmentItem {
  id: number
  studentName: string
  studentAvatar: string
  studentCountry: string
  courseTitle: string
  courseSlug: string
  amount: number
  enrolledAt: string
}

export interface TopCourseItem {
  slug: string
  title: string
  revenue: number
  totalStudents: number
  rating: number
  category?: string
  price?: number
  status?: string
}

export interface DashboardStats {
  kpis: {
    totalRevenue: number
    totalStudents: number
    totalCourses: number
    publishedCourses: number
    avgRating: number
    revenueGrowth: number
    studentGrowth: number
  }
  charts: {
    months: string[]
    monthlyRevenue: number[]
    monthlyEnrollments: number[]
    revenueByCategory: Record<string, number>
  }
  topCourses: TopCourseItem[]
  recentEnrollments: RecentEnrollmentItem[]
}

export interface PlatformSettings {
  platformName: string
  platformTagline: string
  currency: string
  defaultLanguage: string
  notifications: {
    newEnrollment: boolean
    courseCompletion: boolean
    weeklyReport: boolean
  }
  profile: {
    name: string
    email: string
    role: string
    avatar: string
    bio: string
    website: string
    twitter: string
  }
}

// Learner self-service (/api/v1/me/**) and curriculum

export interface CourseProgress {
  completedLessons: number
  totalLessons: number
  progressPercent: number
  completed: boolean
}

export interface MyCourse {
  courseId: number
  slug: string
  title: string
  thumbnail: string
  instructor: string
  level: string
  enrolledAt: string
  progress: CourseProgress
  lastActivityAt: string | null
  /** Where to resume; null once the course is completed */
  nextLesson: NextLesson | null
}

export interface NextLesson {
  lessonId: number
  title: string
  type: LessonType
  durationMinutes: number
  sectionId: number
  sectionTitle: string
  /** Seconds into the video to continue from, if it was started */
  resumePositionSeconds?: number | null
}

export interface LearningStreak {
  currentDays: number
  longestDays: number
  activeToday: boolean
}

export interface DailyActivity {
  date: string
  lessonsCompleted: number
}

export interface LearnerDashboard {
  enrolledCourses: number
  inProgressCourses: number
  completedCourses: number
  certificatesEarned: number
  lessonsCompleted: number
  minutesLearned: number
  streak: LearningStreak
  /** Oldest first, ending today */
  lastSevenDays: DailyActivity[]
  continueLearning: MyCourse | null
  timeZone: string
}

export interface Achievement {
  code: string
  title: string
  description: string
  metric: 'lessons_completed' | 'certificates_earned' | 'longest_streak_days' | 'reviews_written'
  progress: number
  target: number
  earned: boolean
}

export interface CartItem {
  courseId: number
  slug: string
  title: string
  thumbnail: string
  instructor: string
  listPrice: number
  price: number
}

export interface Cart {
  items: CartItem[]
  listTotal: number
  total: number
  currency: string
}

export interface CartCouponPreview {
  code: string
  courseSlug: string
  courseTitle: string
  couponDiscount: number
  total: number
}

export interface CheckoutResult {
  groupNumber: string
  amount: number
  currency: string
  checkoutUrl: string | null
  orders: Order[]
}

export interface Quiz {
  lessonId: number
  passPercent: number
  questions: {
    id: number
    prompt: string
    options: { id: number, text: string }[]
  }[]
  attempts: number
  bestScore: number | null
  passed: boolean
}

export interface QuizResult {
  scorePercent: number
  correctCount: number
  totalCount: number
  passPercent: number
  passed: boolean
  questions: {
    questionId: number
    correct: boolean
    correctOptionId: number | null
    explanation: string | null
  }[]
  progress: LessonProgressResult | null
}

export interface AdminQuiz {
  lessonId: number
  passPercent: number
  questions: {
    id: number
    prompt: string
    explanation: string | null
    options: { id: number, text: string, correct: boolean }[]
  }[]
}

export interface QuizFormData {
  passPercent: number
  questions: {
    prompt: string
    explanation: string | null
    options: { text: string, correct: boolean }[]
  }[]
}

export interface TelegramStatus {
  available: boolean
  connected: boolean
  enabled: boolean
  telegramName: string | null
  linkedAt: string | null
}

export interface TelegramConnectLink {
  url: string
  expiresAt: string
}

export interface Certificate {
  certificateNumber: string
  courseSlug: string
  courseTitle: string
  instructor: string
  thumbnail: string
  issuedAt: string
}

export interface CertificateVerification {
  certificateNumber: string
  learnerName: string
  courseTitle: string
  instructor: string
  issuedAt: string
}

export interface WishlistItem {
  courseId: number
  slug: string
  title: string
  thumbnail: string
  instructor: string
  level: string
  price: number
  originalPrice: number
  rating: number
  addedAt: string
}

export interface LearnerProfile {
  userId: string
  email: string
  firstName: string
  lastName: string
  imageUrl: string | null
  bio: string | null
  website: string | null
  twitter: string | null
  provider: string
  hasPassword: boolean
}

export type LearnerProfileUpdate = Partial<Pick<LearnerProfile, 'firstName' | 'lastName' | 'imageUrl' | 'bio' | 'website' | 'twitter'>>

export type LessonType = 'video' | 'article' | 'quiz'

export interface Lesson {
  id: number
  title: string
  type: LessonType
  durationMinutes: number
  preview: boolean
  position: number
  locked: boolean
  contentUrl: string | null
  completed: boolean
  /** Seconds into the video to continue from, if it was started */
  resumePositionSeconds?: number | null
}

export interface LessonPosition {
  lessonId: number
  positionSeconds: number
}

export interface CourseSection {
  id: number
  title: string
  position: number
  totalDurationMinutes: number
  lessons: Lesson[]
}

export interface Curriculum {
  courseId: number
  courseSlug: string
  enrolled: boolean
  totalLessons: number
  totalDurationMinutes: number
  progress: CourseProgress | null
  nextLessonId: number | null
  sections: CourseSection[]
}

export interface LessonFormData {
  title: string
  type: LessonType
  durationMinutes: number
  contentUrl: string
  preview: boolean
}

export interface LessonProgressResult {
  lessonId: number
  courseSlug: string
  lessonCompleted: boolean
  courseProgress: CourseProgress
}

export interface Review {
  id: number
  rating: number
  comment: string | null
  reviewerName: string
  reviewerAvatar: string | null
  createdAt: string
  updatedAt: string
}

export interface ReviewPage {
  items: Review[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  averageRating: number | null
}

export type FilePurpose = 'AVATAR' | 'COURSE_THUMBNAIL' | 'LESSON_CONTENT' | 'ASSIGNMENT_SUBMISSION' | 'TOP_UP_RECEIPT'

export interface FileUploadRequest {
  purpose: FilePurpose
  fileName: string
  contentType: string
  size: number
}

export interface FileUploadTicket {
  id: string
  uploadUrl: string
  contentType: string
}

export interface StoredFile {
  id: string
  // The value to save on the course, profile or lesson
  url: string
  contentType: string
  size: number
  fileName: string
}

export interface CouponPreview {
  code: string
  listAmount: number
  discountAmount: number
  finalAmount: number
}

export interface AccountSecurity {
  userId: string
  email: string
  enabled: boolean
  emailVerified: boolean
  mfaEnabled: boolean
  lockedUntil: string | null
  failedLoginAttempts: number
  role: string
}

export interface EnrollmentCreate {
  studentId: number
  courseId: number
  amount: number
  enrolledAt?: string
}

export type PaymentMethod = 'ONLINE' | 'MEMBER_CARD'
export type MemberCardApplicationStatus = 'PENDING' | 'APPROVED' | 'REJECTED'
export type MemberCardStatus = 'ACTIVE' | 'SUSPENDED'
export type MemberCardTransactionType = 'TOP_UP' | 'DEDUCTION' | 'PURCHASE' | 'REFUND'

export interface MemberCardApplicationForm {
  fullName: string
  phone: string
  dateOfBirth: string
  address: string
}

export interface MemberCardApplication extends MemberCardApplicationForm {
  id: number
  studentId: number
  studentEmail: string
  status: MemberCardApplicationStatus
  reviewNote: string | null
  createdAt: string
  reviewedAt: string | null
}

export interface MemberCard {
  id: number
  studentId: number
  studentEmail: string
  cardNumber: string
  holderName: string
  balance: number
  currency: string
  status: MemberCardStatus
  createdAt: string
}

export interface MemberCardOverview {
  card: MemberCard | null
  application: MemberCardApplication | null
}

export interface MemberCardTransaction {
  id: number
  type: MemberCardTransactionType
  amount: number
  balanceAfter: number
  reference: string | null
  note: string | null
  createdAt: string
}

export interface MemberCardTopUp {
  id: number
  cardId: number
  cardNumber: string
  holderName: string
  studentEmail: string
  amount: number
  currency: string
  note: string | null
  receiptUrl: string | null
  receiptName: string | null
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  reviewNote: string | null
  createdAt: string
  reviewedAt: string | null
}

export interface MemberCardTopUpForm {
  amount: number
  note?: string
  receiptUrl?: string
  receiptName?: string
}

export interface MemberCardReport {
  days: number
  currency: string
  totalCards: number
  activeCards: number
  outstandingBalance: number
  pendingApplications: number
  pendingTopUps: number
  topUps: number
  deductions: number
  purchases: number
  refunds: number
}

export interface LessonAnswer {
  id: number
  authorName: string
  fromStaff: boolean
  body: string
  createdAt: string
  canDelete: boolean
}

export interface LessonQuestion {
  id: number
  lessonId: number
  authorName: string
  body: string
  resolved: boolean
  createdAt: string
  canManage: boolean
  answers: LessonAnswer[]
}

export interface OpenQuestion {
  id: number
  lessonId: number
  lessonTitle: string
  courseSlug: string
  courseTitle: string
  authorName: string
  body: string
  answerCount: number
  createdAt: string
}

export interface LessonNote {
  id: number
  lessonId: number
  body: string | null
  positionSeconds: number | null
  createdAt: string
  updatedAt: string
}

export interface Category {
  id: number
  name: string
  courseCount: number
}

export interface AssignmentSubmission {
  id: number
  fileUrl: string | null
  fileName: string | null
  comment: string | null
  status: 'SUBMITTED' | 'GRADED'
  score: number | null
  passed: boolean
  feedback: string | null
  submittedAt: string
  gradedAt: string | null
}

export interface Assignment {
  id: number
  lessonId: number
  instructions: string
  passScore: number
  required: boolean
  submission: AssignmentSubmission | null
}

export interface AssignmentForm {
  instructions: string
  passScore: number
  required: boolean
}

export interface SubmissionReview {
  studentName: string
  lessonId: number
  lessonTitle: string
  courseSlug: string
  courseTitle: string
  passScore: number
  submission: AssignmentSubmission
}

export interface InstructorCourse {
  course: Course
  reviewNote: string | null
}

export interface InstructorSummary {
  courses: number
  publishedCourses: number
  awaitingReview: number
  students: number
  revenue: number
  averageRating: number
}

export interface InstructorStudent {
  id: number
  name: string
  avatar: string
  completed: boolean
}

export interface MemberCardCreate {
  studentId: number
  holderName: string
  openingBalance?: number
}

export interface MemberCardAdjustment {
  type: 'TOP_UP' | 'DEDUCTION'
  amount: number
  note: string
  idempotencyKey: string
}

interface PageOf<T> {
  items: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export type MemberCardPage = PageOf<MemberCard>
export type MemberCardTopUpPage = PageOf<MemberCardTopUp>
export type OpenQuestionPage = PageOf<OpenQuestion>
export type SubmissionPage = PageOf<SubmissionReview>
export type MemberCardApplicationPage = PageOf<MemberCardApplication>
export type MemberCardTransactionPage = PageOf<MemberCardTransaction>
