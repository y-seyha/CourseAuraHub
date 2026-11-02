<template>
  <Teleport to="body">
    <div v-if="lesson" class="fixed inset-0 z-100 flex items-center justify-center bg-[#05050c]/82 p-4 backdrop-blur-xl" @click.self="$emit('close')">
      <form class="w-full max-w-120 rounded-[20px] border border-violet-500/25 bg-[#0f1019] p-5 light:border-violet-500/30 light:bg-white" role="dialog" aria-modal="true" aria-labelledby="assignment-title" @submit.prevent="save">
        <h2 id="assignment-title" class="text-lg font-bold text-slate-50 light:text-slate-900">Assignment</h2>
        <p class="mt-0.5 truncate text-xs text-white/45 light:text-slate-500">{{ lesson.title }}</p>

        <div class="mt-4 flex flex-col gap-3">
          <div class="flex flex-col gap-1.5">
            <label class="text-[11px] font-semibold tracking-wider text-white/60 uppercase light:text-slate-600" for="assignment-instructions">Instructions</label>
            <textarea id="assignment-instructions" v-model="form.instructions" rows="5" required maxlength="5000" class="w-full rounded-[10px] border border-white/10 bg-white/4 px-3.5 py-2.5 text-[13px] text-slate-100 outline-none transition-all duration-200 placeholder:text-white/30 focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/15 light:border-slate-300 light:bg-white light:text-slate-900 light:placeholder:text-slate-400" />
          </div>
          <div class="flex flex-col gap-1.5">
            <label class="text-[11px] font-semibold tracking-wider text-white/60 uppercase light:text-slate-600" for="assignment-pass">Pass Score (0 to 100)</label>
            <input id="assignment-pass" v-model.number="form.passScore" type="number" min="0" max="100" required class="w-full rounded-[10px] border border-white/10 bg-white/4 px-3.5 py-2.5 text-[13px] text-slate-100 outline-none transition-all duration-200 placeholder:text-white/30 focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/15 light:border-slate-300 light:bg-white light:text-slate-900 light:placeholder:text-slate-400">
          </div>
          <label class="flex items-center gap-2 text-[13px] text-slate-100 light:text-slate-900">
            <input v-model="form.required" type="checkbox" class="size-4 accent-violet-600">
            Learners must pass this to complete the lesson
          </label>
        </div>

        <div class="mt-4 flex flex-wrap justify-end gap-2">
          <button v-if="exists" type="button" class="cursor-pointer rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 light:border-rose-200 light:bg-rose-50 light:text-rose-600 mr-auto" :disabled="working" @click="remove">Remove</button>
          <button type="button" class="cursor-pointer rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 border-white/10 bg-white/5 text-white/75 hover:bg-white/9 hover:text-white light:border-slate-200 light:bg-slate-100 light:text-slate-700" @click="$emit('close')">Cancel</button>
          <button type="submit" class="cursor-pointer rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 border-violet-500/40 bg-linear-to-br from-violet-600 to-indigo-600 text-white hover:from-violet-500 hover:to-indigo-500" :disabled="working || loading || !form.instructions.trim()">Save</button>
        </div>
      </form>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import type { AssignmentForm, Lesson } from '~/types'
import { useAppToast } from '~/composables/useAppToast'
import { useLessonTools } from '~/composables/useLessonTools'
import { getErrorMessage } from '~/utils/apiError'

const props = defineProps<{ lesson: Lesson | null }>()
const emit = defineEmits<{ close: [] }>()

const { fetchAssignmentForStaff, saveAssignment, removeAssignment } = useLessonTools()
const toast = useAppToast()

const form = reactive<AssignmentForm>({ instructions: '', passScore: 50, required: false })
const exists = ref(false)
const loading = ref(false)
const working = ref(false)

watch(() => props.lesson?.id, async (id) => {
  form.instructions = ''
  form.passScore = 50
  form.required = false
  exists.value = false
  if (id === undefined) return

  loading.value = true
  try {
    const assignment = await fetchAssignmentForStaff(id)
    if (assignment) {
      form.instructions = assignment.instructions
      form.passScore = assignment.passScore
      form.required = assignment.required
      exists.value = true
    }
  } catch (err) {
    toast.error('Assignment Not Loaded', getErrorMessage(err, 'Unable to load this assignment'))
  } finally {
    loading.value = false
  }
})

async function save() {
  if (!props.lesson) return
  working.value = true
  try {
    await saveAssignment(props.lesson.id, { ...form, instructions: form.instructions.trim() })
    toast.success('Assignment Saved')
    emit('close')
  } catch (err) {
    toast.error('Assignment Not Saved', getErrorMessage(err, 'Unable to save this assignment'))
  } finally {
    working.value = false
  }
}

async function remove() {
  if (!props.lesson) return
  working.value = true
  try {
    await removeAssignment(props.lesson.id)
    toast.success('Assignment Removed')
    emit('close')
  } catch (err) {
    toast.error('Assignment Not Removed', getErrorMessage(err, 'Unable to remove this assignment'))
  } finally {
    working.value = false
  }
}
</script>
