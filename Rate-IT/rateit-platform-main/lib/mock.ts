/**
 * Pune Seed Data for Development
 * 
 * Realistic mock data for V1 launch categories:
 * - Coaching Classes
 * - PGs / Hostels
 * - Cafés
 * - Restaurants
 * - Local Services
 * 
 * All coordinates are real Pune locations.
 */

export const PUNE_SEED_PLACES = [
  // ========== COACHING CLASSES ==========
  {
    id: "1",
    name: "IIT JEE Academy",
    category: "COACHING" as const,
    description: "JEE/NEET preparation with experienced faculty. Known for small batch sizes and personal attention.",
    address: "FC Road, Deccan Gymkhana",
    city: "Pune",
    latitude: 18.5204,
    longitude: 73.8567,
    avgRating: 4.3,
    reviewCount: 47,
    tags: ["JEE", "NEET", "Small Batches", "Study Material"],
    priceRange: "$$$",
  },
  {
    id: "2",
    name: "Mahesh Tutorials",
    category: "COACHING" as const,
    description: "SSC/HSC board exam coaching. Multiple branches across Pune. Strong in Maths and Science.",
    address: "Karve Nagar",
    city: "Pune",
    latitude: 18.4973,
    longitude: 73.8178,
    avgRating: 3.9,
    reviewCount: 82,
    tags: ["SSC", "HSC", "Maths", "Science", "Multiple Branches"],
    priceRange: "$$",
  },
  {
    id: "3",
    name: "Kale Classes",
    category: "COACHING" as const,
    description: "UPSC and MPSC preparation. Marathi and English medium. Evening batches available.",
    address: "Shivajinagar",
    city: "Pune",
    latitude: 18.5314,
    longitude: 73.8446,
    avgRating: 4.1,
    reviewCount: 34,
    tags: ["UPSC", "MPSC", "Evening Batch", "Test Series"],
    priceRange: "$$",
  },
  {
    id: "4",
    name: "Code Academy Pune",
    category: "COACHING" as const,
    description: "Full-stack web development bootcamp. 6-month program with placement assistance.",
    address: "Baner",
    city: "Pune",
    latitude: 18.5591,
    longitude: 73.7868,
    avgRating: 4.6,
    reviewCount: 28,
    tags: ["Coding", "Web Dev", "Placement", "Full Stack"],
    priceRange: "$$$",
  },

  // ========== PGs & HOSTELS ==========
  {
    id: "5",
    name: "Sunrise PG for Boys",
    category: "PG_HOSTEL" as const,
    description: "Boys PG near Kothrud bus stop. Includes meals, WiFi, and laundry. AC rooms available.",
    address: "Kothrud",
    city: "Pune",
    latitude: 18.5074,
    longitude: 73.8077,
    avgRating: 3.8,
    reviewCount: 56,
    tags: ["Boys", "Meals Included", "WiFi", "AC Rooms", "Near Bus Stop"],
    priceRange: "$$",
  },
  {
    id: "6",
    name: "Green Villa Hostel",
    category: "PG_HOSTEL" as const,
    description: "Co-living space near Hinjewadi IT Park. Modern amenities, gym, and parking.",
    address: "Hinjewadi Phase 1",
    city: "Pune",
    latitude: 18.5912,
    longitude: 73.7388,
    avgRating: 4.4,
    reviewCount: 41,
    tags: ["Co-living", "Gym", "Parking", "Near IT Park", "Modern"],
    priceRange: "$$$",
  },
  {
    id: "7",
    name: "Comfort Stay PG",
    category: "PG_HOSTEL" as const,
    description: "Girls PG with strict timings. Home-cooked Maharashtrian meals. CCTV security.",
    address: "Aundh",
    city: "Pune",
    latitude: 18.5600,
    longitude: 73.8070,
    avgRating: 4.0,
    reviewCount: 23,
    tags: ["Girls", "Maharashtrian Food", "CCTV", "Safe"],
    priceRange: "$$",
  },

  // ========== CAFÉS ==========
  {
    id: "8",
    name: "Café Good Luck",
    category: "CAFE" as const,
    description: "Iconic FC Road café since 1951. Famous for bun maska and Irani chai. A Pune institution.",
    address: "FC Road",
    city: "Pune",
    latitude: 18.5196,
    longitude: 73.8423,
    avgRating: 4.5,
    reviewCount: 189,
    tags: ["Bun Maska", "Irani Chai", "Iconic", "Budget"],
    priceRange: "$",
  },
  {
    id: "9",
    name: "Vohuman Café",
    category: "CAFE" as const,
    description: "Classic Pune breakfast spot. Cheese omelette and chai is legendary. Cash only.",
    address: "Sassoon Road",
    city: "Pune",
    latitude: 18.5165,
    longitude: 73.8692,
    avgRating: 4.3,
    reviewCount: 145,
    tags: ["Breakfast", "Omelette", "Cash Only", "Quick Service"],
    priceRange: "$",
  },

  // ========== RESTAURANTS ==========
  {
    id: "10",
    name: "Vaishali Restaurant",
    category: "RESTAURANT" as const,
    description: "Legendary South Indian restaurant on FC Road. Known for dosas and filter coffee.",
    address: "FC Road",
    city: "Pune",
    latitude: 18.5187,
    longitude: 73.8419,
    avgRating: 4.2,
    reviewCount: 312,
    tags: ["South Indian", "Dosa", "Filter Coffee", "Vegetarian"],
    priceRange: "$$",
  },
  {
    id: "11",
    name: "Shreemaya Celebrity",
    category: "RESTAURANT" as const,
    description: "Pure veg thali restaurant. Unlimited Maharashtrian and Rajasthani thalis.",
    address: "JM Road",
    city: "Pune",
    latitude: 18.5236,
    longitude: 73.8477,
    avgRating: 4.0,
    reviewCount: 87,
    tags: ["Thali", "Unlimited", "Vegetarian", "Family"],
    priceRange: "$$",
  },
]

export const PUNE_SEED_REVIEWS = [
  {
    placeIndex: 0, // IIT JEE Academy
    rating: 5,
    text: "Best JEE coaching in Pune. Faculty actually cares about students. Batch size is 30, so you get personal attention. Study material is comprehensive.",
    tags: ["Good Faculty", "Study Material", "Results"],
    checkinVerified: true,
    trustTier: "trusted" as const,
    displayName: "Aniket S.",
  },
  {
    placeIndex: 0,
    rating: 4,
    text: "Good teaching but fees are on the higher side. ₹1.2L for one year. Worth it if you can afford it.",
    tags: ["Good Faculty", "Affordable"],
    checkinVerified: true,
    trustTier: "neutral" as const,
    displayName: "Priya K.",
  },
  {
    placeIndex: 4, // Sunrise PG
    rating: 3,
    text: "Rooms are okay, food is decent Maharashtrian. But water supply is a problem — hot water only in morning slot. WiFi drops frequently.",
    tags: ["Food", "Water Supply"],
    checkinVerified: true,
    trustTier: "trusted" as const,
    displayName: "Rohit M.",
  },
  {
    placeIndex: 5, // Green Villa Hostel
    rating: 5,
    text: "Best co-living space near Hinjewadi. Gym is great, rooms are modern, and the community vibe is good. Monthly events and movie nights.",
    tags: ["Modern", "WiFi", "Clean"],
    checkinVerified: true,
    trustTier: "trusted" as const,
    displayName: "Sneha P.",
  },
  {
    placeIndex: 7, // Café Good Luck
    rating: 5,
    text: "A Pune legend. The bun maska here is unmatched. Come early on weekends — it gets crowded. ₹30 for the best breakfast in the city.",
    tags: ["Bun Maska", "Irani Chai", "Budget"],
    checkinVerified: false,
    trustTier: "neutral" as const,
    displayName: "Amit D.",
  },
]
