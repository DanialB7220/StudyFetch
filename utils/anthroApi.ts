"use server";

import { Anthropic } from '@anthropic-ai/sdk';
import connectMongo from '@/utils/mongo';
import Flashcard from '@/models/Flashcard';
import message from '@/models/Message';

interface Flashcard {
  term: string;
  definition: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const anthropicApiKey = process.env.ANTHROPIC_API_KEY;

if (!anthropicApiKey) {
  throw new Error('ANTHROPIC_API_KEY is not set in environment variables');
}

const anthropic = new Anthropic({
  apiKey: anthropicApiKey,
});

export async function chatWithAiTutor(
  prompt: string,
  conversationId: string,
  generateFlashcards: boolean = false
) {
  await connectMongo();
  
  try {
    // Fetch previous messages for this conversation
    const previousMessages = await message.find({ conversationId })
      .sort({ timestamp: 1 })
      .select('role content -_id');

    // Ensure that we always have at least the current user's message
    const messages = previousMessages.length > 0 
      ? [
          ...previousMessages.map(msg => ({
            role: msg.role,
            content: msg.content || '', // Ensure there's no null or undefined content
          })),
          { role: 'user', content: prompt }
        ]
      : [{ role: 'user', content: prompt }]; // If no previous messages, just add the user's message

    // Prepare API call parameters
    const apiParams: any = {
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 6192,
      messages
    };

    // Only add tools if flashcard generation is requested
    if (generateFlashcards) {
      apiParams.tools = [
        {
          name: "flashcard_generator",
          description: "Generate flashcards from text and also suggest a relevant topic",
          input_schema: {
            type: "object",
            properties: {
              flashcards: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    question: {
                      type: "string",
                      description: "The term or question for the flashcard",
                    },
                    answer: {
                      type: "string",
                      description: "The definition or answer for the flashcard",
                    },
                  },
                  required: ["question", "answer"],
                },
              },
              topic: {
                type: "string",
                description: "A relevant topic related to the flashcards",
              },
            },
            required: ["flashcards", "topic"],
          },
        },
      ];
      apiParams.tool_choice = { type: "tool", name: "flashcard_generator" };
    }

    const response = await anthropic.messages.create(apiParams);

    // Log the full response content for debugging
    console.log('Response Content:', response.content);

    // Check if response contains any message (non-tool_use item)
    let messageText = '';
    if (response.content[0]?.type !== 'tool_use') {
      messageText = response.content[0]?.text || '';  // Safely access text
    } else {
      // If tool_use response, handle accordingly
      const toolUse = response.content.find(
        (item: Record<string, any>) => item.type === 'tool_use' && item.name === 'flashcard_generator'
      );
      if (toolUse?.input?.flashcards) {
        // If flashcards were generated, we'll save them but don't expect a direct 'text' response
        messageText = 'Flashcards generated successfully refresh page to view and click on card to flip!';
      }
    }

    // Save the new message to the conversation history
    const newMessage = new message({
      conversationId,
      role: 'assistant',
      content: messageText,
      timestamp: new Date()
    });
    await newMessage.save();

    // If flashcard generation was requested, process and save them
    let flashcards = null;
    if (generateFlashcards) {
      const toolUse = response.content.find(
        (item: Record<string, any>) => 
          item.type === 'tool_use' && 
          item.name === 'flashcard_generator'
      );

      // Ensure that we correctly handle the case where flashcards are generated
      if (toolUse?.input?.flashcards) {
        flashcards = toolUse.input.flashcards.map((fc: any) => ({
          term: fc.question,
          definition: fc.answer,
        }));

        const newFlashcards = new Flashcard({
          topic: toolUse.input.topic || 'Untitled Topic',
          flashcards: flashcards,
        });
        await newFlashcards.save();
      }
    }

    // Return the message and flashcards (if generated)
    return {
      message: messageText,
      flashcards: flashcards || null
    };

  } catch (error) {
    console.error('Error in AI Tutor:', error);
    throw new Error('Failed to process request');
  }
}
