// ============================================================
// Llama a Supabase Edge Function via supabase.functions.invoke.
// Esto FUNCIONA — es el mismo método que usaba tu app original.
// La diferencia es que ahora la Edge Function NO usa streaming.
// ============================================================

import { supabase } from "@/integrations/supabase/client";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function callGemini(
  messages: ChatMessage[],
  type: "chat" | "analyze_emotions" | "generate_suggestions" = "chat",
  userContext: string = "",
  totalConversations: number = 0
): Promise<string> {
  console.log(`[callGemini] type=${type}, messages=${messages.length}`);

  const { data, error } = await supabase.functions.invoke("therapy-chat", {
    body: {
      messages,
      type,
      userContext,
      totalConversations,
    },
  });

  if (error) {
    console.error("[callGemini] Error:", error);
    throw new Error(error.message || "Error al contactar al terapeuta");
  }

  if (!data || !data.result) {
    console.error("[callGemini] No result. Response:", JSON.stringify(data));
    throw new Error("El terapeuta no generó respuesta. Intenta de nuevo.");
  }

  console.log(`[callGemini] OK: type=${type}, chars=${data.result.length}`);
  return data.result;
}
