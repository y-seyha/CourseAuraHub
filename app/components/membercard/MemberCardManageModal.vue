<template>
  <Teleport to="body">
    <Transition v-bind="modalFade">
      <div v-if="card" class="fixed inset-0 z-100 flex items-center justify-center bg-[#05050c]/82 p-4 backdrop-blur-xl sm:p-6" @click.self="$emit('close')">
        <div ref="dialogRef" class="max-h-[90dvh] w-full max-w-140 overflow-y-auto overscroll-contain rounded-[20px] border border-violet-500/25 bg-[#0f1019] p-5 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8),0_0_40px_rgba(124,58,237,0.15)] focus:outline-none sm:p-6 light:border-violet-500/30 light:bg-white" role="dialog" aria-modal="true" aria-labelledby="card-modal-title" tabindex="-1">
          <div class="flex items-start justify-between gap-4 border-b border-white/8 pb-4 light:border-slate-200">
            <div class="min-w-0">
              <h2 id="card-modal-title" class="truncate text-lg font-bold text-slate-50 light:text-slate-900">{{ card.holderName }}</h2>
              <p class="mt-0.5 truncate text-xs text-white/45 light:text-slate-500">{{ card.cardNumber }} · {{ card.studentEmail }}</p>
            </div>
            <button type="button" aria-label="Close" class="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-white/8 bg-white/5 text-white/50 transition-all hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60 light:border-slate-200 light:bg-slate-100 light:text-slate-500 light:hover:bg-slate-200 light:hover:text-slate-900" @click="$emit('close')">
              <X :size="18" />
            </button>
          </div>

          <div class="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p class="text-[11px] text-white/40 light:text-slate-500">Balance</p>
              <p class="text-2xl font-extrabold text-slate-50 light:text-slate-900">{{ formatMoney(card.balance, card.currency) }}</p>
            </div>
            <button type="button" :class="secondaryButton" :disabled="working" @click="toggleStatus">
              {{ card.status === 'ACTIVE' ? 'Suspend Card' : 'Reactivate Card' }}
            </button>
          </div>

          <form class="mt-4 flex flex-col gap-3 rounded-xl border border-white/8 bg-white/3 p-3.5 light:border-slate-200 light:bg-slate-50" @submit.prevent="submit">
            <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div class="flex min-w-0 flex-col gap-1.5">
                <label :class="labelClass" for="adjust-type">Type</label>
                <AppDropdown id="adjust-type" v-model="form.type" :options="typeOptions" />
              </div>
              <div class="flex min-w-0 flex-col gap-1.5">
                <label :class="labelClass" for="adjust-amount">Amount</label>
                <input id="adjust-amount" v-model.number="form.amount" type="number" min="0.01" step="0.01" required :class="inputClass">
              </div>
            </div>
            <div class="flex flex-col gap-1.5">
              <label :class="labelClass" for="adjust-note">Reason</label>
              <input id="adjust-note" v-model="form.note" type="text" required maxlength="500" placeholder="e.g. Cash received at the front desk" :class="inputClass">
            </div>
            <button type="submit" class="inline-flex cursor-pointer items-center justify-center gap-2 self-end rounded-[10px] border border-violet-500/40 bg-linear-to-br from-violet-600 to-indigo-600 px-5 py-2 text-[13px] font-semibold text-white transition-all hover:from-violet-500 hover:to-indigo-500 disabled:cursor-not-allowed disabled:opacity-50" :disabled="working || !canSubmit">
              <Loader2 v-if="working" :size="16" class="animate-spin" />
              {{ form.type === 'TOP_UP' ? 'Top Up' : 'Deduct' }}
            </button>
          </form>

          <section class="mt-4">
            <h3 class="text-sm font-bold text-slate-100 light:text-slate-900">History</h3>
            <p v-if="historyError" class="mt-2 text-[13px] text-rose-400">{{ historyError }}</p>
            <MemberCardHistory v-else :transactions="transactions" :currency="card.currency" />
          </section>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { Loader2, X } from 'lucide-vue-next'
import type { MemberCard, MemberCardAdjustment, MemberCardTransaction } from '~/types'
import AppDropdown from '~/components/shared/AppDropdown.vue'
import MemberCardHistory from '~/components/membercard/MemberCardHistory.vue'
import { formatMoney } from '~/composables/useCart'
import { useAppToast } from '~/composables/useAppToast'
import { useMemberCard } from '~/composables/useMemberCard'
import { useModalA11y } from '~/composables/useModalA11y'
import { getErrorMessage } from '~/utils/apiError'

const props = defineProps<{
  card: MemberCard | null
}>()

const emit = defineEmits<{
  (e: 'close' | 'changed'): void
}>()

const { adjustBalance, fetchCardTransactions, setCardStatus } = useMemberCard()
const toast = useAppToast()

const dialogRef = ref<HTMLElement | null>(null)

useModalA11y({
  isOpen: computed(() => props.card !== null),
  dialogRef,
  onClose: () => emit('close')
})

const modalFade = {
  enterActiveClass: 'transition-opacity duration-250 ease-out',
  leaveActiveClass: 'transition-opacity duration-250 ease-out',
  enterFromClass: 'opacity-0',
  leaveToClass: 'opacity-0'
}

const labelClass = 'text-[11px] font-semibold tracking-wider text-white/60 uppercase light:text-slate-600'
const inputClass = 'w-full rounded-[10px] border border-white/10 bg-white/4 px-3.5 py-2.5 text-[13px] text-slate-100 outline-none transition-all duration-200 placeholder:text-white/30 focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/15 light:border-slate-300 light:bg-white light:text-slate-900 light:placeholder:text-slate-400'
const secondaryButton = 'cursor-pointer rounded-lg border border-white/10 bg-white/5 px-3 py-1.75 text-xs font-semibold text-white/75 transition-colors hover:bg-white/9 hover:text-white disabled:cursor-not-allowed disabled:opacity-50 light:border-slate-200 light:bg-slate-100 light:text-slate-700'

const typeOptions = [
  { value: 'TOP_UP', label: 'Top-up' },
  { value: 'DEDUCTION', label: 'Deduction' }
]

const form = reactive<{ type: MemberCardAdjustment['type'], amount: number | null, note: string }>({
  type: 'TOP_UP',
  amount: null,
  note: ''
})
// Kept across retries, so a timed-out request that did reach the server can't apply twice
const idempotencyKey = ref('')
const working = ref(false)
const transactions = ref<MemberCardTransaction[]>([])
const historyError = ref('')

const canSubmit = computed(() => Number(form.amount) > 0 && Boolean(form.note.trim()))

function resetForm() {
  form.type = 'TOP_UP'
  form.amount = null
  form.note = ''
  idempotencyKey.value = crypto.randomUUID()
}

async function loadHistory(id: number) {
  historyError.value = ''
  try {
    transactions.value = (await fetchCardTransactions(id, 0, 50)).items
  } catch (err) {
    historyError.value = getErrorMessage(err, 'Unable to load this card\'s history')
  }
}

watch(() => props.card?.id, (id) => {
  transactions.value = []
  if (id === undefined) return
  resetForm()
  loadHistory(id)
})

async function submit() {
  if (!props.card) return
  working.value = true
  try {
    await adjustBalance(props.card.id, {
      type: form.type,
      amount: Number(form.amount),
      note: form.note.trim(),
      idempotencyKey: idempotencyKey.value
    })
    toast.success(form.type === 'TOP_UP' ? 'Balance Topped Up' : 'Balance Deducted')
    resetForm()
    emit('changed')
    await loadHistory(props.card.id)
  } catch (err) {
    toast.error('Balance Not Changed', getErrorMessage(err, 'Unable to change this balance'))
  } finally {
    working.value = false
  }
}

async function toggleStatus() {
  if (!props.card) return
  working.value = true
  try {
    await setCardStatus(props.card.id, props.card.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE')
    toast.success('Card Updated')
    emit('changed')
  } catch (err) {
    toast.error('Card Not Updated', getErrorMessage(err, 'Unable to update this card'))
  } finally {
    working.value = false
  }
}
</script>
