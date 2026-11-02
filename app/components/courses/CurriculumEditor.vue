<template>
  <div class="rounded-[18px] border border-white/10 bg-white/5 p-5 backdrop-blur-md sm:p-6 light:border-slate-200 light:bg-white">
    <div class="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h3 class="text-base font-bold text-slate-100 light:text-slate-900">Curriculum</h3>
        <p class="mt-0.5 text-xs text-white/40 light:text-slate-500">
          <template v-if="curriculum">
            {{ curriculum.sections.length }} sections · {{ curriculum.totalLessons }} lessons · {{ formatDuration(curriculum.totalDurationMinutes) }}
          </template>
          <template v-else>Sections and lessons learners will work through</template>
        </p>
      </div>
    </div>

    <div v-if="pending" class="flex flex-col gap-2.5">
      <div v-for="i in 2" :key="i" class="h-24 animate-pulse rounded-xl bg-white/5 light:bg-slate-100" />
    </div>

    <div v-else-if="curriculum" class="flex flex-col gap-3">
      <section
        v-for="(section, index) in curriculum.sections"
        :key="section.id"
        class="rounded-xl border border-white/8 bg-white/3 light:border-slate-200 light:bg-slate-50"
      >
        <header class="flex flex-wrap items-center gap-2 border-b border-white/6 px-3.5 py-2.5 light:border-slate-200">
          <span class="text-[11px] font-bold text-white/35 light:text-slate-400">{{ index + 1 }}</span>
          <form v-if="editingSectionId === section.id" class="flex min-w-0 flex-1 items-center gap-2" @submit.prevent="saveSectionTitle(section.id)">
            <input
              ref="sectionTitleInput"
              v-model="sectionTitleDraft"
              type="text"
              maxlength="200"
              required
              aria-label="Section title"
              :class="inputClass"
              @keydown.esc="editingSectionId = null"
            >
            <button type="submit" :class="iconButtonClass" aria-label="Save section title" :disabled="busy"><Check :size="14" /></button>
            <button type="button" :class="iconButtonClass" aria-label="Cancel" @click="editingSectionId = null"><X :size="14" /></button>
          </form>
          <template v-else>
            <span class="min-w-0 flex-1 truncate text-[13px] font-semibold text-slate-100 light:text-slate-900">{{ section.title }}</span>
            <button type="button" :class="iconButtonClass" :aria-label="`Move ${section.title} up`" :disabled="busy || index === 0" @click="moveSection(index, -1)"><ArrowUp :size="14" /></button>
            <button type="button" :class="iconButtonClass" :aria-label="`Move ${section.title} down`" :disabled="busy || index === curriculum.sections.length - 1" @click="moveSection(index, 1)"><ArrowDown :size="14" /></button>
            <button type="button" :class="iconButtonClass" :aria-label="`Rename ${section.title}`" @click="startEditSection(section)"><Pencil :size="14" /></button>
            <button type="button" :class="dangerButtonClass" :aria-label="`Delete ${section.title}`" @click="pendingDelete = { kind: 'section', id: section.id, name: section.title }"><Trash2 :size="14" /></button>
          </template>
        </header>

        <ul class="m-0 flex list-none flex-col gap-0.5 p-1.5">
          <li
            v-for="(lesson, lessonIndex) in section.lessons"
            :key="lesson.id"
            class="flex items-center gap-2 rounded-lg px-2.5 py-1.5 hover:bg-white/4 light:hover:bg-white"
          >
            <component :is="typeIcon(lesson.type)" :size="14" class="shrink-0 text-white/40 light:text-slate-400" />
            <span class="min-w-0 flex-1 truncate text-[13px] text-white/80 light:text-slate-700">{{ lesson.title }}</span>
            <span v-if="lesson.preview" class="shrink-0 rounded border border-blue-400/30 bg-blue-400/12 px-1.5 py-px text-[10px] font-semibold text-blue-300 light:border-blue-200 light:bg-blue-50 light:text-blue-700">Preview</span>
            <span class="w-12 shrink-0 text-right text-[11px] text-white/40 light:text-slate-500">{{ formatDuration(lesson.durationMinutes) }}</span>
            <button type="button" :class="iconButtonClass" :aria-label="`Move ${lesson.title} up`" :disabled="busy || lessonIndex === 0" @click="moveLesson(section, lessonIndex, -1)"><ArrowUp :size="13" /></button>
            <button type="button" :class="iconButtonClass" :aria-label="`Move ${lesson.title} down`" :disabled="busy || lessonIndex === section.lessons.length - 1" @click="moveLesson(section, lessonIndex, 1)"><ArrowDown :size="13" /></button>
            <button v-if="lesson.type === 'quiz'" type="button" :class="iconButtonClass" :aria-label="`Edit questions for ${lesson.title}`" title="Quiz questions" @click="quizLesson = lesson"><ListChecks :size="13" /></button>
            <button v-else type="button" :class="iconButtonClass" :aria-label="`Assignment for ${lesson.title}`" title="Assignment" @click="assignmentLesson = lesson"><ClipboardCheck :size="13" /></button>
            <button type="button" :class="iconButtonClass" :aria-label="`Edit ${lesson.title}`" @click="openLessonModal(section, lesson)"><Pencil :size="13" /></button>
            <button type="button" :class="dangerButtonClass" :aria-label="`Delete ${lesson.title}`" @click="pendingDelete = { kind: 'lesson', id: lesson.id, name: lesson.title }"><Trash2 :size="13" /></button>
          </li>
          <li>
            <button
              type="button"
              class="flex w-full cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-2 text-left text-xs font-semibold text-violet-300 transition-colors hover:bg-violet-500/10 light:text-violet-700 light:hover:bg-violet-50"
              @click="openLessonModal(section, null)"
            >
              <Plus :size="14" /> Add lesson
            </button>
          </li>
        </ul>
      </section>

      <form class="flex items-center gap-2" @submit.prevent="addSection">
        <input v-model="newSectionTitle" type="text" maxlength="200" placeholder="New section title" aria-label="New section title" :class="inputClass">
        <button
          type="submit"
          class="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-[10px] border border-violet-500/35 bg-violet-500/15 px-3.5 py-2 text-xs font-semibold text-violet-300 transition-all hover:bg-violet-500/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-50 light:border-violet-300 light:bg-violet-50 light:text-violet-700"
          :disabled="busy || !newSectionTitle.trim()"
        >
          <Plus :size="14" /> Add section
        </button>
      </form>
    </div>

    <p v-else class="text-[13px] text-white/45 light:text-slate-500">Unable to load the curriculum.</p>

    <QuizEditorModal :is-open="Boolean(quizLesson)" :lesson="quizLesson" @close="quizLesson = null" />
    <AssignmentEditorModal :lesson="assignmentLesson" @close="assignmentLesson = null" />

    <LessonFormModal
      :is-open="lessonModal.open"
      :lesson="lessonModal.lesson"
      :section-title="lessonModal.section?.title"
      :loading="busy"
      @close="lessonModal.open = false"
      @submit="saveLesson"
    />

    <ConfirmDeleteModal
      :is-open="Boolean(pendingDelete)"
      :title="pendingDelete?.kind === 'section' ? 'Delete Section' : 'Delete Lesson'"
      :description="pendingDelete?.kind === 'section'
        ? 'The section and every lesson in it will be removed, along with learner progress on those lessons.'
        : 'The lesson and learner progress on it will be removed.'"
      :item-name="pendingDelete?.name"
      :loading="busy"
      @close="pendingDelete = null"
      @confirm="confirmDelete"
    />
  </div>
</template>

<script setup lang="ts">
import { ArrowDown, ArrowUp, Check, ClipboardCheck, FileText, HelpCircle, ListChecks, Pencil, PlayCircle, Plus, Trash2, X } from 'lucide-vue-next'
import type { CourseSection, Curriculum, Lesson, LessonFormData, LessonType } from '~/types'
import LessonFormModal from '~/components/courses/LessonFormModal.vue'
import AssignmentEditorModal from '~/components/courses/AssignmentEditorModal.vue'
import QuizEditorModal from '~/components/courses/QuizEditorModal.vue'
import ConfirmDeleteModal from '~/components/shared/ConfirmDeleteModal.vue'
import { formatDuration, useCurriculum } from '~/composables/useCurriculum'
import { useAppToast } from '~/composables/useAppToast'
import { getErrorMessage } from '~/utils/apiError'

const props = defineProps<{ slug: string }>()

// Lesson changes alter the course's lesson and hour totals
const emit = defineEmits<{ changed: [] }>()

const quizLesson = ref<Lesson | null>(null)
const assignmentLesson = ref<Lesson | null>(null)

const api = useCurriculum()
const toast = useAppToast()

const inputClass = 'w-full min-w-0 rounded-[10px] border border-white/10 bg-white/4 px-3 py-2 text-[13px] text-slate-100 outline-none transition-all placeholder:text-white/30 focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/15 light:border-slate-300 light:bg-white light:text-slate-900 light:placeholder:text-slate-400'
const iconButtonClass = 'flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-lg text-white/45 transition-colors hover:bg-white/8 hover:text-white disabled:cursor-not-allowed disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60 light:text-slate-500 light:hover:bg-slate-200 light:hover:text-slate-900'
const dangerButtonClass = 'flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-lg text-rose-400 transition-colors hover:bg-rose-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/60 light:text-rose-600 light:hover:bg-rose-50'

const curriculum = ref<Curriculum | null>(null)
const pending = ref(true)
const busy = ref(false)
const newSectionTitle = ref('')
const editingSectionId = ref<number | null>(null)
const sectionTitleDraft = ref('')
const sectionTitleInput = ref<HTMLInputElement[] | null>(null)
const pendingDelete = ref<{ kind: 'section' | 'lesson'; id: number; name: string } | null>(null)
const lessonModal = reactive<{ open: boolean; section: CourseSection | null; lesson: Lesson | null }>({
  open: false,
  section: null,
  lesson: null
})

async function load() {
  try {
    curriculum.value = await api.fetchCurriculum(props.slug)
  } catch {
    curriculum.value = null
  } finally {
    pending.value = false
  }
}

// Runs a mutation, reloads the curriculum and reports the outcome
async function mutate(action: () => Promise<unknown>, successTitle: string, failure: string, totalsChanged = false) {
  busy.value = true
  try {
    await action()
    await load()
    if (successTitle) toast.success(successTitle)
    if (totalsChanged) emit('changed')
    return true
  } catch (err) {
    toast.error('Curriculum Update Failed', getErrorMessage(err, failure))
    return false
  } finally {
    busy.value = false
  }
}

async function addSection() {
  const title = newSectionTitle.value.trim()
  if (!title) return
  if (await mutate(() => api.createSection(props.slug, title), 'Section Added', 'Unable to create section')) {
    newSectionTitle.value = ''
  }
}

function startEditSection(section: CourseSection) {
  editingSectionId.value = section.id
  sectionTitleDraft.value = section.title
  nextTick(() => sectionTitleInput.value?.[0]?.focus())
}

async function saveSectionTitle(sectionId: number) {
  const title = sectionTitleDraft.value.trim()
  if (!title) return
  if (await mutate(() => api.updateSection(props.slug, sectionId, { title }), '', 'Unable to rename section')) {
    editingSectionId.value = null
  }
}

// Positions are stored as given (ties fall back to id order), so a move renumbers
// the whole list 0..n-1 and sends only the items whose position changed
function reorder<T extends { id: number; position: number }>(items: T[], index: number, direction: -1 | 1) {
  const ordered = [...items]
  const [moved] = ordered.splice(index, 1)
  if (!moved) return []
  ordered.splice(index + direction, 0, moved)
  return ordered
    .map((item, position) => ({ id: item.id, position, changed: item.position !== position }))
    .filter(item => item.changed)
}

function moveSection(index: number, direction: -1 | 1) {
  const updates = reorder(curriculum.value?.sections ?? [], index, direction)
  mutate(
    () => Promise.all(updates.map(u => api.updateSection(props.slug, u.id, { position: u.position }))),
    '',
    'Unable to reorder sections'
  )
}

function moveLesson(section: CourseSection, index: number, direction: -1 | 1) {
  const updates = reorder(section.lessons, index, direction)
  mutate(
    () => Promise.all(updates.map(u => api.updateLesson(props.slug, u.id, { position: u.position }))),
    '',
    'Unable to reorder lessons'
  )
}

function openLessonModal(section: CourseSection, lesson: Lesson | null) {
  lessonModal.section = section
  lessonModal.lesson = lesson
  lessonModal.open = true
}

async function saveLesson(data: LessonFormData) {
  const { section, lesson } = lessonModal
  if (!section) return
  const ok = lesson
    ? await mutate(() => api.updateLesson(props.slug, lesson.id, data), 'Lesson Updated', 'Unable to update lesson', true)
    : await mutate(() => api.createLesson(props.slug, section.id, data), 'Lesson Added', 'Unable to create lesson', true)
  if (ok) lessonModal.open = false
}

async function confirmDelete() {
  const target = pendingDelete.value
  if (!target) return
  const ok = target.kind === 'section'
    ? await mutate(() => api.deleteSection(props.slug, target.id), 'Section Deleted', 'Unable to delete section', true)
    : await mutate(() => api.deleteLesson(props.slug, target.id), 'Lesson Deleted', 'Unable to delete lesson', true)
  if (ok) pendingDelete.value = null
}

function typeIcon(type: LessonType) {
  if (type === 'article') return FileText
  if (type === 'quiz') return HelpCircle
  return PlayCircle
}

watch(() => props.slug, () => {
  pending.value = true
  load()
}, { immediate: true })
</script>
