export function queryString(value: unknown): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value
  const normalized = raw === undefined || raw === null ? undefined : String(raw).trim()

  if (!normalized || normalized === 'all') {
    return undefined
  }

  return normalized
}
