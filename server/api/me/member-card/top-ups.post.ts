export default defineEventHandler(async (event) => {
  const body = await readBody<{ amount?: unknown, note?: unknown, receiptUrl?: unknown, receiptName?: unknown }>(event)

  return await backendRequest<unknown>(event, '/me/member-card/top-ups', {
    method: 'POST',
    body: { amount: body?.amount, note: body?.note, receiptUrl: body?.receiptUrl, receiptName: body?.receiptName },
    csrf: true,
    fallbackMessage: 'Unable to send your request',
  })
})
