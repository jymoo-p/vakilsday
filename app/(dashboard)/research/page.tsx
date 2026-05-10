import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BookOpen, Scale, Bookmark } from 'lucide-react'

export default function ResearchPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Legal Research</h2>
        <p className="text-muted-foreground">Search Indian laws and judgments</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Link href="/research/bare-acts">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Bare Acts</CardTitle>
              <CardDescription>
                Search Indian central and state acts with full text access
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">Search Acts</Button>
            </CardContent>
          </Card>
        </Link>

        <Link href="/research/judgments">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Scale className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Judgments</CardTitle>
              <CardDescription>
                Find Supreme Court and High Court judgments with citations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">Search Judgments</Button>
            </CardContent>
          </Card>
        </Link>

        <Link href="/research/bookmarks">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Bookmark className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Bookmarks</CardTitle>
              <CardDescription>
                Access your saved legal research and references
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="secondary">
                View Bookmarks
              </Button>
            </CardContent>
          </Card>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Tips</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
            <li>Use specific keywords for better search results</li>
            <li>Filter judgments by court for targeted research</li>
            <li>Bookmark important references for quick access</li>
            <li>Search results are cached for faster subsequent queries</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
