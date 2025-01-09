"use client";

import { useState } from 'react';
import { callAiTutor } from '@/utils/anthroApi'; // Call to your AI service

// Flashcard Interface for sending to backend
interface Flashcard {
  term: string;
  definition: string;
}

interface Message {
  text: string;
  sender: 'user' | 'ai';
}

const ChatBox = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // Function to check if flashcards exist in the database
  const checkIfFlashcardsExist = async (topic: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/flashcards?topic=${encodeURIComponent(topic)}`);
      const data = await response.json();
      return Array.isArray(data.flashcards) && data.flashcards.length > 0;
    } catch (error) {
      console.error('Error checking flashcards in database:', error);
      return false;
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const newMessages = [...messages, { text: input, sender: 'user' }];
    setMessages(newMessages);
    setInput('');
    setLoading(true); // Show loading state while processing

    try {
      // Check if flashcards already exist for the topic (you can pass the topic or use AI to infer one)
      const flashcardsExist = await checkIfFlashcardsExist(input);

      if (flashcardsExist) {
        setMessages([
          ...newMessages,
          { text: 'Flashcards already exist for this topic. Displaying them now.', sender: 'ai' },
        ]);
        setLoading(false);
      } else {
        // Call the AI Tutor with the user input
        const response = await callAiTutor(input);
        console.log('AI Tutor Response:', response);

        if (response.flashcards && Array.isArray(response.flashcards)) {
          // Create flashcard set in the database
          const flashcardSetCreated = await createFlashcardSet(response.flashcards, 'Generated Flashcards');
          if (flashcardSetCreated) {
            setMessages([
              ...newMessages,
              { text: 'Here are your flashcards! They have been saved successfully.', sender: 'ai' },
            ]);
          } else {
            setMessages([
              ...newMessages,
              { text: 'I generated flashcards but couldn’t save them. Please try again.', sender: 'ai' },
            ]);
          }
        } else {
          setMessages([
            ...newMessages,
            { text: 'Refresh the page to view flashacrds.', sender: 'ai' },
          ]);
        }
        setLoading(false);
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages([
        ...newMessages,
        { text: 'Sorry, something went wrong!', sender: 'ai' },
      ]);
      setLoading(false);
    }
  };

  // Function to create a flashcard set and verify its creation
  const createFlashcardSet = async (flashcards: Flashcard[], topic: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flashcards, topic }),
      });

      if (response.ok) {
        console.log('Flashcard set created successfully!');
        return true;
      } else {
        console.error('Failed to create flashcard set');
        return false;
      }
    } catch (error) {
      console.error('Error creating flashcard set:', error);
      return false;
    }
  };

  return (
    <div>
      <div className="space-y-4 mb-4">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`p-3 rounded-lg max-w-[80%] ${
              msg.sender === 'user' ? 'bg-green-200 self-end' : 'bg-blue-100 self-start'
            } text-black`}
          >
            <p>{msg.text}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-4">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask the AI tutor..."
          className="w-full p-3 rounded-lg border-2 border-gray-300 focus:outline-none focus:border-blue-500 text-black"
        />
        <button
          onClick={handleSendMessage}
          className="bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition-all"
          disabled={loading}
        >
          {loading ? 'Processing...' : 'Send'}
        </button>
      </div>
    </div>
  );
};

export default ChatBox;
