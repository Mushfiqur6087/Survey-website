import React, { useState } from 'react';

interface SubmissionPasswordModalProps {
  isOpen: boolean;
  onSubmit: (password: string) => void;
  onCancel: () => void;
  isValidating: boolean;
  error?: string;
}

export default function SubmissionPasswordModal({ 
  isOpen, 
  onSubmit, 
  onCancel, 
  isValidating, 
  error 
}: SubmissionPasswordModalProps) {
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.trim()) {
      onSubmit(password.trim());
    }
  };

  const handleCancel = () => {
    setPassword('');
    onCancel();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 max-w-90vw">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">
          Submit Annotations
        </h2>
        
        <p className="text-gray-600 mb-4">
          Please enter the submission password to finalize your annotations.
        </p>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter submission password"
              autoFocus
              disabled={isValidating}
            />
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}
          
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isValidating}
              className="px-4 py-2 text-gray-600 bg-gray-200 rounded hover:bg-gray-300 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!password.trim() || isValidating}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isValidating ? 'Validating...' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
