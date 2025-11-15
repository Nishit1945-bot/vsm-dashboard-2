// app/api/hf-chat/route.ts
import { NextRequest, NextResponse } from "next/server";
import { findBestResponse } from "@/lib/vsm-training-responses";

interface Message {
  role: string;
  content: string;
}

function getHardcodedResponse(messages: Message[]): string {
  const lastMessage = messages[messages.length - 1].content.toLowerCase();
  const conversationLength = messages.length;
  const previousMessage = messages.length > 2 ? messages[messages.length - 3].content.toLowerCase() : '';

  // Try to find response from training data first
  const trainingResponse = findBestResponse(lastMessage);
  if (trainingResponse) {
    return trainingResponse;
  }

  // Fallback to original logic for special cases
  
  // Positive responses
  if (hasKeyword(lastMessage, ['yes', 'yeah', 'sure', 'ok', 'okay'])) {
    return "Perfect! Use the VSM Data Entry form on the right:\n\n1. Enter Customer Demand\n2. Add Process Steps\n3. Click Generate Preview\n\nNeed help? Just ask!";
  }

  // Initial greeting
  if (conversationLength === 1) {
    return "Great! Let's create a Value Stream Map.\n\nWhat product or product family do you want to map?";
  }

  // Form guidance
  if (hasKeyword(lastMessage, ['form', 'enter', 'where'])) {
    return "Use the VSM Data Entry form on the right side!\n\n1. Customer Demand (units/day)\n2. Click '+ Add Process'\n3. Fill cycle times\n4. Generate Preview\n\nNeed help with a specific field?";
  }

  // Generic fallback
  return "I can help you with:\n\n• Understanding VSM\n• Calculating takt time\n• Identifying bottlenecks\n• The 8 wastes (DOWNTIME)\n• Drawing VSM\n• Process data collection\n\nWhat would you like to know?";
}

function hasKeyword(text: string, keywords: string[]): boolean {
  return keywords.some(keyword => text.includes(keyword));
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Messages array is required" },
        { status: 400 }
      );
    }

    await new Promise(resolve => setTimeout(resolve, 500));

    const response = getHardcodedResponse(messages);

    return NextResponse.json({
      response: response,
      success: true,
    });

  } catch (error: any) {
    console.error("[Chat] Error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}