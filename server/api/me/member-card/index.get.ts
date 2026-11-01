import type { MemberCardOverview } from '~/types'

export default defineEventHandler(async (event) => {
  return await backendRequest<MemberCardOverview>(event, '/me/member-card', {
    fallbackMessage: 'Unable to load your member card',
  })
})
