import type { StatusMessage } from '../types'

interface Props {
  status: StatusMessage
}

export function StatusBar({ status }: Props) {
  return (
    <div className={`footer ${status.type}`}>{status.message}</div>
  )
}
