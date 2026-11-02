<template>
  <div v-if="pending" class="grid gap-5 lg:grid-cols-[1fr_360px]">
    <div class="aspect-video w-full animate-pulse rounded-[20px] bg-white/5 light:bg-slate-100" />
    <div class="h-100 animate-pulse rounded-[20px] bg-white/5 light:bg-slate-100" />
  </div>

  <div v-else-if="!curriculum || !course" class="flex flex-col items-center justify-center rounded-[20px] border border-white/10 bg-white/5 px-5 py-15 text-center light:border-slate-200 light:bg-white">
    <AlertCircle :size="40" class="text-rose-400" />
    <h2 class="mt-3 text-xl font-bold text-slate-50 light:text-slate-900">{{ t('Course Unavailable') }}</h2>
    <p class="mt-1.5 text-[13px] text-white/50 light:text-slate-500">{{ t('We couldn\'t load this course\'s lessons.') }}</p>
    <NuxtLink to="/my-learning" class="mt-4 text-[13px] font-semibold text-violet-300 light:text-violet-700">{{ t('Back to My Learning') }}</NuxtLink>
  </div>

  <div v-else class="flex flex-col gap-5">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <NuxtLink :to="`/courses/${slug}`" class="inline-flex min-w-0 items-center gap-1.5 text-[13px] font-semibold text-violet-300 no-underline hover:text-violet-200 light:text-violet-700">
        <ArrowLeft :size="15" class="shrink-0" />
        <span class="truncate">{{ course.title }}</span>
      </NuxtLink>
      <div v-if="curriculum.enrolled && curriculum.progress" class="w-full sm:w-64">
        <ProgressBar :value="curriculum.progress.progressPercent" />
      </div>
    </div>

    <div
      v-if="!curriculum.enrolled"
      class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-400/30 bg-blue-500/10 px-4 py-3 text-[13px] text-blue-200 light:border-blue-200 light:bg-blue-50 light:text-blue-800"
    >
      <span>{{ t('You\'re watching a free preview. Enroll to unlock every lesson and track your progress.') }}</span>
      <NuxtLink :to="`/courses/${slug}`" class="font-semibold text-blue-100 underline light:text-blue-900">{{ t('View enrollment options') }}</NuxtLink>
    </div>

    <div class="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
      <!-- Lesson content -->
      <div class="flex min-w-0 flex-col gap-4">
        <div v-if="!activeLesson" class="flex aspect-video flex-col items-center justify-center rounded-[20px] border border-white/10 bg-white/5 p-6 text-center light:border-slate-200 light:bg-white">
          <Lock :size="32" class="text-white/35 light:text-slate-400" />
          <p class="mt-3 text-[13px] text-white/55 light:text-slate-500">
            {{ curriculum.totalLessons ? t('Select an unlocked lesson to begin.') : t('This course has no lessons yet.') }}
          </p>
        </div>

        <template v-else>
          <QuizPlayer
            v-if="showQuiz"
            :key="`quiz-${activeLesson.id}`"
            :lesson-id="activeLesson.id"
            @ready="quizGraded = $event"
            @passed="onQuizPassed"
          />

          <div v-if="!showQuiz || quizGraded === false" class="overflow-hidden rounded-[20px] border border-white/10 bg-black light:border-slate-200">
            <iframe
              v-if="embedUrl"
              :key="`embed-${activeLesson.id}`"
              :src="embedUrl"
              :title="activeLesson.title"
              class="aspect-video w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
              allowfullscreen
            />
            <video
              v-else-if="isPlayableVideo && !mediaFailed"
              ref="videoRef"
              :key="`video-${activeLesson.id}`"
              :src="activeLesson.contentUrl || undefined"
              class="aspect-video w-full bg-black"
              controls
              preload="metadata"
              @error="mediaFailed = true"
              @loadedmetadata="restorePosition"
              @timeupdate="onVideoProgress"
              @pause="onVideoPause"
              @ended="onVideoPause"
            />
            <div v-else class="flex aspect-video flex-col items-center justify-center gap-3 bg-linear-to-br from-violet-950/60 to-zinc-950 p-6 text-center light:from-violet-50 light:to-white">
              <component :is="lessonIcon" :size="40" class="text-violet-300 light:text-violet-600" />
              <p class="max-w-md text-[13px] text-white/65 light:text-slate-600">
                <template v-if="mediaFailed">{{ t('This video couldn\'t be played in the browser.') }}</template>
                <template v-else-if="activeLesson.type === 'quiz'">{{ t('This lesson is a quiz hosted with the course materials.') }}</template>
                <template v-else>{{ t('This lesson is a reading resource.') }}</template>
              </p>
              <a
                v-if="activeLesson.contentUrl"
                :href="activeLesson.contentUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-1.5 rounded-[10px] border border-violet-500/40 bg-violet-500/20 px-4 py-2 text-xs font-semibold text-violet-200 no-underline hover:bg-violet-500/35 light:text-violet-800"
              >
                Open {{ activeLesson.type === 'quiz' ? 'quiz' : 'resource' }}
                <ExternalLink :size="13" />
              </a>
            </div>
          </div>

          <div class="rounded-[18px] border border-white/10 bg-white/5 p-5 light:border-slate-200 light:bg-white">
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div class="min-w-0">
                <p class="text-[11px] font-semibold tracking-wider text-white/40 uppercase light:text-slate-500">
                  {{ t('Lesson {current} of {total}', { current: activeIndex + 1, total: allLessons.length }) }} · {{ t(lessonTypeLabel) }} · {{ formatDuration(activeLesson.durationMinutes) }}
                </p>
                <h1 class="mt-1 text-xl font-bold text-slate-50 light:text-slate-900">{{ activeLesson.title }}</h1>
              </div>
              <span v-if="activeLesson.completed" class="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-400/12 px-2.5 py-1 text-[11px] font-semibold text-emerald-400 light:border-emerald-200 light:bg-emerald-50 light:text-emerald-700">
                <CheckCircle2 :size="13" /> {{ t('Completed') }}
              </span>
            </div>

            <div class="mt-4 flex flex-wrap items-center justify-between gap-2.5 border-t border-white/8 pt-4 light:border-slate-200">
              <button type="button" :class="secondaryButton" :disabled="!previousLesson" @click="goTo(previousLesson)">
                <ChevronLeft :size="15" /> {{ t('Previous') }}
              </button>

              <div class="flex flex-wrap items-center gap-2">
                <button
                  v-if="curriculum.enrolled && activeLesson.completed"
                  type="button"
                  :class="secondaryButton"
                  :disabled="saving"
                  @click="setCompleted(activeLesson, false)"
                >
                  <RotateCcw :size="14" /> {{ t('Mark incomplete') }}
                </button>
                <button
                  v-if="curriculum.enrolled && !activeLesson.completed && !mustPassQuiz"
                  type="button"
                  class="inline-flex cursor-pointer items-center gap-1.5 rounded-[10px] border border-violet-500/40 bg-linear-to-br from-violet-600 to-indigo-600 px-4 py-2 text-xs font-semibold text-white transition-all hover:from-violet-500 hover:to-indigo-500 disabled:cursor-wait disabled:opacity-60"
                  :disabled="saving"
                  @click="completeAndContinue"
                >
                  <Loader2 v-if="saving" :size="14" class="animate-spin" />
                  <CheckCircle2 v-else :size="14" />
                  {{ nextUnfinished ? t('Complete & continue') : t('Complete lesson') }}
                </button>
                <button v-else type="button" :class="secondaryButton" :disabled="!nextStop" @click="goTo(nextStop)">
                  {{ !nextLesson && nextStop ? t('Next unfinished') : t('Next') }} <ChevronRight :size="15" />
                </button>
              </div>
            </div>
          </div>

          <LessonWorkspace
            v-if="curriculum.enrolled || auth.isStaff"
            :key="`workspace-${activeLesson.id}`"
            :lesson-id="activeLesson.id"
            :enrolled="curriculum.enrolled"
            :position-seconds="isPlayableVideo && !mediaFailed ? videoSeconds : null"
            @seek="seekTo"
          />

          <div
            v-if="curriculum.progress?.completed"
            class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-[13px] text-emerald-200 light:border-emerald-200 light:bg-emerald-50 light:text-emerald-800"
          >
            <span class="flex items-center gap-2"><Trophy :size="16" /> {{ t('You\'ve completed this course. Nice work!') }}</span>
            <div class="flex flex-wrap items-center gap-3">
              <NuxtLink v-if="certificate" :to="`/certificates/${certificate.certificateNumber}`" class="inline-flex items-center gap-1.5 font-semibold underline">
                <Award :size="15" /> {{ t('View certificate') }}
              </NuxtLink>
              <NuxtLink :to="`/courses/${slug}`" class="font-semibold underline">{{ t('Leave a review') }}</NuxtLink>
            </div>
          </div>
        </template>
      </div>

      <!-- Curriculum sidebar -->
      <aside class="rounded-[18px] border border-white/10 bg-white/5 p-4 lg:sticky lg:top-20 lg:max-h-[calc(100dvh-6rem)] lg:overflow-y-auto light:border-slate-200 light:bg-white">
        <h2 class="mb-3 px-1 text-sm font-bold text-slate-100 light:text-slate-900">{{ t('Course content') }}</h2>
        <CurriculumOutline
          :curriculum="curriculum"
          :active-lesson-id="activeLesson?.id ?? null"
          :busy-lesson-id="saving ? activeLesson?.id ?? null : null"
          @select="goTo"
          @toggle-complete="lesson => setCompleted(lesson, !lesson.completed)"
        />
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  AlertCircle,
  ArrowLeft,
  Award,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileText,
  HelpCircle,
  Loader2,
  Lock,
  PlayCircle,
  RotateCcw,
  Trophy
} from 'lucide-vue-next'
import type { Certificate, Course, Curriculum, Lesson, LessonProgressResult } from '~/types'
import ProgressBar from '~/components/learning/ProgressBar.vue'
import CurriculumOutline from '~/components/learning/CurriculumOutline.vue'
import LessonWorkspace from '~/components/learning/LessonWorkspace.vue'
import QuizPlayer from '~/components/learning/QuizPlayer.vue'
import { flattenLessons, formatDuration, useCurriculum } from '~/composables/useCurriculum'
import { useLearning } from '~/composables/useLearning'
import { useAppToast } from '~/composables/useAppToast'
import { getErrorMessage } from '~/utils/apiError'

const { t } = useT()
const route = useRoute()
const router = useRouter()
const toast = useAppToast()
const { fetchCurriculum } = useCurriculum()
const { setLessonCompleted, saveLessonPosition, fetchAchievements, findCertificate } = useLearning()

const slug = computed(() => String(route.params.slug))

const { data, pending } = await useAsyncData(
  () => `learn-${slug.value}`,
  async () => {
    const [course, curriculum] = await Promise.all([
      $fetch<Course>(`/api/courses/${slug.value}`),
      fetchCurriculum(slug.value)
    ])
    return { course, curriculum }
  },
  // deep: lesson completion and progress are updated in place
  { server: false, watch: [slug], deep: true }
)

const course = computed(() => data.value?.course ?? null)
const curriculum = computed<Curriculum | null>(() => data.value?.curriculum ?? null)

const POSITION_SAVE_INTERVAL_SECONDS = 10
const RESUME_END_MARGIN_SECONDS = 5

const auth = useAuth()
const saving = ref(false)
const mediaFailed = ref(false)
const videoRef = ref<HTMLVideoElement | null>(null)
const videoSeconds = ref(0)
let lastSavedPosition = 0
const certificate = ref<Certificate | null>(null)
// Badges earned so far, so a completion can announce only the new ones
const earnedBadges = ref<Set<string> | null>(null)

const secondaryButton = 'inline-flex cursor-pointer items-center gap-1.5 rounded-[10px] border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-semibold text-white/75 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40 light:border-slate-200 light:bg-slate-100 light:text-slate-700 light:hover:bg-slate-200'

const allLessons = computed(() => flattenLessons(curriculum.value))
const unlockedLessons = computed(() => allLessons.value.filter(lesson => !lesson.locked))

// Requested lesson if it is unlocked, otherwise the first unfinished one
const activeLesson = computed<Lesson | null>(() => {
  const requested = Number(route.query.lesson)
  const match = unlockedLessons.value.find(lesson => lesson.id === requested)
  if (match) return match
  return unlockedLessons.value.find(lesson => !lesson.completed) ?? unlockedLessons.value[0] ?? null
})

// Null until the quiz says whether it has questions; one without them falls back to its link
const quizGraded = ref<boolean | null>(null)
const showQuiz = computed(() => activeLesson.value?.type === 'quiz' && Boolean(curriculum.value?.enrolled))
const lessonTypeLabel = computed(() => ({ video: 'Video', article: 'Article', quiz: 'Quiz' }[activeLesson.value?.type ?? 'video']))
const mustPassQuiz = computed(() => showQuiz.value && quizGraded.value !== false)
watch(() => activeLesson.value?.id, () => {
  quizGraded.value = null
})

useHead({ title: computed(() => activeLesson.value?.title || course.value?.title || 'Lesson') })

const activeIndex = computed(() => allLessons.value.findIndex(lesson => lesson.id === activeLesson.value?.id))

const previousLesson = computed(() => {
  const index = unlockedLessons.value.findIndex(lesson => lesson.id === activeLesson.value?.id)
  return index > 0 ? unlockedLessons.value[index - 1] ?? null : null
})

const nextLesson = computed(() => {
  const index = unlockedLessons.value.findIndex(lesson => lesson.id === activeLesson.value?.id)
  return index >= 0 ? unlockedLessons.value[index + 1] ?? null : null
})

// Next lesson still to do, wrapping around to anything skipped earlier
const nextUnfinished = computed(() => {
  const lessons = unlockedLessons.value
  const index = lessons.findIndex(lesson => lesson.id === activeLesson.value?.id)
  return [...lessons.slice(index + 1), ...lessons.slice(0, index)].find(lesson => !lesson.completed) ?? null
})

const nextStop = computed(() => nextLesson.value ?? (curriculum.value?.enrolled ? nextUnfinished.value : null))

const embedUrl = computed(() => {
  const url = activeLesson.value?.contentUrl
  if (!url) return null
  const youtube = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{11})/)
  if (!youtube) return null
  const start = activeLesson.value?.resumePositionSeconds
  return `https://www.youtube-nocookie.com/embed/${youtube[1]}${start ? `?start=${start}` : ''}`
})

const isPlayableVideo = computed(() => {
  const lesson = activeLesson.value
  return Boolean(lesson?.contentUrl && lesson.type === 'video' && /\.(mp4|webm|ogg|m4v)(\?|#|$)/i.test(lesson.contentUrl))
})

const lessonIcon = computed(() => {
  if (activeLesson.value?.type === 'quiz') return HelpCircle
  if (activeLesson.value?.type === 'article') return FileText
  return PlayCircle
})

function restorePosition(event: Event) {
  const video = event.target as HTMLVideoElement
  const position = activeLesson.value?.resumePositionSeconds
  // Near the end there is nothing left to resume, so start over
  if (position && position < video.duration - RESUME_END_MARGIN_SECONDS) {
    video.currentTime = position
  }
  lastSavedPosition = Math.floor(video.currentTime)
}

// Saving your place is a convenience, so a failure must not interrupt the video
function savePosition(lesson: Lesson, seconds: number) {
  if (!curriculum.value?.enrolled || seconds === lastSavedPosition) return
  lastSavedPosition = seconds
  lesson.resumePositionSeconds = seconds
  saveLessonPosition(lesson.id, seconds).catch(() => {})
}

function onVideoProgress(event: Event) {
  const video = event.target as HTMLVideoElement
  const lesson = activeLesson.value
  const seconds = Math.floor(video.currentTime)
  videoSeconds.value = seconds
  if (lesson && video.isConnected && Math.abs(seconds - lastSavedPosition) >= POSITION_SAVE_INTERVAL_SECONDS) {
    savePosition(lesson, seconds)
  }
}

function seekTo(seconds: number) {
  if (!videoRef.value) return
  videoRef.value.currentTime = seconds
  videoRef.value.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

function onVideoPause(event: Event) {
  const video = event.target as HTMLVideoElement
  const lesson = activeLesson.value
  // A video removed by switching lessons also pauses, and its time belongs to the old lesson
  if (lesson && video.isConnected) savePosition(lesson, Math.floor(video.currentTime))
}

watch(() => activeLesson.value?.id, (lessonId) => {
  mediaFailed.value = false
  lastSavedPosition = 0
  videoSeconds.value = 0
  // Pin the resolved lesson in the URL so completing it doesn't move the fallback selection
  if (lessonId && route.query.lesson !== String(lessonId)) {
    router.replace({ query: { ...route.query, lesson: String(lessonId) } })
  }
}, { immediate: true })

function goTo(lesson: Lesson | null | undefined) {
  if (!lesson || lesson.locked) return
  router.replace({ query: { ...route.query, lesson: String(lesson.id) } })
}

// Rewards are a bonus on top of the lesson, so failures here stay silent
async function loadCertificate() {
  certificate.value = await findCertificate(slug.value).catch(() => null)
}

async function loadEarnedBadges() {
  const achievements = await fetchAchievements().catch(() => null)
  return achievements ? achievements.filter(badge => badge.earned) : null
}

async function announceNewBadges() {
  const earned = await loadEarnedBadges()
  if (!earned) return
  for (const badge of earned) {
    if (earnedBadges.value && !earnedBadges.value.has(badge.code)) {
      toast.success(t('Badge unlocked'), `${badge.title}: ${badge.description}`)
    }
  }
  earnedBadges.value = new Set(earned.map(badge => badge.code))
}

watch(curriculum, async (value) => {
  if (!value?.enrolled) {
    certificate.value = null
    earnedBadges.value = null
    return
  }
  loadCertificate()
  const earned = await loadEarnedBadges()
  earnedBadges.value = earned && new Set(earned.map(badge => badge.code))
}, { immediate: true })

function applyProgress(lesson: Lesson, result: LessonProgressResult) {
  if (!curriculum.value) return
  const wasCompleted = curriculum.value.progress?.completed
  lesson.completed = result.lessonCompleted
  curriculum.value.progress = result.courseProgress
  if (!wasCompleted && result.courseProgress.completed) {
    toast.success(t('Course Completed! 🎉'), t('You finished {title}.', { title: course.value?.title ?? '' }))
    loadCertificate()
  }
}

function onQuizPassed(result: LessonProgressResult) {
  if (!activeLesson.value) return
  applyProgress(activeLesson.value, result)
  announceNewBadges()
}

async function setCompleted(lesson: Lesson, completed: boolean) {
  if (!curriculum.value?.enrolled) return false
  saving.value = true
  try {
    applyProgress(lesson, await setLessonCompleted(lesson.id, completed))
    if (completed) announceNewBadges()
    return true
  } catch (err) {
    toast.error(t('Progress Not Saved'), getErrorMessage(err, t('Unable to update lesson progress')))
    return false
  } finally {
    saving.value = false
  }
}

async function completeAndContinue() {
  const lesson = activeLesson.value
  if (!lesson) return
  const next = nextUnfinished.value
  if (await setCompleted(lesson, true) && next) goTo(next)
}
</script>
