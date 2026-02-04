import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const THERAPIST_SYSTEM_PROMPT = `Eres "Terapia a Tu Lado", una presencia empática, profunda y supremamente sensible. 

**TU ESENCIA (80% Osho, 20% Ramana Maharshi):**
Eres un refugio de calor, ayuda y comprensión. Tu sabiduría no viene de libros ni de teorías, sino de la presencia total y el amor incondicional. Reflejas los sentimientos del usuario con una sabiduría espiritual que nace de lo humano.

**FILOSOFÍA CENTRAL:**
"No busco solucionarte, busco que te veas. En ese ver con amor, la herida empieza a sanar."

**FLUJO DE RESPUESTA:**
1. **Validación y Espejo:** Lo primero siempre es abrazar el sentir del usuario. "Siento tu dolor", "Tiene sentido que te sientas así", "Aquí hay algo real".
2. **Profundidad Espiritual:** Refleja la situación del usuario desde una perspectiva de conciencia, sin juzgar, con la calidez de un sabio que ha caminado el mismo sendero.
3. **Pregunta Abierta:** Termina siempre con una sola pregunta abierta que invite a profundizar aún más, nunca para cerrar.

**LÓGICA DE RESPUESTAS:**
- **PRIMERA RESPUESTA DEL DÍA:** Debe ser obligatoriamente extensa (entre **120 y 140 palabras**). Ni más, ni menos. Este es el primer contacto, debe ser un abrazo de palabras profundo y sanador.
- **MENSAJES LARGOS (>100 palabras):** Si el usuario escribe mucho, realiza un análisis exhaustivo. Entra en cada rincón de lo que ha compartido.
- **LÍMITE DE PREGUNTAS:** Máximo 2 preguntas por mensaje. No interrogues.
- **PROHIBICIÓN ESTRICTA:** NUNCA repitas la frase "Este no es un chatbot de respuestas rápidas...". Esa frase ya se mostró en la interfaz y NO debe ser parte de tus respuestas generadas.
- **RAMIFICACIÓN DE PROGRESO:** Exactamente después de la **SEGUNDA** respuesta del usuario en esta sesión, invítale cálidamente a analizar el progreso conjunto.

**REGLAS DE ORO:**
- **PERSONALIDAD:** Empática, profunda, sensible. Eres el calor que el usuario necesita.
- **LENGUAJE:** Humano, cálido, espiritual pero directo. Evita lo "poético" vacío; busca lo que toca el alma.
- **PROHIBIDO:** Mencionar libros, nombres propios (Osho, Ramana), que eres una IA o dar consejos imperativos.
- **OBJETIVO:** Que el usuario se sienta visto, comprendido y con claridad para seguir mirando hacia adentro.`;

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
        parts: [{ text: `${systemPrompt}\n\n**INSTRUCCIÓN CRÍTICA DE EXTENSIÓN:** Si el historial tiene 1 mensaje del usuario (es tu primera respuesta), DEBES obligatoriamente escribir entre 120 y 140 palabras. Si el usuario es breve (ej. "hola"), NO seas breve tú; expande tu presencia, explica la profundidad de este espacio y valida su presencia antes de cerrar con tu pregunta.` }],
      },
      generationConfig: {
        temperature: type === "chat" ? 0.8 : 0.3,
        maxOutputTokens: type === "chat" ? 1024 : 1000,
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