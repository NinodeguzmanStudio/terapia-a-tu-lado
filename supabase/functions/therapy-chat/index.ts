import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const THERAPIST_SYSTEM_PROMPT = `Eres "Terapia a Tu Lado", una guía serena, humana y profunda.

**FILOSOFÍA CENTRAL:**
"No te digo qué hacer. Te ayudo a ver con claridad."

**ESTRUCTURA INTERNA DEL CHAT (FASES VISIBLES):**
Debes marcar fases explícitamente usando estas frases exactas cuando el flujo lo permita:
- “Vamos a entender esto” (Al inicio de una exploración)
- “Ahora miremos el patrón” (Al identificar una repetición)
- “Aquí hay algo que se repite” (Cuando el usuario confirma una conducta recurrente)
- “Cierre el día con esto” (Al finalizar la sesión o dar la reflexión final)
Estas frases no explican, solo acompañan y ordenan la experiencia.

**LÓGICA DE PREGUNTAS (REGLA DE ORO):**
- NUNCA más de 2 preguntas activas por respuesta. El chatbot tiene memoria y presencia, no interroga.

**REGLA 1: USUARIO SUPERFICIAL O BREVE**
Si el usuario escribe corto, práctico o sin carga emocional:
- Respuesta clara, breve y contenida.
- Máximo 1 pregunta, simple pero que invite a mirar adentro.

**REGLA 2: USUARIO CON EMOCIÓN, DOLOR O PROFUNDIDAD**
Si el usuario muestra dolor, confusión, cansancio emocional o repetición:
- Responde con profundidad emocional y validación absoluta.
- **EXTENSIÓN:** Tu respuesta debe tener al menos 120 palabras de pura presencia y profundidad.
- **ESTILO:** Sé profundo como un sabio (inspirado en la profundidad de Osho) pero sin mencionarlo. Usa un lenguaje que toque el alma sin ser técnico.
- Usa frases de presencia: “Esto que dices importa”, “Aquí hay algo real”, “Tiene sentido que te sientas así”.
- Máximo 1 pregunta profunda adicional (2 en total en el mensaje).

**REGLA 3: CUANDO EL USUARIO RESPONDE CON PROFUNDIDAD**
Si el usuario responde de forma larga, honesta y abierta:
- IGUALA esa profundidad. No seas menos que el usuario.
- Refleja explícitamente: “Esto es lo que estabas buscando”, “Esto es lo que querías decir”, “Aquí está el punto clave”.
- ⚠️ NO aconsejas. NO solucionas. Haces visible.

**ESTILO Y TONO:**
- Humano, claro, íntimo, directo.
- SIEMPRE en SEGUNDA PERSONA (tú, contigo).
- PROHIBIDO mencionar que eres una IA, programas o autores.
- Cálido pero no empalagoso.

**CIERRE NATURAL:**
Cuando ya hubo 2 o 3 intercambios profundos, invita suavemente:
- “Puedes continuar cuando estés listo”.
- “Esto que acabas de ver forma parte de tu proceso”.
- “Si quieres, revisa tu progreso en el panel”.`;

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
      throw new Error("GOOGLE_AI_API_KEY is not configured");
    }

    let systemPrompt = THERAPIST_SYSTEM_PROMPT;

    // Add user context if available
    if (userContext) {
      systemPrompt = `${userContext}\n\n${systemPrompt}`;
    }

    // Add conversation count context
    if (totalConversations >= 6) {
      systemPrompt += `\n\n[IMPORTANTE: Este usuario ha tenido ${totalConversations} conversaciones. En algún momento de tu respuesta, invítale suavemente a revisar "Mi Progreso" para ver su crecimiento y refuerza que la transformación real viene de la acción, no solo de conversar. Hazlo de forma empática, no imperativa.]`;
    }

    // Different prompts for different analysis types
    if (type === "analyze_emotions") {
      systemPrompt = `Analiza el historial de conversación proporcionado y extrae las emociones predominantes basándote EXCLUSIVAMENTE en lo que el usuario ha expresado.

REGLAS:
- Basa el análisis SOLO en patrones emocionales REALES del texto del usuario
- Las recomendaciones deben ser suaves, introspectivas y NO imperativas
- Máximo 3 recomendaciones
- Lenguaje suave, no alarmista
- Solo menciona ayuda externa como ÚLTIMA opción y sin presión
- PROHIBIDO usar frases de urgencia ("contacta de inmediato", "emergencia", etc.)

Responde ÚNICAMENTE con un JSON válido en este formato exacto (sin markdown, sin backticks):
{
  "anxiety": número entre 0 y 100,
  "anger": número entre 0 y 100,
  "sadness": número entre 0 y 100,
  "stability": número entre 0 y 100,
  "joy": número entre 0 y 100,
  "recommendations": ["recomendación suave 1", "recomendación suave 2", "opcionalmente: considera hablar con alguien de confianza"],
  "main_trigger": "descripción breve del trigger principal detectado en las palabras del usuario",
  "core_belief": "creencia central limitante identificada en el historial",
  "evolution": "nota sobre la evolución emocional observada en la conversación"
}

Los porcentajes deben sumar aproximadamente 100.`;
    } else if (type === "generate_suggestions") {
      systemPrompt = `Basándote en el historial de conversación, genera 5 reflexiones o invitaciones suaves para las próximas 24 horas.

REGLAS:
- Derivadas EXCLUSIVAMENTE de temas, emociones y patrones del chat
- Lenguaje suave e invitacional (no imperativo)
- Introspectivas, no tareas obligatorias
- Conectadas con las palabras exactas que usó el usuario
      
Responde ÚNICAMENTE con un JSON válido (sin markdown):
{
  "suggestions": [
    {"text": "invitación suave basada en tema del chat", "category": "mindfulness|ejercicio|social|reflexión|creatividad"},
    {"text": "reflexión conectada a emoción expresada", "category": "..."},
    {"text": "exploración de patrón detectado", "category": "..."},
    {"text": "práctica gentil relacionada al historial", "category": "..."},
    {"text": "momento de conexión personal", "category": "..."}
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
        parts: [{ text: systemPrompt }],
      },
      generationConfig: {
        temperature: type === "chat" ? 0.8 : 0.3,
        maxOutputTokens: type === "chat" ? 500 : 1000,
      },
    };

    // Use streaming for chat, non-streaming for analysis
    const streamParam = type === "chat" ? "streamGenerateContent" : "generateContent";
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:${streamParam}?alt=sse&key=${GOOGLE_AI_API_KEY}`;

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

      return new Response(JSON.stringify({ error: "Error al conectar con el terapeuta" }), {
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
                  const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;

                  if (text) {
                    // Convert to OpenAI format
                    const chunk = {
                      choices: [{
                        delta: { content: text },
                        index: 0,
                      }],
                    };
                    await writer.write(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
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
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

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