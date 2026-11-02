<template>
  <div class="flex flex-col gap-4">
    <div class="w-full sm:w-52">
      <AppDropdown v-model="days" :options="periodOptions" aria-label="Report period" />
    </div>

    <div v-if="pending" class="h-40 animate-pulse rounded-[18px] bg-white/5 light:bg-slate-100" />
    <p v-else-if="error" class="rounded-[18px] border border-white/10 bg-white/5 px-5 py-12 text-center text-[13px] text-white/45 light:border-slate-200 light:bg-white light:text-slate-500">{{ getErrorMessage(error, 'Unable to load the report') }}</p>

    <template v-else-if="report">
      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div v-for="stat in stats" :key="stat.label" class="rounded-[18px] border border-white/10 bg-white/5 p-5 light:border-slate-200 light:bg-white">
          <p class="text-xs text-white/45 light:text-slate-500">{{ stat.label }}</p>
          <p class="mt-1 text-xl font-extrabold text-slate-50 light:text-slate-900">{{ stat.value }}</p>
        </div>
      </div>
      <p class="text-xs text-white/45 light:text-slate-500">Top-ups, deductions, purchases and refunds cover the selected period. Balances and counts are current. Compare top-ups with the cash you received.</p>
    </template>
  </div>
</template>

<script setup lang="ts">
import AppDropdown from '~/components/shared/AppDropdown.vue'
import { formatMoney } from '~/composables/useCart'
import { useMemberCard } from '~/composables/useMemberCard'
import { getErrorMessage } from '~/utils/apiError'

const { fetchReport } = useMemberCard()

const periodOptions = [
  { value: 7, label: 'Last 7 Days' },
  { value: 30, label: 'Last 30 Days' },
  { value: 90, label: 'Last 90 Days' },
  { value: 365, label: 'Last Year' }
]
const days = ref(30)

const { data: report, pending, error } = await useAsyncData(
  'admin-card-report',
  () => fetchReport(Number(days.value)),
  { server: false, watch: [days] }
)

const stats = computed(() => {
  const value = report.value
  if (!value) return []
  const money = (amount: number) => formatMoney(amount, value.currency)
  return [
    { label: 'Balances Held', value: money(value.outstandingBalance) },
    { label: 'Active Cards', value: `${value.activeCards} of ${value.totalCards}` },
    { label: 'Pending Applications', value: value.pendingApplications },
    { label: 'Pending Top-Ups', value: value.pendingTopUps },
    { label: 'Topped Up', value: money(value.topUps) },
    { label: 'Spent on Courses', value: money(value.purchases) },
    { label: 'Refunded to Cards', value: money(value.refunds) },
    { label: 'Deducted by Admins', value: money(value.deductions) }
  ]
})
</script>
