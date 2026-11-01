import type { Order } from '~/types'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ courseSlug?: string; couponCode?: string }>(event)

  return await backendRequest<Order>(event, '/me/orders', {
    method: 'POST',
    body: { courseSlug: body?.courseSlug, couponCode: body?.couponCode },
    csrf: true,
    fallbackMessage: 'Unable to start checkout',
  })
})
