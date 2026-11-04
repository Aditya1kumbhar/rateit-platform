import { PrismaClient, Category, ClaimStatus } from '@prisma/client'
import { PUNE_SEED_PLACES, PUNE_SEED_REVIEWS } from '../lib/mock'
import { calculateBayesianRating } from '../lib/bayesian'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding Pune database...')

  // 1. Create Demo Users
  const user1 = await prisma.user.upsert({
    where: { phone: '+919876543210' },
    update: {},
    create: {
      phone: '+919876543210',
      phoneVerified: true,
      displayName: 'Aniket S.',
      trustScore: 85.0,
      consentGiven: true,
      consentDate: new Date(),
    }
  })

  const user2 = await prisma.user.upsert({
    where: { phone: '+919876543211' },
    update: {},
    create: {
      phone: '+919876543211',
      phoneVerified: true,
      displayName: 'Priya K.',
      trustScore: 65.0,
      consentGiven: true,
      consentDate: new Date(),
    }
  })

  const user3 = await prisma.user.upsert({
    where: { phone: '+919876543212' },
    update: {},
    create: {
      phone: '+919876543212',
      phoneVerified: true,
      displayName: 'Rohit M.',
      trustScore: 78.0,
      consentGiven: true,
      consentDate: new Date(),
    }
  })

  // Seeded Personalization Proof Users:
  // User 1: High CAFE affinity
  const userCafe = await prisma.user.upsert({
    where: { phone: '+919999900001' },
    update: {},
    create: {
      phone: '+919999900001',
      phoneVerified: true,
      displayName: 'Aarav (Cafe Enthusiast)',
      trustScore: 82.0,
      consentGiven: true,
      consentDate: new Date(),
    }
  })

  // User 2: High PG_HOSTEL affinity
  const userHostel = await prisma.user.upsert({
    where: { phone: '+919999900002' },
    update: {},
    create: {
      phone: '+919999900002',
      phoneVerified: true,
      displayName: 'Meera (Student PG Seeker)',
      trustScore: 75.0,
      consentGiven: true,
      consentDate: new Date(),
    }
  })

  const users = [user1, user2, user3, userCafe, userHostel]

  // 2. Create Places
  const createdPlaces = []
  for (const placeData of PUNE_SEED_PLACES) {
    const bayesian = calculateBayesianRating(placeData.reviewCount, placeData.avgRating, 4.0, 10)
    const place = await prisma.place.upsert({
      where: { name_address: { name: placeData.name, address: placeData.address } },
      update: {
        bayesianRating: bayesian,
      },
      create: {
        name: placeData.name,
        category: placeData.category as Category,
        description: placeData.description,
        address: placeData.address,
        city: placeData.city,
        latitude: placeData.latitude,
        longitude: placeData.longitude,
        avgRating: placeData.avgRating,
        weightedRating: placeData.avgRating,
        bayesianRating: bayesian,
        reviewCount: placeData.reviewCount,
        geofenceRadius: 50,
        claimStatus: ClaimStatus.UNCLAIMED,
        tags: placeData.tags,
        priceRange: placeData.priceRange,
      },
    })
    createdPlaces.push(place)
  }

  // Seed interest profiles for personalized demo users
  await prisma.userInterest.upsert({
    where: { userId_category: { userId: userCafe.id, category: 'CAFE' } },
    update: { affinity: 25.0 },
    create: { userId: userCafe.id, category: 'CAFE', affinity: 25.0 },
  })

  await prisma.userInterest.upsert({
    where: { userId_category: { userId: userHostel.id, category: 'PG_HOSTEL' } },
    update: { affinity: 25.0 },
    create: { userId: userHostel.id, category: 'PG_HOSTEL', affinity: 25.0 },
  })

  // Seed 20+ events for each to establish warm user state (> cold-start threshold of 20 events)
  const cafePlace = createdPlaces.find((p) => p.category === 'CAFE')
  const pgPlace = createdPlaces.find((p) => p.category === 'PG_HOSTEL')

  if (cafePlace) {
    const existingCafeEvents = await prisma.userEvent.count({ where: { userId: userCafe.id } })
    if (existingCafeEvents < 20) {
      for (let i = 0; i < 22; i++) {
        await prisma.userEvent.create({
          data: {
            userId: userCafe.id,
            sessionId: `seed-session-cafe-${i}`,
            type: i % 2 === 0 ? 'place_save' : 'place_dwell',
            placeId: cafePlace.id,
            category: 'CAFE',
            dwellMs: 30000,
            ipHash: 'seed-ip-hash',
            deviceHash: 'seed-device-hash',
          },
        })
      }
    }
  }

  if (pgPlace) {
    const existingPgEvents = await prisma.userEvent.count({ where: { userId: userHostel.id } })
    if (existingPgEvents < 20) {
      for (let i = 0; i < 22; i++) {
        await prisma.userEvent.create({
          data: {
            userId: userHostel.id,
            sessionId: `seed-session-pg-${i}`,
            type: i % 2 === 0 ? 'place_save' : 'place_dwell',
            placeId: pgPlace.id,
            category: 'PG_HOSTEL',
            dwellMs: 30000,
            ipHash: 'seed-ip-hash',
            deviceHash: 'seed-device-hash',
          },
        })
      }
    }
  }

  // 3. Create Seed Reviews
  for (const [index, reviewData] of PUNE_SEED_REVIEWS.entries()) {
    const targetPlace = createdPlaces[reviewData.placeIndex]
    const assignedUser = users[index % users.length]

    // Simple check to prevent duplicate reviews from same user on same place in seed
    const existingReview = await prisma.review.findFirst({
      where: { userId: assignedUser.id, placeId: targetPlace.id }
    })

    if (!existingReview) {
      await prisma.review.create({
        data: {
          userId: assignedUser.id,
          placeId: targetPlace.id,
          rating: reviewData.rating,
          text: reviewData.text,
          tags: reviewData.tags,
          photoUrls: [], // explicitly add photoUrls if needed
          checkinVerified: reviewData.checkinVerified,
          checkinLat: targetPlace.latitude,
          checkinLng: targetPlace.longitude,
          trustWeight: assignedUser.trustScore >= 70 ? 1.0 : 0.8,
          isBlindRevealed: true,
          publishDate: new Date(),
        },
      })
    }
  }

  console.log('Database successfully seeded with Pune places and reviews!')
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
