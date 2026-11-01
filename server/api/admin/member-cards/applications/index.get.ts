import type { MemberCardApplicationPage } from '~/types'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  return await backendRequest<MemberCardApplicationPage>(event, '/admin/member-cards/applications', {
    query: {
      status: queryString(query.status),
      page: queryString(query.page),
      size: queryString(query.size),
    },
    fallbackMessage: 'Unable to load applications',
  })
})
