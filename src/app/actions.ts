'use server';

import { z } from 'zod';

const PexelsResponseSchema = z.object({
  photos: z.array(
    z.object({
      src: z.object({
        large: z.string().url(),
        large2x: z.string().url(),
      }),
      alt: z.string(),
      url: z.string().url(),
    })
  ),
});

export async function getPexelsImage(query: string) {
  try {
    const response = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1`, {
      headers: {
        Authorization: process.env.PEXELS_API_KEY!,
      },
    });

    if (!response.ok) {
      console.error('Pexels API Error:', await response.text());
      return null;
    }

    const data = await response.json();
    const parsedData = PexelsResponseSchema.safeParse(data);

    if (parsedData.success && parsedData.data.photos.length > 0) {
      const photo = parsedData.data.photos[0];
      return {
        url: photo.src.large, // Using 'large' instead of 'large2x' for faster loading
        alt: photo.alt,
        photographerUrl: photo.url,
      }
    } else {
       console.error('Pexels API parsing error or no photos found:', parsedData.error);
       return null;
    }
  } catch (error) {
    console.error('Failed to fetch from Pexels API:', error);
    return null;
  }
}

export async function getNewPexelsImage(query: string) {
  try {
    // Fetch from a random page to get a new image
    const randomPage = Math.floor(Math.random() * 10) + 1;
    const response = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1&page=${randomPage}`, {
      headers: {
        Authorization: process.env.PEXELS_API_KEY!,
      },
    });

    if (!response.ok) {
      console.error('Pexels API Error:', await response.text());
      return null;
    }

    const data = await response.json();
    const parsedData = PexelsResponseSchema.safeParse(data);

    if (parsedData.success && parsedData.data.photos.length > 0) {
      const photo = parsedData.data.photos[0];
      return {
        url: photo.src.large,
        alt: photo.alt,
        photographerUrl: photo.url,
      };
    } else {
      console.error('Pexels API parsing error or no photos found:', parsedData.error);
      return null;
    }
  } catch (error) {
    console.error('Failed to fetch from Pexels API:', error);
    return null;
  }
}

export async function getPexelsImageForLocationPage(query: string) {
  try {
    const response = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1`, {
      headers: {
        Authorization: process.env.PEXELS_API_KEY!,
      },
    });

    if (!response.ok) {
      console.error('Pexels API Error:', await response.text());
      return null;
    }

    const data = await response.json();
    const parsedData = PexelsResponseSchema.safeParse(data);

    if (parsedData.success && parsedData.data.photos.length > 0) {
      const photo = parsedData.data.photos[0];
      return {
        url: photo.src.large2x, // Use high resolution for the banner
        alt: photo.alt,
        photographerUrl: photo.url,
      }
    } else {
       console.error('Pexels API parsing error or no photos found:', parsedData.error);
       return null;
    }
  } catch (error) {
    console.error('Failed to fetch from Pexels API:', error);
    return null;
  }
}
