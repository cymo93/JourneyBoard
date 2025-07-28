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
    
    console.log('Selected location for image:', randomLocation);
    console.log('All trip locations:', locationArray);
    
    // Create a more specific search query for the location
    // Use different search strategies based on the location type
    let query: string;
    
    // For major cities, use skyline/landmarks
    if (['New York', 'London', 'Paris', 'Tokyo', 'Hong Kong', 'Shanghai', 'Beijing', 'Vancouver', 'Toronto', 'Sydney', 'Melbourne', 'Dubai', 'Singapore'].includes(randomLocation)) {
      query = `${randomLocation} city skyline landmarks`;
    }
    // For countries, use more specific terms
    else if (['China', 'Japan', 'France', 'Italy', 'Spain', 'Germany', 'Canada', 'Australia', 'Brazil', 'Argentina', 'Peru', 'Mexico'].includes(randomLocation)) {
      query = `${randomLocation} famous landmarks architecture`;
    }
    // For other locations, use a general but specific search
    else {
      query = `${randomLocation} famous landmarks`;
    }
    
    console.log('Search query:', query);
    
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
      console.log('Found image for', randomLocation, ':', photo.alt);
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