const TOSSPAYMENTS_SECRET_KEY = process.env.TOSSPAYMENTS_SECRET_KEY ?? ''
const TOSSPAYMENTS_API_URL = 'https://api.tosspayments.com/v1'

export interface TossPaymentResult {
  paymentKey: string
  orderId: string
  status: string
  totalAmount: number
  method: string
  approvedAt: string
}

export async function confirmPayment(
  paymentKey: string,
  orderId: string,
  amount: number
): Promise<TossPaymentResult> {
  if (!TOSSPAYMENTS_SECRET_KEY) {
    throw new Error('TOSSPAYMENTS_SECRET_KEY가 설정되지 않았습니다.')
  }

  const credentials = Buffer.from(`${TOSSPAYMENTS_SECRET_KEY}:`).toString('base64')
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 15000) // 15초 타임아웃

  try {
    const response = await fetch(`${TOSSPAYMENTS_API_URL}/payments/confirm`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ paymentKey, orderId, amount }),
    })

    if (!response.ok) {
      const error = await response.json() as { code: string; message: string }
      throw new Error(`TossPayments 오류: [${error.code}] ${error.message}`)
    }

    return response.json() as Promise<TossPaymentResult>
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('TossPayments API 요청 시간이 초과됐습니다.')
    }
    throw err
  } finally {
    clearTimeout(timeoutId)
  }
}
