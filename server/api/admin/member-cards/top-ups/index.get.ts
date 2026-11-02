export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  return await backendRequest<unknown>(event, '/admin/member-cards/top-ups', {
    query: { status: queryString(query.status), page: queryString(query.page), size: queryString(query.size) },
    fallbackMessage: 'Unable to load top-up requests',
  })
})
