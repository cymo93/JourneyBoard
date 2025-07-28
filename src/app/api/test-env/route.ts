import { NextResponse } from 'next/server';

export async function GET() {
  const pexelsKey = process.env.PEXELS_API_KEY;
  
  return NextResponse.json({
    hasPexelsKey: !!pexelsKey,
    keyLength: pexelsKey?.length || 0,
    keyPreview: pexelsKey ? `${pexelsKey.substring(0, 10)}...` : 'Not set',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
} 