"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface FlashcardSet {
  _id: string;
  topic: string;
}

const FlashcardSidebar = () => {
  const [flashcardSets, setFlashcardSets] = useState<FlashcardSet[]>([]);

  useEffect(() => {
    const fetchFlashcardSets = async () => {
      try {
        console.log('Fetching flashcard sets'); // Debug log
        const response = await fetch('/api/flashcards');
        if (!response.ok) {
          throw new Error(`Failed to fetch flashcard sets: ${response.status}`);
        }
        const data = await response.json();
        console.log('Fetched flashcard sets:', data); // Debug log
        setFlashcardSets(data.flashcardSets);
      } catch (error) {
        console.error('Error fetching flashcard sets:', error);
      }
    };

    fetchFlashcardSets();
  }, []);

  return (
    <div>
      {flashcardSets.map((set) => (
        <Link key={set._id} href={`/flashcards/${set._id}`}>
          <div className="p-3 rounded-lg bg-green-500 text-white cursor-pointer hover:bg-green-600">
            {set.topic}
          </div>
        </Link>
      ))}
    </div>
  );
};

export default FlashcardSidebar;
