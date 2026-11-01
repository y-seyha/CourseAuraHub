import type { MemberCardTransactionPage } from '~/types'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  return await backendRequest<MemberCardTransactionPage>(event, '/me/member-card/transactions', {
    query: { page: queryString(query.page), size: queryString(query.size) },
    fallbackMessage: 'Unable to load your card history',
  })
})
