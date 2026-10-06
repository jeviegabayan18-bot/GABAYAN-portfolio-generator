import { useState } from 'react'
import { initials } from '../lib/format.ts'

export function Portrait({
  name,
  url,
  className,
}: {
  name: string
  url: string | null
  className?: string
}) {
  const [failed, setFailed] = useState(false)
  const showImage = Boolean(url) && !failed
  return (
    <span className={className ? `portrait ${className}` : 'portrait'}>
      {showImage ? (
        <img src={url ?? ''} alt="" onError={() => setFailed(true)} />
      ) : (
        <span className="portrait-fallback">{initials(name)}</span>
      )}
    </span>
  )
}
