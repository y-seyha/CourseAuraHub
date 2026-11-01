import type { Cart, CartCouponPreview, CheckoutResult, PaymentMethod } from '~/types'

/** The learner's cart. One copy per app, so the header count follows every change. */
export function useCart() {
  const cart = useState<Cart | null>('cart', () => null)
  const count = computed(() => cart.value?.items.length ?? 0)

  async function refresh() {
    cart.value = await $fetch<Cart>('/api/me/cart')
    return cart.value
  }

  function clear() {
    cart.value = null
  }

  async function add(slug: string) {
    cart.value = await $fetch<Cart>(`/api/me/cart/${encodeURIComponent(slug)}`, { method: 'PUT' })
  }

  async function remove(slug: string) {
    cart.value = await $fetch<Cart>(`/api/me/cart/${encodeURIComponent(slug)}`, { method: 'DELETE' })
  }

  function contains(slug: string) {
    return Boolean(cart.value?.items.some(item => item.slug === slug))
  }

  async function previewCoupon(code: string) {
    return await $fetch<CartCouponPreview>('/api/me/cart/coupon-preview', { method: 'POST', body: { code } })
  }

  async function checkout(couponCode?: string, paymentMethod?: PaymentMethod) {
    return await $fetch<CheckoutResult>('/api/me/cart/checkout', { method: 'POST', body: { couponCode, paymentMethod } })
  }

  return { cart, count, refresh, clear, add, remove, contains, previewCoupon, checkout }
}

export function formatMoney(amount: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount)
}
