<template>
  <p v-if="!transactions.length" class="py-6 text-center text-[13px] text-white/45 light:text-slate-500">{{ t('No transactions yet.') }}</p>
  <ul v-else class="m-0 flex list-none flex-col p-0">
    <li v-for="item in transactions" :key="item.id" class="flex items-center justify-between gap-4 border-b border-white/6 py-3 last:border-b-0 light:border-slate-100">
      <div class="min-w-0">
        <p class="text-[13px] font-semibold text-slate-100 light:text-slate-900">{{ t(TRANSACTION_LABELS[item.type]) }}</p>
        <p v-if="item.note" class="truncate text-xs text-white/50 light:text-slate-500">{{ item.note }}</p>
        <p class="text-[11px] text-white/35 light:text-slate-400">{{ formatDateTime(item.createdAt) }}</p>
      </div>
      <div class="shrink-0 text-right">
        <p class="text-[13px] font-bold" :class="isCredit(item.type) ? 'text-emerald-400 light:text-emerald-700' : 'text-rose-400 light:text-rose-600'">
          {{ isCredit(item.type) ? '+' : '-' }}{{ formatMoney(item.amount, currency) }}
        </p>
        <p class="text-[11px] text-white/35 light:text-slate-400">{{ t('Balance {amount}', { amount: formatMoney(item.balanceAfter, currency) }) }}</p>
      </div>
    </li>
  </ul>
</template>

<script setup lang="ts">
import type { MemberCardTransaction } from '~/types'
import { formatMoney } from '~/composables/useCart'
import { isCredit, TRANSACTION_LABELS } from '~/composables/useMemberCard'
import { useT } from '~/composables/useT'
import { formatDateTime } from '~/utils/dateTime'

defineProps<{
  transactions: MemberCardTransaction[]
  currency?: string
}>()

const { t } = useT()
</script>
