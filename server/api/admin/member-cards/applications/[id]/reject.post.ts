import type { MemberCardApplication } from '~/types'

export default defineEventHandler(async (event) => {
  const id = encodeURIComponent(getRouterParam(event, 'id') ?? '')
  const body = await readBody<{ note?: string }>(event)

  return await backendRequest<MemberCardApplication>(event, `/admin/member-cards/applications/${id}/reject`, {
    method: 'POST',
    body: { note: body?.note },
    csrf: true,
    fallbackMessage: 'Unable to reject this application',
  })
})
