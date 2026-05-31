import { cn } from '@/lib/utils'

export function LoadingSpinner({ size = 'md', className }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const sizeClass = { sm: 'h-4 w-4', md: 'h-8 w-8', lg: 'h-12 w-12' }[size]
  return (
    <div className={cn('flex items-center justify-center', className)}>
      <div className={cn(sizeClass, 'animate-spin rounded-full border-2 border-primary border-t-transparent')} />
    </div>
  )
}
