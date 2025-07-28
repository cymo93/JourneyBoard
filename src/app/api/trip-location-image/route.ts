import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const locations = searchParams.get('locations');
  
  if (!locations) {
    return NextResponse.json({
      success: false,
      error: 'Locations parameter is required'
    });
  }

  const pexelsKey = process.env.PEXELS_API_KEY;
  
  if (!pexelsKey) {
    return NextResponse.json({
      success: false,
      error: 'PEXELS_API_KEY not found in environment variables'
    });
  }

  try {
    // Parse locations array
    const locationArray = JSON.parse(locations);
    
    if (!Array.isArray(locationArray) || locationArray.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Invalid locations array'
      });
    }

    // Randomly select one location from the trip
    const randomLocation = locationArray[Math.floor(Math.random() * locationArray.length)];
    
    // Create a search query for the location
    const query = `${randomLocation} iconic landscape`;
    
    const response = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1`, {
      headers: {
        'Authorization': pexelsKey
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({
        success: false,
        error: errorText
      });
    }

    const data = await response.json();
    
    if (data.photos && data.photos.length > 0) {
      const photo = data.photos[0];
      return NextResponse.json({
        success: true,
        data: {
          url: photo.src.large,
          alt: photo.alt,
          photographerUrl: photo.url,
          location: randomLocation
        }
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'No photos found'
      });
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 