import { NextResponse } from 'next/server';

export async function GET() {
  const pexelsKey = process.env.PEXELS_API_KEY;
  
  if (!pexelsKey) {
    return NextResponse.json({
      success: false,
      error: 'PEXELS_API_KEY not found in environment variables'
    });
  }

  try {
    // Test with a simple search query
    const response = await fetch('https://api.pexels.com/v1/search?query=landscape&per_page=1', {
      headers: {
        'Authorization': pexelsKey
      }
    });

    const data = await response.json();
    
    return NextResponse.json({
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      data: response.ok ? {
        total_results: data.total_results,
        photos_count: data.photos?.length || 0,
        first_photo: data.photos?.[0] ? {
          id: data.photos[0].id,
          url: data.photos[0].url,
          photographer: data.photos[0].photographer
        } : null
      } : data,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
} 