interface Props {
  isLive: boolean
}

export function Header({ isLive }: Props) {
  return (
    <header>
      <h1>
        Ajazz AK820 Web Driver <small>v0.2</small>
      </h1>
      <span className={`badge ${isLive ? 'connected' : 'idle'}`}>
        {isLive ? 'Live' : 'Idle'}
      </span>
    </header>
  )
}
