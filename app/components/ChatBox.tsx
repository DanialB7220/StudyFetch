"use client";

import { useState } from 'react';
import { callAiTutor } from '@/utils/anthroApi';

// Flashcard Interface
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

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    setMessages([...messages, { text: input, sender: 'user' }]);
    setInput('');

    try {
      // Call the AI Tutor with the user input
      const response = await callAiTutor(input);
      console.log('AI Tutor Response:', response); // Debug log

      // Check if flashcards are returned in the AI response
      if (response.length > 0) {
        // Assuming response is an array of Flashcards
        await createFlashcardSet(response, 'Generated Flashcards');
        setMessages([
          ...messages,
          { text: input, sender: 'user' },
          { text: 'Here are your flashcards refresh page!', sender: 'ai' },
        ]);
      } else {
        // Handle case where no flashcards are generated
        setMessages([
          ...messages,
          { text: input, sender: 'user' },
          { text: 'No flashcards were generated. Try asking something else!', sender: 'ai' },
        ]);
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages([
        ...messages,
        { text: input, sender: 'user' },
        { text: 'Refresh Page to load cards!', sender: 'ai' },
      ]);
    }
  };

  // Function to create a flashcard set
  const createFlashcardSet = async (flashcards: Flashcard[], topic: string) => {
    try {
      const response = await fetch('/api/flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          flashcards, // The generated flashcards
          topic, // You can pass the topic here
        }),
      });

      if (response.ok) {
        console.log('Flashcard set created successfully!');
      } else {
        console.error('Failed to create flashcard set');
      }
    } catch (error) {
      console.error('Error creating flashcard set:', error);
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
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatBox;
