import type { CouponPreview } from '~/types'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ courseSlug?: string; code?: string }>(event)

  return await backendRequest<CouponPreview>(event, '/me/coupons/preview', {
    method: 'POST',
    body: { courseSlug: body?.courseSlug, code: body?.code },
    csrf: true,
    fallbackMessage: 'This coupon can\'t be used',
  })
})
