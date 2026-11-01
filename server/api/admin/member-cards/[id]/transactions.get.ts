import type { MemberCardTransactionPage } from '~/types'

export default defineEventHandler(async (event) => {
  const id = encodeURIComponent(getRouterParam(event, 'id') ?? '')
  const query = getQuery(event)

  return await backendRequest<MemberCardTransactionPage>(event, `/admin/member-cards/${id}/transactions`, {
    query: { page: queryString(query.page), size: queryString(query.size) },
    fallbackMessage: 'Unable to load this card\'s history',
  })
})
