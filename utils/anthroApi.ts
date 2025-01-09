"use server";

import { Anthropic } from '@anthropic-ai/sdk';
import connectMongo from '@/utils/mongo';
import Flashcard from '@/models/Flashcard';

interface Flashcard {
  term: string;
  definition: string;
}

interface ToolUseInput {
  flashcards: {
    question: string;
    answer: string;
  }[];
}

interface ToolUseContent {
  type: string;
  name: string;
  input?: ToolUseInput;
}

interface AnthropicResponse {
  content: ToolUseContent[];
}

const anthroApiKey = process.env.ANYPHROPIC_API_KEY;
if (!anthroApiKey) {
  throw new Error('Anthropic API key is missing in environment variables.');
}

const anthropic = new Anthropic({ apiKey: anthroApiKey });

export async function callAiTutor(prompt: string): Promise<Flashcard[]> {
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

    console.log('Full response:', JSON.stringify(response, null, 2));

    // Cast response to AnthropicResponse type
    const anthropicResponse = response as unknown as AnthropicResponse;

    // Extract the correct `tool_use` object and its flashcards
    const toolUse = anthropicResponse.content.find(
      (item) =>
        item.type === 'tool_use' &&
        item.name === 'flashcard_generator'
    );

    if (!toolUse || !toolUse.input?.flashcards) {
      console.warn('No flashcards generated from the response.');
      return [];
    }

    const flashcards = toolUse.input.flashcards.map((fc) => ({
      term: fc.question,
      definition: fc.answer,
    }));

    const newFlashcards = new Flashcard({
      topic: prompt,
      flashcards,
    });

    await newFlashcards.save();
    console.log('Generated flashcards:', flashcards);

    return flashcards;
  } catch (error) {
    console.error('Error calling AI Tutor:', error);
    throw new Error('Failed to generate flashcards');
  }
}
