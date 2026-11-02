<template>
  <div class="flex flex-col gap-5">
    <div>
      <h1 class="text-2xl font-extrabold tracking-tight text-slate-50 sm:text-[26px] light:text-slate-900">Course Reviews</h1>
      <p class="mt-1 text-[13px] text-white/45 light:text-slate-500">Instructors' courses waiting for approval. Approving publishes the course.</p>
    </div>

    <div v-if="pending" class="h-40 animate-pulse rounded-[18px] bg-white/5 light:bg-slate-100" />
    <p v-else-if="error" class="rounded-[18px] border border-white/10 bg-white/5 px-5 py-12 text-center text-[13px] text-white/45 light:border-slate-200 light:bg-white light:text-slate-500">{{ getErrorMessage(error, 'Unable to load courses waiting for review') }}</p>
    <p v-else-if="!courses.length" class="rounded-[18px] border border-white/10 bg-white/5 px-5 py-12 text-center text-[13px] text-white/45 light:border-slate-200 light:bg-white light:text-slate-500">No courses are waiting for review.</p>

    <div v-else class="overflow-x-auto rounded-[18px] border border-white/10 bg-white/5 light:border-slate-200 light:bg-white">
      <table class="w-full min-w-180 border-collapse text-left text-[13px]">
        <thead>
          <tr class="border-b border-white/8 text-[11px] tracking-wider text-white/40 uppercase light:border-slate-200 light:text-slate-500">
            <th class="px-4 py-3 font-semibold">Course</th>
            <th class="px-4 py-3 font-semibold">Instructor</th>
            <th class="px-4 py-3 font-semibold">Lessons</th>
            <th class="px-4 py-3 text-right font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-white/6 light:divide-slate-200">
          <tr v-for="course in courses" :key="course.id">
            <td class="px-4 py-3">
              <NuxtLink :to="`/courses/${course.slug}`" class="font-semibold text-violet-300 no-underline light:text-violet-700">{{ course.title }}</NuxtLink>
              <span class="block text-xs text-white/45 light:text-slate-500">{{ course.category }} · {{ formatMoney(course.price) }}</span>
            </td>
            <td class="px-4 py-3 text-white/70 light:text-slate-600">{{ course.instructor }}</td>
            <td class="px-4 py-3 text-white/70 light:text-slate-600">{{ course.totalLessons }}</td>
            <td class="px-4 py-3 text-right whitespace-nowrap">
              <button type="button" class="cursor-pointer rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 border-violet-500/35 bg-violet-500/15 text-violet-300 hover:bg-violet-500/25 light:border-violet-200 light:bg-violet-50 light:text-violet-700" :disabled="busySlug === course.slug" @click="approve(course)">Approve</button>
              <button type="button" class="cursor-pointer rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 light:border-rose-200 light:bg-rose-50 light:text-rose-600 ml-2" :disabled="busySlug === course.slug" @click="rejecting = course">Send Back</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <Teleport to="body">
      <div v-if="rejecting" class="fixed inset-0 z-100 flex items-center justify-center bg-[#05050c]/82 p-4 backdrop-blur-xl" @click.self="rejecting = null">
        <form class="w-full max-w-120 rounded-[20px] border border-violet-500/25 bg-[#0f1019] p-5 light:border-violet-500/30 light:bg-white" role="dialog" aria-modal="true" aria-labelledby="reject-course-title" @submit.prevent="reject">
          <h2 id="reject-course-title" class="text-lg font-bold text-slate-50 light:text-slate-900">Send Back {{ rejecting.title }}</h2>
          <p class="mt-1 text-xs text-white/45 light:text-slate-500">The instructor sees this and can resubmit.</p>
          <textarea v-model="note" rows="3" required maxlength="1000" aria-label="What to change" class="w-full rounded-[10px] border border-white/10 bg-white/4 px-3.5 py-2.5 text-[13px] text-slate-100 outline-none transition-all duration-200 placeholder:text-white/30 focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/15 light:border-slate-300 light:bg-white light:text-slate-900 light:placeholder:text-slate-400 mt-3" />
          <div class="mt-3 flex justify-end gap-2">
            <button type="button" class="cursor-pointer rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 border-white/10 bg-white/5 text-white/75 hover:bg-white/9 hover:text-white light:border-slate-200 light:bg-slate-100 light:text-slate-700" @click="rejecting = null">Cancel</button>
            <button type="submit" class="cursor-pointer rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 light:border-rose-200 light:bg-rose-50 light:text-rose-600" :disabled="busySlug === rejecting.slug || !note.trim()">Send Back</button>
          </div>
        </form>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import type { Course } from '~/types'
import { useAppToast } from '~/composables/useAppToast'
import { formatMoney } from '~/composables/useCart'
import { useInstructor } from '~/composables/useInstructor'
import { getErrorMessage } from '~/utils/apiError'

definePageMeta({ requiresAdmin: true })
useHead({ title: 'Course Reviews' })

const toast = useAppToast()
const { fetchAwaitingReview, approveCourse, rejectCourse } = useInstructor()

const { data, pending, error, refresh } = await useAsyncData('course-reviews', fetchAwaitingReview, { server: false })
const courses = computed(() => data.value ?? [])

const busySlug = ref<string | null>(null)
const rejecting = ref<Course | null>(null)
const note = ref('')

async function approve(course: Course) {
  busySlug.value = course.slug
  try {
    await approveCourse(course.slug)
    toast.success('Course Approved', `${course.title} is now live.`)
    await refresh()
  } catch (err) {
    toast.error('Course Not Approved', getErrorMessage(err, 'Unable to approve this course'))
  } finally {
    busySlug.value = null
  }
}

async function reject() {
  const course = rejecting.value
  if (!course) return

  busySlug.value = course.slug
  try {
    await rejectCourse(course.slug, note.value.trim())
    toast.info('Course Sent Back', course.title)
    rejecting.value = null
    note.value = ''
    await refresh()
  } catch (err) {
    toast.error('Course Not Sent Back', getErrorMessage(err, 'Unable to send this course back'))
  } finally {
    busySlug.value = null
  }
}
</script>
