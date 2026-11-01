<template>
  <div class="flex flex-col gap-6">
    <!-- Header -->
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-extrabold tracking-tight text-slate-50 sm:text-[26px] light:text-slate-900">Student Management</h1>
        <p class="mt-1 text-[13px] text-white/45 light:text-slate-500">
          Monitor learner progress, lifetime value, and global enrollment distribution.
        </p>
      </div>

      <button
        type="button"
        class="inline-flex cursor-pointer items-center gap-1.5 rounded-[10px] border border-white/10 bg-white/5 px-4 py-2.25 text-[13px] font-medium text-white/70 transition-all enabled:hover:bg-white/9 enabled:hover:text-white disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60 light:border-slate-200 light:bg-slate-100 light:text-slate-700 light:enabled:hover:bg-slate-200 light:enabled:hover:text-slate-900"
        :disabled="isRefreshing"
        @click="handleRefresh"
      >
        <RefreshCw :size="15" :class="{ 'animate-spin': isRefreshing }" />
        <span>{{ isRefreshing ? 'Refreshing...' : 'Refresh Data' }}</span>
      </button>
    </div>

    <!-- Student Stats -->
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Total Learners"
        :value="students.length"
        format="number"
        sub="Registered academy accounts"
        :icon="Users"
        accent-color="#3b82f6"
      />
      <StatCard
        label="Active Students"
        :value="activeStudentsCount"
        format="number"
        sub="Active in last 30 days"
        :icon="UserCheck"
        accent-color="#10b981"
      />
      <StatCard
        label="Total Lifetime Spend"
        :value="totalSpent"
        format="currency"
        sub="Cumulative student purchases"
        :icon="DollarSign"
        accent-color="#8b5cf6"
      />
      <StatCard
        label="Average Enrolled"
        :value="avgCourses"
        sub="Courses per registered student"
        :icon="GraduationCap"
        accent-color="#f59e0b"
      />
    </div>

    <!-- Student Table -->
    <div v-if="pending" class="h-100 w-full animate-pulse rounded-[18px] bg-white/5 light:bg-slate-100" />
    <StudentTable v-else :students="students" @select="selectedStudentId = $event" />

    <StudentDetailModal :student-id="selectedStudentId" @close="selectedStudentId = null" />
  </div>
</template>

<script setup lang="ts">
import { Users, UserCheck, DollarSign, GraduationCap, RefreshCw } from 'lucide-vue-next'
import type { Student } from '~/types'
import StatCard from '~/components/shared/StatCard.vue'
import StudentDetailModal from '~/components/students/StudentDetailModal.vue'
import StudentTable from '~/components/students/StudentTable.vue'
import { useAppToast } from '~/composables/useAppToast'

definePageMeta({ requiresAdmin: true })

useHead({
  title: 'Student Management'
})

const { info, error } = useAppToast()
const isRefreshing = ref(false)
const selectedStudentId = ref<number | null>(null)
const { data, pending, refresh } = await useAsyncData<Student[]>(
  'students-list',
  () => $fetch(`/api/students?_t=${Date.now()}`),
  { server: false }
)

async function handleRefresh() {
  isRefreshing.value = true
  try {
    await refresh()
    info('Students Synced', `${students.value.length} learner records synced from server.`)
  } catch (err: unknown) {
    error('Refresh Failed', (err as Error).message || 'Could not refresh student data')
  } finally {
    setTimeout(() => {
      isRefreshing.value = false
    }, 600)
  }
}

const students = computed(() => data.value || [])

const activeStudentsCount = computed(() =>
  students.value.filter(s => s.status === 'active').length
)

const totalSpent = computed(() =>
  students.value.reduce((sum, s) => sum + (s.totalSpent || 0), 0)
)

const avgCourses = computed(() => {
  if (!students.value.length) return '0.0'
  const total = students.value.reduce((sum, s) => sum + (s.enrolledCourses ? s.enrolledCourses.length : 0), 0)
  return (total / students.value.length).toFixed(1)
})
</script>
