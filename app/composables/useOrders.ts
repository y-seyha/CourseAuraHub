import type { AdminOrderPage, CouponPreview, Order, PaymentMethod } from '~/types'

/** Learner checkout and order history, plus the admin order list. */
export function useOrders() {
  async function fetchMyOrders() {
    return await $fetch<Order[]>('/api/me/orders')
  }

  async function fetchMyOrder(orderNumber: string) {
    return await $fetch<Order>(`/api/me/orders/${encodeURIComponent(orderNumber)}`)
  }

  async function cancelOrder(orderNumber: string) {
    return await $fetch<Order>(`/api/me/orders/${encodeURIComponent(orderNumber)}/cancel`, { method: 'POST' })
  }

  // Buys one course on its own, leaving anything else in the cart alone
  async function checkoutCourse(courseSlug: string, couponCode?: string, paymentMethod?: PaymentMethod) {
    return await $fetch<Order>('/api/me/orders', { method: 'POST', body: { courseSlug, couponCode, paymentMethod } })
  }

  async function previewCourseCoupon(courseSlug: string, code: string) {
    return await $fetch<CouponPreview>('/api/me/coupons/preview', { method: 'POST', body: { courseSlug, code } })
  }

  async function fetchAdminOrders(status: string, page: number, size = 20) {
    return await $fetch<AdminOrderPage>('/api/admin/orders', { query: { status, page: String(page), size: String(size) } })
  }

  async function refundOrder(orderNumber: string) {
    return await $fetch<Order>(`/api/admin/orders/${encodeURIComponent(orderNumber)}/refund`, { method: 'POST' })
  }

  return {
    checkoutCourse, previewCourseCoupon, fetchMyOrders,
    fetchMyOrder,
    cancelOrder,
    fetchAdminOrders,
    refundOrder,
  }
}
