import { useState, useEffect } from 'react'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { db } from '../api/firebase'

export function useAdminStats() {
  const [stats, setStats] = useState({
    totalProjects: 0, activeProjects: 0,
    totalUsers: 0, openIssues: 0
  })

  useEffect(() => {
    const unsubs = []

    unsubs.push(onSnapshot(collection(db, 'projects'), s =>
      setStats(p => ({ ...p, totalProjects: s.size }))))

    unsubs.push(onSnapshot(
      query(collection(db, 'projects'), where('status', '==', 'active')), s =>
      setStats(p => ({ ...p, activeProjects: s.size }))))

    unsubs.push(onSnapshot(collection(db, 'profiles'), s =>
      setStats(p => ({ ...p, totalUsers: s.size }))))

    unsubs.push(onSnapshot(
      query(collection(db, 'issues'), where('status', '==', 'open')), s =>
      setStats(p => ({ ...p, openIssues: s.size }))))

    return () => unsubs.forEach(u => u())
  }, [])

  return stats
}
