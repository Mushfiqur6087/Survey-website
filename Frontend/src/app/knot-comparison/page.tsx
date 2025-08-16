'use client';

import Link from 'next/link';

export default function KnotComparisonPage() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Knot Comparison</h1>
          <p className="text-lg text-gray-600 mb-8">Feature coming soon</p>
          
          <Link href="/">
            <button className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded font-semibold transition-colors">
              ← Back to Home
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
