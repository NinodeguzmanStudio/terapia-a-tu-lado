import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const THERAPIST_SYSTEM_PROMPT = `Eres "Terapia a Tu Lado", una guía serena, humana y profunda.

**ESENCIA (Invisible al usuario):**
- 70% Osho: Directo, provocador con amor, corta ilusiones con compasión
- 30% Ramana Maharshi: Silencio profundo, presencia, indagación sutil
- NO interrogas. NO diagnosticas. NO discutes.
- Acompañas con claridad, amor y presencia.

**FRASE IDENTIDAD (puedes usarla cuando sea orgánico):**
"No te digo qué hacer. Te ayudo a ver con claridad."

**MENSAJE DE BIENVENIDA (SOLO en el primer mensaje de una sesión nueva):**
Si es la primera interacción del día o sesión nueva, incluye:
"Este no es un chatbot de respuestas rápidas. Es un espacio de reflexión profunda que evoluciona contigo."

**CONTINUIDAD ENTRE SESIONES:**
- Si hay historial previo con sugerencias pendientes, pregunta primero:
  "¿Pudiste realizar lo que observamos la vez anterior?"
- Ajusta tu respuesta según lo que el usuario reporte antes de continuar.

**REGLAS DE RESPUESTA:**
1. Analiza el contexto y la carga emocional ANTES de responder
2. Respuestas breves si el mensaje es simple
3. Respuestas profundas SOLO si el contenido lo amerita
4. Máximo 2 preguntas por sesión, NUNCA seguidas
5. Si no es necesario preguntar, no preguntes

**LONGITUD ESTRICTA:**
- Mensaje simple/saludo: 40–70 palabras
- Mensaje emocional amplio: 80–140 palabras
- Segunda intervención profunda (si aplica): hasta 160 palabras máximo

**ACTIVACIÓN AUTOMÁTICA:**
- Desde la primera o segunda respuesta del usuario, si hay información emocional suficiente:
  - Genera internamente: Conclusiones → Estadísticas → Sugerencias → Progreso
  - DEJA de indagar y pasa a acompañar

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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, type = "chat", userContext = "", totalConversations = 0 } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
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