<template>
  <div class="flex flex-col gap-6">
    <NuxtLink to="/courses" class="inline-flex w-fit items-center gap-1.5 text-[13px] font-semibold text-violet-300 no-underline transition-colors hover:text-violet-200 light:text-violet-700 light:hover:text-violet-800">
      <ArrowLeft :size="15" />
      <span>{{ t('All Courses') }}</span>
    </NuxtLink>

    <!-- Hero -->
    <div class="grid overflow-hidden rounded-[20px] border border-white/8 bg-zinc-900/70 backdrop-blur-md md:grid-cols-[360px_1fr] light:border-slate-200 light:bg-white">
      <div class="relative min-h-60 w-full overflow-hidden">
        <img :src="course.thumbnail" :alt="course.title" class="absolute inset-0 size-full object-cover" >
        <div class="absolute inset-0 bg-linear-to-t from-zinc-950/80 via-zinc-950/20 to-transparent" />
      </div>

      <div class="flex flex-col justify-center p-5 sm:p-7 lg:px-8">
        <div class="mb-3 flex flex-wrap items-center gap-2">
          <span class="rounded-md border border-violet-500/35 bg-violet-500/20 px-2.5 py-0.75 text-[11px] font-semibold text-violet-300 light:border-violet-300 light:bg-violet-50 light:text-violet-700">{{ course.category }}</span>
          <span class="rounded-md border border-white/10 bg-white/6 px-2.5 py-0.75 text-[11px] font-semibold text-white/80 light:border-slate-200 light:bg-slate-100 light:text-slate-600">{{ course.level }}</span>
          <span v-if="course.rating > 0" class="inline-flex items-center gap-1 rounded-md border border-amber-400/30 bg-amber-400/15 px-2.5 py-0.75 text-[11px] font-semibold text-amber-400 light:border-amber-200 light:bg-amber-50 light:text-amber-600">
            <Star :size="12" class="fill-amber-400 text-amber-400" />
            {{ course.rating.toFixed(1) }}
          </span>
          <span class="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/6 px-2.5 py-0.75 text-[11px] font-semibold text-white/70 light:border-slate-200 light:bg-slate-100 light:text-slate-600">
            <Users :size="12" />
            {{ course.totalStudents.toLocaleString() }} learners
          </span>
        </div>

        <h1 class="text-2xl leading-tight font-extrabold text-slate-50 sm:text-[26px] light:text-slate-900">{{ course.title }}</h1>
        <p class="mt-2.5 text-[13px] leading-relaxed text-white/60 light:text-slate-600">{{ course.description }}</p>

        <div class="mt-4 flex items-center gap-2.5">
          <img
            :src="`https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(course.instructor || 'Instructor')}&backgroundColor=b6e3f4`"
            alt=""
            class="size-8 rounded-full border-2 border-violet-500/40"
          >
          <span class="text-[13px] text-white/55 light:text-slate-500">{{ t('Taught by') }} <strong class="text-slate-100 light:text-slate-900">{{ course.instructor }}</strong></span>
        </div>

        <!-- Enrolled: progress + continue -->
        <div v-if="isEnrolled" class="mt-5 border-t border-white/8 pt-4.5 light:border-slate-200">
          <div class="mb-2 flex items-center justify-between text-xs">
            <span class="font-semibold text-slate-200 light:text-slate-800">
              <template v-if="progress?.completed">{{ t('Course completed 🎉') }}</template>
              <template v-else>{{ t('Your progress') }}</template>
            </span>
            <span class="text-white/45 light:text-slate-500">{{ progress?.completedLessons ?? 0 }}/{{ progress?.totalLessons ?? course.totalLessons }} lessons</span>
          </div>
          <ProgressBar :value="progress?.progressPercent ?? 0" />
          <div class="mt-4 flex flex-wrap items-center gap-2">
            <NuxtLink
              :to="`/learn/${course.slug}`"
              class="inline-flex items-center gap-2 rounded-xl border border-violet-500/40 bg-linear-to-br from-violet-600 to-indigo-600 px-5 py-2.5 text-[13px] font-semibold text-white no-underline shadow-[0_4px_15px_rgba(124,58,237,0.25)] transition-all hover:-translate-y-px hover:from-violet-500 hover:to-indigo-500"
            >
              <PlayCircle :size="16" />
              {{ progress?.completedLessons ? (progress.completed ? t('Review course') : t('Continue learning')) : t('Start learning') }}
            </NuxtLink>
            <NuxtLink
              v-if="certificate"
              :to="`/certificates/${certificate.certificateNumber}`"
              class="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-[13px] font-semibold text-white/75 no-underline transition-all hover:bg-white/10 hover:text-white light:border-slate-200 light:bg-slate-100 light:text-slate-700"
            >
              <Award :size="15" />
              {{ t('View certificate') }}
            </NuxtLink>
          </div>
        </div>

        <!-- Not enrolled: price + enroll / wishlist -->
        <div v-else class="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/8 pt-4.5 light:border-slate-200">
          <div class="flex items-baseline gap-2">
            <span v-if="isFree" class="text-2xl font-extrabold text-emerald-400 light:text-emerald-700">{{ t('Free') }}</span>
            <template v-else>
              <span class="text-2xl font-extrabold text-emerald-400 light:text-emerald-700">${{ course.price.toFixed(2) }}</span>
              <span v-if="course.originalPrice > course.price" class="text-[13px] text-white/35 line-through light:text-slate-400">
                ${{ course.originalPrice.toFixed(2) }}
              </span>
              <span v-if="course.sale" class="rounded-md border border-rose-400/30 bg-rose-400/12 px-2 py-0.5 text-[11px] font-bold text-rose-300 light:border-rose-200 light:bg-rose-50 light:text-rose-600">
                {{ formatDiscount(course.sale) }}
              </span>
              <span v-if="course.sale?.endsAt" class="text-xs text-white/45 light:text-slate-500">
                Ends {{ formatDate(course.sale.endsAt) }}
              </span>
            </template>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <NuxtLink
              v-if="!auth.isAuthenticated"
              :to="signInLink"
              class="inline-flex items-center gap-2 rounded-xl border border-violet-500/40 bg-linear-to-br from-violet-600 to-indigo-600 px-5 py-2.5 text-[13px] font-semibold text-white no-underline shadow-[0_4px_15px_rgba(124,58,237,0.25)] transition-all hover:-translate-y-px hover:from-violet-500 hover:to-indigo-500"
            >
              <GraduationCap :size="16" />
              {{ t('Sign in to enroll') }}
            </NuxtLink>

            <button
              v-if="auth.isAuthenticated"
              type="button"
              class="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border px-4 py-2.5 text-[13px] font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60 disabled:cursor-wait disabled:opacity-60"
              :class="inWishlist
                ? 'border-rose-400/40 bg-rose-500/15 text-rose-300 hover:bg-rose-500/25 light:border-rose-200 light:bg-rose-50 light:text-rose-600'
                : 'border-white/10 bg-white/5 text-white/75 hover:bg-white/10 hover:text-white light:border-slate-200 light:bg-slate-100 light:text-slate-700'"
              :aria-pressed="inWishlist"
              :disabled="wishlistBusy"
              @click="toggleWishlist"
            >
              <Heart :size="15" :class="inWishlist ? 'fill-current' : ''" />
              {{ inWishlist ? t('Saved') : t('Save') }}
            </button>

            <button
              v-if="auth.isAuthenticated && isFree"
              type="button"
              class="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-violet-500/40 bg-linear-to-br from-violet-600 to-indigo-600 px-5 py-2.5 text-[13px] font-semibold text-white shadow-[0_4px_15px_rgba(124,58,237,0.25)] transition-all hover:-translate-y-px hover:from-violet-500 hover:to-indigo-500 disabled:cursor-wait disabled:opacity-60"
              :disabled="enrolling"
              @click="handleEnroll"
            >
              <Loader2 v-if="enrolling" :size="16" class="animate-spin" />
              <GraduationCap v-else :size="16" />
              {{ t('Enroll for free') }}
            </button>
            <NuxtLink
              v-else-if="auth.isAuthenticated && inCart"
              to="/cart"
              class="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-[13px] font-semibold text-white/75 no-underline hover:bg-white/10 hover:text-white light:border-slate-200 light:bg-slate-100 light:text-slate-700"
            >
              <ShoppingCart :size="16" />
              {{ t('Go to cart') }}
            </NuxtLink>
            <button
              v-else-if="auth.isAuthenticated"
              type="button"
              class="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-[13px] font-semibold text-white/75 hover:bg-white/10 hover:text-white disabled:cursor-wait disabled:opacity-60 light:border-slate-200 light:bg-slate-100 light:text-slate-700"
              :disabled="checkingOut"
              @click="addToCart"
            >
              <ShoppingCart :size="16" />
              {{ t('Add to cart') }}
            </button>
            <button
              v-if="auth.isAuthenticated && !isFree"
              type="button"
              class="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-violet-500/40 bg-linear-to-br from-violet-600 to-indigo-600 px-5 py-2.5 text-[13px] font-semibold text-white shadow-[0_4px_15px_rgba(124,58,237,0.25)] transition-all hover:-translate-y-px hover:from-violet-500 hover:to-indigo-500 disabled:cursor-wait disabled:opacity-60"
              :disabled="checkingOut"
              @click="buyNow"
            >
              <Loader2 v-if="checkingOut" :size="16" class="animate-spin" />
              {{ t('Buy now') }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-5 lg:grid-cols-3">
      <div class="flex flex-col gap-5 lg:col-span-2">
        <!-- Curriculum -->
        <div class="rounded-[18px] border border-white/10 bg-white/5 p-5 backdrop-blur-md sm:p-6 light:border-slate-200 light:bg-white">
          <div class="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 class="text-base font-bold text-slate-100 light:text-slate-900">{{ t('Course Content') }}</h3>
              <p v-if="curriculum" class="mt-0.5 text-xs text-white/40 light:text-slate-500">
                {{ curriculum.sections.length }} sections · {{ curriculum.totalLessons }} lessons · {{ formatDuration(curriculum.totalDurationMinutes) }} total
              </p>
            </div>
          </div>

          <div v-if="curriculumPending" class="flex flex-col gap-2.5">
            <div v-for="i in 3" :key="i" class="h-14 animate-pulse rounded-xl bg-white/5 light:bg-slate-100" />
          </div>
          <CurriculumOutline
            v-else-if="curriculum"
            :curriculum="curriculum"
            :busy-lesson-id="busyLessonId"
            @select="openLesson"
            @toggle-complete="toggleComplete"
          />
          <p v-else class="text-[13px] text-white/45 light:text-slate-500">{{ t('Unable to load the curriculum right now.') }}</p>
        </div>

        <CourseReviews :slug="course.slug" :can-review="isEnrolled" @changed="$emit('refresh')" />
      </div>

      <!-- Specs -->
      <div class="h-fit rounded-[18px] border border-white/10 bg-white/5 p-5 backdrop-blur-md sm:p-6 light:border-slate-200 light:bg-white">
        <h3 class="mb-3 text-base font-bold text-slate-100 light:text-slate-900">{{ t('This course includes') }}</h3>
        <ul class="m-0 flex list-none flex-col gap-2.5 p-0 text-[13px] text-white/70 light:text-slate-600">
          <li class="flex items-center gap-2.5"><Clock :size="15" class="text-violet-400" /> {{ course.totalHours }} hours of content</li>
          <li class="flex items-center gap-2.5"><BookOpen :size="15" class="text-blue-400" /> {{ course.totalLessons }} lessons</li>
          <li class="flex items-center gap-2.5"><BarChart3 :size="15" class="text-emerald-400" /> {{ course.level }} level</li>
          <li class="flex items-center gap-2.5"><RefreshCw :size="15" class="text-amber-400" /> Updated {{ course.updatedAt }}</li>
        </ul>

        <div v-if="course.tags?.length" class="mt-5">
          <span class="mb-2 block text-[13px] text-white/45 light:text-slate-500">{{ t('Topics') }}</span>
          <div class="flex flex-wrap gap-1.5">
            <span v-for="tag in course.tags" :key="tag" class="rounded-md border border-violet-500/25 bg-violet-500/12 px-2.25 py-0.75 text-[11px] font-medium text-violet-300 light:border-violet-200 light:bg-violet-50 light:text-violet-700">
              #{{ tag }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  ArrowLeft,
  Award,
  BarChart3,
  BookOpen,
  Clock,
  GraduationCap,
  Heart,
  Loader2,
  PlayCircle,
  RefreshCw,
  ShoppingCart,
  Star,
  Users
} from 'lucide-vue-next'
import type { Certificate, Course, Curriculum, Lesson } from '~/types'
import ProgressBar from '~/components/learning/ProgressBar.vue'
import CurriculumOutline from '~/components/learning/CurriculumOutline.vue'
import CourseReviews from '~/components/learning/CourseReviews.vue'
import { formatDuration, useCurriculum } from '~/composables/useCurriculum'
import { formatDiscount } from '~/composables/useDiscounts'
import { useLearning } from '~/composables/useLearning'
import { useCart } from '~/composables/useCart'
import { useAppToast } from '~/composables/useAppToast'
import { getErrorMessage } from '~/utils/apiError'
import { formatDate } from '~/utils/dateTime'

const { t } = useT()

const props = defineProps<{ course: Course }>()
defineEmits<{ refresh: [] }>()

const auth = useAuth()
const router = useRouter()
const toast = useAppToast()
const { fetchCurriculum } = useCurriculum()
const { enroll, setLessonCompleted, fetchWishlist, addToWishlist, removeFromWishlist, findCertificate } = useLearning()

const cart = useCart()

const curriculum = ref<Curriculum | null>(null)
const curriculumPending = ref(true)
const enrolling = ref(false)
const checkingOut = ref(false)
const inWishlist = ref(false)
const wishlistBusy = ref(false)
const busyLessonId = ref<number | null>(null)
const certificate = ref<Certificate | null>(null)

const isFree = computed(() => Number(props.course.price) <= 0)
const inCart = computed(() => cart.contains(props.course.slug))
const isEnrolled = computed(() => Boolean(curriculum.value?.enrolled ?? props.course.enrolled))
const progress = computed(() => curriculum.value?.progress ?? null)
const signInLink = computed(() => ({ path: '/auth/login', query: { redirect: `/courses/${props.course.slug}` } }))

async function loadCurriculum() {
  try {
    curriculum.value = await fetchCurriculum(props.course.slug)
  } catch {
    curriculum.value = null
  } finally {
    curriculumPending.value = false
  }
}

async function loadWishlistState() {
  if (props.course.enrolled || !auth.isAuthenticated) return
  try {
    const items = await fetchWishlist()
    inWishlist.value = items.some(item => item.slug === props.course.slug)
  } catch {
    inWishlist.value = false
  }
}

async function handleEnroll() {
  enrolling.value = true
  try {
    await enroll(props.course.slug)
    toast.success('You\'re Enrolled!', `Welcome to ${props.course.title}.`)
    await router.push(`/learn/${props.course.slug}`)
  } catch (err) {
    toast.error(t('Enrollment Failed'), getErrorMessage(err, t('Unable to enroll in this course')))
  } finally {
    enrolling.value = false
  }
}

async function addToCart() {
  checkingOut.value = true
  try {
    await cart.add(props.course.slug)
    toast.success(t('Added to cart'), props.course.title)
  } catch (err) {
    toast.error(t('Not added to cart'), getErrorMessage(err, t('Please try again.')))
  } finally {
    checkingOut.value = false
  }
}

function buyNow() {
  return router.push({ path: '/checkout', query: { course: props.course.slug } })
}

async function toggleWishlist() {
  wishlistBusy.value = true
  try {
    if (inWishlist.value) {
      await removeFromWishlist(props.course.slug)
      inWishlist.value = false
      toast.info(t('Removed from Wishlist'))
    } else {
      await addToWishlist(props.course.slug)
      inWishlist.value = true
      toast.success(t('Saved to Wishlist'), props.course.title)
    }
  } catch (err) {
    toast.error(t('Wishlist Update Failed'), getErrorMessage(err, t('Unable to update your wishlist')))
  } finally {
    wishlistBusy.value = false
  }
}

function openLesson(lesson: Lesson) {
  if (lesson.locked) return
  router.push({ path: `/learn/${props.course.slug}`, query: { lesson: String(lesson.id) } })
}

async function toggleComplete(lesson: Lesson) {
  busyLessonId.value = lesson.id
  try {
    const result = await setLessonCompleted(lesson.id, !lesson.completed)
    lesson.completed = result.lessonCompleted
    if (curriculum.value) curriculum.value.progress = result.courseProgress
  } catch (err) {
    toast.error(t('Progress Not Saved'), getErrorMessage(err, t('Unable to update lesson progress')))
  } finally {
    busyLessonId.value = null
  }
}

watch(() => props.course.slug, () => {
  curriculumPending.value = true
  loadCurriculum()
  loadWishlistState()
}, { immediate: true })

watch(() => progress.value?.completed ? props.course.slug : null, async (slug) => {
  certificate.value = slug ? await findCertificate(slug).catch(() => null) : null
}, { immediate: true })
</script>
