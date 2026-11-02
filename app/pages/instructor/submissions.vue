<template>
  <div class="flex flex-col gap-5">
    <div>
      <h1 class="text-2xl font-extrabold tracking-tight text-slate-50 sm:text-[26px] light:text-slate-900">Submissions</h1>
      <p class="mt-1 text-[13px] text-white/45 light:text-slate-500">Work waiting to be graded, oldest first.</p>
    </div>

    <div v-if="pending" class="h-40 animate-pulse rounded-[18px] bg-white/5 light:bg-slate-100" />
    <p v-else-if="error" class="rounded-[18px] border border-white/10 bg-white/5 px-5 py-12 text-center text-[13px] text-white/45 light:border-slate-200 light:bg-white light:text-slate-500">{{ getErrorMessage(error, 'Unable to load submissions') }}</p>
    <p v-else-if="!items.length" class="rounded-[18px] border border-white/10 bg-white/5 px-5 py-12 text-center text-[13px] text-white/45 light:border-slate-200 light:bg-white light:text-slate-500">Nothing to grade right now.</p>

    <article v-for="item in items" :key="item.submission.id" class="rounded-[18px] border border-white/10 bg-white/5 p-5 light:border-slate-200 light:bg-white">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <span class="text-sm font-bold text-[13px] text-slate-100 light:text-slate-900">{{ item.studentName }}</span>
        <span class="text-xs text-white/45 light:text-slate-500">{{ formatDateTime(item.submission.submittedAt) }}</span>
      </div>
      <p class="mt-0.5 text-xs text-white/45 light:text-slate-500">{{ item.courseTitle }} · {{ item.lessonTitle }} · Pass score {{ item.passScore }}</p>
      <p v-if="item.submission.comment" class="mt-2 whitespace-pre-line text-[13px] text-slate-100 light:text-slate-900">{{ item.submission.comment }}</p>
      <a v-if="item.submission.fileUrl" :href="item.submission.fileUrl" target="_blank" rel="noopener noreferrer" class="mt-1 inline-block text-xs font-semibold text-violet-300 light:text-violet-700">{{ item.submission.fileName || 'Open file' }}</a>
      <div class="mt-3 flex justify-end">
        <button type="button" class="cursor-pointer rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 border-violet-500/40 bg-linear-to-br from-violet-600 to-indigo-600 text-white hover:from-violet-500 hover:to-indigo-500" @click="grading = item">Grade</button>
      </div>
    </article>

    <div v-if="totalPages > 1" class="flex items-center justify-end gap-3 text-xs text-white/45 light:text-slate-500">
      <button type="button" class="cursor-pointer font-semibold disabled:cursor-not-allowed disabled:opacity-40" :disabled="page === 0" @click="page -= 1">Previous</button>
      <span>Page {{ page + 1 }} of {{ totalPages }}</span>
      <button type="button" class="cursor-pointer font-semibold disabled:cursor-not-allowed disabled:opacity-40" :disabled="page + 1 >= totalPages" @click="page += 1">Next</button>
    </div>

    <Teleport to="body">
      <div v-if="grading" class="fixed inset-0 z-100 flex items-center justify-center bg-[#05050c]/82 p-4 backdrop-blur-xl" @click.self="grading = null">
        <form class="w-full max-w-120 rounded-[20px] border border-violet-500/25 bg-[#0f1019] p-5 light:border-violet-500/30 light:bg-white" role="dialog" aria-modal="true" aria-labelledby="grade-title" @submit.prevent="grade">
          <h2 id="grade-title" class="text-lg font-bold text-slate-50 light:text-slate-900">Grade {{ grading.studentName }}</h2>
          <p class="mt-1 text-xs text-white/45 light:text-slate-500">A score of {{ grading.passScore }} or more passes and completes the lesson.</p>
          <div class="mt-3 flex flex-col gap-3">
            <div class="flex flex-col gap-1.5">
              <label class="text-[11px] font-semibold tracking-wider text-white/60 uppercase light:text-slate-600" for="grade-score">Score (0 to 100)</label>
              <input id="grade-score" v-model.number="score" type="number" min="0" max="100" required class="w-full rounded-[10px] border border-white/10 bg-white/4 px-3.5 py-2.5 text-[13px] text-slate-100 outline-none transition-all duration-200 placeholder:text-white/30 focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/15 light:border-slate-300 light:bg-white light:text-slate-900 light:placeholder:text-slate-400">
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-[11px] font-semibold tracking-wider text-white/60 uppercase light:text-slate-600" for="grade-feedback">Feedback</label>
              <textarea id="grade-feedback" v-model="feedback" rows="3" maxlength="2000" class="w-full rounded-[10px] border border-white/10 bg-white/4 px-3.5 py-2.5 text-[13px] text-slate-100 outline-none transition-all duration-200 placeholder:text-white/30 focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/15 light:border-slate-300 light:bg-white light:text-slate-900 light:placeholder:text-slate-400" />
            </div>
          </div>
          <div class="mt-3 flex justify-end gap-2">
            <button type="button" class="cursor-pointer rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 border-white/10 bg-white/5 text-white/75 hover:bg-white/9 hover:text-white light:border-slate-200 light:bg-slate-100 light:text-slate-700" @click="grading = null">Cancel</button>
            <button type="submit" class="cursor-pointer rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 border-violet-500/40 bg-linear-to-br from-violet-600 to-indigo-600 text-white hover:from-violet-500 hover:to-indigo-500" :disabled="saving || score === null || score === ''">Save Grade</button>
          </div>
        </form>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import type { SubmissionReview } from '~/types'
import { useAppToast } from '~/composables/useAppToast'
import { useLessonTools } from '~/composables/useLessonTools'
import { getErrorMessage } from '~/utils/apiError'
import { formatDateTime } from '~/utils/dateTime'

definePageMeta({ requiresStaff: true })
useHead({ title: 'Submissions' })

const toast = useAppToast()
const { fetchSubmissions, gradeSubmission } = useLessonTools()
const page = ref(0)

const { data, pending, error, refresh } = await useAsyncData(
  'instructor-submissions',
  () => fetchSubmissions(page.value),
  { server: false, watch: [page] }
)
const items = computed(() => data.value?.items ?? [])
const totalPages = computed(() => data.value?.totalPages ?? 0)

const grading = ref<SubmissionReview | null>(null)
const score = ref<number | '' | null>(null)
const feedback = ref('')
const saving = ref(false)

watch(grading, () => {
  score.value = null
  feedback.value = ''
})

async function grade() {
  const item = grading.value
  if (!item) return

  saving.value = true
  try {
    await gradeSubmission(item.submission.id, Number(score.value), feedback.value.trim())
    toast.success('Grade Saved', item.studentName)
    grading.value = null
    await refresh()
  } catch (err) {
    toast.error('Grade Not Saved', getErrorMessage(err, 'Unable to save this grade'))
  } finally {
    saving.value = false
  }
}
</script>
