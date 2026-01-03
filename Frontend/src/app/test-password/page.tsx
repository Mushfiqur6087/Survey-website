'use client';

import React, { useState } from 'react';
import { trajectoryAPI } from '@/lib/api';

export default function TestPasswordPage() {
  const [password, setPassword] = useState('');
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testPassword = async () => {
    if (!password.trim()) return;
    
    setLoading(true);
    try {
      const response = await trajectoryAPI.validateSubmissionPassword(password);
      setResult(`Password validation: ${response.valid ? 'VALID' : 'INVALID'} - ${response.message}`);
    } catch (error) {
      setResult(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-4">Test Submission Password</h1>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Test Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter password to test"
            />
          </div>
          
          <button
            onClick={testPassword}
            disabled={!password.trim() || loading}
            className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test Password'}
          </button>
          
          {result && (
            <div className={`p-3 rounded ${result.includes('VALID') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {result}
            </div>
          )}
          
          <div className="text-sm text-gray-600">
            <p><strong>Current submission password:</strong> submit2024</p>
            <p>You can change this in application.properties</p>
          </div>
        </div>
      </div>
    </div>
  );
}
