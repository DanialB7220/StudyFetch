"use server";

import { Anthropic } from "@anthropic-ai/sdk";
import connectMongo from "@/utils/mongo";
import Flashcard from "@/models/Flashcard";
import message from "@/models/Message";

// Define types for response content blocks
interface ContentBlock {
  type: string; // General type field
}

interface TextBlock extends ContentBlock {
  type: "text";
  text: string;
}

interface ToolUseBlock extends ContentBlock {
  type: "tool_use";
  name: string;
  input?: {
    flashcards?: {
      question: string;
      answer: string;
    }[];
    topic?: string;
  };
}

type ResponseContent = TextBlock | ToolUseBlock;

const anthropicApiKey = process.env.ANTHROPIC_API_KEY;

if (!anthropicApiKey) {
  throw new Error("ANTHROPIC_API_KEY is not set in environment variables");
}

const anthropic = new Anthropic({
  apiKey: anthropicApiKey,
});

// Type guards
function isToolUseBlock(block: ContentBlock): block is ToolUseBlock {
  return block.type === "tool_use" && "input" in block;
}

function isTextBlock(block: ContentBlock): block is TextBlock {
  return block.type === "text" && "text" in block;
}

// Main function
export async function chatWithAiTutor(
  prompt: string,
  conversationId: string
) {
  await connectMongo();

  try {
    // Fetch previous messages for this conversation
    const previousMessages = await message
      .find({ conversationId })
      .sort({ timestamp: 1 })
      .select("role content -_id");

    // Include user's message in the conversation
    const messages = previousMessages.length
      ? [
          ...previousMessages.map((msg) => ({
            role: msg.role,
            content: msg.content || "",
          })),
          { role: "user", content: prompt },
        ]
      : [{ role: "user", content: prompt }];

    const apiParams: any = {
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 6192,
      messages,
      tools: [
        {
          name: "flashcard_generator",
          description: "Generate flashcards from text or a specific topic. Only use this tool if the user explicitly asks for flashcards or provides content suitable for flashcard generation.",
          input_schema: {
            type: "object",
            properties: {
              flashcards: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    question: { type: "string", description: "Flashcard term" },
                    answer: { type: "string", description: "Flashcard definition" },
                  },
                  required: ["question", "answer"],
                },
              },
              topic: {
                type: "string",
                description: "Topic related to the flashcards",
              },
            },
            required: ["flashcards", "topic"],
          },
        },
      ],
    };

    const response = await anthropic.messages.create(apiParams);

    console.log("Response Content:", JSON.stringify(response.content, null, 2));

    let messageText = "";
    let flashcards = null;

    // Handle tool use blocks
    const toolUse = response.content.find(
      (item: ContentBlock): item is ToolUseBlock =>
        isToolUseBlock(item) && item.name === "flashcard_generator"
    );

    if (toolUse?.input?.flashcards) {
      // If the tool was used, generate flashcards
      flashcards = toolUse.input.flashcards.map((fc) => ({
        term: fc.question,
        definition: fc.answer,
      }));

      const newFlashcards = new Flashcard({
        topic: toolUse.input.topic || "Untitled Topic",
        flashcards,
      });
      await newFlashcards.save();

      messageText = "Flashcards generated successfully! Refresh the page to view them and click on flashcards to flip them.";
    } else {
      // Handle regular text message blocks
      const aiMessage = response.content.find(isTextBlock);
      messageText = aiMessage?.text || "Unable to process the response.";
    }

    // Save the assistant's response to the conversation
    const newMessage = new message({
      conversationId,
      role: "assistant",
      content: messageText,
      timestamp: new Date(),
    });
    await newMessage.save();

    return {
      message: messageText,
      flashcards: flashcards || null,
    };
  } catch (error) {
    console.error("Error in AI Tutor:", error);
    throw new Error("Failed to process request");
  }
}
