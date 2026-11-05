/**
 * Realistic Adversarial Worst-Case Fixtures for RateIT UI Stress-Testing
 * Built strictly according to CATALOG.md & Karpathy Guidelines.
 * 
 * Rules:
 * 1. Plausible & schema-backed, never synthetic gibberish.
 * 2. Uses example.com domains for test emails/links.
 * 3. Mixes diverse edge cases across rows (ZWJ emoji names, diacritics, RTL, unbreakable strings, singular counts).
 */

export const WORST_CASE_PLACE = {
  id: "worst-case-pune-inst-01",
  name: "Maharshi Karve Stree Shikshan Samstha's Cummins College of Engineering for Women (Autonomous), Karve Nagar",
  category: "COACHING" as const,
  description:
    "Autonomous engineering institution in Karve Nagar established in 1991. Offers undergraduate and postgraduate engineering degrees with specializations in AI, Data Science, and Computer Engineering. Features a sprawling campus, dedicated research labs, and structured campus placement assistance for Pune students.",
  address: "Survey No. 42/1A, Off Paud Road, Opposite Ideal Colony Ground, Near MIT World Peace University Entrance Gate 3, Kothrud",
  city: "Pune - 411038",
  latitude: 18.497321,
  longitude: 73.817845,
  avgRating: 4.88888,
  bayesianRating: 4.82,
  reviewCount: 1284,
  priceRange: "$$$$",
  imageUrl: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=800&auto=format&fit=crop&q=80",
  tags: [
    "upsc-prelims-and-mains-intensive-foundation-batch",
    "Autonomous",
    "AI & Data Science",
    "Hostel Available",
    "WiFi Campus",
    "Cafeteria",
    "Placement Cell",
    "Central Library",
    "Industry Collaboration",
    "customer-feedback-from-enterprise-onboarding",
  ],
  isVerifiedBiz: true,
  reviews: [
    // Row 1: ZWJ Emoji Name + Unbreakable Email & URL + 1000-char BizReply + 1,284 votes
    {
      id: "rev-worst-01",
      rating: 5,
      text: "Outstanding lab facilities and dedicated faculty. For fee disputes, contact bartholomew.fitzgerald@northwind-industries-holdings.example.com or review the latest accreditation documentation at https://example.com/workspaces/acme/projects/q3-launch/docs/9f8e7d6c5b4a?tab=comments&filter=unresolved immediately.",
      tags: ["Autonomous", "Placement Cell", "Central Library"],
      photoUrls: [
        "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=600&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1562774053-701939374585?w=600&auto=format&fit=crop&q=80",
      ],
      checkinVerified: true,
      publishDate: new Date(Date.now() - 1000 * 60 * 2), // 2 mins ago
      user: {
        id: "usr-worst-01",
        displayName: "👩🏽‍💻 Priya", // ZWJ sequence tests surrogate splitting bug
        avatarUrl: null,
        trustScore: 88, // Trusted Resident
      },
      bizReply: {
        text: "Thank you for the comprehensive feedback regarding our academic infrastructure. We maintain rigorous standards across all undergraduate departments and continuously audit research laboratory equipment in accordance with national accreditation benchmarks. If you require further assistance regarding syllabus progression or internship credits, our administrative office remains at your service during regular campus hours.",
        publishedAt: new Date(Date.now() - 1000 * 60 * 1),
      },
    },

    // Row 2: Long Hyphenated Name with Polish Diacritics + Vietnamese & German Unbreakable Text + Zero Votes
    {
      id: "rev-worst-02",
      rating: 1,
      text: "Khóa học rất tốt nhưng Đặng Thị Ngọc Hân phàn nàn về Benachrichtigungseinstellungen trong hệ thống thông báo. Sĩ số lớp quá đông và thủ tục đăng ký thi lại quá phức tạp.",
      tags: ["Hostel Available", "WiFi Campus"],
      photoUrls: [],
      checkinVerified: false,
      publishDate: new Date("2026-04-12T10:30:00Z"),
      user: {
        id: "usr-worst-02",
        displayName: "Aleksandra Wiśniewska-Kowalczyk", // Long hyphenated name with diacritics
        avatarUrl: null,
        trustScore: 28, // Community Member
      },
      bizReply: null,
    },

    // Row 3: Single-Letter Name + Single Pluralization Edge Case (1 helpful vote) + Whitespace Comment
    {
      id: "rev-worst-03",
      rating: 3,
      text: "   ", // Whitespace-only string
      tags: ["Autonomous"],
      photoUrls: [],
      checkinVerified: true,
      publishDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3), // 3 days ago
      user: {
        id: "usr-worst-03",
        displayName: "J", // 1 letter name
        avatarUrl: null,
        trustScore: 95, // Trusted Resident
      },
      bizReply: null,
    },

    // Row 4: Emoji-First Name (Surrogate pair) + RTL Arabic Text + 404 Photo URL
    {
      id: "rev-worst-04",
      rating: 4,
      text: "تجربة تعليمية ممتازة مع هيئة تدريس متميزة في بيئة دراسية هادئة ومحفزة للطلاب، وتتوفر خدمات تقنية متقدمة في جميع القاعات.",
      tags: ["AI & Data Science", "Central Library"],
      photoUrls: [
        "https://example.com/non-existent-broken-photo-404.jpg", // Broken image check
      ],
      checkinVerified: true,
      publishDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 45), // 45 days ago
      user: {
        id: "usr-worst-04",
        displayName: "🦊 Fox", // Leading emoji surrogate pair
        avatarUrl: null,
        trustScore: 62, // Verified Visitor
      },
      bizReply: null,
    },

    // Row 5: Long Name with Roman Suffix + Extreme 1,500-character Grievance
    {
      id: "rev-worst-05",
      rating: 2,
      text: "Attended the advanced foundation batch for 6 months. While the core mathematics faculty was capable, administrative coordination for internal mock examinations was severely disorganized. Notification schedules were altered with less than twelve hours advance notice, leaving working professionals and commuting students stranded. Furthermore, air conditioning units in lecture hall 4 remained inoperable throughout peak summer temperatures despite repeated written petitions submitted to facility maintenance. For an autonomous institution charging premium coaching fees, student basic welfare and classroom climate control should not be treated as optional amenities. Ensure you obtain all commitments in writing prior to remitting registration fees.",
      tags: ["Industry Collaboration", "Placement Cell"],
      photoUrls: [],
      checkinVerified: false,
      publishDate: new Date("2026-01-05T08:15:00Z"),
      user: {
        id: "usr-worst-05",
        displayName: "Christopher Alexander Montgomery III", // Suffix + long name
        avatarUrl: null,
        trustScore: 45, // Verified Visitor
      },
      bizReply: null,
    },
  ],
}

export const EMPTY_PLACE = {
  id: "empty-place-pune-01",
  name: "New Unrated Pune Spot",
  category: "LOCAL_SERVICE" as const,
  description: null,
  address: "FC Road",
  city: "Pune",
  latitude: 18.5204,
  longitude: 73.8567,
  avgRating: 0,
  bayesianRating: 0,
  reviewCount: 0,
  priceRange: null,
  imageUrl: null,
  tags: [],
  isVerifiedBiz: false,
  reviews: [],
}

export const SINGLE_REVIEW_PLACE = {
  id: "single-review-place-pune-01",
  name: "Kothrud Chai Point",
  category: "CAFE" as const,
  description: "Small local tea stall near Karve Statue.",
  address: "Near Karve Statue, Kothrud",
  city: "Pune",
  latitude: 18.5012,
  longitude: 73.8195,
  avgRating: 5.0,
  bayesianRating: 4.2,
  reviewCount: 1, // Tests singular "1 verified reviews" bug
  priceRange: "$",
  imageUrl: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=800&auto=format&fit=crop&q=80",
  tags: ["Irani Chai", "Quick Service"],
  isVerifiedBiz: false,
  reviews: [
    {
      id: "rev-single-01",
      rating: 5,
      text: "Best morning cutting chai in Kothrud. Fast and authentic.",
      tags: ["Irani Chai"],
      photoUrls: [],
      checkinVerified: true,
      publishDate: new Date(),
      user: {
        id: "usr-single-01",
        displayName: "Amit",
        avatarUrl: null,
        trustScore: 78,
      },
      bizReply: null,
    },
  ],
}

