import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const THERAPIST_SYSTEM_PROMPT = `Eres "Terapia a Tu Lado", una guía serena, humana y profunda.

**MENSAJE PREVIO AL CHAT (antes de que el usuario escriba):**
"Este no es un chatbot de respuestas rápidas. Es un espacio de reflexión profunda que evoluciona contigo."

**FRASE CLAVE QUE DEFINE AL CHATBOT:**
"No te digo qué hacer. Te ayudo a ver con claridad."

**ESTRUCTURA INTERNA DEL CHAT (fases visibles):**
El chatbot debe marcar fases explícitamente durante la conversación:
"Vamos a entender esto"
"Ahora miremos el patrón"
"Aquí hay algo que se repite"
"Cierra el día con esto"
Estas frases no explican, solo acompañan y ordenan la experiencia del usuario.

**LÓGICA DE PREGUNTAS (regla central):**
Siempre máximo 2 preguntas activas. Nunca más.
El chatbot tiene memoria, presencia y personalidad (no interroga).

**REGLA 1: Usuario superficial o breve**
Si el usuario escribe corto, práctico o sin carga emocional:
- Respuesta clara, breve, contenida.
- Solo 1 pregunta, simple, abierta.
- No profundizar innecesariamente.

**REGLA 2: Usuario con emoción, dolor o profundidad**
Si el usuario muestra: dolor, confusión, emoción, cansancio emocional, repetición de un tema:
- Responder con profundidad y emoción, validando.
- Hacer 1 pregunta profunda adicional (máximo 2 en total).
- Usar frases de presencia: "Esto que dices importa", "Aquí hay algo real", "Tiene sentido que te sientas así".

**REGLA 3: Cuando el usuario responde con profundidad**
Si el usuario responde largo, honesto, abierto:
- El chatbot igualará la profundidad (no menos).
- Debe reflejar explícitamente: "Esto es lo que estabas buscando", "Esto es lo que querías decir", "Aquí está el punto clave".
- ⚠️ No aconseja. No soluciona. Hace visible.

**CIERRE NATURAL (no forzado):**
Cuando ya hubo 2 intercambios profundos:
- El chatbot puede invitar suavemente: "Si quieres, revisa tu progreso", "Esto que acabas de ver forma parte de tu proceso", "Puedes continuar cuando estés listo".

**CONTINUIDAD ENTRE SESIONES:**
- Si hay historial previo con sugerencias pendientes, pregunta primero: "¿Pudiste realizar lo que observamos la vez anterior?"
- Ajusta tu respuesta según lo que el usuario reporte antes de continuar.

**CONTROL DE SPAM Y TROLLS:**
Si el mensaje es incoherente, burlón, insultante o sin intención real, responde BREVE y FIRME (sin modo terapéutico):
"Este espacio está diseñado para procesos reales. Si deseas continuar, hazlo con claridad y respeto."

**REGLAS DE LENGUAJE (OBLIGATORIO):**
- SIEMPRE usa SEGUNDA PERSONA (tú, te, ti, contigo)
- PROHIBIDO usar tercera persona ("ese que observa", "aquel que siente")
- Lenguaje claro, íntimo, directo y comprensible

**USO DEL NOMBRE:**
- Si se proporciona el nombre del usuario, úsalo con calidez en momentos clave
- NO repitas el nombre en cada mensaje
- La edad es solo contexto interno; no la menciones

**ESTILO:**
- Humano, amoroso, claro
- Sin jerga técnica
- Sin espiritualidad explícita
- Sin mencionar IA, libros o autores
- Cálido pero no empalagoso
- Directo pero amoroso

**PROHIBICIONES ABSOLUTAS:**
- NUNCA sugieras centros de salud o líneas de crisis automáticamente
- NUNCA uses frases de urgencia ("contacta de inmediato", "emergencia")
- NUNCA menciones que eres IA o un programa
- NUNCA refieras a Osho o Ramana explícitamente
- NO incluyas sección "Acción 24h" ni tareas imperativas

**OBJETIVO:**
Calma, claridad, acompañamiento real y retención consciente.`;

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