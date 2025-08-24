import { NextRequest, NextResponse } from 'next/server';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function POST(request: NextRequest) {
  try {
    const { userId, userEmail } = await request.json();
    
    if (!userId || !userEmail) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing userId or userEmail' 
      });
    }

    console.log('🔧 Server-side fix for user:', { userId, userEmail });

    const tripRef = doc(db, 'trips', '5mf6INxOw1mMP5IrLv1T');
    
    // Get current trip data
    const tripDoc = await getDoc(tripRef);
    if (!tripDoc.exists()) {
      return NextResponse.json({ 
        success: false, 
        error: 'Trip not found' 
      });
    }

    const tripData = tripDoc.data();
    console.log('📊 Current trip data:', {
      ownerId: tripData?.ownerId,
      editors: tripData?.editors,
      viewers: tripData?.viewers
    });

    // Add user to editors array
    const currentEditors = Array.isArray(tripData?.editors) ? tripData.editors : [];
    const newEditors = currentEditors.includes(userId) ? currentEditors : [...currentEditors, userId];
    
    console.log('🔄 Updating editors from', currentEditors, 'to', newEditors);

    // Force the update from server-side
    await updateDoc(tripRef, {
      editors: newEditors
    });

    console.log('✅ Server-side update completed');

    // Wait and verify the update worked
    await new Promise(resolve => setTimeout(resolve, 1000));
    const updatedDoc = await getDoc(tripRef);
    const updatedData = updatedDoc.data();
    
    return NextResponse.json({
      success: true,
      message: 'Server-side update completed',
      before: {
        editors: tripData?.editors || [],
        viewers: tripData?.viewers || []
      },
      after: {
        editors: updatedData?.editors || [],
        viewers: updatedData?.viewers || []
      },
      userAdded: updatedData?.editors?.includes(userId) || false
    });

  } catch (error) {
    console.error('❌ Server-side fix failed:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      details: error
    });
  }
}
