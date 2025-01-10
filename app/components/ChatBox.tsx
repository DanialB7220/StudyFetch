"use client";

import { useState, useEffect } from 'react';
import { chatWithAiTutor } from '@/utils/anthroApi';
import { v4 as uuidv4 } from 'uuid';

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
  const [conversationId, setConversationId] = useState<string>('');

  useEffect(() => {
    setConversationId(uuidv4());
  }, []);

  const handleSendMessage = async () => {
    if (!input.trim()) return;  // Prevent empty input from being sent
  
    const userMessage: Message = { text: input, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
  
    try {
      const isFlashcardRequest = input.toLowerCase().includes('flashcard') || 
                                input.toLowerCase().includes('flash card');
  
      const response = await chatWithAiTutor(
        input.trim(),  // Ensure prompt is not empty
        conversationId,
        isFlashcardRequest
      );
  
      if (response.flashcards) {
        await createFlashcardSet(response.flashcards, input);
        
        const aiMessage: Message = { 
          text: response.message + "\n\nI've created flashcards based on your request. You can view them in your flashcards section!", 
          sender: 'ai' 
        };
        setMessages(prev => [...prev, aiMessage]);
      } else {
        const aiMessage: Message = { 
          text: response.message, 
          sender: 'ai' 
        };
        setMessages(prev => [...prev, aiMessage]);
      }
    } catch (error) {
      console.error('Error:', error);
      const errorMessage: Message = { 
        text: 'Sorry! I encountered an error. Please try again.', 
        sender: 'ai' 
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };
  
  const createFlashcardSet = async (flashcards: Flashcard[], topic: string) => {
    try {
      const response = await fetch('/api/flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          flashcards,
          topic,
          conversationId,
        }),
      });

      if (!response.ok) {
        console.error('Failed to create flashcard set');
      }
    } catch (error) {
      console.error('Error creating flashcard set:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-lg shadow-lg">
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`p-3 rounded-lg max-w-[80%] ${
                  msg.sender === 'user' 
                    ? 'bg-green-200 text-black' 
                    : 'bg-blue-100 text-black'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t p-4">
        <div className="flex items-center gap-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask the AI tutor... (mention 'flashcard' to generate flashcards)"
            className="flex-1 p-3 rounded-lg border-2 border-gray-300 focus:outline-none focus:border-blue-500 text-black"
          />
          <button
            onClick={handleSendMessage}
            className="bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition-all"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatBox;