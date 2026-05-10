import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Scale, Calendar, FileText, Users, Search } from 'lucide-react'
import Link from 'next/link'

export default async function Home() {
  const session = await getServerSession(authOptions)

  if (session) {
    redirect('/onboarding')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scale className="w-8 h-8 text-primary" />
            <span className="text-2xl font-bold">VakilsDay</span>
          </div>
          <Link href="/auth/signin">
            <Button size="lg">Sign In</Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl font-bold tracking-tight mb-6">
          Daily Practice Management
          <br />
          <span className="text-primary">for Indian Lawyers</span>
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Replace your paper diary with a digital system. Track cases, manage hearings,
          and access legal research—all in one place.
        </p>
        <Link href="/auth/signin">
          <Button size="lg" className="text-lg px-8 py-6">
            Get Started - It's Free
          </Button>
        </Link>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-20">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <FeatureCard
            icon={<Calendar className="w-8 h-8" />}
            title="Today's Schedule"
            description="See all your hearings for today with court and item numbers"
          />
          <FeatureCard
            icon={<FileText className="w-8 h-8" />}
            title="Case Management"
            description="Track all case details, documents, and hearing history"
          />
          <FeatureCard
            icon={<Search className="w-8 h-8" />}
            title="Legal Research"
            description="Search Indian bare acts and judgments instantly"
          />
          <FeatureCard
            icon={<Users className="w-8 h-8" />}
            title="Team Collaboration"
            description="Share cases with associates and clerks in your firm"
          />
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="bg-primary text-primary-foreground rounded-2xl p-12">
          <h2 className="text-3xl font-bold mb-4">Ready to go digital?</h2>
          <p className="text-lg mb-6 opacity-90">
            Create your law firm workspace in 30 seconds
          </p>
          <Link href="/auth/signin">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-6">
              Sign In with Google
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>© 2026 VakilsDay. Built for Indian litigation lawyers.</p>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
      <div className="text-primary mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  )
}
