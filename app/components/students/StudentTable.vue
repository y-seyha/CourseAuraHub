<template>
  <div class="rounded-[18px] border border-white/10 bg-white/5 p-5 backdrop-blur-md sm:p-6 light:border-slate-200 light:bg-white light:shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
    <!-- Controls bar -->
    <div class="mb-5 flex flex-wrap items-center justify-between gap-4">
      <div class="relative min-w-65 flex-1">
        <Search :size="16" class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-white/40 light:text-slate-400" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search by student name, email, country..."
          class="w-full rounded-[10px] border border-white/9 bg-white/4 py-2.5 pr-3.5 pl-9.5 text-[13px] text-slate-100 outline-none transition-all duration-200 placeholder:text-white/35 focus:border-violet-500/50 focus:bg-white/7 focus:ring-2 focus:ring-violet-500/15 light:border-slate-300 light:bg-white light:text-slate-900 light:placeholder:text-slate-400 light:focus:border-violet-600"
        >
      </div>

      <div class="w-full sm:w-55">
        <AppDropdown
          v-model="statusFilter"
          :options="statusOptions"
          placeholder="All Statuses"
        />
      </div>
    </div>

    <!-- Table -->
    <div class="overflow-x-auto">
      <table class="w-full border-collapse text-left text-[13px]">
        <thead>
          <tr>
            <th class="border-b border-white/8 px-3.5 py-3 text-[11px] font-semibold tracking-wider whitespace-nowrap text-white/40 uppercase light:border-slate-200 light:text-slate-500">Student</th>
            <th class="hidden border-b border-white/8 px-3.5 py-3 text-[11px] font-semibold tracking-wider whitespace-nowrap text-white/40 uppercase md:table-cell light:border-slate-200 light:text-slate-500">Country</th>
            <th class="hidden border-b border-white/8 px-3.5 py-3 text-[11px] font-semibold tracking-wider whitespace-nowrap text-white/40 uppercase sm:table-cell light:border-slate-200 light:text-slate-500">Enrolled Courses</th>
            <th class="hidden border-b border-white/8 px-3.5 py-3 text-[11px] font-semibold tracking-wider whitespace-nowrap text-white/40 uppercase lg:table-cell light:border-slate-200 light:text-slate-500">Completed</th>
            <th class="border-b border-white/8 px-3.5 py-3 text-[11px] font-semibold tracking-wider whitespace-nowrap text-white/40 uppercase light:border-slate-200 light:text-slate-500">Total Spent</th>
            <th class="border-b border-white/8 px-3.5 py-3 text-[11px] font-semibold tracking-wider whitespace-nowrap text-white/40 uppercase light:border-slate-200 light:text-slate-500">Status</th>
            <th class="hidden border-b border-white/8 px-3.5 py-3 text-[11px] font-semibold tracking-wider whitespace-nowrap text-white/40 uppercase xl:table-cell light:border-slate-200 light:text-slate-500">Joined Date</th>
            <th class="hidden border-b border-white/8 px-3.5 py-3 text-[11px] font-semibold tracking-wider whitespace-nowrap text-white/40 uppercase lg:table-cell light:border-slate-200 light:text-slate-500">Last Active</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="filteredStudents.length === 0">
            <td colspan="8" class="px-3.5 py-10 text-center text-[13px] text-white/40 light:text-slate-400">
              No students found matching your search criteria.
            </td>
          </tr>
          <tr
            v-for="student in filteredStudents"
            :key="student.id"
            class="transition-colors hover:bg-white/3 light:hover:bg-slate-50"
          >
            <!-- Student profile -->
            <td class="border-b border-white/4 px-3.5 py-3.5 text-white/80 light:border-slate-100 light:text-slate-700">
              <div class="flex items-center gap-3">
                <img :src="student.avatar" :alt="student.name" class="size-9.5 shrink-0 rounded-full border-2 border-violet-500/40 bg-violet-500/20" >
                <div class="flex flex-col">
                  <button type="button" class="cursor-pointer text-left font-semibold text-slate-50 hover:text-violet-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60 light:text-slate-900 light:hover:text-violet-700" @click="$emit('select', student.id)">{{ student.name }}</button>
                  <span class="text-[11px] text-white/40 light:text-slate-500">{{ student.email }}</span>
                </div>
              </div>
            </td>

            <!-- Country -->
            <td class="hidden border-b border-white/4 px-3.5 py-3.5 md:table-cell light:border-slate-100">
              <span class="rounded-md border border-white/8 bg-white/5 px-2 py-0.75 text-[11px] text-white/70 light:border-slate-200 light:bg-slate-100 light:text-slate-600">{{ student.country }}</span>
            </td>

            <!-- Enrolled courses count -->
            <td class="hidden border-b border-white/4 px-3.5 py-3.5 sm:table-cell light:border-slate-100">
              <span class="inline-flex items-center gap-1.25 text-xs font-medium text-white/75 light:text-slate-700">
                <BookOpen :size="13" class="text-violet-400" />
                {{ student.enrolledCourses ? student.enrolledCourses.length : 0 }} courses
              </span>
            </td>

            <!-- Completed courses count -->
            <td class="hidden border-b border-white/4 px-3.5 py-3.5 lg:table-cell light:border-slate-100">
              <span class="inline-flex items-center gap-1.25 text-xs font-medium text-white/75 light:text-slate-700">
                <CheckCircle2 :size="13" class="text-emerald-400" />
                {{ student.completedCourses ? student.completedCourses.length : 0 }} done
              </span>
            </td>

            <!-- Total spent -->
            <td class="border-b border-white/4 px-3.5 py-3.5 light:border-slate-100">
              <span class="font-bold whitespace-nowrap text-emerald-400 light:text-emerald-700">${{ student.totalSpent.toFixed(2) }}</span>
            </td>

            <!-- Status -->
            <td class="border-b border-white/4 px-3.5 py-3.5 light:border-slate-100">
              <span class="inline-flex items-center gap-1.5 rounded-full border px-2.25 py-0.75 text-[11px] font-semibold capitalize" :class="statusClass(student.status)">
                <span class="size-1.5 rounded-full" :class="dotClass(student.status)" />
                {{ student.status }}
              </span>
            </td>

            <!-- Joined -->
            <td class="hidden border-b border-white/4 px-3.5 py-3.5 xl:table-cell light:border-slate-100">
              <span class="text-xs whitespace-nowrap text-white/45 light:text-slate-500">{{ student.joinedAt }}</span>
            </td>

            <!-- Last Active -->
            <td class="hidden border-b border-white/4 px-3.5 py-3.5 lg:table-cell light:border-slate-100">
              <span class="text-xs whitespace-nowrap text-white/45 light:text-slate-500">{{ student.lastActive }}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Search, BookOpen, CheckCircle2 } from 'lucide-vue-next'
import type { Student } from '~/types'
import AppDropdown from '~/components/shared/AppDropdown.vue'

const props = defineProps<{
  students: Student[]
}>()

defineEmits<{
  (e: 'select', id: number): void
}>()

const searchQuery = ref('')
const statusFilter = ref('all')

const statusOptions = [
  { value: 'all', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' }
]

const filteredStudents = computed(() => {
  let list = props.students || []

  if (statusFilter.value !== 'all') {
    list = list.filter(s => s.status === statusFilter.value)
  }

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim()
    list = list.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      s.country.toLowerCase().includes(q)
    )
  }

  return list
})

function statusClass(status: string) {
  if (status === 'active') return 'border-emerald-400/30 bg-emerald-400/12 text-emerald-400 light:border-emerald-300 light:bg-emerald-50 light:text-emerald-700'
  return 'border-slate-400/30 bg-slate-400/12 text-slate-400 light:border-slate-300 light:bg-slate-100 light:text-slate-600'
}

function dotClass(status: string) {
  if (status === 'active') return 'bg-emerald-400 shadow-[0_0_8px_#34d399]'
  return 'bg-slate-400'
}
</script>
