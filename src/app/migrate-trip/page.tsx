'use client';

import { useState } from 'react';
import { updateTrip, getTrip } from '@/lib/firestore';
import { useAuth } from '@/hooks/useAuth';

export default function MigrateTripPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const migrateTrip = async () => {
    if (!user) {
      alert('Please log in first');
      return;
    }

    setLoading(true);
    try {
      const tripId = '5mf6INxOw1mMP5IrLv1T';
      console.log('🔧 Starting migration for trip:', tripId);
      
      // First, get the current trip data
      const currentTrip = await getTrip(tripId);
      console.log('📊 Current trip data:', currentTrip);
      
      if (!currentTrip) {
        setResult({ error: 'Trip not found' });
        return;
      }

      // Create the migration data with all required fields
      const migrationData = {
        // Ensure all required arrays exist and are properly formatted
        editors: Array.isArray(currentTrip.editors) ? currentTrip.editors : [],
        viewers: Array.isArray(currentTrip.viewers) ? currentTrip.viewers : [],
        locations: Array.isArray(currentTrip.locations) ? currentTrip.locations : [],
        
        // Ensure tripData structure exists
        tripData: {
          locations: Array.isArray(currentTrip.tripData?.locations) ? currentTrip.tripData.locations : []
        },
        
        // Keep existing fields
        title: currentTrip.title,
        startDate: currentTrip.startDate,
        endDate: currentTrip.endDate,
        ownerId: currentTrip.ownerId,
      };

      console.log('🚀 Migration data to apply:', migrationData);

      // Apply the migration
      await updateTrip(tripId, migrationData);
      
      // Verify the migration worked
      const migratedTrip = await getTrip(tripId);
      console.log('✅ Migration complete. Verifying result:', migratedTrip);
      
      const verification = {
        success: true,
        before: {
          editors: currentTrip.editors,
          viewers: currentTrip.viewers,
          locations: currentTrip.locations,
          tripDataLocations: currentTrip.tripData?.locations?.length || 0
        },
        after: {
          editors: migratedTrip.editors,
          viewers: migratedTrip.viewers,
          locations: migratedTrip.locations,
          tripDataLocations: migratedTrip.tripData?.locations?.length || 0
        },
        changes: []
      };

      // Check what changed
      if (JSON.stringify(currentTrip.editors) !== JSON.stringify(migratedTrip.editors)) {
        verification.changes.push('editors array updated');
      }
      if (JSON.stringify(currentTrip.viewers) !== JSON.stringify(migratedTrip.viewers)) {
        verification.changes.push('viewers array updated');
      }
      if (JSON.stringify(currentTrip.locations) !== JSON.stringify(migratedTrip.locations)) {
        verification.changes.push('locations array updated');
      }

      setResult(verification);
      
    } catch (error) {
      console.error('❌ Migration failed:', error);
      setResult({ 
        success: false, 
        error: error.message,
        details: error
      });
    } finally {
      setLoading(false);
    }
  };

  const forceCleanMigration = async () => {
    if (!user) {
      alert('Please log in first');
      return;
    }

    const confirmed = confirm('This will force a clean migration with fresh arrays. Continue?');
    if (!confirmed) return;

    setLoading(true);
    try {
      const tripId = '5mf6INxOw1mMP5IrLv1T';
      console.log('🧹 Starting FORCE CLEAN migration for trip:', tripId);
      
      // Force clean data structure
      const cleanData = {
        editors: [], // Fresh empty array
        viewers: [], // Fresh empty array
        locations: ['New Location'], // Clean locations array
        tripData: {
          locations: [] // Will be populated by the app
        }
      };

      console.log('🚀 Force clean data:', cleanData);
      await updateTrip(tripId, cleanData);
      
      const result = await getTrip(tripId);
      console.log('✅ Force clean migration complete:', result);
      
      setResult({
        success: true,
        type: 'force_clean',
        result: result
      });
      
    } catch (error) {
      console.error('❌ Force clean migration failed:', error);
      setResult({ 
        success: false, 
        error: error.message 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Migrate Trip Data</h1>
      
      {!user && (
        <p className="text-red-500 mb-4">Please log in to use this migration tool.</p>
      )}
      
      <div className="space-y-4 mb-6">
        <button 
          onClick={migrateTrip}
          disabled={loading || !user}
          className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-300 mr-4"
        >
          {loading ? 'Migrating...' : 'Migrate China 2025 Trip'}
        </button>

        <button 
          onClick={forceCleanMigration}
          disabled={loading || !user}
          className="bg-red-500 text-white px-4 py-2 rounded disabled:bg-gray-300"
        >
          {loading ? 'Migrating...' : 'Force Clean Migration'}
        </button>
      </div>

      {result && (
        <div className="mt-6 bg-gray-100 p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">Migration Results</h2>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
