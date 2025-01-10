import { useState } from 'react';

interface Flashcard {
  term: string;
  definition: string;
}

interface FlashcardSetProps {
  flashcards: Flashcard[];
}

const FlashcardSet = ({ flashcards }: FlashcardSetProps) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [showTerm, setShowTerm] = useState<boolean>(true);

  const handleNext = () => {
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowTerm(true); // Reset to show term on new card
    }
  };

  const handleFlip = () => {
    setShowTerm(!showTerm); // Toggle between term and definition
  };

  const flashcard = flashcards[currentIndex];

  return (
    <div className="flex flex-col items-center mt-8">
      {/* Flashcard */}
      <div
        className="relative w-96 h-64 bg-gray-200 rounded-lg shadow-lg cursor-pointer transform transition-transform duration-500"
        style={{
          perspective: '1000px',
          transformStyle: 'preserve-3d',
        }}
        onClick={handleFlip}
      >
        {/* Front Side */}
        <div
          className={`absolute w-full h-full flex items-center justify-center bg-blue-500 text-white rounded-lg p-4 ${
            showTerm ? '' : 'rotateY(180deg)'
          }`}
          style={{
            backfaceVisibility: 'hidden',
          }}
        >
          <h3 className="text-xl font-bold">{flashcard.term}</h3>
        </div>

        {/* Back Side */}
        <div
          className={`absolute w-full h-full flex items-center justify-center bg-green-500 text-white rounded-lg p-4 transform ${
            showTerm ? 'rotateY(180deg)' : ''
          }`}
          style={{
            backfaceVisibility: 'hidden',
          }}
        >
          <h3 className="text-xl">{flashcard.definition}</h3>
        </div>
      </div>

      {/* Next Button */}
      <button
        onClick={handleNext}
        className="mt-6 bg-gray-600 text-white px-4 py-2 rounded-lg"
        disabled={currentIndex === flashcards.length - 1}
      >
        Next
      </button>
    </div>
  );
};

export default FlashcardSet;