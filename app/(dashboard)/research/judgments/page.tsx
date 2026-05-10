'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, Scale, ExternalLink } from 'lucide-react'
import { format } from 'date-fns'

interface JudgmentResult {
  id: string
  title: string
  court: string
  date: string
  judges: string[]
  citation?: string
  url?: string
  summary?: string
}

const COURTS = [
  { value: '', label: 'All Courts' },
  { value: 'supreme court', label: 'Supreme Court' },
  { value: 'delhi high court', label: 'Delhi High Court' },
  { value: 'bombay high court', label: 'Bombay High Court' },
  { value: 'madras high court', label: 'Madras High Court' },
  { value: 'calcutta high court', label: 'Calcutta High Court' },
  { value: 'karnataka high court', label: 'Karnataka High Court' },
]

export default function JudgmentsPage() {
  const [query, setQuery] = useState('')
  const [court, setCourt] = useState('')
  const [results, setResults] = useState<JudgmentResult[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    setLoading(true)
    setSearched(true)

    try {
      const params = new URLSearchParams({
        q: query,
        limit: '20',
      })
      if (court) {
        params.append('court', court)
      }

      const res = await fetch(`/api/search/judgments?${params.toString()}`)
      const data = await res.json()
      setResults(data.results || [])
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Judgment Search</h2>
        <p className="text-muted-foreground">Find Supreme Court and High Court judgments</p>
      </div>

      <form onSubmit={handleSearch}>
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search judgments... (e.g., habeas corpus, property dispute)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10 h-12 text-base"
              />
            </div>
            <Button type="submit" size="lg" disabled={loading}>
              {loading ? 'Searching...' : 'Search'}
            </Button>
          </div>

          <Select value={court} onValueChange={setCourt}>
            <SelectTrigger className="w-full md:w-64">
              <SelectValue placeholder="Filter by court" />
            </SelectTrigger>
            <SelectContent>
              {COURTS.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </form>

      {loading && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Searching judgment databases...</p>
        </div>
      )}

      {!loading && searched && results.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Scale className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No judgments found</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Try different keywords or change the court filter
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {!loading && results.length > 0 && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Found {results.length} results</p>
          {results.map((judgment) => (
            <Card key={judgment.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <CardTitle className="text-lg leading-snug">{judgment.title}</CardTitle>
                    <CardDescription className="mt-2">
                      {judgment.court} • {judgment.date}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {judgment.citation && (
                  <div>
                    <p className="text-sm font-medium">Citation:</p>
                    <p className="text-sm text-muted-foreground">{judgment.citation}</p>
                  </div>
                )}

                {judgment.judges && judgment.judges.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Judges:</p>
                    <div className="flex flex-wrap gap-2">
                      {judgment.judges.map((judge, idx) => (
                        <Badge key={idx} variant="secondary">
                          {judge}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {judgment.summary && (
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {judgment.summary}
                  </p>
                )}

                <div className="flex gap-2">
                  {judgment.url && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => window.open(judgment.url, '_blank')}
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Read Full Judgment
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!searched && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Scale className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">Start your search</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Search for judgments by topic, case name, or legal issue
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
