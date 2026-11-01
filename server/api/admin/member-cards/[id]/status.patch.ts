import type { MemberCard } from '~/types'

export default defineEventHandler(async (event) => {
  const id = encodeURIComponent(getRouterParam(event, 'id') ?? '')
  const body = await readBody<{ status?: string }>(event)

  return await backendRequest<MemberCard>(event, `/admin/member-cards/${id}/status`, {
    method: 'PATCH',
    body: { status: body?.status },
    csrf: true,
    fallbackMessage: 'Unable to update this card',
  })
})
