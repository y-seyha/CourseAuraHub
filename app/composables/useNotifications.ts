import type { AppNotification, NotificationPage, NotificationStreamEvent } from '~/types'
import { useAppToast } from '~/composables/useAppToast'

const PAGE_SIZE = 15
const RECONNECT_DELAY_MS = 30_000

// One stream per tab, however many components use this composable
let source: EventSource | null = null
let reconnectTimer: ReturnType<typeof setTimeout> | null = null

/**
 * The signed-in user's notifications. The feed comes from REST; the stream only adds to it,
 * so a dropped connection never loses anything.
 */
export function useNotifications() {
  const items = useState<AppNotification[]>('notifications', () => [])
  const unreadCount = useState('notifications-unread', () => 0)
  const hasMore = useState('notifications-has-more', () => false)
  const nextPage = useState('notifications-next-page', () => 0)
  const toast = useAppToast()

  async function loadPage(page: number) {
    const result = await $fetch<NotificationPage>('/api/me/notifications', {
      query: { page: String(page), size: String(PAGE_SIZE) },
    })
    const known = new Set(items.value.map(item => item.id))
    const fresh = result.items.filter(item => !known.has(item.id))
    items.value = page === 0 ? [...fresh, ...items.value] : [...items.value, ...fresh]
    nextPage.value = page + 1
    hasMore.value = page + 1 < result.totalPages
  }

  async function loadMore() {
    await loadPage(nextPage.value)
  }

  // Keeps the badge right when the stream is slow to open or can't connect
  async function loadUnreadCount() {
    const result = await $fetch<{ unreadCount: number }>('/api/me/notifications/unread-count')
    unreadCount.value = result.unreadCount
  }

  function onNotification(event: MessageEvent<string>) {
    const { notification, unreadCount: count } = JSON.parse(event.data) as NotificationStreamEvent
    unreadCount.value = count
    if (items.value.some(item => item.id === notification.id)) return
    items.value = [notification, ...items.value]
    toast.info(notification.title, notification.message)
  }

  function onUnreadCount(event: MessageEvent<string>) {
    unreadCount.value = (JSON.parse(event.data) as { unreadCount: number }).unreadCount
  }

  function openStream() {
    source = new EventSource('/api/me/notifications/stream')
    source.addEventListener('notification', onNotification)
    source.addEventListener('unread-count', onUnreadCount)
    // The browser retries dropped connections itself, but gives up for good on an error
    // response, such as an expired session. Any REST call refreshes the session.
    source.onerror = () => {
      if (source?.readyState === EventSource.CLOSED && !reconnectTimer) {
        reconnectTimer = setTimeout(reconnect, RECONNECT_DELAY_MS)
      }
    }
  }

  async function reconnect() {
    reconnectTimer = null
    closeStream()
    try {
      await Promise.all([loadPage(0), loadUnreadCount()])
      openStream()
    } catch {
      reconnectTimer = setTimeout(reconnect, RECONNECT_DELAY_MS)
    }
  }

  function closeStream() {
    source?.close()
    source = null
  }

  async function connect() {
    if (source) return
    items.value = []
    openStream()
    await Promise.all([loadPage(0), loadUnreadCount()]).catch(() => {})
  }

  function disconnect() {
    if (reconnectTimer) clearTimeout(reconnectTimer)
    reconnectTimer = null
    closeStream()
    items.value = []
    unreadCount.value = 0
    hasMore.value = false
  }

  async function markRead(notification: AppNotification) {
    if (notification.read) return
    await $fetch(`/api/me/notifications/${notification.id}/read`, { method: 'PATCH' })
    notification.read = true
    unreadCount.value = Math.max(0, unreadCount.value - 1)
  }

  async function markAllRead() {
    await $fetch('/api/me/notifications/read-all', { method: 'POST' })
    items.value.forEach((item) => {
      item.read = true
    })
    unreadCount.value = 0
  }

  async function remove(notification: AppNotification) {
    await $fetch(`/api/me/notifications/${notification.id}`, { method: 'DELETE' })
    items.value = items.value.filter(item => item.id !== notification.id)
    if (!notification.read) unreadCount.value = Math.max(0, unreadCount.value - 1)
  }

  return {
    items,
    unreadCount,
    hasMore,
    connect,
    disconnect,
    loadMore,
    markRead,
    markAllRead,
    remove,
  }
}
