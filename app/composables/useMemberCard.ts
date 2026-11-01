import type {
  MemberCard,
  MemberCardAdjustment,
  MemberCardApplication,
  MemberCardApplicationForm,
  MemberCardApplicationPage,
  MemberCardCreate,
  MemberCardOverview,
  MemberCardPage,
  MemberCardStatus,
  MemberCardTransaction,
  MemberCardTransactionPage,
  MemberCardTransactionType
} from '~/types'

/** The learner's member card, plus the admin tools for reviewing applications and managing balances. */
export function useMemberCard() {
  async function fetchMine() {
    return await $fetch<MemberCardOverview>('/api/me/member-card')
  }

  async function apply(form: MemberCardApplicationForm) {
    return await $fetch<MemberCardApplication>('/api/me/member-card/application', { method: 'POST', body: form })
  }

  async function fetchMyTransactions(page = 0, size = 20) {
    return await $fetch<MemberCardTransactionPage>('/api/me/member-card/transactions', {
      query: { page: String(page), size: String(size) }
    })
  }

  async function fetchApplications(status: string, page = 0, size = 20) {
    return await $fetch<MemberCardApplicationPage>('/api/admin/member-cards/applications', {
      query: { status, page: String(page), size: String(size) }
    })
  }

  async function approveApplication(id: number) {
    return await $fetch<MemberCardApplication>(`/api/admin/member-cards/applications/${id}/approve`, { method: 'POST' })
  }

  async function rejectApplication(id: number, note: string) {
    return await $fetch<MemberCardApplication>(`/api/admin/member-cards/applications/${id}/reject`, {
      method: 'POST',
      body: { note }
    })
  }

  async function fetchCards(search = '', page = 0, size = 20) {
    return await $fetch<MemberCardPage>('/api/admin/member-cards', {
      query: { search, page: String(page), size: String(size) }
    })
  }

  async function createCard(card: MemberCardCreate) {
    return await $fetch<MemberCard>('/api/admin/member-cards', { method: 'POST', body: card })
  }

  async function updateCard(id: number, holderName: string) {
    return await $fetch<MemberCard>(`/api/admin/member-cards/${id}`, { method: 'PUT', body: { holderName } })
  }

  async function deleteCard(id: number) {
    return await $fetch(`/api/admin/member-cards/${id}`, { method: 'DELETE' })
  }

  async function fetchCardTransactions(id: number, page = 0, size = 20) {
    return await $fetch<MemberCardTransactionPage>(`/api/admin/member-cards/${id}/transactions`, {
      query: { page: String(page), size: String(size) }
    })
  }

  async function setCardStatus(id: number, status: MemberCardStatus) {
    return await $fetch<MemberCard>(`/api/admin/member-cards/${id}/status`, { method: 'PATCH', body: { status } })
  }

  async function adjustBalance(id: number, adjustment: MemberCardAdjustment) {
    return await $fetch<MemberCardTransaction>(`/api/admin/member-cards/${id}/adjustments`, {
      method: 'POST',
      body: adjustment
    })
  }

  return {
    fetchMine,
    apply,
    fetchMyTransactions,
    fetchApplications,
    approveApplication,
    rejectApplication,
    fetchCards,
    createCard,
    updateCard,
    deleteCard,
    fetchCardTransactions,
    setCardStatus,
    adjustBalance
  }
}

const CREDITS: MemberCardTransactionType[] = ['TOP_UP', 'REFUND']

export function isCredit(type: MemberCardTransactionType) {
  return CREDITS.includes(type)
}

export const TRANSACTION_LABELS: Record<MemberCardTransactionType, string> = {
  TOP_UP: 'Top-up',
  DEDUCTION: 'Deduction',
  PURCHASE: 'Purchase',
  REFUND: 'Refund'
}
