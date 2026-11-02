<template>
  <div class="flex flex-col gap-5">
    <NuxtLink to="/instructor" class="text-[13px] font-semibold text-violet-300 no-underline light:text-violet-700">Back to My Courses</NuxtLink>

    <div v-if="pending" class="h-40 animate-pulse rounded-[18px] bg-white/5 light:bg-slate-100" />
    <p v-else-if="error || !data" class="rounded-[18px] border border-white/10 bg-white/5 px-5 py-12 text-center text-[13px] text-white/45 light:border-slate-200 light:bg-white light:text-slate-500">{{ getErrorMessage(error, 'Unable to load this course') }}</p>

    <template v-else>
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div class="min-w-0">
          <h1 class="text-2xl font-extrabold tracking-tight text-slate-50 sm:text-[26px] light:text-slate-900">{{ data.course.title }}</h1>
          <div class="mt-2"><CourseStatusBadge :status="data.course.status" /></div>
        </div>
        <button v-if="data.course.status === 'draft'" type="button" class="cursor-pointer rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 border-violet-500/40 bg-linear-to-br from-violet-600 to-indigo-600 text-white hover:from-violet-500 hover:to-indigo-500" :disabled="submitting" @click="submit">Send for Review</button>
      </div>

      <p v-if="data.reviewNote" class="rounded-xl border border-amber-400/30 bg-amber-400/10 px-3.5 py-2.5 text-xs text-amber-300 light:border-amber-200 light:bg-amber-50 light:text-amber-800">
        An admin asked for changes: {{ data.reviewNote }}
      </p>
      <p v-if="data.course.status === 'pending_review'" class="text-xs text-white/45 light:text-slate-500">This course is being reviewed. You can edit it again if it's sent back.</p>

      <CurriculumEditor v-else :slug="data.course.slug" @changed="refresh" />

      <section class="rounded-[18px] border border-white/10 bg-white/5 p-5 light:border-slate-200 light:bg-white">
        <h2 class="text-base font-bold text-slate-100 light:text-slate-900">Learners</h2>
        <p v-if="!students?.length" class="mt-2 text-xs text-white/45 light:text-slate-500">Nobody has joined yet.</p>
        <ul v-else class="m-0 mt-3 flex list-none flex-col gap-2 p-0">
          <li v-for="student in students" :key="student.id" class="flex items-center gap-2.5">
            <img :src="student.avatar" :alt="student.name" class="size-8 rounded-full bg-white/5">
            <span class="min-w-0 flex-1 truncate text-[13px] text-slate-100 light:text-slate-900">{{ student.name }}</span>
            <span class="text-xs text-white/45 light:text-slate-500">{{ student.completed ? 'Completed' : 'In progress' }}</span>
          </li>
        </ul>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import CourseStatusBadge from '~/components/courses/CourseStatusBadge.vue'
import CurriculumEditor from '~/components/courses/CurriculumEditor.vue'
import { useAppToast } from '~/composables/useAppToast'
import { useInstructor } from '~/composables/useInstructor'
import { getErrorMessage } from '~/utils/apiError'

definePageMeta({ requiresStaff: true })

const route = useRoute()
const toast = useAppToast()
const { fetchCourse, fetchStudents, submitForReview } = useInstructor()
const slug = computed(() => String(route.params.slug))

const { data, pending, error, refresh } = await useAsyncData(() => `instructor-course-${slug.value}`, () => fetchCourse(slug.value), { server: false, watch: [slug] })
const { data: students } = await useAsyncData(() => `instructor-students-${slug.value}`, () => fetchStudents(slug.value), { server: false, watch: [slug] })

useHead({ title: computed(() => data.value?.course.title ?? 'Course') })

const submitting = ref(false)

async function submit() {
  submitting.value = true
  try {
    data.value = await submitForReview(slug.value)
    toast.success('Sent for Review', 'You\'ll be notified when an admin has reviewed it.')
  } catch (err) {
    toast.error('Not Sent', getErrorMessage(err, 'Unable to send this course for review'))
  } finally {
    submitting.value = false
  }
}
</script>
