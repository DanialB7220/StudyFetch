"use server";

import { Anthropic } from '@anthropic-ai/sdk';
import connectMongo from '@/utils/mongo';
import Flashcard from '@/models/Flashcard';

interface FlashcardData {
  term: string;
  definition: string;
}

// Type guard to validate flashcard structure
function isValidFlashcardInput(input: any): input is { question: string; answer: string } {
  return (
    typeof input === 'object' &&
    input !== null &&
    typeof input.question === 'string' &&
    typeof input.answer === 'string'
  );
}

// Type guard to validate the tool response
function isValidToolResponse(content: any): content is { type: string; name: string; input: { flashcards: any[] } } {
  return (
    typeof content === 'object' &&
    content !== null &&
    content.type === 'tool_use' &&
    typeof content.name === 'string' &&
    typeof content.input === 'object' &&
    content.input !== null &&
    Array.isArray(content.input.flashcards)
  );
}

const anthroApiKey = process.env.ANYPHROPIC_API_KEY;
const anthropic = new Anthropic({ apiKey: anthroApiKey });

export async function callAiTutor(prompt: string): Promise<FlashcardData[]> {
  await connectMongo();
  
  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 6192,
      messages: [{ role: 'user', content: prompt }],
      tools: [
        {
          name: "flashcard_generator",
          description: "Generate flashcards from text",
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
            },
            required: ["flashcards"],
          },
        },
      ],
      tool_choice: { type: "tool", name: "flashcard_generator" },
    });

    // Find and validate the tool response
    const toolContent = response.content.find(item => 
      isValidToolResponse(item) && item.name === 'flashcard_generator'
    );

    if (!toolContent || !isValidToolResponse(toolContent)) {
      console.warn('No valid flashcards found in response');
      return [];
    }

    // Validate and transform each flashcard
    const flashcards = toolContent.input.flashcards
      .filter(isValidFlashcardInput)
      .map(fc => ({
        term: fc.question,
        definition: fc.answer,
      }));

    const newFlashcards = new Flashcard({
      topic: prompt,
      flashcards: flashcards,
    });

    await newFlashcards.save();
    console.log('Generated flashcards:', flashcards);
    return flashcards;

  } catch (error) {
    console.error('Error calling AI Tutor:', error);
    throw new Error('Failed to generate flashcards');
  }
}
