'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { Plus, Briefcase, Trash2 } from 'lucide-react'
import { format, parseISO, differenceInCalendarDays, isToday, isTomorrow, isPast } from 'date-fns'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import type { TaskRecord } from '@/lib/tasks-db'

type HearingWithCase = {
  id: string
  hearingDate: string
  itemNumber: string | null
  outcome: string | null
  notes?: { content: string }[]
  case: {
    id: string
    caseNumber: string
    year?: number | null
    status: string
    courtNumber: string | null
    judgeName?: string | null
    synopsis?: string | null
    client: {
      firstName: string
      lastName: string | null
    } | null
    otherParties: string[]
    opponentMainParty: string
    court: {
      name: string
    } | null
    caseType?: {
      name: string
    } | null
    assignments?: {
      user: {
        id: string
        name: string | null
        role: string
      }
    }[]
  }
}

type TeamMemberSummary = {
  id: string
  name: string | null
  email: string
  role: string
  specialization: string | null
  otherInfo: string | null
  customRole?: { name: string } | null
  assignedCases?: {
    case: {
      id: string
      caseNumber: string
      courtNumber: string | null
      court: { name: string } | null
    }
  }[]
}

type PresenceStatus = 'IN_COURT' | 'REGISTRY' | 'CHAMBERS'

const PRESENCE_CONFIG: Record<
  PresenceStatus,
  { label: string; dotClass: string; pillClass: string; deployBadge: string }
> = {
  IN_COURT: {
    label: 'In Court',
    dotClass: 'bg-emerald-500',
    pillClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    deployBadge: 'Court Dedicated',
  },
  REGISTRY: {
    label: 'Registry',
    dotClass: 'bg-sky-500',
    pillClass: 'bg-sky-50 text-sky-700 border-sky-200',
    deployBadge: 'Registry / Filing',
  },
  CHAMBERS: {
    label: 'Chambers',
    dotClass: 'bg-purple-500',
    pillClass: 'bg-purple-50 text-purple-700 border-purple-200',
    deployBadge: 'Chambers & Briefings',
  },
}

const AVATAR_GRADIENTS = [
  'bg-gradient-to-tr from-purple-600 to-indigo-600',
  'bg-gradient-to-tr from-blue-600 to-sky-500',
  'bg-gradient-to-tr from-slate-600 to-indigo-700',
  'bg-gradient-to-tr from-indigo-600 to-violet-600',
]

export default function DashboardPageClient() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [todaysHearings, setTodaysHearings] = useState<HearingWithCase[]>([])
  const [weekHearings, setWeekHearings] = useState<HearingWithCase[]>([])
  const [upcomingHearings, setUpcomingHearings] = useState<HearingWithCase[]>([])
  const [activeCasesCount, setActiveCasesCount] = useState(0)
  const [tasks, setTasks] = useState<TaskRecord[]>([])
  const [teamMembers, setTeamMembers] = useState<TeamMemberSummary[]>([])
  const [courts, setCourts] = useState<{ id: string; name: string }[]>([])
  const [presenceMap, setPresenceMap] = useState<Record<string, PresenceStatus>>({})
  const [loadingData, setLoadingData] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'today' | 'thisWeek'>('today')
  const [selectedDayFilter, setSelectedDayFilter] = useState<string>('ALL')

  // Quick Case creation dialog state
  const [showQuickCreateDialog, setShowQuickCreateDialog] = useState(false)
  const [creating, setCreating] = useState(false)
  const [clients, setClients] = useState<any[]>([])
  const [allCases, setAllCases] = useState<any[]>([])
  const [quickCaseForm, setQuickCaseForm] = useState({
    caseNumber: '',
    clientId: '',
    opponentMainParty: '',
    appearingFor: 'PETITIONER' as 'PETITIONER' | 'RESPONDENT',
  })
  const [clientSearchQuery, setClientSearchQuery] = useState('')
  const [showClientDropdown, setShowClientDropdown] = useState(false)
  const [showQuickClientDialog, setShowQuickClientDialog] = useState(false)
  const [quickClientName, setQuickClientName] = useState('')
  const [quickClientPhone, setQuickClientPhone] = useState('')
  const [isCreatingClient, setIsCreatingClient] = useState(false)

  // Task creation dialog state
  const [showTaskDialog, setShowTaskDialog] = useState(false)
  const [creatingTask, setCreatingTask] = useState(false)
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    dueDate: '',
    category: 'LIMITATION',
    priority: 'HIGH',
    caseId: 'none',
    assignedToId: 'none',
  })

  const handleOpenQuickCreate = () => {
    fetchClients()
    setShowQuickCreateDialog(true)
  }

  const handleOpenTaskDialog = () => {
    fetchAllCases()
    setShowTaskDialog(true)
  }

  const fetchClients = async () => {
    if (!user?.email) return
    try {
      const response = await fetch(`/api/clients?email=${encodeURIComponent(user.email)}`)
      if (response.ok) {
        const data = await response.json()
        setClients(data.clients || [])
      }
    } catch (err) {
      console.error('Error fetching clients:', err)
    }
  }

  const fetchAllCases = async () => {
    if (!user?.email) return
    try {
      const response = await fetch(`/api/cases?email=${encodeURIComponent(user.email)}`)
      if (response.ok) {
        const data = await response.json()
        setAllCases(data.cases || [])
      }
    } catch (err) {
      console.error('Error fetching cases:', err)
    }
  }

  const handleCreateTask = async () => {
    if (!taskForm.title.trim()) {
      toast.error('Please enter a task or deadline title')
      return
    }

    setCreatingTask(true)
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: user?.email,
          ...taskForm,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to create task')
      }

      const data = await res.json()
      setTasks(data.tasks || [])
      toast.success('Task added to limitation tracker')
      setShowTaskDialog(false)
      setTaskForm({
        title: '',
        description: '',
        dueDate: '',
        category: 'LIMITATION',
        priority: 'HIGH',
        caseId: 'none',
        assignedToId: 'none',
      })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create task')
    } finally {
      setCreatingTask(false)
    }
  }

  const handleToggleTask = async (task: TaskRecord) => {
    const nextCompleted = !task.completed
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, completed: nextCompleted } : t))
    )

    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: user?.email,
          completed: nextCompleted,
        }),
      })
      if (!res.ok) throw new Error('Failed to update task')
      const data = await res.json()
      if (data.tasks) setTasks(data.tasks)
    } catch {
      toast.error('Could not update task status')
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, completed: task.completed } : t))
      )
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    const previous = tasks
    setTasks((prev) => prev.filter((t) => t.id !== taskId))
    try {
      const res = await fetch(
        `/api/tasks/${taskId}?email=${encodeURIComponent(user?.email || '')}`,
        { method: 'DELETE' }
      )
      if (!res.ok) throw new Error('Failed to delete task')
      toast.success('Task removed')
    } catch {
      setTasks(previous)
      toast.error('Failed to delete task')
    }
  }

  const cyclePresence = (memberId: string) => {
    const order: PresenceStatus[] = ['IN_COURT', 'REGISTRY', 'CHAMBERS']
    const current = presenceMap[memberId] || 'IN_COURT'
    const next = order[(order.indexOf(current) + 1) % order.length]
    setPresenceMap((prev) => ({ ...prev, [memberId]: next }))
    toast.success(`Updated status to ${PRESENCE_CONFIG[next].label}`)
  }

  const handleQuickCreateCase = async () => {
    if (!quickCaseForm.caseNumber || !quickCaseForm.opponentMainParty || !quickCaseForm.clientId) {
      toast.error('Please fill in all required fields')
      return
    }

    setCreating(true)
    try {
      const response = await fetch('/api/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: user?.email,
          caseNumber: quickCaseForm.caseNumber,
          clientId: quickCaseForm.clientId || undefined,
          opponentMainParty: quickCaseForm.opponentMainParty,
          appearingFor: quickCaseForm.appearingFor,
          filingDate: new Date().toISOString().split('T')[0],
          status: 'ACTIVE',
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create case')
      }

      const data = await response.json()
      toast.success('Case created successfully!')
      setShowQuickCreateDialog(false)
      setQuickCaseForm({
        caseNumber: '',
        clientId: '',
        opponentMainParty: '',
        appearingFor: 'PETITIONER',
      })
      setClientSearchQuery('')
      router.push(`/cases/${data.case.id}?newCase=true`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create case')
    } finally {
      setCreating(false)
    }
  }

  const handleQuickClientCreate = async () => {
    if (!quickClientName.trim() || !quickClientPhone.trim()) {
      toast.error('Please fill in client name and phone')
      return
    }

    setIsCreatingClient(true)
    try {
      const nameParts = quickClientName.trim().split(/\s+/)
      const firstName = nameParts[0]
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : undefined

      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: user?.email,
          firstName,
          lastName,
          phone: quickClientPhone,
          gender: 'MALE',
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create client')
      }

      const data = await response.json()
      const newClient = data.client
      toast.success('Client created successfully!')

      const fullName = lastName ? `${firstName} ${lastName}` : firstName
      setClientSearchQuery(fullName)
      setQuickCaseForm({ ...quickCaseForm, clientId: newClient.id })
      setClients([...clients, newClient])
      setShowQuickClientDialog(false)
      setQuickClientName('')
      setQuickClientPhone('')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create client')
    } finally {
      setIsCreatingClient(false)
    }
  }

  const filteredClients = clients.filter((client) => {
    const fullName = `${client.firstName} ${client.lastName || ''}`.toLowerCase()
    return fullName.includes(clientSearchQuery.toLowerCase())
  })

  useEffect(() => {
    async function fetchDashboardData() {
      if (!user?.email) return

      try {
        const response = await fetch(`/api/dashboard?email=${encodeURIComponent(user.email)}`)

        if (response.ok) {
          const data = await response.json()
          setTodaysHearings(data.todaysHearings || [])
          setWeekHearings(data.weekHearings || [])
          setUpcomingHearings(data.upcomingHearings || [])
          setActiveCasesCount(data.activeCasesCount || 0)
          setTasks(data.tasks || [])
          setTeamMembers(data.teamMembers || [])
          setCourts(data.courts || [])

          const initialPresence: Record<string, PresenceStatus> = {}
          const cycle: PresenceStatus[] = ['IN_COURT', 'REGISTRY', 'CHAMBERS']
          ;(data.teamMembers || []).forEach((m: TeamMemberSummary, idx: number) => {
            if (m.role === 'CLERK') {
              initialPresence[m.id] = 'REGISTRY'
            } else {
              initialPresence[m.id] = cycle[idx % cycle.length]
            }
          })
          setPresenceMap(initialPresence)
        } else {
          const errorData = await response.json()
          setError(errorData.error || 'Failed to load dashboard')
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
        setError('Failed to load dashboard')
      } finally {
        setLoadingData(false)
      }
    }

    if (!loading && user) {
      fetchDashboardData()
    }
  }, [user, loading])

  // Combined 7-day hearings for "This Week" view (Today + Week)
  const allWeekMatters = useMemo(() => {
    const map = new Map<string, HearingWithCase>()
    todaysHearings.forEach((h) => map.set(h.id, h))
    weekHearings.forEach((h) => map.set(h.id, h))
    return Array.from(map.values()).sort(
      (a, b) => new Date(a.hearingDate).getTime() - new Date(b.hearingDate).getTime()
    )
  }, [todaysHearings, weekHearings])

  // Group week matters by calendar date string (yyyy-MM-dd)
  const groupedWeekMatters = useMemo(() => {
    const groups: {
      dateKey: string
      dateObj: Date
      label: string
      chipLabel: string
      dotColor: string
      badgeColor: string
      hearings: HearingWithCase[]
    }[] = []

    const byDay = new Map<string, HearingWithCase[]>()
    allWeekMatters.forEach((h) => {
      const key = format(parseISO(h.hearingDate), 'yyyy-MM-dd')
      if (!byDay.has(key)) byDay.set(key, [])
      byDay.get(key)!.push(h)
    })

    byDay.forEach((list, key) => {
      const d = parseISO(list[0].hearingDate)
      let label = format(d, 'EEEE • dd MMM')
      let chipLabel = format(d, 'EEE dd MMM')
      let dotColor = 'bg-indigo-500'
      let badgeColor = 'bg-indigo-50 text-indigo-700 border-indigo-200/60'

      if (isToday(d)) {
        label = `Today • ${format(d, 'EEEE, dd MMM')}`
        chipLabel = `${format(d, 'EEE')} Today`
        dotColor = 'bg-emerald-500 animate-pulse'
        badgeColor = 'bg-indigo-50 text-indigo-700 border-indigo-200/60'
      } else if (isTomorrow(d)) {
        label = `Tomorrow • ${format(d, 'EEEE, dd MMM')}`
        chipLabel = `${format(d, 'EEE')} Tomorrow`
        dotColor = 'bg-blue-500'
        badgeColor = 'bg-blue-50 text-blue-700 border-blue-200/60'
      }

      groups.push({
        dateKey: key,
        dateObj: d,
        label,
        chipLabel,
        dotColor,
        badgeColor,
        hearings: list,
      })
    })

    return groups
  }, [allWeekMatters])

  if (loading || loadingData) {
    return (
      <div className="flex flex-col gap-8">
        <div className="h-12 w-64 bg-[#eaedff] rounded-xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-28 bg-[#eaedff] rounded-2xl animate-pulse" />
          <div className="h-28 bg-[#eaedff] rounded-2xl animate-pulse" />
          <div className="h-28 bg-[#eaedff] rounded-2xl animate-pulse" />
        </div>
        <div className="h-44 bg-[#eaedff] rounded-2xl animate-pulse" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center">
        <p className="text-red-700 font-semibold">{error}</p>
      </div>
    )
  }

  const getClientName = (hearing: HearingWithCase) => {
    if (hearing.case.client) {
      return `${hearing.case.client.firstName} ${hearing.case.client.lastName || ''}`.trim()
    }
    return hearing.case.otherParties[0] || 'Petitioner'
  }

  const getCounselNames = (hearing: HearingWithCase) => {
    const assigned = hearing.case.assignments
      ?.map((a) => a.user.name)
      .filter(Boolean) as string[] | undefined
    if (assigned && assigned.length > 0) {
      return assigned.map((n) => (/^adv\.?\s/i.test(n) ? n : `Adv. ${n}`)).join(' / ')
    }
    return user?.displayName ? `Adv. ${user.displayName}` : 'Chamber Counsel'
  }

  const getTaskUrgencyBadge = (task: TaskRecord) => {
    if (task.completed) {
      return {
        label: 'Completed',
        className: 'text-emerald-700 bg-emerald-50 border border-emerald-200 font-semibold',
      }
    }
    if (!task.dueDate) {
      return {
        label: task.category || 'Action Due',
        className: 'text-slate-600 bg-slate-100 border border-slate-200 font-medium',
      }
    }
    const due = parseISO(task.dueDate)
    const days = differenceInCalendarDays(due, new Date())
    if (isToday(due)) {
      return {
        label: 'Today, 4:00 PM',
        className: 'text-amber-800 bg-amber-50 border border-amber-200/80 font-medium',
      }
    }
    if (days < 0 || isPast(due)) {
      return {
        label: `${Math.abs(days)}d overdue`,
        className: 'text-rose-700 bg-rose-50 border border-rose-200 font-bold',
      }
    }
    if (days <= 5) {
      return {
        label: `${days} days left`,
        className: 'text-rose-700 bg-rose-50 border border-rose-200 font-bold',
      }
    }
    return {
      label: `${days} days left`,
      className: 'text-slate-600 bg-slate-100 border border-slate-200 font-medium',
    }
  }

  const featuredHearing =
    todaysHearings[0] || weekHearings[0] || upcomingHearings[0] || null

  const activeRegistryLabel =
    courts.length > 0
      ? courts.slice(0, 2).map((c) => c.name).join(' & ')
      : 'Delhi High Court & Tribunals'

  const filteredWeekGroups =
    selectedDayFilter === 'ALL'
      ? groupedWeekMatters
      : groupedWeekMatters.filter((g) => g.dateKey === selectedDayFilter)

  return (
    <div className="flex flex-col gap-8">
      {/* SUBTLE MINIMAL STATS ROW */}
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-[#131b2e]">Dashboard</h2>
            <p className="text-sm md:text-base text-[#545f73] mt-0.5">
              {format(new Date(), 'EEEE, MMMM d, yyyy')}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-sm text-[#545f73] hidden sm:flex items-center gap-2 mr-2">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span>Court Masters Synced: {format(new Date(), 'hh:mm a')}</span>
            </div>
            <button
              type="button"
              onClick={handleOpenQuickCreate}
              className="h-10 md:h-11 px-5 bg-[#004ac6] text-white rounded-lg text-sm md:text-base font-semibold hover:bg-[#2563eb] transition-colors flex items-center gap-2 shadow-sm shadow-[#004ac6]/20 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">add</span>
              <span>Case</span>
            </button>
          </div>
        </div>

        {/* 3 Hero Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: Today Hearings (Deep Electric Violet/Purple) */}
          <div
            onClick={() => setActiveTab('today')}
            className={`rounded-2xl p-6 bg-gradient-to-br from-[#581c87] via-[#6d28d9] to-[#7c3aed] text-white shadow-md shadow-purple-900/10 flex flex-col justify-between transition-transform hover:-translate-y-0.5 cursor-pointer ${
              activeTab === 'today' ? 'ring-2 ring-purple-400/50' : 'opacity-95 hover:opacity-100'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold uppercase tracking-wider text-purple-200">
                Today
              </span>
              <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-sm text-white flex items-center justify-center border border-white/20">
                <span className="material-symbols-outlined text-[24px]">calendar_today</span>
              </div>
            </div>
            <div className="mt-5 flex items-baseline gap-2.5">
              <span className="text-4xl md:text-5xl font-bold tracking-tight text-white">
                {todaysHearings.length}
              </span>
              <span className="text-sm md:text-base text-purple-100 font-medium">hearings scheduled</span>
            </div>
          </div>

          {/* Card 2: This Week Upcoming (Vibrant Indigo-Violet) */}
          <div
            onClick={() => setActiveTab('thisWeek')}
            className={`rounded-2xl p-6 bg-gradient-to-br from-[#4f46e5] via-[#6366f1] to-[#818cf8] text-white shadow-md shadow-indigo-900/10 flex flex-col justify-between transition-transform hover:-translate-y-0.5 cursor-pointer ${
              activeTab === 'thisWeek'
                ? 'ring-2 ring-indigo-400/50'
                : 'opacity-95 hover:opacity-100'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold uppercase tracking-wider text-indigo-100">
                This Week
              </span>
              <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-sm text-white flex items-center justify-center border border-white/20">
                <span className="material-symbols-outlined text-[24px]">trending_up</span>
              </div>
            </div>
            <div className="mt-5 flex items-baseline gap-2.5">
              <span className="text-4xl md:text-5xl font-bold tracking-tight text-white">
                {weekHearings.length}
              </span>
              <span className="text-sm md:text-base text-indigo-100 font-medium">upcoming matters</span>
            </div>
          </div>

          {/* Card 3: Active Cases (Electric Royal Blue) */}
          <Link
            href="/cases"
            className="rounded-2xl p-6 bg-gradient-to-br from-[#1d4ed8] via-[#2563eb] to-[#3b82f6] text-white shadow-md shadow-blue-900/10 flex flex-col justify-between transition-transform hover:-translate-y-0.5"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold uppercase tracking-wider text-blue-100">
                Active Cases
              </span>
              <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-sm text-white flex items-center justify-center border border-white/20">
                <span className="material-symbols-outlined text-[24px]">folder</span>
              </div>
            </div>
            <div className="mt-5 flex items-baseline gap-2.5">
              <span className="text-4xl md:text-5xl font-bold tracking-tight text-white">
                {activeCasesCount}
              </span>
              <span className="text-sm md:text-base text-blue-100 font-medium">in progress</span>
            </div>
          </Link>
        </div>
      </div>

      {/* IN-PAGE TAB TOGGLE BAR */}
      <div className="flex items-center justify-between border-b border-[#c3c6d7]/30 pb-1.5">
        <div className="flex items-center gap-2.5">
          {/* Today Tab Button */}
          <button
            type="button"
            onClick={() => setActiveTab('today')}
            className={
              activeTab === 'today'
                ? 'group relative px-5 py-2.5 rounded-lg text-sm md:text-base font-semibold transition-all flex items-center gap-2.5 text-[#004ac6] bg-[#e2e7ff]/60 shadow-xs border border-[#c3c6d7]/30 cursor-pointer'
                : 'group relative px-5 py-2.5 rounded-lg text-sm md:text-base font-medium transition-all flex items-center gap-2.5 text-[#545f73] hover:text-[#131b2e] hover:bg-[#f2f3ff] border border-transparent cursor-pointer'
            }
          >
            <span
              className={`material-symbols-outlined text-[20px] ${
                activeTab === 'today'
                  ? 'text-[#004ac6]'
                  : 'text-[#737686] group-hover:text-[#545f73]'
              }`}
            >
              schedule
            </span>
            <span>Today</span>
            <span
              className={
                activeTab === 'today'
                  ? 'ml-1 text-xs md:text-sm px-2.5 py-0.5 rounded-full font-bold bg-[#004ac6] text-white'
                  : 'ml-1 text-xs md:text-sm px-2.5 py-0.5 rounded-full font-medium bg-[#e2e7ff] text-[#545f73]'
              }
            >
              {todaysHearings.length}
            </span>
            {activeTab === 'today' && (
              <div className="absolute bottom-[-7px] left-3 right-3 h-[2px] bg-[#004ac6] rounded-full"></div>
            )}
          </button>

          {/* This Week Tab Button */}
          <button
            type="button"
            onClick={() => setActiveTab('thisWeek')}
            className={
              activeTab === 'thisWeek'
                ? 'group relative px-5 py-2.5 rounded-lg text-sm md:text-base font-semibold transition-all flex items-center gap-2.5 text-[#004ac6] bg-[#e2e7ff]/60 shadow-xs border border-[#c3c6d7]/30 cursor-pointer'
                : 'group relative px-5 py-2.5 rounded-lg text-sm md:text-base font-medium transition-all flex items-center gap-2.5 text-[#545f73] hover:text-[#131b2e] hover:bg-[#f2f3ff] border border-transparent cursor-pointer'
            }
          >
            <span
              className={`material-symbols-outlined text-[20px] ${
                activeTab === 'thisWeek'
                  ? 'text-[#004ac6]'
                  : 'text-[#737686] group-hover:text-[#545f73]'
              }`}
            >
              date_range
            </span>
            <span>This Week</span>
            <span
              className={
                activeTab === 'thisWeek'
                  ? 'ml-1 text-xs md:text-sm px-2.5 py-0.5 rounded-full font-bold bg-[#004ac6] text-white'
                  : 'ml-1 text-xs md:text-sm px-2.5 py-0.5 rounded-full font-medium bg-[#e2e7ff] text-[#545f73]'
              }
            >
              {weekHearings.length}
            </span>
            {activeTab === 'thisWeek' && (
              <div className="absolute bottom-[-7px] left-3 right-3 h-[2px] bg-[#004ac6] rounded-full"></div>
            )}
          </button>
        </div>

        <div className="flex items-center gap-2 text-sm text-[#545f73]">
          <span className="material-symbols-outlined text-[18px] text-[#737686]">tune</span>
          <span className="hidden sm:inline">Active Registry: {activeRegistryLabel}</span>
        </div>
      </div>

      {/* CONTAINER 1: TODAY VIEW CONTENT */}
      {activeTab === 'today' && (
        <div className="flex flex-col gap-8 transition-opacity duration-200">
          {/* SECTION 1: UP NEXT FOCUS CARD */}
          {featuredHearing && (
            <div className="bg-white rounded-2xl border border-[#c3c6d7]/30 border-l-4 border-l-[#6366f1] p-8 shadow-sm relative overflow-hidden">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div className="flex flex-col gap-2 max-w-3xl">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="px-3.5 py-1 rounded-full text-xs md:text-sm font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/80 shadow-xs flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span>
                      {isToday(parseISO(featuredHearing.hearingDate))
                        ? 'Up Next • In 35 mins'
                        : `Next Hearing • ${format(parseISO(featuredHearing.hearingDate), 'MMM d')}`}
                    </span>
                    <span className="text-sm text-[#545f73] font-medium">
                      {featuredHearing.case.court?.name || 'High Court'}
                      {featuredHearing.case.courtNumber
                        ? ` • Court Hall ${featuredHearing.case.courtNumber}`
                        : ''}
                    </span>
                    <span className="text-xs md:text-sm text-[#737686] font-mono">
                      CNR: {featuredHearing.case.id.slice(-14).toUpperCase()}
                    </span>
                  </div>

                  <h1 className="text-2xl md:text-3xl font-bold text-[#131b2e] tracking-tight mt-1">
                    {featuredHearing.case.caseNumber}
                  </h1>
                  <p className="text-base md:text-lg text-[#545f73] font-medium">
                    {getClientName(featuredHearing)} <span className="text-[#737686]">v.</span>{' '}
                    {featuredHearing.case.opponentMainParty}
                  </p>

                  <div className="flex flex-wrap items-center gap-6 mt-4 pt-4 border-t border-[#c3c6d7]/20 text-sm md:text-base text-[#545f73]">
                    <div>
                      <span className="text-[#737686]">Bench:</span>{' '}
                      <span className="text-[#131b2e] font-semibold">
                        {featuredHearing.case.judgeName || 'Division / Single Bench'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#737686]">Item:</span>{' '}
                      <span className="px-2.5 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold border border-indigo-200/70">
                        #{featuredHearing.itemNumber || '14'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#737686]">Stage:</span>{' '}
                      <span className="text-[#131b2e] font-semibold">
                        {featuredHearing.outcome ||
                          featuredHearing.notes?.[0]?.content ||
                          featuredHearing.case.caseType?.name ||
                          'Notice & Stay Motion'}
                      </span>
                    </div>
                    <div className="w-full sm:w-auto">
                      <span className="text-[#737686]">Counsel:</span>{' '}
                      <span className="text-[#131b2e] font-semibold">
                        {getCounselNames(featuredHearing)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Essential CTAs */}
                <div className="flex items-center md:self-center shrink-0">
                  <Link
                    href={`/cases/${featuredHearing.case.id}`}
                    className="w-full py-3 px-6 bg-indigo-50/70 hover:bg-indigo-100 text-indigo-700 hover:text-indigo-800 rounded-xl text-sm md:text-base font-semibold transition-all flex items-center justify-center gap-2 border border-indigo-200/80 shadow-sm"
                  >
                    <span className="material-symbols-outlined text-[20px] text-indigo-600">
                      description
                    </span>
                    <span>View Brief</span>
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* MAIN TWO-COLUMN CONTENT GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* LEFT COLUMN (7 COLS): TODAY'S HEARING AGENDA */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              <div className="flex items-center justify-between pb-1">
                <h2 className="text-lg md:text-xl font-bold text-[#131b2e] tracking-tight">
                  Today&apos;s Hearing Agenda
                </h2>
                <span className="text-sm text-[#545f73] font-medium">
                  {format(new Date(), 'EEEE, d MMM yyyy')}
                </span>
              </div>

              {todaysHearings.length === 0 ? (
                <div className="bg-white rounded-xl border border-[#c3c6d7]/30 p-8 md:p-10 text-center shadow-xs">
                  <span className="material-symbols-outlined text-[36px] text-[#004ac6] mb-2">
                    event_available
                  </span>
                  <h3 className="text-base md:text-lg font-semibold text-[#131b2e]">
                    No hearings scheduled for today
                  </h3>
                  <p className="text-sm md:text-base text-[#545f73] mt-1">
                    Switch to &ldquo;This Week&rdquo; to view your upcoming cause list ({weekHearings.length} matters).
                  </p>
                  {weekHearings.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setActiveTab('thisWeek')}
                      className="mt-4 px-5 py-2.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-sm font-semibold border border-indigo-200 transition-colors cursor-pointer"
                    >
                      View This Week&apos;s {weekHearings.length} Matters
                    </button>
                  )}
                </div>
              ) : (
                todaysHearings.map((hearing, idx) => {
                  const hasOutcome = Boolean(hearing.outcome)
                  return (
                    <Link
                      key={hearing.id}
                      href={`/cases/${hearing.case.id}`}
                      className={
                        hasOutcome
                          ? 'bg-white/60 rounded-xl border border-[#c3c6d7]/20 p-6 flex flex-col gap-3 opacity-80 hover:opacity-100 transition-opacity'
                          : 'bg-white rounded-xl border border-[#c3c6d7]/30 p-6 hover:border-indigo-300 transition-colors flex flex-col gap-3 shadow-xs'
                      }
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          {hasOutcome ? (
                            <span className="text-xs md:text-sm font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-2.5 py-0.5 rounded">
                              Disposed / Order
                            </span>
                          ) : (
                            <span className="text-xs md:text-sm font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/70 px-2.5 py-0.5 rounded">
                              Item #{hearing.itemNumber || String(idx + 1).padStart(2, '0')}
                            </span>
                          )}
                          <span className="text-sm text-[#545f73] font-medium">
                            {hearing.case.court?.name || 'District / High Court'}
                            {hearing.case.courtNumber
                              ? ` • Court ${hearing.case.courtNumber}`
                              : ''}
                          </span>
                        </div>

                        {hasOutcome ? (
                          <span className="text-sm font-semibold text-emerald-600">
                            Order Passed
                          </span>
                        ) : (
                          <span className="text-xs md:text-sm font-semibold text-indigo-950 bg-indigo-50/50 px-2.5 py-0.5 rounded">
                            {format(parseISO(hearing.hearingDate), 'hh:mm a')}
                          </span>
                        )}
                      </div>

                      <div>
                        <h3 className="text-base md:text-lg font-bold text-[#131b2e]">
                          {hearing.case.caseNumber}
                        </h3>
                        <p className="text-base font-medium text-[#545f73] mt-0.5">
                          {getClientName(hearing)} v. {hearing.case.opponentMainParty}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-[#c3c6d7]/20 text-sm text-[#545f73]">
                        <div>
                          <span className="text-[#737686]">
                            {hasOutcome ? 'Result:' : 'Stage:'}
                          </span>{' '}
                          <span className="font-medium text-[#131b2e]">
                            {hearing.outcome ||
                              hearing.notes?.[0]?.content ||
                              hearing.case.caseType?.name ||
                              'Hearing & Arguments'}
                          </span>
                        </div>
                        {hasOutcome ? (
                          <span className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 hover:underline">
                            View Order
                          </span>
                        ) : (
                          <div>
                            <span className="text-[#737686]">Lead:</span>{' '}
                            <span className="font-medium text-[#131b2e]">
                              {getCounselNames(hearing)}
                            </span>
                          </div>
                        )}
                      </div>
                    </Link>
                  )
                })
              )}
            </div>

            {/* RIGHT COLUMN (5 COLS): TASKS, DEADLINES & TEAM PRESENCE */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              {/* DAILY TASKS & LIMITATION DEADLINES */}
              <div className="bg-white rounded-xl border border-[#c3c6d7]/30 p-6 flex flex-col gap-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <h3 className="text-base md:text-lg font-bold text-[#131b2e]">
                    Tasks &amp; Limitation Deadlines
                  </h3>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleOpenTaskDialog}
                      className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
                    >
                      + Add Task
                    </button>
                    <Link
                      href="/tasks"
                      className="text-sm text-[#737686] hover:text-[#131b2e] font-medium"
                    >
                      Action Due
                    </Link>
                  </div>
                </div>

                {tasks.length === 0 ? (
                  <div className="p-5 rounded-lg bg-[#f2f3ff]/50 border border-[#c3c6d7]/30 text-center">
                    <p className="text-sm font-medium text-[#545f73]">
                      No limitation deadlines or chamber tasks recorded yet.
                    </p>
                    <button
                      type="button"
                      onClick={handleOpenTaskDialog}
                      className="mt-2 text-sm font-semibold text-indigo-600 hover:underline cursor-pointer"
                    >
                      + Add Written Statement / Registry Deadline
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {tasks.slice(0, 5).map((task) => {
                      const badge = getTaskUrgencyBadge(task)
                      return (
                        <div
                          key={task.id}
                          className="group flex items-start gap-3.5 p-3.5 rounded-lg bg-[#f2f3ff]/50 border border-transparent hover:border-[#c3c6d7]/40 transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={task.completed}
                            onChange={() => handleToggleTask(task)}
                            className="mt-1 h-4 w-4 rounded border-[#c3c6d7] text-indigo-600 focus:ring-0 cursor-pointer"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span
                                className={`text-base font-semibold truncate ${
                                  task.completed
                                    ? 'line-through text-[#737686]'
                                    : 'text-[#131b2e]'
                                }`}
                              >
                                {task.title}
                              </span>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <span
                                  className={`text-xs md:text-sm px-2.5 py-0.5 rounded-full ${badge.className}`}
                                >
                                  {badge.label}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteTask(task.id)}
                                  className="opacity-0 group-hover:opacity-100 text-[#737686] hover:text-red-600 transition-opacity cursor-pointer"
                                  title="Delete task"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                            <p className="text-sm text-[#545f73] mt-1 truncate">
                              {[
                                task.caseNumber,
                                task.description,
                                task.assignedToName ? `${task.assignedToName} assigned` : null,
                              ]
                                .filter(Boolean)
                                .join(' • ') || 'Chamber task'}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* CHAMBER TEAM & COURT PRESENCE */}
              <div className="bg-white rounded-xl border border-[#c3c6d7]/30 p-6 flex flex-col gap-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <h3 className="text-base md:text-lg font-bold text-[#131b2e]">
                    Chamber Team &amp; Presence
                  </h3>
                  <button
                    type="button"
                    onClick={() =>
                      toast.success('Quick broadcast message sent to all chamber members.')
                    }
                    className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 hover:underline transition-colors cursor-pointer"
                  >
                    Ping All
                  </button>
                </div>

                <div className="flex flex-col gap-4">
                  {teamMembers.slice(0, 5).map((member, index) => {
                    const presence = presenceMap[member.id] || 'IN_COURT'
                    const pConfig = PRESENCE_CONFIG[presence]
                    const initial = (member.name || member.email || 'U')
                      .replace(/^Adv\.?\s*/i, '')
                      .charAt(0)
                      .toUpperCase()
                    const activeCase = member.assignedCases?.[0]?.case
                    const roleLabel =
                      member.customRole?.name ||
                      (member.role === 'ADMIN'
                        ? 'Lead'
                        : member.role === 'CLERK'
                        ? 'Registry'
                        : 'Junior')

                    const displayName = member.name
                      ? member.role === 'CLERK' || /^adv\.?\s/i.test(member.name)
                        ? member.name
                        : `Adv. ${member.name} (${roleLabel})`
                      : member.email.split('@')[0]

                    const subtitle = activeCase
                      ? `${activeCase.court?.name || 'Physical Court'}${
                          activeCase.courtNumber ? ` ${activeCase.courtNumber}` : ''
                        } • ${activeCase.caseNumber}`
                      : member.specialization || `${roleLabel} • Chamber Desk`

                    return (
                      <div
                        key={member.id}
                        className="flex items-start justify-between gap-3 text-base"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-9 h-9 rounded-full ${
                              AVATAR_GRADIENTS[index % AVATAR_GRADIENTS.length]
                            } text-white font-bold flex items-center justify-center text-sm shadow-xs shrink-0`}
                          >
                            {initial}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-[#131b2e] truncate">
                              {displayName}
                            </div>
                            <div className="text-sm text-[#545f73] truncate">
                              {subtitle}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => cyclePresence(member.id)}
                          title="Click to update presence"
                          className={`px-3 py-1 text-xs md:text-sm font-semibold border rounded-full flex items-center gap-1.5 shrink-0 cursor-pointer ${pConfig.pillClass}`}
                        >
                          <span className={`w-2 h-2 rounded-full ${pConfig.dotClass}`}></span>{' '}
                          {pConfig.label}
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONTAINER 2: THIS WEEK VIEW CONTENT */}
      {activeTab === 'thisWeek' && (
        <div className="flex flex-col gap-8 transition-opacity duration-200">
          {/* QUICK DAY FILTER CHIPS */}
          <div className="flex items-center justify-between flex-wrap gap-3 p-4 bg-white rounded-xl border border-[#c3c6d7]/30 shadow-xs">
            <div className="flex items-center gap-2 overflow-x-auto">
              <span className="text-xs md:text-sm font-bold text-[#737686] uppercase tracking-wider mr-1">
                Filter Days:
              </span>
              <button
                type="button"
                onClick={() => setSelectedDayFilter('ALL')}
                className={
                  selectedDayFilter === 'ALL'
                    ? 'px-3.5 py-2 rounded-lg text-xs md:text-sm font-semibold bg-[#004ac6] text-white shadow-xs cursor-pointer'
                    : 'px-3.5 py-2 rounded-lg text-xs md:text-sm font-medium text-[#545f73] bg-[#f2f3ff] hover:bg-[#e2e7ff] transition-colors cursor-pointer'
                }
              >
                All ({allWeekMatters.length})
              </button>
              {groupedWeekMatters.map((group) => (
                <button
                  key={group.dateKey}
                  type="button"
                  onClick={() => setSelectedDayFilter(group.dateKey)}
                  className={
                    selectedDayFilter === group.dateKey
                      ? 'px-3.5 py-2 rounded-lg text-xs md:text-sm font-semibold bg-[#004ac6] text-white shadow-xs cursor-pointer'
                      : 'px-3.5 py-2 rounded-lg text-xs md:text-sm font-medium text-[#545f73] bg-[#f2f3ff] hover:bg-[#e2e7ff] transition-colors cursor-pointer'
                  }
                >
                  {group.chipLabel} ({group.hearings.length})
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 text-sm text-[#545f73] font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span>Live Cause Lists Synced</span>
            </div>
          </div>

          {/* MAIN TWO-COLUMN CONTENT GRID FOR THIS WEEK */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* LEFT COLUMN (7 COLS): 7-DAY GROUPED CAUSE AGENDA */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              {filteredWeekGroups.length === 0 ? (
                <div className="bg-white rounded-xl border border-[#c3c6d7]/30 p-8 md:p-10 text-center shadow-xs">
                  <p className="text-base md:text-lg font-semibold text-[#131b2e]">
                    No hearings scheduled this week
                  </p>
                  <p className="text-sm md:text-base text-[#545f73] mt-1">
                    Your 7-day cause list is clear.
                  </p>
                </div>
              ) : (
                filteredWeekGroups.map((group) => (
                  <div key={group.dateKey} className="flex flex-col gap-3.5">
                    <div className="flex items-center justify-between pb-1.5 border-b border-[#c3c6d7]/20">
                      <div className="flex items-center gap-2.5">
                        <span className={`w-2.5 h-2.5 rounded-full ${group.dotColor}`}></span>
                        <h3 className="text-base md:text-lg font-bold text-[#131b2e]">{group.label}</h3>
                        <span
                          className={`text-xs md:text-sm px-2.5 py-0.5 rounded-full font-semibold border ${group.badgeColor}`}
                        >
                          {group.hearings.length}{' '}
                          {group.hearings.length === 1 ? 'Matter' : 'Matters'}
                        </span>
                      </div>
                      {isToday(group.dateObj) ? (
                        <button
                          type="button"
                          onClick={() => setActiveTab('today')}
                          className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
                        >
                          Jump to Focus
                        </button>
                      ) : (
                        <span className="text-sm text-[#545f73]">
                          {group.hearings.length} Listed
                        </span>
                      )}
                    </div>

                    {group.hearings.map((hearing, idx) => (
                      <div
                        key={hearing.id}
                        className="bg-white rounded-xl border border-[#c3c6d7]/30 p-6 hover:border-indigo-300 transition-colors flex flex-col gap-3 shadow-xs"
                      >
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-2.5">
                            <span className="text-xs md:text-sm font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/70 px-2.5 py-0.5 rounded">
                              Item #{hearing.itemNumber || String(idx + 1).padStart(2, '0')}
                            </span>
                            <span className="text-sm text-[#545f73] font-medium">
                              {hearing.case.court?.name || 'High Court'}
                              {hearing.case.courtNumber
                                ? ` • Court ${hearing.case.courtNumber}`
                                : ''}
                            </span>
                            <span className="text-xs md:text-sm font-semibold text-[#131b2e] bg-[#e2e7ff] px-2.5 py-0.5 rounded">
                              {format(parseISO(hearing.hearingDate), 'hh:mm a')}
                            </span>
                          </div>
                          <span className="px-3 py-0.5 text-xs md:text-sm font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-600"></span> Brief
                            Ready
                          </span>
                        </div>

                        <div>
                          <h4 className="text-base md:text-lg font-bold text-[#131b2e]">
                            {hearing.case.caseNumber}
                          </h4>
                          <p className="text-base font-medium text-[#545f73] mt-0.5">
                            {getClientName(hearing)} v. {hearing.case.opponentMainParty}
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-[#c3c6d7]/20 text-sm text-[#545f73]">
                          <div>
                            <span className="text-[#737686]">Stage:</span>{' '}
                            <span className="font-medium text-[#131b2e]">
                              {hearing.outcome ||
                                hearing.notes?.[0]?.content ||
                                hearing.case.caseType?.name ||
                                'Further Proceedings'}
                            </span>{' '}
                            ({getCounselNames(hearing)})
                          </div>
                          <Link
                            href={`/cases/${hearing.case.id}`}
                            className="px-3.5 py-1.5 bg-[#f2f3ff] hover:bg-[#e2e7ff] text-indigo-700 rounded-lg text-sm font-semibold transition-colors"
                          >
                            View Brief
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ))
              )}
            </div>

            {/* RIGHT COLUMN (5 COLS): WEEKLY DEPLOYMENTS & STATUTORY DEADLINES */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              {/* CHAMBER WEEKLY COURT DEPLOYMENTS */}
              <div className="bg-white rounded-xl border border-[#c3c6d7]/30 p-6 flex flex-col gap-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base md:text-lg font-bold text-[#131b2e]">
                      Chamber Weekly Deployments
                    </h3>
                    <p className="text-sm text-[#545f73]">Team assignment schedule</p>
                  </div>
                  <span className="text-xs md:text-sm px-2.5 py-0.5 rounded bg-[#e2e7ff] text-[#545f73] font-semibold">
                    {teamMembers.length} Members
                  </span>
                </div>

                <div className="flex flex-col gap-3.5">
                  {teamMembers.slice(0, 4).map((member, index) => {
                    const presence = presenceMap[member.id] || 'IN_COURT'
                    const pConfig = PRESENCE_CONFIG[presence]
                    const initial = (member.name || member.email || 'U')
                      .replace(/^Adv\.?\s*/i, '')
                      .charAt(0)
                      .toUpperCase()
                    const activeCase = member.assignedCases?.[0]?.case
                    const roleLabel =
                      member.customRole?.name ||
                      (member.role === 'ADMIN'
                        ? 'Senior / Lead'
                        : member.role === 'CLERK'
                        ? 'Registry Clerk'
                        : 'Associate')

                    return (
                      <div
                        key={member.id}
                        className="flex items-start justify-between gap-3 p-3.5 rounded-lg bg-[#f2f3ff]/50 border border-[#c3c6d7]/30"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-9 h-9 rounded-full ${
                              AVATAR_GRADIENTS[index % AVATAR_GRADIENTS.length]
                            } text-white font-bold flex items-center justify-center text-sm shadow-xs shrink-0`}
                          >
                            {initial}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-base text-[#131b2e] truncate">
                              {member.name || member.email}
                            </div>
                            <div className="text-sm text-[#545f73] truncate">
                              {activeCase?.court?.name || member.specialization || roleLabel}
                            </div>
                            <div className="text-xs md:text-sm text-indigo-700 font-medium mt-0.5 truncate">
                              {activeCase
                                ? `Handling ${activeCase.caseNumber}`
                                : 'Assigned across active cause list'}
                            </div>
                          </div>
                        </div>
                        <span
                          className={`px-3 py-1 text-xs md:text-sm font-semibold border rounded-full shrink-0 ${pConfig.pillClass}`}
                        >
                          {pConfig.deployBadge}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* UPCOMING STATUTORY DEADLINES FOR THE WEEK */}
              <div className="bg-white rounded-xl border border-[#c3c6d7]/30 p-6 flex flex-col gap-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <h3 className="text-base md:text-lg font-bold text-[#131b2e]">
                    Upcoming Deadlines This Week
                  </h3>
                  <span className="text-sm text-[#737686] font-medium">Limitation Act</span>
                </div>

                {tasks.length === 0 ? (
                  <p className="text-sm text-[#545f73] text-center py-4">
                    No statutory deadlines due this week.
                  </p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {tasks.slice(0, 4).map((task, idx) => {
                      const badge = getTaskUrgencyBadge(task)
                      const isUrgent = idx === 0 && !task.completed
                      return (
                        <div
                          key={task.id}
                          className={
                            isUrgent
                              ? 'p-3.5 rounded-lg bg-rose-50/50 border border-rose-200/80'
                              : 'p-3.5 rounded-lg bg-[#f2f3ff]/50 border border-[#c3c6d7]/30'
                          }
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span
                              className={`text-base font-semibold truncate ${
                                isUrgent ? 'text-rose-950' : 'text-[#131b2e]'
                              }`}
                            >
                              {task.title}
                            </span>
                            <span
                              className={`text-xs md:text-sm px-2.5 py-0.5 rounded-full shrink-0 ${badge.className}`}
                            >
                              {badge.label}
                            </span>
                          </div>
                          <p
                            className={`text-sm mt-1 truncate ${
                              isUrgent ? 'text-rose-900/80' : 'text-[#545f73]'
                            }`}
                          >
                            {[task.caseNumber, task.description].filter(Boolean).join(' • ') ||
                              'Statutory compliance deadline'}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Task / Limitation Deadline Dialog */}
      <Dialog open={showTaskDialog} onOpenChange={setShowTaskDialog}>
        <DialogContent className="sm:max-w-[480px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#131b2e]">
              Add Task or Limitation Deadline
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-[#545f73]">
              Track statutory filing deadlines, registry defects, caveats, or chamber tasks.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="taskTitle" className="text-xs font-semibold text-[#131b2e]">
                Task / Deadline Title <span className="text-red-600">*</span>
              </Label>
              <Input
                id="taskTitle"
                value={taskForm.title}
                onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                placeholder="e.g., Written Statement (120 Days) or Registry Defect Clearance"
                className="h-10 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="taskCategory" className="text-xs font-semibold text-[#131b2e]">
                  Category
                </Label>
                <select
                  id="taskCategory"
                  value={taskForm.category}
                  onChange={(e) => setTaskForm({ ...taskForm, category: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg border border-[#c3c6d7]/60 bg-white text-sm text-[#131b2e]"
                >
                  <option value="LIMITATION">Limitation Deadline</option>
                  <option value="REGISTRY">Registry Defect</option>
                  <option value="CAVEAT">Caveat Expiry</option>
                  <option value="FILING">Filing / Reply</option>
                  <option value="DEADLINE">General Task</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="taskDueDate" className="text-xs font-semibold text-[#131b2e]">
                  Due Date
                </Label>
                <Input
                  id="taskDueDate"
                  type="date"
                  value={taskForm.dueDate}
                  onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                  className="h-10 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="taskCase" className="text-xs font-semibold text-[#131b2e]">
                  Linked Case (Optional)
                </Label>
                <select
                  id="taskCase"
                  value={taskForm.caseId}
                  onChange={(e) => setTaskForm({ ...taskForm, caseId: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg border border-[#c3c6d7]/60 bg-white text-sm text-[#131b2e]"
                >
                  <option value="none">No linked case</option>
                  {allCases.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.caseNumber}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="taskAssignee" className="text-xs font-semibold text-[#131b2e]">
                  Assign To (Optional)
                </Label>
                <select
                  id="taskAssignee"
                  value={taskForm.assignedToId}
                  onChange={(e) => setTaskForm({ ...taskForm, assignedToId: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg border border-[#c3c6d7]/60 bg-white text-sm text-[#131b2e]"
                >
                  <option value="none">Unassigned</option>
                  {teamMembers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name || m.email}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="taskDesc" className="text-xs font-semibold text-[#131b2e]">
                Notes / Reference Details
              </Label>
              <Input
                id="taskDesc"
                value={taskForm.description}
                onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                placeholder="e.g., Non-extendable statutory limitation • Diary No. 89201/2026"
                className="h-10 text-sm"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowTaskDialog(false)}
              disabled={creatingTask}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleCreateTask}
              disabled={creatingTask}
              className="bg-[#004ac6] hover:bg-[#2563eb] text-white"
            >
              {creatingTask ? 'Saving...' : 'Save Deadline'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick Case Creation Dialog */}
      <Dialog open={showQuickCreateDialog} onOpenChange={setShowQuickCreateDialog}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-[540px] rounded-xl sm:rounded-2xl max-h-[95vh] p-0 gap-0 overflow-hidden flex flex-col">
          <div
            className="flex-1 overflow-y-auto px-4 sm:px-6 pt-4 sm:pt-6"
            style={{ maxHeight: 'calc(95vh - 80px)' }}
          >
            <DialogHeader className="space-y-2 sm:space-y-3">
              <div className="mx-auto w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-[#004ac6] flex items-center justify-center">
                <Briefcase className="h-5 w-5 sm:h-7 sm:w-7 text-white" />
              </div>
              <DialogTitle className="text-xl sm:text-2xl font-semibold text-center">
                New Case
              </DialogTitle>
              <DialogDescription className="text-center text-sm sm:text-base">
                Create case quickly. Add more details later.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 sm:space-y-5 py-3 sm:py-4">
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="caseNumber" className="text-xs sm:text-sm font-medium text-[#131b2e]">
                  Case Number <span className="text-red-600">*</span>
                </Label>
                <Input
                  id="caseNumber"
                  value={quickCaseForm.caseNumber}
                  onChange={(e) =>
                    setQuickCaseForm({ ...quickCaseForm, caseNumber: e.target.value })
                  }
                  placeholder="e.g., WP(C) 4520/2026"
                  className="h-9 sm:h-11 text-sm sm:text-base"
                />
              </div>

              <div className="space-y-2 sm:space-y-3">
                <Label className="text-xs sm:text-sm font-medium text-[#131b2e]">
                  Appearing For <span className="text-red-600">*</span>
                </Label>
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <label
                    className={`flex items-center justify-center gap-2 cursor-pointer rounded-lg border-2 p-2 sm:p-3 transition-all ${
                      quickCaseForm.appearingFor === 'PETITIONER'
                        ? 'border-[#004ac6] bg-[#f2f3ff] text-[#004ac6]'
                        : 'border-[#c3c6d7]/50 bg-white hover:border-[#737686]'
                    }`}
                  >
                    <input
                      type="radio"
                      value="PETITIONER"
                      checked={quickCaseForm.appearingFor === 'PETITIONER'}
                      onChange={(e) =>
                        setQuickCaseForm({
                          ...quickCaseForm,
                          appearingFor: e.target.value as 'PETITIONER' | 'RESPONDENT',
                        })
                      }
                      className="sr-only"
                    />
                    <span className="font-medium text-xs sm:text-sm">Petitioner</span>
                  </label>
                  <label
                    className={`flex items-center justify-center gap-2 cursor-pointer rounded-lg border-2 p-2 sm:p-3 transition-all ${
                      quickCaseForm.appearingFor === 'RESPONDENT'
                        ? 'border-[#004ac6] bg-[#f2f3ff] text-[#004ac6]'
                        : 'border-[#c3c6d7]/50 bg-white hover:border-[#737686]'
                    }`}
                  >
                    <input
                      type="radio"
                      value="RESPONDENT"
                      checked={quickCaseForm.appearingFor === 'RESPONDENT'}
                      onChange={(e) =>
                        setQuickCaseForm({
                          ...quickCaseForm,
                          appearingFor: e.target.value as 'PETITIONER' | 'RESPONDENT',
                        })
                      }
                      className="sr-only"
                    />
                    <span className="font-medium text-xs sm:text-sm">Respondent</span>
                  </label>
                </div>
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="client" className="text-xs sm:text-sm font-medium text-[#131b2e]">
                  Client <span className="text-red-600">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="client"
                    value={clientSearchQuery}
                    onChange={(e) => {
                      setClientSearchQuery(e.target.value)
                      setShowClientDropdown(true)
                    }}
                    onFocus={() => setShowClientDropdown(true)}
                    placeholder="Search or create client"
                    autoComplete="off"
                    className="h-9 sm:h-11 text-sm sm:text-base"
                  />
                  {showClientDropdown && clientSearchQuery && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-[#c3c6d7]/40 rounded-lg sm:rounded-xl shadow-lg max-h-48 sm:max-h-64 overflow-auto">
                      {filteredClients.length > 0 ? (
                        <>
                          {filteredClients.map((client) => (
                            <button
                              key={client.id}
                              type="button"
                              onClick={() => {
                                const fullName = client.lastName
                                  ? `${client.firstName} ${client.lastName}`
                                  : client.firstName
                                setClientSearchQuery(fullName)
                                setQuickCaseForm({ ...quickCaseForm, clientId: client.id })
                                setShowClientDropdown(false)
                              }}
                              className="w-full text-left px-3 sm:px-4 py-2 sm:py-3 hover:bg-[#f2f3ff] text-xs sm:text-sm border-b border-[#c3c6d7]/20 last:border-0 transition-colors"
                            >
                              {client.firstName} {client.lastName || ''}
                            </button>
                          ))}
                        </>
                      ) : (
                        <div className="p-4 sm:p-6 text-center">
                          <p className="text-xs sm:text-sm text-[#545f73] mb-3 sm:mb-4">
                            No matching clients found
                          </p>
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => {
                              setQuickClientName(clientSearchQuery)
                              setShowClientDropdown(false)
                              setShowQuickClientDialog(true)
                            }}
                            className="gap-2 bg-[#004ac6] hover:bg-[#2563eb] text-white h-8 text-xs sm:h-9 sm:text-sm"
                          >
                            <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                            Create New Client
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <Label
                  htmlFor="opponentMainParty"
                  className="text-xs sm:text-sm font-medium text-[#131b2e]"
                >
                  Opponent Main Party <span className="text-red-600">*</span>
                </Label>
                <Input
                  id="opponentMainParty"
                  value={quickCaseForm.opponentMainParty}
                  onChange={(e) =>
                    setQuickCaseForm({ ...quickCaseForm, opponentMainParty: e.target.value })
                  }
                  placeholder="e.g., Union of India & Ors"
                  className="h-9 sm:h-11 text-sm sm:text-base"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-3 px-4 sm:px-6 pb-4 sm:pb-6 pt-3 sm:pt-4 border-t border-[#c3c6d7]/20">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowQuickCreateDialog(false)}
              disabled={creating}
              className="flex-1 h-9 sm:h-10 text-xs sm:text-sm"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleQuickCreateCase}
              disabled={creating}
              className="flex-1 bg-[#004ac6] hover:bg-[#2563eb] text-white h-9 sm:h-10 text-xs sm:text-sm"
            >
              {creating ? 'Creating...' : 'Create Case'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick Client Creation Dialog */}
      <Dialog open={showQuickClientDialog} onOpenChange={setShowQuickClientDialog}>
        <DialogContent className="sm:max-w-[440px] rounded-2xl">
          <DialogHeader className="space-y-3">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
              <Plus className="h-7 w-7 text-white" />
            </div>
            <DialogTitle className="text-2xl font-semibold text-center">
              Create New Client
            </DialogTitle>
            <DialogDescription className="text-center text-base">
              Enter basic client details to create a new record.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-6">
            <div className="space-y-2">
              <Label htmlFor="quickClientName" className="text-sm font-medium text-[#131b2e]">
                Client Name <span className="text-red-600">*</span>
              </Label>
              <Input
                id="quickClientName"
                value={quickClientName}
                onChange={(e) => setQuickClientName(e.target.value)}
                placeholder="Enter full name"
                className="h-11 text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quickClientPhone" className="text-sm font-medium text-[#131b2e]">
                Phone Number <span className="text-red-600">*</span>
              </Label>
              <Input
                id="quickClientPhone"
                value={quickClientPhone}
                onChange={(e) => setQuickClientPhone(e.target.value)}
                placeholder="Enter phone number"
                className="h-11 text-base"
              />
            </div>
          </div>

          <DialogFooter className="gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowQuickClientDialog(false)}
              disabled={isCreatingClient}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleQuickClientCreate}
              disabled={isCreatingClient}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {isCreatingClient ? 'Creating...' : 'Create Client'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
