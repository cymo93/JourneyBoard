'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminFixPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const runAdminFix = async () => {
    if (!user) {
      alert('Please log in first');
      return;
    }

    setLoading(true);
    try {
      console.log('🔧 Running server-side fix for user:', user.uid);
      
      const response = await fetch('/api/fix-china-trip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.uid,
          userEmail: user.email
        })
      });

      const data = await response.json();
      console.log('📊 Server fix result:', data);
      setResult(data);

    } catch (error) {
      console.error('❌ Server fix failed:', error);
      setResult({ 
        success: false, 
        error: error.message 
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto p-8">
        <h1 className="text-2xl font-bold mb-4">Admin Fix Tool</h1>
        <p>Please log in to use this tool.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Admin SDK Fix - China 2025</h1>
      
      <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-6">
        <h3 className="font-semibold text-blue-800">Server-Side Fix</h3>
        <p className="text-blue-700 mt-2">
          This tool runs the update from the server-side, bypassing any client-side security rules or caching issues.
        </p>
      </div>

      <Button 
        onClick={runAdminFix} 
        disabled={loading}
        className="mb-6"
      >
        {loading ? 'Running Server Fix...' : 'Run Server-Side Fix'}
      </Button>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Server Fix Results</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm bg-gray-100 p-4 rounded overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
