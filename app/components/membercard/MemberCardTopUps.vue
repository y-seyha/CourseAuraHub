<template>
  <div class="flex flex-col gap-4">
    <div class="w-full sm:w-52">
      <AppDropdown v-model="status" :options="statusOptions" aria-label="Filter top-up requests by status" />
    </div>

    <div v-if="pending" class="h-40 animate-pulse rounded-[18px] bg-white/5 light:bg-slate-100" />
    <p v-else-if="error" class="rounded-[18px] border border-white/10 bg-white/5 px-5 py-12 text-center text-[13px] text-white/45 light:border-slate-200 light:bg-white light:text-slate-500">{{ getErrorMessage(error, 'Unable to load top-up requests') }}</p>
    <p v-else-if="!items.length" class="rounded-[18px] border border-white/10 bg-white/5 px-5 py-12 text-center text-[13px] text-white/45 light:border-slate-200 light:bg-white light:text-slate-500">No top-up requests found.</p>

    <div v-else class="overflow-x-auto rounded-[18px] border border-white/10 bg-white/5 light:border-slate-200 light:bg-white">
      <table class="w-full min-w-200 border-collapse text-left text-[13px]">
        <thead>
          <tr class="border-b border-white/8 text-[11px] tracking-wider text-white/40 uppercase light:border-slate-200 light:text-slate-500">
            <th class="px-4 py-3 font-semibold">Holder</th>
            <th class="px-4 py-3 font-semibold">Amount</th>
            <th class="px-4 py-3 font-semibold">Note</th>
            <th class="px-4 py-3 font-semibold">Status</th>
            <th class="px-4 py-3 text-right font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-white/6 light:divide-slate-200">
          <tr v-for="item in items" :key="item.id">
            <td class="px-4 py-3">
              <span class="block font-semibold text-[13px] text-slate-100 light:text-slate-900">{{ item.holderName }}</span>
              <span class="text-xs text-white/45 light:text-slate-500">{{ item.studentEmail }} · {{ formatDateTime(item.createdAt) }}</span>
            </td>
            <td class="px-4 py-3 font-semibold text-emerald-400 light:text-emerald-700">{{ formatMoney(item.amount, item.currency) }}</td>
            <td class="max-w-64 px-4 py-3 text-white/70 light:text-slate-600">
              <span class="block truncate">{{ item.note || '—' }}</span>
              <a v-if="item.receiptUrl" :href="item.receiptUrl" target="_blank" rel="noopener noreferrer" class="text-xs font-semibold text-violet-300 light:text-violet-700">{{ item.receiptName || 'Receipt' }}</a>
            </td>
            <td class="px-4 py-3">
              <span class="text-xs font-semibold capitalize text-white/70 light:text-slate-600">{{ item.status.toLowerCase() }}</span>
              <span v-if="item.reviewNote" class="block max-w-48 truncate text-xs text-white/45 light:text-slate-500">{{ item.reviewNote }}</span>
            </td>
            <td class="px-4 py-3 text-right whitespace-nowrap">
              <template v-if="item.status === 'PENDING'">
                <button type="button" class="cursor-pointer rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 border-violet-500/35 bg-violet-500/15 text-violet-300 hover:bg-violet-500/25 light:border-violet-200 light:bg-violet-50 light:text-violet-700" :disabled="busyId === item.id" @click="approve(item)">Approve</button>
                <button type="button" class="cursor-pointer rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 light:border-rose-200 light:bg-rose-50 light:text-rose-600 ml-2" :disabled="busyId === item.id" @click="rejecting = item">Reject</button>
              </template>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="totalPages > 1" class="flex items-center justify-end gap-3 text-xs text-white/45 light:text-slate-500">
      <button type="button" class="cursor-pointer font-semibold disabled:cursor-not-allowed disabled:opacity-40" :disabled="page === 0" @click="page -= 1">Previous</button>
      <span>Page {{ page + 1 }} of {{ totalPages }}</span>
      <button type="button" class="cursor-pointer font-semibold disabled:cursor-not-allowed disabled:opacity-40" :disabled="page + 1 >= totalPages" @click="page += 1">Next</button>
    </div>

    <Teleport to="body">
      <div v-if="rejecting" class="fixed inset-0 z-100 flex items-center justify-center bg-[#05050c]/82 p-4 backdrop-blur-xl" @click.self="rejecting = null">
        <form class="w-full max-w-120 rounded-[20px] border border-violet-500/25 bg-[#0f1019] p-5 light:border-violet-500/30 light:bg-white" role="dialog" aria-modal="true" aria-labelledby="reject-top-up-title" @submit.prevent="reject">
          <h2 id="reject-top-up-title" class="text-lg font-bold text-slate-50 light:text-slate-900">Reject {{ formatMoney(rejecting.amount, rejecting.currency) }}</h2>
          <p class="mt-1 text-xs text-white/45 light:text-slate-500">The learner sees this reason.</p>
          <textarea v-model="rejectNote" rows="3" required maxlength="500" aria-label="Reason" class="w-full rounded-[10px] border border-white/10 bg-white/4 px-3.5 py-2.5 text-[13px] text-slate-100 outline-none transition-all duration-200 placeholder:text-white/30 focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/15 light:border-slate-300 light:bg-white light:text-slate-900 light:placeholder:text-slate-400 mt-3" />
          <div class="mt-3 flex justify-end gap-2">
            <button type="button" class="cursor-pointer rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 border-white/10 bg-white/5 text-white/75 hover:bg-white/9 hover:text-white light:border-slate-200 light:bg-slate-100 light:text-slate-700" @click="rejecting = null">Cancel</button>
            <button type="submit" class="cursor-pointer rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 light:border-rose-200 light:bg-rose-50 light:text-rose-600" :disabled="busyId === rejecting.id || !rejectNote.trim()">Reject</button>
          </div>
        </form>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import type { MemberCardTopUp } from '~/types'
import AppDropdown from '~/components/shared/AppDropdown.vue'
import { useAppToast } from '~/composables/useAppToast'
import { formatMoney } from '~/composables/useCart'
import { useMemberCard } from '~/composables/useMemberCard'
import { getErrorMessage } from '~/utils/apiError'
import { formatDateTime } from '~/utils/dateTime'

const emit = defineEmits<{ changed: [] }>()

const toast = useAppToast()
const { fetchTopUps, approveTopUp, rejectTopUp } = useMemberCard()

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' }
]
const status = ref('')
const page = ref(0)
const busyId = ref<number | null>(null)
const rejecting = ref<MemberCardTopUp | null>(null)
const rejectNote = ref('')

const { data, pending, error, refresh } = await useAsyncData(
  'admin-top-ups',
  () => fetchTopUps(status.value, page.value),
  { server: false, watch: [status, page] }
)
const items = computed(() => data.value?.items ?? [])
const totalPages = computed(() => data.value?.totalPages ?? 0)

watch(status, () => {
  page.value = 0
})

async function approve(item: MemberCardTopUp) {
  busyId.value = item.id
  try {
    await approveTopUp(item.id)
    toast.success('Top-Up Approved', `${formatMoney(item.amount, item.currency)} was added to ${item.holderName}'s card.`)
    await refresh()
    emit('changed')
  } catch (err) {
    toast.error('Top-Up Not Approved', getErrorMessage(err, 'Unable to approve this request'))
  } finally {
    busyId.value = null
  }
}

async function reject() {
  const item = rejecting.value
  if (!item) return

  busyId.value = item.id
  try {
    await rejectTopUp(item.id, rejectNote.value.trim())
    toast.info('Top-Up Rejected', item.holderName)
    rejecting.value = null
    rejectNote.value = ''
    await refresh()
  } catch (err) {
    toast.error('Top-Up Not Rejected', getErrorMessage(err, 'Unable to reject this request'))
  } finally {
    busyId.value = null
  }
}
</script>
