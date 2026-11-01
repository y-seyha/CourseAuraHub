import type { MemberCard } from '~/types'

export default defineEventHandler(async (event) => {
  const id = encodeURIComponent(getRouterParam(event, 'id') ?? '')
  const body = await readBody<{ holderName?: string }>(event)

  return await backendRequest<MemberCard>(event, `/admin/member-cards/${id}`, {
    method: 'PUT',
    body: { holderName: body?.holderName },
    csrf: true,
    fallbackMessage: 'Unable to update this card',
  })
})
