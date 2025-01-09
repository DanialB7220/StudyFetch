import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

interface Flashcard {
  term: string;
  definition: string;
}

const FlashcardSet = () => {
  const router = useRouter();
  const { id } = router.query;
  const [flashcardSet, setFlashcardSet] = useState<Flashcard[] | null>(null);
  const [flipped, setFlipped] = useState<boolean>(false); // State to track if the card is flipped
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      const fetchFlashcardSet = async () => {
        try {
          console.log(`Fetching flashcards for ID: ${id}`);
          const response = await fetch(`/api/flashcards/${id}`); // Correct endpoint
          if (!response.ok) {
            throw new Error(`Failed to fetch flashcards: ${response.status}`);
          }
          const data = await response.json();
          console.log('Fetched flashcards by id:', data); // Debug log
          setFlashcardSet(data.flashcardSets.flashcards); // Ensure correct data structure
        } catch (error) {
          setError('Failed to fetch flashcards. Please try again later.');
          console.error('Error fetching flashcards:', error);
        }
      };
      fetchFlashcardSet();
    }
  }, [id]);

  const nextFlashcard = () => {
    if (flashcardSet && currentIndex < flashcardSet.length - 1) {
      setFlipped(false); // Reset flipped state when changing cards
      setCurrentIndex(currentIndex + 1);
    }
  };

  const prevFlashcard = () => {
    if (currentIndex > 0) {
      setFlipped(false); // Reset flipped state when changing cards
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleFlip = () => {
    setFlipped(!flipped); // Toggle flipped state
  };

  return (
    <div className="flex flex-col items-center">
      {error && <p className="text-red-500">{error}</p>}
      {flashcardSet ? (
        <div className="relative w-96 h-64 mt-8">
          <div
            className="relative w-full h-full"
            style={{
              perspective: '1000px', // Perspective for 3D effect
            }}
          >
            <div
              className={`absolute w-full h-full transition-transform duration-500 ${
                flipped ? 'rotate-y-180' : ''
              }`}
              style={{
                transformStyle: 'preserve-3d', // Ensure 3D transform
              }}
              onClick={handleFlip}
            >
              {/* Front of the card */}
              <div
                className="absolute w-full h-full flex items-center justify-center bg-gray-200 rounded-lg p-6 text-black text-center"
                style={{
                  backfaceVisibility: 'hidden', // Hide back when front is visible
                  transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                }}
              >
                <h2 className="text-2xl font-bold">{flashcardSet[currentIndex].term}</h2>
              </div>

              {/* Back of the card */}
              <div
                className="absolute w-full h-full flex items-center justify-center bg-gray-300 rounded-lg p-6 text-black text-center"
                style={{
                  backfaceVisibility: 'hidden', // Hide front when back is visible
                  transform: flipped ? 'rotateY(0deg)' : 'rotateY(180deg)',
                }}
              >
                <p className="text-xl">{flashcardSet[currentIndex].definition}</p>
              </div>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-6">
            <button
              onClick={prevFlashcard}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg"
              disabled={currentIndex === 0}
            >
              Previous
            </button>
            <button
              onClick={nextFlashcard}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg"
              disabled={currentIndex === flashcardSet.length - 1}
            >
              Next
            </button>
          </div>
        </div>
      ) : (
        <p>Loading flashcards...</p>
      )}
    </div>
  );
};

export default FlashcardSet;