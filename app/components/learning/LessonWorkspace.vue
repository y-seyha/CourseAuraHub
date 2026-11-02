<template>
  <section class="rounded-[18px] border border-white/10 bg-white/5 p-5 light:border-slate-200 light:bg-white">
    <div class="flex gap-1 border-b border-white/8 pb-3 light:border-slate-200" role="tablist">
      <button
        v-for="item in tabs"
        :key="item.value"
        type="button"
        role="tab"
        :aria-selected="tab === item.value"
        class="cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors"
        :class="tab === item.value ? 'bg-violet-600 text-white' : 'text-white/60 hover:text-white light:text-slate-600 light:hover:text-slate-900'"
        @click="tab = item.value"
      >
        {{ t(item.label) }}
      </button>
    </div>

    <!-- Assignment -->
    <div v-if="tab === 'assignment' && assignment" class="mt-4 flex flex-col gap-3">
      <p class="whitespace-pre-line text-[13px] text-slate-100 light:text-slate-900">{{ assignment.instructions }}</p>
      <p class="text-xs text-white/45 light:text-slate-500">
        {{ t('Pass score: {score}/100', { score: assignment.passScore }) }}
        <template v-if="assignment.required"> · {{ t('Needed to complete this lesson') }}</template>
      </p>

      <div v-if="assignment.submission" class="rounded-xl border border-white/8 bg-white/3 p-3 light:border-slate-200 light:bg-slate-50">
        <p class="text-xs font-semibold text-[13px] text-slate-100 light:text-slate-900">
          <template v-if="assignment.submission.status === 'SUBMITTED'">{{ t('Waiting for grading') }}</template>
          <template v-else>{{ assignment.submission.passed ? t('Passed') : t('Not passed yet') }}: {{ assignment.submission.score }}/100</template>
        </p>
        <p v-if="assignment.submission.feedback" class="mt-1 whitespace-pre-line text-xs text-white/45 light:text-slate-500">{{ assignment.submission.feedback }}</p>
        <a v-if="assignment.submission.fileUrl" :href="assignment.submission.fileUrl" target="_blank" rel="noopener noreferrer" class="mt-1 inline-block text-xs font-semibold text-violet-300 light:text-violet-700">
          {{ assignment.submission.fileName || t('Your file') }}
        </a>
      </div>

      <form v-if="!assignment.submission?.passed" class="flex flex-col gap-2.5" @submit.prevent="submitWork">
        <textarea v-model="workComment" rows="3" maxlength="4000" :placeholder="t('Add a comment')" :aria-label="t('Add a comment')" class="w-full rounded-[10px] border border-white/10 bg-white/4 px-3.5 py-2.5 text-[13px] text-slate-100 outline-none transition-all duration-200 placeholder:text-white/30 focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/15 light:border-slate-300 light:bg-white light:text-slate-900 light:placeholder:text-slate-400" />
        <div class="flex flex-wrap items-center gap-2">
          <FileUploadButton v-model:busy="uploading" purpose="ASSIGNMENT_SUBMISSION" accept="application/pdf,image/jpeg,image/png" label="Attach a file" @uploaded="workFile = $event" />
          <span v-if="workFile" class="text-xs text-white/45 light:text-slate-500">{{ workFile.fileName }}</span>
          <button type="submit" class="cursor-pointer rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 border-violet-500/40 bg-linear-to-br from-violet-600 to-indigo-600 text-white hover:from-violet-500 hover:to-indigo-500 ml-auto" :disabled="working || uploading || (!workFile && !workComment.trim())">{{ assignment.submission ? t('Resubmit') : t('Submit') }}</button>
        </div>
      </form>
    </div>

    <!-- Q&A -->
    <div v-else-if="tab === 'questions'" class="mt-4 flex flex-col gap-3">
      <form class="flex items-start gap-2" @submit.prevent="ask">
        <textarea v-model="newQuestion" rows="2" maxlength="4000" :placeholder="t('Ask a question about this lesson')" :aria-label="t('Ask a question about this lesson')" class="w-full rounded-[10px] border border-white/10 bg-white/4 px-3.5 py-2.5 text-[13px] text-slate-100 outline-none transition-all duration-200 placeholder:text-white/30 focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/15 light:border-slate-300 light:bg-white light:text-slate-900 light:placeholder:text-slate-400" />
        <button type="submit" class="cursor-pointer rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 border-violet-500/40 bg-linear-to-br from-violet-600 to-indigo-600 text-white hover:from-violet-500 hover:to-indigo-500 shrink-0" :disabled="working || !newQuestion.trim()">{{ t('Ask') }}</button>
      </form>
      <p v-if="error" class="text-[13px] text-rose-400">{{ error }}</p>
      <p v-else-if="!questions.length" class="text-xs text-white/45 light:text-slate-500">{{ t('No questions yet.') }}</p>

      <article v-for="question in questions" :key="question.id" class="rounded-xl border border-white/8 bg-white/3 p-3 light:border-slate-200 light:bg-slate-50">
        <div class="flex flex-wrap items-center gap-2">
          <span class="text-xs font-semibold text-[13px] text-slate-100 light:text-slate-900">{{ question.authorName }}</span>
          <span class="text-xs text-white/45 light:text-slate-500">{{ formatTimeAgo(question.createdAt) }}</span>
          <span v-if="question.resolved" class="rounded-full border border-emerald-400/30 bg-emerald-400/12 px-2 py-px text-[10px] font-semibold text-emerald-400 light:border-emerald-200 light:bg-emerald-50 light:text-emerald-700">{{ t('Resolved') }}</span>
          <span v-if="question.canManage" class="ml-auto flex gap-1.5">
            <button type="button" class="cursor-pointer rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 border-white/10 bg-white/5 text-white/75 hover:bg-white/9 hover:text-white light:border-slate-200 light:bg-slate-100 light:text-slate-700" :disabled="working" @click="toggleResolved(question)">{{ question.resolved ? t('Reopen') : t('Resolve') }}</button>
            <button type="button" class="cursor-pointer rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 light:border-rose-200 light:bg-rose-50 light:text-rose-600" :disabled="working" @click="removeQuestion(question)">{{ t('Delete') }}</button>
          </span>
        </div>
        <p class="mt-1.5 whitespace-pre-line text-[13px] text-slate-100 light:text-slate-900">{{ question.body }}</p>

        <ul class="m-0 mt-2 flex list-none flex-col gap-2 border-l-2 border-white/10 p-0 pl-3 light:border-slate-200">
          <li v-for="answer in question.answers" :key="answer.id">
            <div class="flex flex-wrap items-center gap-2">
              <span class="text-xs font-semibold text-[13px] text-slate-100 light:text-slate-900">{{ answer.authorName }}</span>
              <span v-if="answer.fromStaff" class="rounded-full border border-violet-500/30 bg-violet-500/15 px-2 py-px text-[10px] font-semibold text-violet-300 light:border-violet-200 light:bg-violet-50 light:text-violet-700">{{ t('Staff') }}</span>
              <span class="text-xs text-white/45 light:text-slate-500">{{ formatTimeAgo(answer.createdAt) }}</span>
              <button v-if="answer.canDelete" type="button" class="ml-auto cursor-pointer text-[11px] font-semibold text-rose-400" :disabled="working" @click="removeAnswer(question, answer.id)">{{ t('Delete') }}</button>
            </div>
            <p class="mt-0.5 whitespace-pre-line text-[13px] text-slate-100 light:text-slate-900">{{ answer.body }}</p>
          </li>
        </ul>

        <form class="mt-2 flex items-center gap-2" @submit.prevent="reply(question)">
          <input v-model="replies[question.id]" type="text" maxlength="4000" :placeholder="t('Write a reply')" :aria-label="t('Write a reply')" class="w-full rounded-[10px] border border-white/10 bg-white/4 px-3.5 py-2.5 text-[13px] text-slate-100 outline-none transition-all duration-200 placeholder:text-white/30 focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/15 light:border-slate-300 light:bg-white light:text-slate-900 light:placeholder:text-slate-400">
          <button type="submit" class="cursor-pointer rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 border-white/10 bg-white/5 text-white/75 hover:bg-white/9 hover:text-white light:border-slate-200 light:bg-slate-100 light:text-slate-700 shrink-0" :disabled="working || !replies[question.id]?.trim()">{{ t('Reply') }}</button>
        </form>
      </article>
    </div>

    <!-- Notes -->
    <div v-else-if="tab === 'notes'" class="mt-4 flex flex-col gap-3">
      <form class="flex flex-col gap-2" @submit.prevent="saveNote">
        <textarea v-model="newNote" rows="2" maxlength="4000" :placeholder="t('Write a private note')" :aria-label="t('Write a private note')" class="w-full rounded-[10px] border border-white/10 bg-white/4 px-3.5 py-2.5 text-[13px] text-slate-100 outline-none transition-all duration-200 placeholder:text-white/30 focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/15 light:border-slate-300 light:bg-white light:text-slate-900 light:placeholder:text-slate-400" />
        <div class="flex flex-wrap items-center justify-end gap-2">
          <button v-if="positionSeconds !== null" type="button" class="cursor-pointer rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 border-white/10 bg-white/5 text-white/75 hover:bg-white/9 hover:text-white light:border-slate-200 light:bg-slate-100 light:text-slate-700" :disabled="working" @click="bookmark">{{ t('Bookmark {time}', { time: formatPosition(positionSeconds) }) }}</button>
          <button type="submit" class="cursor-pointer rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 border-violet-500/40 bg-linear-to-br from-violet-600 to-indigo-600 text-white hover:from-violet-500 hover:to-indigo-500" :disabled="working || !newNote.trim()">{{ t('Save note') }}</button>
        </div>
      </form>
      <p v-if="error" class="text-[13px] text-rose-400">{{ error }}</p>
      <p v-else-if="!notes.length" class="text-xs text-white/45 light:text-slate-500">{{ t('No notes yet. Only you can see these.') }}</p>
      <article v-for="note in notes" :key="note.id" class="flex items-start gap-2 rounded-xl border border-white/8 bg-white/3 p-3 light:border-slate-200 light:bg-slate-50">
        <button v-if="note.positionSeconds !== null" type="button" class="cursor-pointer rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 border-violet-500/35 bg-violet-500/15 text-violet-300 hover:bg-violet-500/25 light:border-violet-200 light:bg-violet-50 light:text-violet-700 shrink-0 font-mono" @click="$emit('seek', note.positionSeconds)">{{ formatPosition(note.positionSeconds) }}</button>
        <p class="min-w-0 flex-1 whitespace-pre-line text-[13px] text-slate-100 light:text-slate-900">{{ note.body || t('Bookmark') }}</p>
        <button type="button" class="shrink-0 cursor-pointer text-[11px] font-semibold text-rose-400" :disabled="working" @click="removeNote(note.id)">{{ t('Delete') }}</button>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { Assignment, LessonNote, LessonQuestion, StoredFile } from '~/types'
import FileUploadButton from '~/components/shared/FileUploadButton.vue'
import { useAppToast } from '~/composables/useAppToast'
import { formatPosition } from '~/composables/useCurriculum'
import { useLessonTools } from '~/composables/useLessonTools'
import { getErrorMessage } from '~/utils/apiError'
import { formatTimeAgo } from '~/utils/dateTime'

const props = defineProps<{
  lessonId: number
  // Null when the player can't report a position, such as YouTube
  positionSeconds: number | null
  // Notes and submissions belong to learners; staff only join the discussion
  enrolled: boolean
}>()

defineEmits<{ seek: [seconds: number] }>()

const { t } = useT()
const toast = useAppToast()
const api = useLessonTools()

const tab = ref<'questions' | 'notes' | 'assignment'>('questions')
const questions = ref<LessonQuestion[]>([])
const notes = ref<LessonNote[]>([])
const assignment = ref<Assignment | null>(null)
const error = ref('')
const working = ref(false)
const uploading = ref(false)
const newQuestion = ref('')
const newNote = ref('')
const replies = reactive<Record<number, string>>({})
const workComment = ref('')
const workFile = ref<StoredFile | null>(null)

const tabs = computed(() => [
  { value: 'questions' as const, label: 'Questions' },
  ...(props.enrolled ? [{ value: 'notes' as const, label: 'Notes' }] : []),
  ...(assignment.value ? [{ value: 'assignment' as const, label: 'Assignment' }] : [])
])

// The parent keys this component by lesson, so this runs once per lesson
onMounted(async () => {
  try {
    const [loadedQuestions, loadedNotes, loadedAssignment] = await Promise.all([
      api.fetchQuestions(props.lessonId),
      props.enrolled ? api.fetchNotes(props.lessonId) : Promise.resolve([]),
      api.fetchAssignment(props.lessonId)
    ])
    questions.value = loadedQuestions
    notes.value = loadedNotes
    assignment.value = loadedAssignment
  } catch (err) {
    error.value = getErrorMessage(err, t('Unable to load this lesson\'s discussion'))
  }
})

async function act(action: () => Promise<void>, failure: string) {
  working.value = true
  try {
    await action()
  } catch (err) {
    toast.error(t(failure), getErrorMessage(err, t('Please try again.')))
  } finally {
    working.value = false
  }
}

function ask() {
  return act(async () => {
    questions.value.unshift(await api.askQuestion(props.lessonId, newQuestion.value.trim()))
    newQuestion.value = ''
  }, 'Question not posted')
}

function reply(question: LessonQuestion) {
  return act(async () => {
    question.answers.push(await api.answerQuestion(question.id, (replies[question.id] ?? '').trim()))
    replies[question.id] = ''
  }, 'Reply not posted')
}

function toggleResolved(question: LessonQuestion) {
  return act(async () => {
    question.resolved = (await api.setResolved(question.id, !question.resolved)).resolved
  }, 'Question not updated')
}

function removeQuestion(question: LessonQuestion) {
  return act(async () => {
    await api.deleteQuestion(question.id)
    questions.value = questions.value.filter(item => item.id !== question.id)
  }, 'Question not deleted')
}

function removeAnswer(question: LessonQuestion, answerId: number) {
  return act(async () => {
    await api.deleteAnswer(answerId)
    question.answers = question.answers.filter(item => item.id !== answerId)
  }, 'Reply not deleted')
}

function saveNote() {
  return act(async () => {
    notes.value.unshift(await api.addNote(props.lessonId, { body: newNote.value.trim(), positionSeconds: props.positionSeconds ?? undefined }))
    newNote.value = ''
  }, 'Note not saved')
}

function bookmark() {
  return act(async () => {
    notes.value.unshift(await api.addNote(props.lessonId, { positionSeconds: props.positionSeconds ?? undefined }))
  }, 'Bookmark not saved')
}

function removeNote(id: number) {
  return act(async () => {
    await api.deleteNote(id)
    notes.value = notes.value.filter(note => note.id !== id)
  }, 'Note not deleted')
}

function submitWork() {
  return act(async () => {
    assignment.value = await api.submitAssignment(props.lessonId, {
      fileUrl: workFile.value?.url,
      fileName: workFile.value?.fileName,
      comment: workComment.value.trim() || undefined
    })
    workFile.value = null
    workComment.value = ''
    toast.success(t('Work submitted'), t('You\'ll be notified when it\'s graded.'))
  }, 'Work not submitted')
}
</script>
