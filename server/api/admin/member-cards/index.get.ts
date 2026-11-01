import type { MemberCardPage } from '~/types'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  return await backendRequest<MemberCardPage>(event, '/admin/member-cards', {
    query: { search: queryString(query.search), page: queryString(query.page), size: queryString(query.size) },
    fallbackMessage: 'Unable to load member cards',
  })
})
