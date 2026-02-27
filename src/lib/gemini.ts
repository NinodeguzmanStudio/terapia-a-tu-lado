// ============================================================
// GEMINI.TS — Llama a /api/therapy-chat (Vercel serverless).
// La API key se queda en el servidor. NUNCA en el frontend.
// ============================================================

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

  console.log(`[callGemini] Sending request: type=${type}, messages=${messages.length}`);

  const response = await fetch("/api/therapy-chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages,
      type,
      userContext,
      totalConversations,
    }),
  });

  // Si la respuesta no es JSON, es que Vercel devolvió HTML (la función no existe)
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    console.error("[callGemini] Response is not JSON — the serverless function is not running");
    console.error("[callGemini] Content-Type:", contentType);
    console.error("[callGemini] Status:", response.status);
    const text = await response.text();
    console.error("[callGemini] Body (first 200 chars):", text.slice(0, 200));
    throw new Error(
      "La función del servidor no está activa. Verifica que el archivo api/therapy-chat.js exista en la raíz del repo y que vercel.json esté configurado."
    );
  }

  const data = await response.json();

  if (!response.ok) {
    console.error("[callGemini] Server error:", data.error);
    throw new Error(data.error || `Error ${response.status}`);
  }

  if (!data.result) {
    console.error("[callGemini] Empty result from server");
    throw new Error("El terapeuta no generó respuesta. Intenta de nuevo.");
  }

  console.log(`[callGemini] Success: type=${type}, length=${data.result.length}`);
  return data.result;
}
