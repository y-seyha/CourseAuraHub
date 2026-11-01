<template>
  <div class="flex flex-col gap-6">
    <div>
      <h1 class="text-2xl font-extrabold tracking-tight text-slate-50 sm:text-[26px] light:text-slate-900">Enrollments</h1>
      <p class="mt-1 text-[13px] text-white/45 light:text-slate-500">Give a learner access to a course, or take it away. Showing the latest 100.</p>
    </div>

    <form class="grid grid-cols-1 items-end gap-3.5 rounded-[18px] border border-white/10 bg-white/5 p-5 md:grid-cols-[1fr_1fr_130px_auto] light:border-slate-200 light:bg-white" @submit.prevent="handleCreate">
      <div class="flex min-w-0 flex-col gap-1.5">
        <label :class="labelClass" for="enrollment-student">Student</label>
        <AppDropdown id="enrollment-student" v-model="form.studentId" :options="studentOptions" placeholder="Choose a student" />
      </div>
      <div class="flex min-w-0 flex-col gap-1.5">
        <label :class="labelClass" for="enrollment-course">Course</label>
        <AppDropdown id="enrollment-course" v-model="form.courseId" :options="courseOptions" placeholder="Choose a course" />
      </div>
      <div class="flex min-w-0 flex-col gap-1.5">
        <label :class="labelClass" for="enrollment-amount">Amount ($)</label>
        <input id="enrollment-amount" v-model.number="form.amount" type="number" min="0" step="0.01" class="w-full rounded-[10px] border border-white/10 bg-white/4 px-3.5 py-2.5 text-[13px] text-slate-100 outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/15 light:border-slate-300 light:bg-white light:text-slate-900">
      </div>
      <button type="submit" class="inline-flex cursor-pointer items-center justify-center gap-2 rounded-[10px] border border-violet-500/40 bg-linear-to-br from-violet-600 to-indigo-600 px-5 py-2.5 text-[13px] font-semibold text-white transition-all hover:from-violet-500 hover:to-indigo-500 disabled:cursor-not-allowed disabled:opacity-50" :disabled="!canCreate">
        <Loader2 v-if="creating" :size="16" class="animate-spin" />
        Enroll
      </button>
    </form>

    <div v-if="pending" class="flex flex-col gap-3">
      <div v-for="i in 3" :key="i" class="h-14 animate-pulse rounded-[14px] bg-white/5 light:bg-slate-100" />
    </div>

    <div v-else-if="error" class="rounded-[20px] border border-white/10 bg-white/5 px-5 py-12 text-center light:border-slate-200 light:bg-white">
      <AlertCircle :size="36" class="mx-auto text-rose-400" />
      <p class="mt-3 text-[13px] text-white/50 light:text-slate-500">{{ getErrorMessage(error, 'Unable to load enrollments') }}</p>
    </div>

    <p v-else-if="!enrollments.length" class="rounded-[20px] border border-white/10 bg-white/5 px-5 py-12 text-center text-[13px] text-white/45 light:border-slate-200 light:bg-white light:text-slate-500">No enrollments yet.</p>

    <div v-else class="overflow-x-auto rounded-[18px] border border-white/10 bg-white/5 backdrop-blur-md light:border-slate-200 light:bg-white">
      <table class="w-full min-w-160 border-collapse text-left text-[13px]">
        <thead>
          <tr class="border-b border-white/8 text-[11px] tracking-wider text-white/40 uppercase light:border-slate-200 light:text-slate-500">
            <th class="px-4 py-3 font-semibold">Student</th>
            <th class="px-4 py-3 font-semibold">Course</th>
            <th class="px-4 py-3 font-semibold">Date</th>
            <th class="px-4 py-3 font-semibold">Amount</th>
            <th class="px-4 py-3 text-right font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-white/6 light:divide-slate-200">
          <tr v-for="item in enrollments" :key="item.id" class="transition-colors hover:bg-white/3 light:hover:bg-slate-50">
            <td class="px-4 py-3 font-semibold text-slate-100 light:text-slate-900">{{ item.studentName }}</td>
            <td class="px-4 py-3">
              <NuxtLink :to="`/courses/${item.courseSlug}`" class="text-white/70 no-underline hover:text-violet-300 light:text-slate-600 light:hover:text-violet-700">{{ item.courseTitle }}</NuxtLink>
            </td>
            <td class="px-4 py-3 whitespace-nowrap text-white/50 light:text-slate-500">{{ item.enrolledAt }}</td>
            <td class="px-4 py-3 font-semibold text-emerald-400 light:text-emerald-700">${{ Number(item.amount).toFixed(2) }}</td>
            <td class="px-4 py-3 text-right">
              <button type="button" class="cursor-pointer rounded-lg border border-rose-500/30 bg-rose-500/10 px-2.5 py-1.5 text-xs font-semibold text-rose-400 transition-colors hover:bg-rose-500/20 light:border-rose-200 light:bg-rose-50 light:text-rose-600" @click="pendingDelete = item">
                Remove
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <ConfirmDeleteModal
      :is-open="pendingDelete !== null"
      title="Remove Enrollment"
      description="The learner loses access to this course, and its revenue totals are reduced. Use a refund instead if they paid through checkout."
      :item-name="pendingDelete ? `${pendingDelete.studentName} — ${pendingDelete.courseTitle}` : ''"
      :loading="deleting"
      @close="pendingDelete = null"
      @confirm="handleDelete"
    />
  </div>
</template>

<script setup lang="ts">
import { AlertCircle, Loader2 } from 'lucide-vue-next'
import type { Course, Enrollment, Student } from '~/types'
import AppDropdown from '~/components/shared/AppDropdown.vue'
import ConfirmDeleteModal from '~/components/shared/ConfirmDeleteModal.vue'
import { useAppToast } from '~/composables/useAppToast'
import { useStudentAdmin } from '~/composables/useStudentAdmin'
import { getErrorMessage } from '~/utils/apiError'

definePageMeta({ requiresAdmin: true })
useHead({ title: 'Enrollments' })

const toast = useAppToast()
const { fetchEnrollments, createEnrollment, deleteEnrollment } = useStudentAdmin()

const labelClass = 'text-[11px] font-semibold tracking-wider text-white/60 uppercase light:text-slate-600'

const { data, pending, error, refresh } = await useAsyncData<Enrollment[]>('admin-enrollments', () => fetchEnrollments(), { server: false })
const { data: students } = await useAsyncData<Student[]>('enrollment-students', () => $fetch('/api/students'), { server: false })
const { data: courses } = await useAsyncData<Course[]>('enrollment-courses', () => $fetch('/api/courses'), { server: false })

const enrollments = computed(() => data.value ?? [])
const studentOptions = computed(() => (students.value ?? []).map(s => ({ value: s.id, label: `${s.name} (${s.email})` })))
const courseOptions = computed(() => (courses.value ?? []).map(c => ({ value: c.id, label: c.title })))

// Defaults to a free grant, so a manual enrollment never adds revenue by accident
const form = reactive({ studentId: 0, courseId: 0, amount: 0 })
const creating = ref(false)
const deleting = ref(false)
const pendingDelete = ref<Enrollment | null>(null)

const canCreate = computed(() => Boolean(form.studentId && form.courseId) && Number(form.amount) >= 0 && !creating.value)

async function handleCreate() {
  creating.value = true
  try {
    const created = await createEnrollment({ ...form, amount: Number(form.amount) || 0 })
    toast.success('Student Enrolled', `${created.studentName} can now open ${created.courseTitle}.`)
    form.courseId = 0
    form.amount = 0
    await refresh()
  } catch (err) {
    toast.error('Enrollment Failed', getErrorMessage(err, 'Unable to enroll this student'))
  } finally {
    creating.value = false
  }
}

async function handleDelete() {
  const target = pendingDelete.value
  if (!target) return

  deleting.value = true
  try {
    await deleteEnrollment(target.id)
    toast.success('Enrollment Removed')
    pendingDelete.value = null
    await refresh()
  } catch (err) {
    toast.error('Enrollment Not Removed', getErrorMessage(err, 'Unable to remove this enrollment'))
  } finally {
    deleting.value = false
  }
}
</script>
