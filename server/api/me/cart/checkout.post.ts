import type { CheckoutResult } from '~/types'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ couponCode?: string, paymentMethod?: string }>(event)

  return await backendRequest<CheckoutResult>(event, '/me/cart/checkout', {
    method: 'POST',
    body: { couponCode: body?.couponCode, paymentMethod: body?.paymentMethod },
    csrf: true,
    fallbackMessage: 'Unable to start checkout',
  })
})
