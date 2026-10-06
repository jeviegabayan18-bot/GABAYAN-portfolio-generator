import { useEffect } from 'react'

export function usePageTitle(page: string): void {
  useEffect(() => {
    document.title =
      page === 'Portfolio Generator' ? page : `${page} · Portfolio Generator`
  }, [page])
}
