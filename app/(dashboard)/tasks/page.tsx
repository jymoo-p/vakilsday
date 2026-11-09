'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Check,
  Plus,
  Trash2,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Gavel,
  Search,
} from 'lucide-react'
import Link from 'next/link'
import { differenceInCalendarDays, format, isPast, isToday, parseISO } from 'date-fns'
import { toast } from 'sonner'
import type { TaskRecord } from '@/lib/tasks-db'

const CATEGORY_LABELS: Record<string, { label: string; className: string }> = {
  LIMITATION: {
    label: 'Statutory Limitation',
    className: 'bg-red-50 text-red-700 border-red-200/70',
  },
  REGISTRY: {
    label: 'Registry Defect',
    className: 'bg-amber-50 text-amber-700 border-amber-200/70',
  },
  CAVEAT: {
    label: 'Caveat Expiry',
    className: 'bg-purple-50 text-purple-700 border-purple-200/70',
  },
  FILING: {
    label: 'Filing / Pleadings',
    className: 'bg-blue-50 text-blue-700 border-blue-200/70',
  },
  DEADLINE: {
    label: 'Chamber Task',
    className: 'bg-slate-100 text-slate-700 border-slate-200/70',
  },
}

export default function TasksPage() {
  const { user, loading } = useAuth()
  const [tasks, setTasks] = useState<TaskRecord[]>([])
  const [cases, setCases] = useState<any[]>([])
  const [teamMembers, setTeamMembers] = useState<any[]>([])
  const [loadingTasks, setLoadingTasks] = useState(true)
  const [filter, setFilter] = useState<string>('ALL')
  const [search, setSearch] = useState('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({
    title: '',
    description: '',
    dueDate: '',
    category: 'LIMITATION',
    priority: 'HIGH',
    caseId: 'none',
    assignedToId: 'none',
  })

  useEffect(() => {
    async function loadData() {
      if (!user?.email) return
      try {
        const [dashboardRes, casesRes] = await Promise.all([
          fetch(`/api/dashboard?email=${encodeURIComponent(user.email)}`),
          fetch(`/api/cases?email=${encodeURIComponent(user.email)}`),
        ])
        if (dashboardRes.ok) {
          const d = await dashboardRes.json()
          setTasks(d.tasks || [])
          setTeamMembers(d.teamMembers || [])
        }
        if (casesRes.ok) {
          const c = await casesRes.json()
          setCases(c.cases || [])
        }
      } catch (err) {
        console.error('Error loading tasks page:', err)
      } finally {
        setLoadingTasks(false)
      }
    }

    if (!loading && user) {
      loadData()
    }
  }, [user, loading])

  const handleCreateTask = async () => {
    if (!form.title.trim()) {
      toast.error('Please enter a task or limitation title')
      return
    }
    setCreating(true)
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: user?.email,
          ...form,
        }),
      })
      if (!res.ok) throw new Error('Failed to create task')
      const data = await res.json()
      setTasks(data.tasks || [])
      toast.success('Task added successfully')
      setShowCreateDialog(false)
      setForm({
        title: '',
        description: '',
        dueDate: '',
        category: 'LIMITATION',
        priority: 'HIGH',
        caseId: 'none',
        assignedToId: 'none',
      })
    } catch {
      toast.error('Failed to create task')
    } finally {
      setCreating(false)
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
      if (!res.ok) throw new Error()
      const data = await res.json()
      if (data.tasks) setTasks(data.tasks)
    } catch {
      toast.error('Could not update task')
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, completed: task.completed } : t))
      )
    }
  }

  const handleDeleteTask = async (id: string) => {
    const prev = tasks
    setTasks((list) => list.filter((t) => t.id !== id))
    try {
      const res = await fetch(
        `/api/tasks/${id}?email=${encodeURIComponent(user?.email || '')}`,
        { method: 'DELETE' }
      )
      if (!res.ok) throw new Error()
      toast.success('Task deleted')
    } catch {
      setTasks(prev)
      toast.error('Could not delete task')
    }
  }

  const getUrgencyBadge = (task: TaskRecord) => {
    if (task.completed) {
      return {
        label: 'Completed',
        className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      }
    }
    if (!task.dueDate) {
      return {
        label: 'No deadline',
        className: 'bg-slate-100 text-slate-600 border-slate-200',
      }
    }
    const due = parseISO(task.dueDate)
    const days = differenceInCalendarDays(due, new Date())
    if (isToday(due)) {
      return {
        label: 'Due Today',
        className: 'bg-amber-50 text-amber-700 border-amber-200',
      }
    }
    if (days < 0 || isPast(due)) {
      return {
        label: `${Math.abs(days)}d overdue`,
        className: 'bg-red-50 text-red-600 border-red-200',
      }
    }
    if (days <= 5) {
      return {
        label: `${days} days left`,
        className: 'bg-red-50 text-red-600 border-red-200',
      }
    }
    return {
      label: `${days} days left (${format(due, 'MMM d')})`,
      className: 'bg-slate-100 text-slate-700 border-slate-200',
    }
  }

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'PENDING' && t.completed) return false
    if (filter === 'COMPLETED' && !t.completed) return false
    if (['LIMITATION', 'REGISTRY', 'CAVEAT', 'FILING'].includes(filter) && t.category !== filter) {
      return false
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      const matchesTitle = t.title.toLowerCase().includes(q)
      const matchesDesc = (t.description || '').toLowerCase().includes(q)
      const matchesCase = (t.caseNumber || '').toLowerCase().includes(q)
      const matchesAssignee = (t.assignedToName || '').toLowerCase().includes(q)
      return matchesTitle || matchesDesc || matchesCase || matchesAssignee
    }
    return true
  })

  const pendingCount = tasks.filter((t) => !t.completed).length
  const urgentCount = tasks.filter((t) => {
    if (t.completed || !t.dueDate) return false
    const days = differenceInCalendarDays(parseISO(t.dueDate), new Date())
    return days <= 5
  }).length
  const completedCount = tasks.filter((t) => t.completed).length

  if (loading || loadingTasks) {
    return (
      <div className="space-y-6 max-w-6xl">
        <div className="h-10 w-72 bg-slate-200/70 rounded-xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-28 bg-slate-200/70 rounded-2xl animate-pulse" />
          <div className="h-28 bg-slate-200/70 rounded-2xl animate-pulse" />
          <div className="h-28 bg-slate-200/70 rounded-2xl animate-pulse" />
        </div>
        <div className="h-96 bg-slate-200/70 rounded-2xl animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold text-slate-900 tracking-tight">
            Tasks & Limitation Deadlines
          </h1>
          <p className="text-sm md:text-base text-slate-500 mt-0.5">
            Track statutory filing periods, registry defects, caveats, and chamber action items
          </p>
        </div>

        <Button
          onClick={() => setShowCreateDialog(true)}
          className="gap-2 bg-[#004ac6] hover:bg-[#2563eb] text-white font-semibold rounded-xl h-10 md:h-11 px-5 text-sm md:text-base shadow-sm cursor-pointer"
        >
          <Plus className="h-4 w-4 stroke-[2.5]" />
          New Deadline / Task
        </Button>
      </div>

      {/* Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-red-600">
              Urgent / ≤ 5 Days
            </p>
            <p className="text-4xl font-heading font-bold text-slate-900 mt-1">{urgentCount}</p>
            <p className="text-sm text-slate-500 mt-0.5">statutory & immediate actions</p>
          </div>
          <div className="p-3.5 rounded-xl bg-red-50 text-red-600">
            <AlertTriangle className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-[#004ac6]">
              Pending Actions
            </p>
            <p className="text-4xl font-heading font-bold text-slate-900 mt-1">{pendingCount}</p>
            <p className="text-sm text-slate-500 mt-0.5">open tasks across cases</p>
          </div>
          <div className="p-3.5 rounded-xl bg-blue-50 text-[#004ac6]">
            <Clock className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-emerald-600">
              Completed
            </p>
            <p className="text-4xl font-heading font-bold text-slate-900 mt-1">{completedCount}</p>
            <p className="text-sm text-slate-500 mt-0.5">filings & clearances done</p>
          </div>
          <div className="p-3.5 rounded-xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Filter Bar & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80">
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'ALL', label: 'All' },
            { id: 'PENDING', label: 'Pending' },
            { id: 'LIMITATION', label: 'Limitation' },
            { id: 'REGISTRY', label: 'Registry Defects' },
            { id: 'CAVEAT', label: 'Caveats' },
            { id: 'COMPLETED', label: 'Completed' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-4 py-2 rounded-lg text-xs md:text-sm font-semibold transition-colors cursor-pointer ${
                filter === tab.id
                  ? 'bg-[#004ac6] text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by title, case, lawyer..."
            className="w-full h-10 pl-10 pr-3 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-blue-500"
          />
        </div>
      </div>

      {/* Tasks List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 divide-y divide-slate-100">
        {filteredTasks.length === 0 ? (
          <div className="p-12 text-center">
            <Calendar className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <p className="text-base md:text-lg font-semibold text-slate-900">No tasks match this view</p>
            <p className="text-sm md:text-base text-slate-500 mt-1 mb-4">
              Add a statutory limitation deadline, registry defect clearance, or caveat alert.
            </p>
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="bg-[#004ac6] hover:bg-[#2563eb] text-white rounded-xl"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Add Task
            </Button>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const urgency = getUrgencyBadge(task)
            const cat = CATEGORY_LABELS[task.category] || CATEGORY_LABELS.DEADLINE
            return (
              <div
                key={task.id}
                className="p-5 sm:p-6 flex items-start justify-between gap-4 hover:bg-slate-50/60 transition-colors"
              >
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => handleToggleTask(task)}
                    className={`mt-1 h-5 w-5 rounded-md flex items-center justify-center border transition-colors shrink-0 cursor-pointer ${
                      task.completed
                        ? 'bg-[#4f46e5] border-[#4f46e5] text-white'
                        : 'bg-white border-slate-300 hover:border-[#4f46e5]'
                    }`}
                  >
                    {task.completed && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                  </button>

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span
                        className={`text-base md:text-lg font-bold ${
                          task.completed ? 'line-through text-slate-400' : 'text-slate-900'
                        }`}
                      >
                        {task.title}
                      </span>
                      <span
                        className={`text-xs font-semibold px-2.5 py-0.5 rounded-md border ${cat.className}`}
                      >
                        {cat.label}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                      {task.caseId && task.caseNumber && (
                        <Link
                          href={`/cases/${task.caseId}`}
                          className="inline-flex items-center gap-1 font-semibold text-[#004ac6] hover:underline"
                        >
                          <Gavel className="h-3.5 w-3.5" />
                          {task.caseNumber}
                        </Link>
                      )}
                      {task.description && <span>{task.description}</span>}
                      {task.assignedToName && (
                        <span className="text-slate-600 font-medium">
                          Assigned: {task.assignedToName}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span
                    className={`text-xs md:text-sm font-semibold px-3 py-1 rounded-full border ${urgency.className}`}
                  >
                    {urgency.label}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeleteTask(task.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Delete task"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Create Task Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[480px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900">
              Add Task or Limitation Deadline
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-slate-500">
              Create a new limitation period, registry clearance, caveat alert, or chamber task.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="title" className="text-xs font-semibold text-slate-700">
                Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g., Written Statement (120 Days)"
                className="h-10 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="cat" className="text-xs font-semibold text-slate-700">
                  Category
                </Label>
                <select
                  id="cat"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-800"
                >
                  <option value="LIMITATION">Limitation Deadline</option>
                  <option value="REGISTRY">Registry Defect</option>
                  <option value="CAVEAT">Caveat Expiry</option>
                  <option value="FILING">Filing / Reply</option>
                  <option value="DEADLINE">Chamber Task</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="due" className="text-xs font-semibold text-slate-700">
                  Due Date
                </Label>
                <Input
                  id="due"
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                  className="h-10 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="caseSelect" className="text-xs font-semibold text-slate-700">
                  Linked Case
                </Label>
                <select
                  id="caseSelect"
                  value={form.caseId}
                  onChange={(e) => setForm({ ...form, caseId: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-800"
                >
                  <option value="none">No linked case</option>
                  {cases.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.caseNumber}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="memberSelect" className="text-xs font-semibold text-slate-700">
                  Assign To
                </Label>
                <select
                  id="memberSelect"
                  value={form.assignedToId}
                  onChange={(e) => setForm({ ...form, assignedToId: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-800"
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
              <Label htmlFor="desc" className="text-xs font-semibold text-slate-700">
                Reference / Notes
              </Label>
              <Input
                id="desc"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="e.g., Non-extendable statutory period • Diary No. 89201/2026"
                className="h-10 text-sm"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
              disabled={creating}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleCreateTask}
              disabled={creating}
              className="bg-[#1d4ed8] hover:bg-[#1e40af] text-white"
            >
              {creating ? 'Saving...' : 'Save Deadline'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
