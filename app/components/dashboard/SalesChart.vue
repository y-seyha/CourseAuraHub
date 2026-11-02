<template>
  <div class="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md sm:p-6 light:border-slate-200 light:bg-white">
    <div class="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h3 class="text-base font-semibold text-slate-200 light:text-slate-900">{{ title }}</h3>
        <p class="mt-0.5 text-xs text-white/35 light:text-slate-500">{{ subtitle }}</p>
      </div>
      <div class="flex gap-1 rounded-lg border border-white/7 bg-white/4 p-0.75 light:border-slate-200 light:bg-slate-100">
        <button
          v-for="tab in ['Revenue', 'Enrollments']"
          :key="tab"
          class="cursor-pointer rounded-md border border-transparent px-3.5 py-1.25 text-xs font-medium text-white/45 transition-all hover:text-white/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60 light:text-slate-500 light:hover:text-slate-700"
          :class="{ 'border-violet-500/30 bg-violet-500/25 text-violet-300 light:border-violet-200 light:bg-violet-100 light:text-violet-700': activeTab === tab }"
          @click="activeTab = tab"
        >
          {{ tab }}
        </button>
      </div>
    </div>
    <div class="relative h-65">
      <Line v-if="chartData" :data="chartData" :options="chartOptions" />
      <div v-else class="h-62.5 animate-pulse rounded-lg bg-white/5 light:bg-slate-100" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ChartOptions } from 'chart.js'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { Line } from 'vue-chartjs'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

const props = defineProps<{
  title: string
  subtitle?: string
  months: string[]
  monthlyRevenue: number[]
  monthlyEnrollments: number[]
}>()

const activeTab = ref('Revenue')
const colorMode = useColorMode()
const isDark = computed(() => colorMode.value === 'dark')

const chartData = computed(() => {
  if (!props.months?.length) return null
  const isRevenue = activeTab.value === 'Revenue'
  return {
    labels: props.months,
    datasets: [
      {
        label: isRevenue ? 'Revenue ($)' : 'Enrollments',
        data: isRevenue ? props.monthlyRevenue : props.monthlyEnrollments,
        borderColor: isRevenue ? '#7c3aed' : '#2563eb',
        backgroundColor: isRevenue
          ? 'rgba(124, 58, 237, 0.12)'
          : 'rgba(37, 99, 235, 0.12)',
        borderWidth: 2.5,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: isRevenue ? '#7c3aed' : '#2563eb',
        pointBorderColor: isDark.value ? '#0a0a0f' : '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  }
})

const chartOptions = computed<ChartOptions<'line'>>(() => {
  const gridColor = isDark.value ? 'rgba(255,255,255,0.04)' : 'rgba(15,23,42,0.06)'
  const tickColor = isDark.value ? 'rgba(255,255,255,0.35)' : 'rgba(71,85,105,0.85)'
  const borderColor = isDark.value ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.08)'

  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: isDark.value ? 'rgba(15, 15, 30, 0.95)' : 'rgba(255, 255, 255, 0.97)',
        borderColor: isDark.value ? 'rgba(255, 255, 255, 0.1)' : 'rgba(15, 23, 42, 0.1)',
        borderWidth: 1,
        titleColor: isDark.value ? '#e2e8f0' : '#0f172a',
        bodyColor: isDark.value ? 'rgba(255,255,255,0.65)' : 'rgba(51,65,85,0.9)',
        padding: 12,
        cornerRadius: 10,
        callbacks: {
          label: (ctx) => {
            const v = ctx.parsed.y ?? 0
            return activeTab.value === 'Revenue' ? `  $${v.toLocaleString()}` : `  ${v.toLocaleString()} students`
          },
        },
      },
    },
    scales: {
      x: {
        grid: { color: gridColor },
        ticks: { color: tickColor, font: { size: 11 } },
        border: { color: borderColor },
      },
      y: {
        grid: { color: gridColor },
        ticks: {
          color: tickColor,
          font: { size: 11 },
          callback: (value) => { const v = Number(value); return activeTab.value === 'Revenue' ? `$${(v / 1000).toFixed(0)}K` : v },
        },
        border: { color: borderColor },
      },
    },
  }
})
</script>
