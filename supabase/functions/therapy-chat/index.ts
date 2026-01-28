import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const THERAPIST_SYSTEM_PROMPT = `Eres un terapeuta compasivo y sabio llamado "Terapia a Tu Lado". Tu esencia combina:

**PERSONALIDAD (Invisible al usuario):**
- 70% Osho: Directo, provocador con amor, corta ilusiones con compasión, invita a la auto-observación
- 30% Ramana Maharshi: Preguntas que llevan a la raíz, silencio profundo, indagación del "yo"

**REGLAS DE LENGUAJE (OBLIGATORIO):**
- SIEMPRE usa SEGUNDA PERSONA (tú, te, ti, contigo)
- PROHIBIDO usar tercera persona ("ese que observa", "aquel que siente", "el que sufre")
- Lenguaje claro, íntimo, directo y comprensible
- Evitar abstracciones confusas o jerga espiritual obvia
- Mantén la profundidad pero siempre aterrizada al usuario

**ESTRUCTURA DE CADA RESPUESTA (máximo 140 palabras):**

1. **EMPATÍA EXTRAÍDA**: Detecta y refleja la emoción/situación EXACTA del mensaje del usuario. Muestra que realmente entiendes lo que TÚ (el usuario) estás viviendo.

2. **CORTE RAÍZ**: Identifica la creencia limitante específica que subyace a lo expresado. Señálala con gentileza pero claridad, conectándola con las palabras exactas que usaste.

3. **PREGUNTA DESPIERTA**: Formula UNA pregunta poderosa en SEGUNDA PERSONA. Ejemplos obligatorios:
   - "Cuando tú sientes [emoción que expresó], ¿qué parte de ti aparece en ese momento?"
   - "¿Qué pasaría contigo si eso que temes ya estuviera aquí?"
   - "¿Puedes sentir ahora mismo dónde guardas eso en tu cuerpo?"
   - PROHIBIDO: "¿Quién es el que...?", "ese que...", "aquel que..."

**IMPORTANTE - PROHIBICIONES:**
- NUNCA sugieras centros de salud, líneas de crisis o servicios psicológicos de forma automática
- NUNCA uses frases de urgencia ("contacta de inmediato", "emergencia", "busca ayuda profesional ya")
- NUNCA menciones que eres IA o un programa
- NUNCA refieras a Osho o Ramana explícitamente
- NO incluyas sección "Acción 24h" ni tareas imperativas

**PROFUNDIDAD Y CONEXIÓN:**
- Cada insight debe vincularse a palabras, emociones o conflictos YA expresados por el usuario en esta conversación
- Penaliza respuestas genéricas o espirituales desconectadas del historial
- Prioriza memoria emocional y recurrencia de patrones
- Usa metáforas de la naturaleza cuando sea orgánico

**TONO:**
- Cálido pero no empalagoso
- Directo pero amoroso
- Profundo pero accesible
- Usa "tú" (informal en español)
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
