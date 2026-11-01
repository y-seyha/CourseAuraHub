import type { MemberCard } from '~/types'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ studentId?: number, holderName?: string, openingBalance?: number }>(event)

  return await backendRequest<MemberCard>(event, '/admin/member-cards', {
    method: 'POST',
    body: {
      studentId: body?.studentId,
      holderName: body?.holderName,
      openingBalance: body?.openingBalance,
    },
    csrf: true,
    fallbackMessage: 'Unable to create this card',
  })
})
