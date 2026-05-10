'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Search, BookOpen, ExternalLink } from 'lucide-react'

interface BareActResult {
  id: string
  title: string
  year: string
  sections: string[]
  url?: string
  excerpt?: string
}

export default function BareActsPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<BareActResult[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    setLoading(true)
    setSearched(true)

    try {
      const res = await fetch(`/api/search/bare-acts?q=${encodeURIComponent(query)}&limit=20`)
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
        <h2 className="text-3xl font-bold tracking-tight">Bare Acts Search</h2>
        <p className="text-muted-foreground">Search Indian central and state legislation</p>
      </div>

      <form onSubmit={handleSearch}>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search for acts... (e.g., Indian Penal Code, Evidence Act)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 h-12 text-base"
            />
          </div>
          <Button type="submit" size="lg" disabled={loading}>
            {loading ? 'Searching...' : 'Search'}
          </Button>
        </div>
      </form>

      {loading && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Searching legal databases...</p>
        </div>
      )}

      {!loading && searched && results.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No results found</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Try different keywords or check your spelling
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {!loading && results.length > 0 && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Found {results.length} results</p>
          {results.map((act) => (
            <Card key={act.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <CardTitle className="text-xl">{act.title}</CardTitle>
                    <CardDescription className="mt-1 text-base">
                      Year: {act.year}
                    </CardDescription>
                  </div>
                  <Badge variant="outline">{act.year}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {act.sections && act.sections.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Key Sections:</p>
                    <div className="flex flex-wrap gap-2">
                      {act.sections.slice(0, 5).map((section, idx) => (
                        <Badge key={idx} variant="secondary">
                          {section}
                        </Badge>
                      ))}
                      {act.sections.length > 5 && (
                        <Badge variant="secondary">
                          +{act.sections.length - 5} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {act.excerpt && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {act.excerpt}
                  </p>
                )}

                <div className="flex gap-2">
                  {act.url && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => window.open(act.url, '_blank')}
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      View Full Act
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
              <BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">Start your search</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Search for Indian acts by name or topic
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
