import { Card, CardContent } from '@/components/ui/card'
import { Bookmark } from 'lucide-react'

export default function BookmarksPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Research Bookmarks</h2>
        <p className="text-muted-foreground">Your saved legal references</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <Bookmark className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No bookmarks yet</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Save important acts and judgments for quick access
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
