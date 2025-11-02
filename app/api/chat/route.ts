import { streamText } from "ai";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const systemPrompt = `You are an expert Value Stream Mapping (VSM) assistant for foundry operations.
For now, no external model is connected. Reply with a simple acknowledgement if someone tries to chat.`;

// ==============================
//  POST Handler
// ==============================
export async function POST(req: Request) {
  try {
    const { messages, chatId, userId } = await req.json();

    // Ask for industry if this is a new chat
    if (!messages || messages.length === 0) {
      return new Response(
        JSON.stringify({
          messages: [
            {
              role: "assistant",
              content: "Please tell me the type of industry you are working in.",
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // User authentication
    if (!userId) {
      return new Response("Unauthorized", { status: 401 });
    }

    const supabase = await getSupabaseServerClient();

    // Verify ownership
    const { data: chat } = await supabase
      .from("chats")
      .select("user_id")
      .eq("id", chatId)
      .single();

    if (!chat || chat.user_id !== userId) {
      return new Response("Forbidden", { status: 403 });
    }

    // Placeholder response (model removed)
    const placeholderResponse = {
      messages: [
        {
          role: "assistant",
          content:
            "The GPT model is currently disconnected. Your message was received successfully.",
        },
      ],
    };

    return new Response(JSON.stringify(placeholderResponse), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("[Chat API Error]:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
