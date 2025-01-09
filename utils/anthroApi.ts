"use server";

interface Flashcard {
  term: string;
  definition: string;
}
import { Anthropic } from '@anthropic-ai/sdk';
import connectMongo from '@/utils/mongo';
import Flashcard from '@/models/Flashcard';

const anthroApiKey = process.env.ANYPHROPIC_API_KEY;
const anthropic = new Anthropic({ apiKey: anthroApiKey });

export async function callAiTutor(prompt: string) {
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

    // Extract the correct `tool_use` object and its flashcards
    const toolUse = response.content.find(
      (item: any) => item.type === 'tool_use' && item.name === 'flashcard_generator'
    );

    if (!toolUse || !toolUse.input?.flashcards) {
      console.warn('No flashcards generated from the response.');
      return [];
    }

    const flashcards = toolUse.input.flashcards.map((fc: any) => ({
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