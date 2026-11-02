<template>
  <div class="flex flex-col gap-5">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-extrabold tracking-tight text-slate-50 sm:text-[26px] light:text-slate-900">My Courses</h1>
        <p class="mt-1 text-[13px] text-white/45 light:text-slate-500">Build your courses, then send them for review to go live.</p>
      </div>
      <button type="button" class="cursor-pointer rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 border-violet-500/40 bg-linear-to-br from-violet-600 to-indigo-600 text-white hover:from-violet-500 hover:to-indigo-500" @click="openForm(null)">New Course</button>
    </div>

    <div v-if="summary" class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <div v-for="stat in stats" :key="stat.label" class="rounded-[18px] border border-white/10 bg-white/5 p-5 light:border-slate-200 light:bg-white">
        <p class="text-xs text-white/45 light:text-slate-500">{{ stat.label }}</p>
        <p class="mt-1 text-xl font-extrabold text-slate-50 light:text-slate-900">{{ stat.value }}</p>
      </div>
    </div>

    <div v-if="pending" class="h-40 animate-pulse rounded-[18px] bg-white/5 light:bg-slate-100" />
    <p v-else-if="error" class="rounded-[18px] border border-white/10 bg-white/5 px-5 py-12 text-center text-[13px] text-white/45 light:border-slate-200 light:bg-white light:text-slate-500">{{ getErrorMessage(error, 'Unable to load your courses') }}</p>
    <p v-else-if="!items.length" class="rounded-[18px] border border-white/10 bg-white/5 px-5 py-12 text-center text-[13px] text-white/45 light:border-slate-200 light:bg-white light:text-slate-500">No courses yet. Create your first one.</p>

    <div v-else class="overflow-x-auto rounded-[18px] border border-white/10 bg-white/5 light:border-slate-200 light:bg-white">
      <table class="w-full min-w-200 border-collapse text-left text-[13px]">
        <thead>
          <tr class="border-b border-white/8 text-[11px] tracking-wider text-white/40 uppercase light:border-slate-200 light:text-slate-500">
            <th class="px-4 py-3 font-semibold">Course</th>
            <th class="px-4 py-3 font-semibold">Status</th>
            <th class="px-4 py-3 font-semibold">Students</th>
            <th class="px-4 py-3 font-semibold">Revenue</th>
            <th class="px-4 py-3 text-right font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-white/6 light:divide-slate-200">
          <tr v-for="item in items" :key="item.course.id">
            <td class="px-4 py-3">
              <NuxtLink :to="`/instructor/courses/${item.course.slug}`" class="font-semibold text-violet-300 no-underline light:text-violet-700">{{ item.course.title }}</NuxtLink>
              <span v-if="item.reviewNote" class="mt-0.5 block max-w-96 text-xs text-amber-400 light:text-amber-700">Needs changes: {{ item.reviewNote }}</span>
            </td>
            <td class="px-4 py-3"><CourseStatusBadge :status="item.course.status" /></td>
            <td class="px-4 py-3 text-white/70 light:text-slate-600">{{ item.course.totalStudents }}</td>
            <td class="px-4 py-3 text-white/70 light:text-slate-600">{{ formatMoney(item.course.revenue) }}</td>
            <td class="px-4 py-3 text-right whitespace-nowrap">
              <button v-if="item.course.status !== 'pending_review'" type="button" class="cursor-pointer rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 border-white/10 bg-white/5 text-white/75 hover:bg-white/9 hover:text-white light:border-slate-200 light:bg-slate-100 light:text-slate-700" @click="openForm(item.course)">Edit</button>
              <button v-if="item.course.status === 'draft' && !item.course.totalStudents" type="button" class="cursor-pointer rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 light:border-rose-200 light:bg-rose-50 light:text-rose-600 ml-2" @click="pendingDelete = item.course">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <CourseFormModal :is-open="formOpen" :course="editing" :loading="saving" instructor-mode @close="formOpen = false" @submit="save" />
    <ConfirmDeleteModal
      :is-open="pendingDelete !== null"
      title="Delete Course"
      description="This draft and its lessons will be removed."
      :item-name="pendingDelete?.title"
      :loading="saving"
      @close="pendingDelete = null"
      @confirm="confirmDelete"
    />
  </div>
</template>

<script setup lang="ts">
import type { Course, CourseFormData } from '~/types'
import CourseFormModal from '~/components/courses/CourseFormModal.vue'
import CourseStatusBadge from '~/components/courses/CourseStatusBadge.vue'
import ConfirmDeleteModal from '~/components/shared/ConfirmDeleteModal.vue'
import { useAppToast } from '~/composables/useAppToast'
import { formatMoney } from '~/composables/useCart'
import { useInstructor } from '~/composables/useInstructor'
import { getErrorMessage } from '~/utils/apiError'

definePageMeta({ requiresStaff: true })
useHead({ title: 'My Courses' })

const toast = useAppToast()
const { fetchSummary, fetchCourses, createCourse, updateCourse, deleteCourse } = useInstructor()

const { data, pending, error, refresh } = await useAsyncData('instructor-courses', fetchCourses, { server: false })
const { data: summary, refresh: refreshSummary } = await useAsyncData('instructor-summary', fetchSummary, { server: false })
const items = computed(() => data.value ?? [])

const stats = computed(() => {
  const value = summary.value
  if (!value) return []
  return [
    { label: 'Courses', value: value.courses },
    { label: 'Live', value: value.publishedCourses },
    { label: 'Students', value: value.students },
    { label: 'Revenue', value: formatMoney(value.revenue) }
  ]
})

const formOpen = ref(false)
const editing = ref<Course | null>(null)
const pendingDelete = ref<Course | null>(null)
const saving = ref(false)

function openForm(course: Course | null) {
  editing.value = course
  formOpen.value = true
}

async function act(action: () => Promise<unknown>, success: string, failure: string) {
  saving.value = true
  try {
    await action()
    toast.success(success)
    await Promise.all([refresh(), refreshSummary()])
  } catch (err) {
    toast.error(failure, getErrorMessage(err, 'Please try again.'))
  } finally {
    saving.value = false
  }
}

async function save(form: CourseFormData) {
  const slug = editing.value?.slug
  await act(() => slug ? updateCourse(slug, form) : createCourse(form), 'Course Saved', 'Course Not Saved')
  formOpen.value = false
}

async function confirmDelete() {
  const course = pendingDelete.value
  if (!course) return
  await act(() => deleteCourse(course.slug), 'Course Deleted', 'Course Not Deleted')
  pendingDelete.value = null
}
</script>
