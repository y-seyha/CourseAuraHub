import type { MemberCardApplication, MemberCardApplicationForm } from '~/types'

export default defineEventHandler(async (event) => {
  const body = await readBody<MemberCardApplicationForm>(event)

  return await backendRequest<MemberCardApplication>(event, '/me/member-card/application', {
    method: 'POST',
    body: {
      fullName: body?.fullName,
      phone: body?.phone,
      dateOfBirth: body?.dateOfBirth,
      address: body?.address,
    },
    csrf: true,
    fallbackMessage: 'Unable to send your application',
  })
})
