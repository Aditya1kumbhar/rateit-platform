/**
 * EXIF metadata extraction from review photos.
 * 
 * Uses the lightweight `exifr` library to extract GPS coordinates,
 * timestamps, and device info from uploaded images. This data is
 * used for fraud cross-checks:
 * - Photo GPS vs. place GPS (was the photo actually taken there?)
 * - Photo timestamp vs. review timestamp (is this a recycled photo?)
 * - Device fingerprinting (same device posting from multiple "locations"?)
 */

export interface ExifData {
  latitude?: number
  longitude?: number
  timestamp?: Date
  deviceMake?: string
  deviceModel?: string
  hasGps: boolean
}

/**
 * Extract EXIF metadata from an image file.
 * Returns sanitized metadata — we strip all personal data except
 * what's needed for fraud detection (DPDP: purpose limitation).
 */
export async function extractExifData(file: File): Promise<ExifData> {
  try {
    // Dynamic import to keep bundle size small — exifr is only
    // loaded when a user actually uploads a photo
    const exifr = (await import('exifr')).default

    const exif = await exifr.parse(file, {
      // Only extract what we need (DPDP: data minimization)
      pick: [
        'GPSLatitude',
        'GPSLongitude',
        'DateTimeOriginal',
        'CreateDate',
        'Make',
        'Model',
      ],
    })

    if (!exif) {
      return { hasGps: false }
    }

    return {
      latitude: exif.GPSLatitude ?? exif.latitude,
      longitude: exif.GPSLongitude ?? exif.longitude,
      timestamp: exif.DateTimeOriginal ?? exif.CreateDate,
      deviceMake: exif.Make,
      deviceModel: exif.Model,
      hasGps: !!(exif.GPSLatitude || exif.latitude),
    }
  } catch (error) {
    console.warn('EXIF extraction failed (image may not contain metadata):', error)
    return { hasGps: false }
  }
}

/**
 * Cross-check photo EXIF against review context.
 * Returns a list of warnings (empty = no issues detected).
 */
export function crossCheckExif(
  exif: ExifData,
  placeLat: number,
  placeLng: number,
  reviewTimestamp: Date
): string[] {
  const warnings: string[] = []

  // Check if photo GPS is far from the place
  if (exif.hasGps && exif.latitude && exif.longitude) {
    const { haversineDistance } = require('./geolocation')
    const photoDistance = haversineDistance(
      exif.latitude,
      exif.longitude,
      placeLat,
      placeLng
    )
    if (photoDistance > 1000) {
      warnings.push(
        `Photo was taken ${Math.round(photoDistance / 1000)}km from the reviewed location`
      )
    }
  }

  // Check if photo is more than 30 days old
  if (exif.timestamp) {
    const photoAge = reviewTimestamp.getTime() - new Date(exif.timestamp).getTime()
    const daysDiff = photoAge / (1000 * 60 * 60 * 24)
    if (daysDiff > 30) {
      warnings.push(
        `Photo was taken ${Math.round(daysDiff)} days before the review`
      )
    }
    // Check if photo is from the future (GPS spoofing indicator)
    if (daysDiff < -1) {
      warnings.push('Photo timestamp is in the future — possible metadata manipulation')
    }
  }

  return warnings
}
