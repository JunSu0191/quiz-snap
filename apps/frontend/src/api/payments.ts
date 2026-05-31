import { api } from '@/lib/axios'

export interface InitializePaymentResponse {
  orderId: string
  amount: number
  orderName: string
}

export interface ConfirmPaymentResponse {
  plan: string
}

export interface PaymentRecord {
  id: string
  order_id: string
  plan: string
  amount: number
  status: string
  created_at: string
  confirmed_at: string | null
}

export async function initializePayment(plan: 'basic' | 'pro'): Promise<InitializePaymentResponse> {
  const { data } = await api.post<{ success: true; data: InitializePaymentResponse }>(
    '/api/payments/initialize',
    { plan }
  )
  return data.data
}

export async function confirmPayment(
  paymentKey: string,
  orderId: string,
  amount: number
): Promise<ConfirmPaymentResponse> {
  const { data } = await api.post<{ success: true; data: ConfirmPaymentResponse }>(
    '/api/payments/confirm',
    { paymentKey, orderId, amount }
  )
  return data.data
}

export async function getPaymentHistory(): Promise<PaymentRecord[]> {
  const { data } = await api.get<{ success: true; data: PaymentRecord[] }>('/api/payments/history')
  return data.data
}
