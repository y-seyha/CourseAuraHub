import type { Order } from '~/types'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ courseSlug?: string; couponCode?: string; paymentMethod?: string }>(event)

  return await backendRequest<Order>(event, '/me/orders', {
    method: 'POST',
    body: { courseSlug: body?.courseSlug, couponCode: body?.couponCode, paymentMethod: body?.paymentMethod },
    csrf: true,
    fallbackMessage: 'Unable to start checkout',
  })
})
