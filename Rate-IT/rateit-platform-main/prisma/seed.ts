import { PrismaClient, Category, ClaimStatus } from '@prisma/client'
import { PUNE_SEED_PLACES, PUNE_SEED_REVIEWS } from '../lib/mock'

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

  const users = [user1, user2, user3]

  // 2. Create Places
  const createdPlaces = []
  for (const placeData of PUNE_SEED_PLACES) {
    const place = await prisma.place.upsert({
      where: { name_address: { name: placeData.name, address: placeData.address } },
      update: {},
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
        reviewCount: placeData.reviewCount,
        geofenceRadius: 50,
        claimStatus: ClaimStatus.UNCLAIMED,
        tags: placeData.tags,
        priceRange: placeData.priceRange,
      },
    })
    createdPlaces.push(place)
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
