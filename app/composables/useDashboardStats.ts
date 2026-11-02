import type { DashboardStats } from '~/types'

export function useDashboardStats() {
  const isRefreshing = ref(false)

  const { data, pending, refresh: baseRefresh, error } = useAsyncData<DashboardStats>(
    'dashboard-stats',
    () => $fetch<DashboardStats>('/api/stats', { query: { _t: Date.now() } }),
    { server: false }
  )

  const kpis = computed(() => data.value?.kpis ?? {
    totalRevenue: 0,
    totalStudents: 0,
    totalCourses: 0,
    publishedCourses: 0,
    avgRating: 0,
    revenueGrowth: 0,
    studentGrowth: 0,
  })

  const charts = computed(() => data.value?.charts ?? {
    months: [],
    monthlyRevenue: [],
    monthlyEnrollments: [],
    revenueByCategory: {},
  })

  const topCourses = computed(() => data.value?.topCourses ?? [])
  const recentEnrollments = computed(() => data.value?.recentEnrollments ?? [])

  async function refresh() {
    isRefreshing.value = true
    try {
      await baseRefresh()
    } finally {
      setTimeout(() => {
        isRefreshing.value = false
      }, 600)
    }
  }

  return {
    kpis,
    charts,
    topCourses,
    recentEnrollments,
    pending,
    isRefreshing,
    refresh,
    error,
  }
}
