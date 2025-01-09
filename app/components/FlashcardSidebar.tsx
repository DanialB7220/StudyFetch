"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface FlashcardSet {
  _id: string;
  topic: string;
}

const FlashcardSidebar = () => {
  const [flashcardSets, setFlashcardSets] = useState<FlashcardSet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFlashcardSets = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Use absolute URL in production
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
        const response = await fetch(`${baseUrl}/api/flashcards`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          // Add cache control
          cache: 'no-store',
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch flashcard sets: ${response.status}`);
        }

        const data = await response.json();
        
        // Validate the response data structure
        if (!Array.isArray(data.flashcardSets)) {
          throw new Error('Invalid response format');
        }

        setFlashcardSets(data.flashcardSets);
      } catch (error) {
        console.error('Error fetching flashcard sets:', error);
        setError('Failed to load flashcard sets. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchFlashcardSets();
  }, []);

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="animate-pulse">
          <div className="h-10 bg-gray-200 rounded mb-2"></div>
          <div className="h-10 bg-gray-200 rounded mb-2"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-500">
        {error}
        <button 
          onClick={() => window.location.reload()} 
          className="mt-2 text-blue-500 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-2">
      {flashcardSets.length > 0 ? (
        flashcardSets.map((set) => (
          <Link 
            key={set._id} 
            href={`/flashcards/${set._id}`}
            className="block"
          >
            <div className="p-3 rounded-lg bg-green-500 text-white cursor-pointer hover:bg-green-600 transition-colors">
              {set.topic}
            </div>
          </Link>
        ))
      ) : (
        <p className="text-gray-500">No flashcard sets found.</p>
      )}
    </div>
  );
};

export default FlashcardSidebar;
