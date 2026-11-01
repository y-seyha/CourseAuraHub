import type { MemberCardApplication } from '~/types'

export default defineEventHandler(async (event) => {
  const id = encodeURIComponent(getRouterParam(event, 'id') ?? '')

  return await backendRequest<MemberCardApplication>(event, `/admin/member-cards/applications/${id}/approve`, {
    method: 'POST',
    csrf: true,
    fallbackMessage: 'Unable to approve this application',
  })
})
