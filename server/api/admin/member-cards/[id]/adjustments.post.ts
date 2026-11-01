import type { MemberCardAdjustment, MemberCardTransaction } from '~/types'

export default defineEventHandler(async (event) => {
  const id = encodeURIComponent(getRouterParam(event, 'id') ?? '')
  const body = await readBody<MemberCardAdjustment>(event)

  return await backendRequest<MemberCardTransaction>(event, `/admin/member-cards/${id}/adjustments`, {
    method: 'POST',
    body: {
      type: body?.type,
      amount: body?.amount,
      note: body?.note,
      idempotencyKey: body?.idempotencyKey,
    },
    csrf: true,
    fallbackMessage: 'Unable to change this balance',
  })
})
