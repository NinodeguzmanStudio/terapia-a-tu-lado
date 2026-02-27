import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const THERAPIST_SYSTEM_PROMPT = `Eres "Terapia a Tu Lado". Hablas SIEMPRE en segunda persona directa: "tú", "te", "tu", "sientes", "vives". NUNCA uses tercera persona como "el usuario", "la persona", "uno". Estás hablando directamente CON quien te escribe.

**TU ESENCIA:**
Eres como un maestro zen que ve a través de las palabras. No adornas. No decoras. Vas al centro de lo que la persona siente. Tu claridad es tu compasión. Dices lo que otros no se atreven a decir, pero lo dices con tanto amor que no duele — despierta.

**CÓMO HABLAS:**
- Directo. Claro. Penetrante. Sin rodeos poéticos.
- Usas frases cortas que impactan. Luego profundizas.
- No repites lo que te dijeron como un espejo mecánico. Vas más allá: nombras lo que está DEBAJO de lo que dicen.
- Ejemplo MALO: "Siento que estás pasando por un momento difícil y quiero que sepas que este espacio es seguro para ti..."
- Ejemplo BUENO: "Hay algo más detrás de esa tristeza. No es solo lo que pasó — es lo que crees sobre ti misma por lo que pasó. ¿Lo ves?"

**FLUJO DE CADA RESPUESTA:**
1. **Nombra lo real:** Di lo que percibes que la persona siente. Sin filtro. Con amor pero sin dulcificar. "Estás enojada, pero debajo del enojo hay miedo."
2. **Profundiza:** Ofrece una perspectiva que la persona no ha considerado. No des consejos. Abre una puerta. "¿Y si ese control que buscas es exactamente lo que te tiene atrapada?"
3. **Una pregunta que sacuda:** Termina con UNA sola pregunta directa que invite a mirar más adentro. No preguntas suaves — preguntas que importen.

**REGLAS INQUEBRANTABLES:**
- SIEMPRE háblale de TÚ, directo, como si estuvieras frente a frente.
- Primera respuesta del día: entre 120 y 140 palabras. Es tu primera conexión — debe ser profunda y sustancial.
- Mensajes largos del usuario: entra en cada capa de lo que compartió.
- Máximo 2 preguntas por mensaje.
- NUNCA digas "Este no es un chatbot de respuestas rápidas" ni variantes.
- NUNCA menciones libros, autores, que eres IA, ni des instrucciones imperativas ("deberías", "tienes que").
- NUNCA uses lenguaje poético vacío: nada de "tu alma danza", "el universo te abraza", "las estrellas conspiran". Sé real.
- Después de la SEGUNDA respuesta del usuario en la sesión, invita suavemente a revisar su progreso.
- Tu objetivo: que quien te lea sienta que ALGUIEN por fin lo VIO de verdad.`;

interface Message {
  role: string;
  content: string;
}

interface GeminiContent {
  parts: Array<{ text: string }>;
  role: string;
}

interface GeminiRequest {
  contents: GeminiContent[];
  generationConfig?: {
    temperature?: number;
    maxOutputTokens?: number;
    thinkingConfig?: {
      thinkingBudget?: number;
    };
  };
  systemInstruction?: {
    parts: Array<{ text: string }>;
  };
}

Deno.serve(async (req: Request) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, type = "chat", userContext = "", totalConversations = 0 } = await req.json();
    const GOOGLE_AI_API_KEY = Deno.env.get("GEMINI_API_KEY");

    if (!GOOGLE_AI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    let systemPrompt = THERAPIST_SYSTEM_PROMPT;

    // Add user context if available
    if (userContext) {
      systemPrompt = `${userContext}\n\n${systemPrompt}`;
    }

    // Add conversation count context
    if (totalConversations >= 6) {
      systemPrompt += `\n\n[IMPORTANTE: Esta persona lleva ${totalConversations} mensajes contigo. En algún momento de tu respuesta, dile directamente algo como "Llevas un camino recorrido conmigo. ¿Has revisado tu progreso? A veces ver desde afuera lo que vives por dentro cambia la perspectiva." Hazlo natural, no forzado.]`;
    }

    // Different prompts for different analysis types
    if (type === "analyze_emotions") {
      systemPrompt = `Analiza el historial de conversación y extrae las emociones predominantes basándote EXCLUSIVAMENTE en lo que la persona ha expresado.

REGLAS:
- Basa el análisis SOLO en patrones emocionales REALES del texto
- Las recomendaciones deben estar en segunda persona (tú): "Observa cómo...", "Pregúntate si..."
- Máximo 3 recomendaciones — directas, introspectivas, no imperativas
- Lenguaje claro y directo, no alarmista
- Solo menciona ayuda profesional como última opción y sin presión
- PROHIBIDO usar frases de urgencia ("contacta de inmediato", "emergencia", etc.)

Responde ÚNICAMENTE con un JSON válido en este formato exacto (sin markdown, sin backticks):
{
  "anxiety": número entre 0 y 100,
  "anger": número entre 0 y 100,
  "sadness": número entre 0 y 100,
  "stability": número entre 0 y 100,
  "joy": número entre 0 y 100,
  "recommendations": ["recomendación directa en tú 1", "recomendación directa en tú 2", "opcional: considerar hablar con alguien de confianza"],
  "main_trigger": "descripción breve y directa del trigger principal detectado",
  "core_belief": "creencia central limitante identificada — escrita en primera persona como la diría la persona: ej. 'No merezco que me quieran'",
  "evolution": "nota breve sobre cómo ha cambiado el tono emocional durante la conversación"
}

Los porcentajes deben sumar aproximadamente 100.`;
    } else if (type === "generate_suggestions") {
      systemPrompt = `Basándote en el historial de conversación, genera exactamente 3 reflexiones o invitaciones suaves para las próximas 24 horas.
      
REGLAS:
- Derivadas EXCLUSIVAMENTE de temas, emociones y patrones del chat.
- Lenguaje profundamente empático, sensible y cálido.
- **CANTIDAD:** Exactamente 3 sugerencias.
- Cada sugerencia debe ser una invitación a mirar hacia adentro o a realizar una acción pequeña pero significativa.
      
Responde ÚNICAMENTE con un JSON válido (sin markdown):
{
  "suggestions": [
    {"text": "invitación empática 1", "category": "mindfulness|ejercicio|social|reflexión|creatividad"},
    {"text": "invitación empática 2", "category": "..."},
    {"text": "invitación empática 3", "category": "..."}
  ]
}`;
    }

    // Convert messages to Gemini format
    const geminiContents: GeminiContent[] = messages.map((msg: Message) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    }));

    const geminiRequest: GeminiRequest = {
      contents: geminiContents,
      systemInstruction: {
        parts: [{ text: `${systemPrompt}\n\n⚠️ REGLA CRÍTICA: Habla SIEMPRE de TÚ. "Tú sientes", "lo que tú vives", "tu miedo". JAMÁS "el usuario", "la persona", "uno siente". Eres directo, profundo, real. Si es el primer mensaje, responde con 120-140 palabras. Si dice "hola", tú respondes con sustancia: nombra lo que percibes, abre espacio, pregunta algo que importe.` }],
      },
      generationConfig: {
        temperature: type === "chat" ? 0.8 : 0.3,
        maxOutputTokens: type === "chat" ? 1024 : 1000,
        // Disable thinking to keep streaming simple and responses fast
        thinkingConfig: {
          thinkingBudget: 0,
        },
      },
    };

    // Use streaming for chat, non-streaming for analysis
    const streamParam = type === "chat" ? "streamGenerateContent" : "generateContent";
    const queryParam = type === "chat" ? "?alt=sse&" : "?";
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:${streamParam}${queryParam}key=${GOOGLE_AI_API_KEY}`;

    console.log(`Calling Gemini API: type=${type}, model=gemini-2.5-flash, streaming=${type === "chat"}`);

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(geminiRequest),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Límite de uso alcanzado. Por favor, espera un momento." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: `Error al conectar con el terapeuta (${response.status})` }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // For streaming (chat), transform SSE format to OpenAI-compatible format
    if (type === "chat") {
      const { readable, writable } = new TransformStream();
      const writer = writable.getWriter();
      const encoder = new TextEncoder();

      // Process Gemini SSE stream
      (async () => {
        try {
          const reader = response.body!.getReader();
          const decoder = new TextDecoder();
          let buffer = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const data = line.slice(6);
                if (data === "[DONE]") continue;

                try {
                  const parsed = JSON.parse(data);
                  // Gemini 2.5 Flash may have multiple parts (thinking + response)
                  // We only want non-thinking text parts
                  const parts = parsed.candidates?.[0]?.content?.parts || [];
                  for (const part of parts) {
                    // Skip thinking parts — only output real text
                    if (part.thought === true) continue;
                    if (part.text) {
                      const chunk = {
                        choices: [{
                          delta: { content: part.text },
                          index: 0,
                        }],
                      };
                      await writer.write(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
                    }
                  }
                } catch (e) {
                  console.error("Error parsing SSE:", e);
                }
              }
            }
          }

          await writer.write(encoder.encode("data: [DONE]\n\n"));
          await writer.close();
        } catch (error) {
          console.error("Stream error:", error);
          await writer.abort(error);
        }
      })();

      return new Response(readable, {
        headers: {
          ...corsHeaders,
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
        },
      });
    }

    // For analysis, return JSON
    const data = await response.json();
    // Gemini 2.5 Flash: find the first non-thinking text part
    const parts = data.candidates?.[0]?.content?.parts || [];
    let content = "";
    for (const part of parts) {
      if (part.thought === true) continue;
      if (part.text) {
        content = part.text;
        break;
      }
    }

    return new Response(JSON.stringify({ result: content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Therapy chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Error desconocido" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
