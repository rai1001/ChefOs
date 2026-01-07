import { useEffect, useMemo, useState } from 'react'
import { useUserMemberships } from './memberships'

const STORAGE_KEY = 'activeOrgId'

export function useActiveOrgId() {
  const memberships = useUserMemberships()
  const [activeOrgId, setActiveOrgId] = useState<string | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) setActiveOrgId(stored)
  }, [])

  useEffect(() => {
    if (memberships.data && memberships.data.length === 1) {
      setActiveOrgId((prev) => {
        const next = memberships.data?.[0]?.orgId ?? null
        if (next && prev !== next) localStorage.setItem(STORAGE_KEY, next)
        return next
      })
    } else if (memberships.data && memberships.data.length > 1) {
      setActiveOrgId((prev) => {
        const next = prev ?? memberships.data?.[0]?.orgId ?? null
        if (next) localStorage.setItem(STORAGE_KEY, next)
        return next
      })
    }
  }, [memberships.data])

  const loading = memberships.isLoading
  const error = memberships.isError ? memberships.error : undefined

  const selector = useMemo(
    () => ({
      setOrg: (id: string) => {
        setActiveOrgId(id)
        localStorage.setItem(STORAGE_KEY, id)
      },
      memberships: memberships.data ?? [],
    }),
    [memberships.data],
  )

  return { activeOrgId, loading, error, ...selector }
}
