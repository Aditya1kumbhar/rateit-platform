import { Metadata } from 'next'
import Link from 'next/link'
import { GraduationCap, Home, Coffee, Utensils, Wrench, BookOpen, ChevronRight, Sparkles, ArrowRight } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Categories Directory: RateIT Pune',
  description: 'Browse verified coaching classes, student hostels, cafes, and local services in Pune.',
}

export default function CategoriesPage() {
  const categories = [
    {
      name: "Coaching Classes",
      slug: "coaching-classes",
      icon: GraduationCap,
      count: "34 Verified Centers",
      tag: "Top JEE/NEET Hubs",
      description: "Faculty, mock test quality, batch sizes, and physical attendance tracking across Kothrud and FC Road.",
    },
    {
      name: "PGs & Hostels",
      slug: "pgs-hostels",
      icon: Home,
      count: "58 Verified Stays",
      tag: "Biometric & Mess Checked",
      description: "Authentic student resident reviews on food mess quality, WiFi speed, security deposits, and curfews.",
    },
    {
      name: "Cafés & Study Spots",
      slug: "cafes",
      icon: Coffee,
      count: "42 Study Hubs",
      tag: "Power Sockets & WiFi",
      description: "Noise levels, laptop friendliness, espresso quality, and seating capacity for deep study sessions.",
    },
    {
      name: "Restaurants & Messes",
      slug: "restaurants",
      icon: Utensils,
      count: "67 Verified Spots",
      tag: "Hygiene & Taste Rated",
      description: "Student-budget daily thali messes, historic Irani cafes, and quick bites verified on-site.",
    },
    {
      name: "Local Services",
      slug: "local-services",
      icon: Wrench,
      count: "29 Verified Services",
      tag: "Repairs & Utilities",
      description: "Essential student services: thesis printing, laptop repairs, and laundry pickups.",
    },
    {
      name: "Libraries & Study Spaces",
      slug: "coaching-classes",
      icon: BookOpen,
      count: "12 Silent Hubs",
      tag: "24/7 Study Halls",
      description: "Air-conditioned reading rooms and competitive exam study libraries across Pune.",
    },
  ]

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl space-y-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-fg-subtle">
        <Link href="/" className="hover:text-fg transition-colors">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-fg-subtle" />
        <span className="text-fg font-medium">All Pune Categories</span>
      </nav>

      {/* Header */}
      <div className="p-6 sm:p-8 rounded-modal bg-surface border-0 relative overflow-hidden shadow-sm">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 text-xs text-accent-link font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            Pune Directory
          </div>
          <h1 className="text-3xl sm:text-4xl font-semibold text-fg tracking-[-0.022em]">
            Pune Categories Directory
          </h1>
          <p className="text-fg-muted text-sm max-w-2xl leading-relaxed">
            Browse verified listings across Pune&apos;s key student hubs: FC Road, Kothrud, Hinjewadi, and Viman Nagar.
          </p>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {categories.map((cat, idx) => (
          <Link
            key={idx}
            href={`/category/${cat.slug}`}
            className="apple-press group apple-focus rounded-card"
            style={{ animationDelay: `${Math.min(idx * 40, 240)}ms` }}
          >
            <div className="p-6 rounded-card bg-surface hover:bg-surface-2 transition-[background-color] duration-150 border-0 shadow-sm h-full flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-11 h-11 rounded-full bg-accent-tint text-accent-link flex items-center justify-center">
                    <cat.icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-semibold text-accent-link bg-accent-tint px-2.5 py-0.5 rounded-full border border-accent-link/20">
                    {cat.tag}
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-fg tracking-[-0.022em] group-hover:text-accent-link transition-colors">
                    {cat.name}
                  </h3>
                  <p className="text-xs text-fg-subtle mt-0.5">{cat.count}</p>
                </div>

                <p className="text-xs text-fg-muted leading-relaxed">
                  {cat.description}
                </p>
              </div>

              <div className="pt-3 border-t border-hairline flex items-center justify-between text-xs text-accent-link font-semibold">
                <span>Explore spots</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
