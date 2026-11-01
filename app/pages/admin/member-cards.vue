<template>
  <div class="flex flex-col gap-6">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-extrabold tracking-tight text-slate-50 sm:text-[26px] light:text-slate-900">Member Cards</h1>
        <p class="mt-1 text-[13px] text-white/45 light:text-slate-500">Review applications and manage card balances.</p>
      </div>
      <div class="flex gap-1 rounded-xl border border-white/10 bg-white/5 p-1 light:border-slate-200 light:bg-slate-100" role="tablist">
        <button v-for="item in tabs" :key="item.value" type="button" role="tab" :aria-selected="tab === item.value" class="cursor-pointer rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors" :class="tab === item.value ? 'bg-violet-600 text-white' : 'text-white/60 hover:text-white light:text-slate-600 light:hover:text-slate-900'" @click="tab = item.value">
          {{ item.label }}
        </button>
      </div>
    </div>

    <!-- Applications -->
    <template v-if="tab === 'applications'">
      <div class="w-full sm:w-52">
        <AppDropdown v-model="statusFilter" :options="statusOptions" aria-label="Filter applications by status" />
      </div>

      <div v-if="applicationsPending" class="h-40 animate-pulse rounded-[18px] bg-white/5 light:bg-slate-100" />
      <p v-else-if="applicationsError" :class="messageClass">{{ getErrorMessage(applicationsError, 'Unable to load applications') }}</p>
      <p v-else-if="!applications.length" :class="messageClass">No applications found.</p>

      <div v-else class="overflow-x-auto rounded-[18px] border border-white/10 bg-white/5 light:border-slate-200 light:bg-white">
        <table class="w-full min-w-200 border-collapse text-left text-[13px]">
          <thead>
            <tr class="border-b border-white/8 text-[11px] tracking-wider text-white/40 uppercase light:border-slate-200 light:text-slate-500">
              <th class="px-4 py-3 font-semibold">Applicant</th>
              <th class="px-4 py-3 font-semibold">Contact</th>
              <th class="px-4 py-3 font-semibold">Applied</th>
              <th class="px-4 py-3 font-semibold">Status</th>
              <th class="px-4 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/6 light:divide-slate-200">
            <tr v-for="item in applications" :key="item.id">
              <td class="px-4 py-3">
                <span class="block font-semibold text-slate-100 light:text-slate-900">{{ item.fullName }}</span>
                <span class="text-xs text-white/40 light:text-slate-500">Born {{ item.dateOfBirth }}</span>
              </td>
              <td class="max-w-72 px-4 py-3 text-white/70 light:text-slate-600">
                <span class="block">{{ item.studentEmail }} · {{ item.phone }}</span>
                <span class="block truncate text-xs text-white/40 light:text-slate-500">{{ item.address }}</span>
              </td>
              <td class="px-4 py-3 whitespace-nowrap text-white/50 light:text-slate-500">{{ formatDateTime(item.createdAt) }}</td>
              <td class="px-4 py-3">
                <span class="text-xs font-semibold capitalize text-white/70 light:text-slate-600">{{ item.status.toLowerCase() }}</span>
                <span v-if="item.reviewNote" class="block max-w-48 truncate text-xs text-white/40 light:text-slate-500">{{ item.reviewNote }}</span>
              </td>
              <td class="px-4 py-3 text-right whitespace-nowrap">
                <template v-if="item.status === 'PENDING'">
                  <button type="button" :class="approveButton" :disabled="busyId === item.id" @click="approve(item)">Approve</button>
                  <button type="button" :class="rejectButton" class="ml-2" :disabled="busyId === item.id" @click="rejecting = item">Reject</button>
                </template>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>

    <!-- Cards -->
    <template v-else>
      <div v-if="cardsPending" class="h-40 animate-pulse rounded-[18px] bg-white/5 light:bg-slate-100" />
      <p v-else-if="cardsError" :class="messageClass">{{ getErrorMessage(cardsError, 'Unable to load member cards') }}</p>
      <p v-else-if="!cards.length" :class="messageClass">No member cards yet.</p>

      <div v-else class="overflow-x-auto rounded-[18px] border border-white/10 bg-white/5 light:border-slate-200 light:bg-white">
        <table class="w-full min-w-180 border-collapse text-left text-[13px]">
          <thead>
            <tr class="border-b border-white/8 text-[11px] tracking-wider text-white/40 uppercase light:border-slate-200 light:text-slate-500">
              <th class="px-4 py-3 font-semibold">Holder</th>
              <th class="px-4 py-3 font-semibold">Card</th>
              <th class="px-4 py-3 font-semibold">Balance</th>
              <th class="px-4 py-3 font-semibold">Status</th>
              <th class="px-4 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/6 light:divide-slate-200">
            <tr v-for="item in cards" :key="item.id">
              <td class="px-4 py-3">
                <span class="block font-semibold text-slate-100 light:text-slate-900">{{ item.holderName }}</span>
                <span class="text-xs text-white/40 light:text-slate-500">{{ item.studentEmail }}</span>
              </td>
              <td class="px-4 py-3 font-mono text-xs text-white/70 light:text-slate-600">{{ item.cardNumber }}</td>
              <td class="px-4 py-3 font-semibold text-emerald-400 light:text-emerald-700">{{ formatMoney(item.balance, item.currency) }}</td>
              <td class="px-4 py-3 text-xs font-semibold capitalize text-white/70 light:text-slate-600">{{ item.status.toLowerCase() }}</td>
              <td class="px-4 py-3 text-right">
                <button type="button" :class="approveButton" @click="selectedId = item.id">Manage</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>

    <div v-if="pageCount > 1" class="flex items-center justify-end gap-3 text-xs text-white/50 light:text-slate-500">
      <button type="button" class="cursor-pointer font-semibold disabled:cursor-not-allowed disabled:opacity-40" :disabled="page === 0" @click="page -= 1">Previous</button>
      <span>Page {{ page + 1 }} of {{ pageCount }}</span>
      <button type="button" class="cursor-pointer font-semibold disabled:cursor-not-allowed disabled:opacity-40" :disabled="page + 1 >= pageCount" @click="page += 1">Next</button>
    </div>

    <MemberCardManageModal :card="selectedCard" @close="selectedId = null" @changed="refreshCards()" />

    <!-- Reject with a reason -->
    <Teleport to="body">
      <div v-if="rejecting" class="fixed inset-0 z-100 flex items-center justify-center bg-[#05050c]/82 p-4 backdrop-blur-xl" @click.self="rejecting = null">
        <form class="w-full max-w-110 rounded-[20px] border border-rose-500/25 bg-[#0f1019] p-5 light:border-rose-200 light:bg-white" role="dialog" aria-modal="true" aria-labelledby="reject-title" @submit.prevent="reject">
          <h2 id="reject-title" class="text-lg font-bold text-slate-50 light:text-slate-900">Reject {{ rejecting.fullName }}</h2>
          <p class="mt-1 text-xs text-white/45 light:text-slate-500">The learner sees this reason and can apply again.</p>
          <textarea v-model="rejectNote" rows="3" required maxlength="500" aria-label="Reason" class="mt-3 w-full rounded-[10px] border border-white/10 bg-white/4 px-3.5 py-2.5 text-[13px] text-slate-100 outline-none focus:border-violet-500/50 light:border-slate-300 light:bg-white light:text-slate-900" />
          <div class="mt-3 flex justify-end gap-2">
            <button type="button" :class="approveButton" @click="rejecting = null">Cancel</button>
            <button type="submit" :class="rejectButton" :disabled="busyId === rejecting.id || !rejectNote.trim()">Reject</button>
          </div>
        </form>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import type { MemberCardApplication } from '~/types'
import AppDropdown from '~/components/shared/AppDropdown.vue'
import MemberCardManageModal from '~/components/membercard/MemberCardManageModal.vue'
import { formatMoney } from '~/composables/useCart'
import { useAppToast } from '~/composables/useAppToast'
import { useMemberCard } from '~/composables/useMemberCard'
import { getErrorMessage } from '~/utils/apiError'
import { formatDateTime } from '~/utils/dateTime'

definePageMeta({ requiresAdmin: true })
useHead({ title: 'Member Cards' })

const toast = useAppToast()
const { fetchApplications, approveApplication, rejectApplication, fetchCards } = useMemberCard()

const baseButton = 'cursor-pointer rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50'
const approveButton = `${baseButton} border-violet-500/35 bg-violet-500/15 text-violet-300 hover:bg-violet-500/25 light:border-violet-200 light:bg-violet-50 light:text-violet-700`
const rejectButton = `${baseButton} border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 light:border-rose-200 light:bg-rose-50 light:text-rose-600`
const messageClass = 'rounded-[18px] border border-white/10 bg-white/5 px-5 py-12 text-center text-[13px] text-white/45 light:border-slate-200 light:bg-white light:text-slate-500'

const tabs = [
  { value: 'applications', label: 'Applications' },
  { value: 'cards', label: 'Cards' }
]
const statusOptions = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: '', label: 'All Statuses' }
]

const tab = ref('applications')
const statusFilter = ref('PENDING')
const applicationPage = ref(0)
const cardPage = ref(0)

const { data: applicationData, pending: applicationsPending, error: applicationsError, refresh: refreshApplications } = await useAsyncData(
  'admin-card-applications',
  () => fetchApplications(statusFilter.value, applicationPage.value),
  { server: false, watch: [statusFilter, applicationPage] }
)
const { data: cardData, pending: cardsPending, error: cardsError, refresh: refreshCards } = await useAsyncData(
  'admin-member-cards',
  () => fetchCards(cardPage.value),
  { server: false, watch: [cardPage] }
)

const applications = computed(() => applicationData.value?.items ?? [])
const cards = computed(() => cardData.value?.items ?? [])

const page = computed({
  get: () => tab.value === 'applications' ? applicationPage.value : cardPage.value,
  set: (value) => {
    if (tab.value === 'applications') applicationPage.value = value
    else cardPage.value = value
  }
})
const pageCount = computed(() => (tab.value === 'applications' ? applicationData.value : cardData.value)?.totalPages ?? 0)

watch(statusFilter, () => {
  applicationPage.value = 0
})

// Follows the list, so a new balance shows in the open panel
const selectedId = ref<number | null>(null)
const selectedCard = computed(() => cards.value.find(card => card.id === selectedId.value) ?? null)

const busyId = ref<number | null>(null)
const rejecting = ref<MemberCardApplication | null>(null)
const rejectNote = ref('')

async function approve(application: MemberCardApplication) {
  busyId.value = application.id
  try {
    await approveApplication(application.id)
    toast.success('Application Approved', `${application.fullName} now has a member card.`)
    await Promise.all([refreshApplications(), refreshCards()])
  } catch (err) {
    toast.error('Application Not Approved', getErrorMessage(err, 'Unable to approve this application'))
  } finally {
    busyId.value = null
  }
}

async function reject() {
  const application = rejecting.value
  if (!application) return

  busyId.value = application.id
  try {
    await rejectApplication(application.id, rejectNote.value.trim())
    toast.info('Application Rejected', application.fullName)
    rejecting.value = null
    rejectNote.value = ''
    await refreshApplications()
  } catch (err) {
    toast.error('Application Not Rejected', getErrorMessage(err, 'Unable to reject this application'))
  } finally {
    busyId.value = null
  }
}
</script>
