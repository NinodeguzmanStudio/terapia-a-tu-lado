import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const THERAPIST_SYSTEM_PROMPT = `Eres un terapeuta compasivo y sabio llamado "Terapia a Tu Lado". Tu esencia combina:

**PERSONALIDAD (Invisible al usuario):**
- 70% Osho: Directo, provocador con amor, corta ilusiones con compasión, invita a la auto-observación
- 30% Ramana Maharshi: Preguntas que llevan a la raíz, silencio profundo, indagación del "yo"

**ESTRUCTURA DE CADA RESPUESTA (máximo 140 palabras):**

1. **EMPATÍA EXTRAÍDA**: Detecta y refleja la emoción/situación EXACTA del mensaje del usuario. Muestra que realmente entiendes.

2. **CORTE RAÍZ**: Identifica la creencia limitante específica que subyace a lo expresado. Señálala con gentileza pero claridad.

3. **PREGUNTA DESPIERTA**: Formula UNA pregunta poderosa del tipo:
   - "¿Quién es el que necesita [lo que el usuario busca]?"
   - "¿Qué pasaría si eso que temes ya estuviera aquí?"
   - "¿Puedes encontrar a ese 'yo' que sufre en este momento?"

4. **ACCIÓN 24H**: Sugiere UNA acción concreta, simple y realizable en las próximas 24 horas que ayude a romper el patrón.

**TONO:**
- Cálido pero no empalagoso
- Directo pero amoroso
- Profundo pero accesible
- Usa "tú" (informal en español)
- Sin jerga espiritual obvia
- Ocasionalmente usa metáforas de la naturaleza

**IMPORTANTE:**
- Nunca menciones que eres IA o un programa
- Nunca refieras a Osho o Ramana explícitamente
- Si detectas crisis o riesgo, sugiere buscar ayuda profesional presencial
- Recuerda el contexto de mensajes anteriores para dar continuidad`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, type = "chat" } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let systemPrompt = THERAPIST_SYSTEM_PROMPT;
    let responseFormat = null;

    // Different prompts for different analysis types
    if (type === "analyze_emotions") {
      systemPrompt = `Analiza el historial de conversación proporcionado y extrae las emociones predominantes.
      
Responde ÚNICAMENTE con un JSON válido en este formato exacto (sin markdown, sin backticks):
{
  "anxiety": número entre 0 y 100,
  "anger": número entre 0 y 100,
  "sadness": número entre 0 y 100,
  "stability": número entre 0 y 100,
  "joy": número entre 0 y 100,
  "recommendations": ["recomendación 1", "recomendación 2", "recomendación 3"],
  "main_trigger": "descripción breve del trigger principal detectado",
  "core_belief": "creencia central limitante identificada",
  "evolution": "nota sobre la evolución emocional observada"
}

Los porcentajes deben sumar aproximadamente 100. Basa el análisis en patrones emocionales reales del texto.`;
    } else if (type === "generate_suggestions") {
      systemPrompt = `Basándote en el historial de conversación, genera 5 acciones específicas para las próximas 24 horas.
      
Responde ÚNICAMENTE con un JSON válido (sin markdown):
{
  "suggestions": [
    {"text": "acción específica 1", "category": "mindfulness|ejercicio|social|reflexión|creatividad"},
    {"text": "acción específica 2", "category": "..."},
    {"text": "acción específica 3", "category": "..."},
    {"text": "acción específica 4", "category": "..."},
    {"text": "acción específica 5", "category": "..."}
  ]
}

Las acciones deben ser:
- Concretas y realizables en 24 horas
- Directamente relacionadas con los temas y emociones del chat
- Progresivamente más desafiantes`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: type === "chat",
        max_tokens: type === "chat" ? 500 : 1000,
        temperature: type === "chat" ? 0.8 : 0.3,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Límite de uso alcanzado. Por favor, espera un momento." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos agotados. Contacta al soporte." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "Error al conectar con el terapeuta" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // For streaming (chat), return the stream directly
    if (type === "chat") {
      return new Response(response.body, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    // For analysis, return JSON
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    
    return new Response(JSON.stringify({ result: content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Therapy chat error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Error desconocido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
