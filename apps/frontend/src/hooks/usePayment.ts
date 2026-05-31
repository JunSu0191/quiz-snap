import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { loadTossPayments, ANONYMOUS } from '@tosspayments/tosspayments-sdk'
import { initializePayment, confirmPayment } from '@/api/payments'

const CLIENT_KEY = import.meta.env.VITE_TOSSPAYMENTS_CLIENT_KEY as string

export function useUpgradePlan() {
  const { mutateAsync: initialize } = useMutation({
    mutationFn: (plan: 'basic' | 'pro') => initializePayment(plan),
  })

  const startPayment = async (
    plan: 'basic' | 'pro',
    customerName: string,
    customerEmail: string
  ) => {
    const { orderId, amount, orderName } = await initialize(plan)
    const tossPayments = await loadTossPayments(CLIENT_KEY)
    const payment = tossPayments.payment({ customerKey: ANONYMOUS })

    await payment.requestPayment({
      method: 'CARD',
      amount: { currency: 'KRW', value: amount },
      orderId,
      orderName,
      customerName,
      customerEmail,
      successUrl: `${window.location.origin}/payment/success`,
      failUrl: `${window.location.origin}/payment/cancel`,
    })
  }

  return { startPayment }
}

export function useConfirmPayment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      paymentKey,
      orderId,
      amount,
    }: {
      paymentKey: string
      orderId: string
      amount: number
    }) => confirmPayment(paymentKey, orderId, amount),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['usage'] })
      toast.success(`${data.plan === 'basic' ? 'Basic' : 'Pro'} 플랜으로 업그레이드됐어요!`)
    },
    onError: () => {
      toast.error('결제 처리 중 오류가 발생했습니다.')
    },
  })
}
