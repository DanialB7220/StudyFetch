use client";

import { useState } from 'react';
import { callAiTutor } from '@/utils/anthroApi';

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

  const handleSendMessage = async () => {
    if (!input.trim()) return;
  
    // Add user message to the chat
    const newMessages = [...messages, { text: input, sender: 'user' }];
    setMessages(newMessages);
    setInput('');
  
    try {
      // Call the AI Tutor with the user input
      const response = await callAiTutor(input);
      console.log('AI Tutor Response:', response); // Debug log
  
      if (response.flashcards && Array.isArray(response.flashcards)) {
        // Create flashcard set in the database
        const flashcardSetCreated = await createFlashcardSet(response.flashcards, 'Generated Flashcards');
  
        if (flashcardSetCreated) {
          // Confirm the flashcard set was created successfully
          setMessages([
            ...newMessages,
            { text: 'Here are your flashcards! They have been saved successfully.', sender: 'ai' },
          ]);
        } else {
          // Flashcards weren't created despite AI generating them
          setMessages([
            ...newMessages,
            { text: 'I generated flashcards but couldn’t save them. Please try again.', sender: 'ai' },
          ]);
        }
      } else if (response.content) {
        // Handle general AI response
        setMessages([
          ...newMessages,
          { text: response.content, sender: 'ai' },
        ]);
      } else {
        // No valid response, flashcards, or content
        setMessages([
          ...newMessages,
          { text: 'Refresh the page to view flashcards.', sender: 'ai' },
        ]);
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages([
        ...newMessages,
        { text: 'Sorry, something went wrong!', sender: 'ai' },
      ]);
    }
  };
  
  
  return (
    <div>
      <div className="space-y-4 mb-4">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={p-3 rounded-lg max-w-[80%] ${
              msg.sender === 'user' ? 'bg-green-200 self-end' : 'bg-blue-100 self-start'
            } text-black}
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
