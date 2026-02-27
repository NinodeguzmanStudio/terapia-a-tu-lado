// Vercel Serverless Function — reemplaza la Edge Function de Supabase
// Se ejecuta en Vercel con 10s de timeout (suficiente para Gemini)

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

function buildSystemPrompt(type, userContext, totalConversations) {
  let systemPrompt = THERAPIST_SYSTEM_PROMPT;

  if (userContext) {
    systemPrompt = `${userContext}\n\n${systemPrompt}`;
  }

  if (totalConversations >= 6) {
    systemPrompt += `\n\n[IMPORTANTE: Esta persona lleva ${totalConversations} mensajes contigo. En algún momento de tu respuesta, dile directamente algo como "Llevas un camino recorrido conmigo. ¿Has revisado tu progreso? A veces ver desde afuera lo que vives por dentro cambia la perspectiva." Hazlo natural, no forzado.]`;
  }

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

  return systemPrompt;
}

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, apikey, x-client-info");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { messages, type = "chat", userContext = "", totalConversations = 0 } = req.body;

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
      return res.status(500).json({ error: "GEMINI_API_KEY is not configured in Vercel" });
    }

    const systemPrompt = buildSystemPrompt(type, userContext, totalConversations);

    // Convert to Gemini format
    const geminiContents = messages.map((msg) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    }));

    const geminiRequest = {
      contents: geminiContents,
      systemInstruction: {
        parts: [{
          text: type === "chat"
            ? `${systemPrompt}\n\n⚠️ REGLA CRÍTICA: Habla SIEMPRE de TÚ. "Tú sientes", "lo que tú vives", "tu miedo". JAMÁS "el usuario", "la persona", "uno siente". Eres directo, profundo, real. Si es el primer mensaje, responde con 120-140 palabras. Si dice "hola", tú respondes con sustancia: nombra lo que percibes, abre espacio, pregunta algo que importe.`
            : systemPrompt
        }],
      },
      generationConfig: {
        temperature: type === "chat" ? 0.8 : 0.3,
        maxOutputTokens: type === "chat" ? 2048 : 1000,
      },
    };

    // Always use non-streaming generateContent — simple, reliable, no shutdown issues
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

    console.log(`[therapy-chat] Calling Gemini: type=${type}, model=gemini-2.0-flash`);

    const geminiResponse = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(geminiRequest),
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error("[therapy-chat] Gemini error:", geminiResponse.status, errorText);

      if (geminiResponse.status === 429) {
        return res.status(429).json({ error: "Límite de uso alcanzado. Espera un momento." });
      }

      return res.status(500).json({ error: `Error del terapeuta (${geminiResponse.status})` });
    }

    const data = await geminiResponse.json();

    // Extract text, skip thinking parts
    const parts = data.candidates?.[0]?.content?.parts || [];
    let content = "";
    for (const part of parts) {
      if (part.thought === true) continue;
      if (part.text) {
        content = part.text;
        break;
      }
    }

    if (!content) {
      console.error("[therapy-chat] Empty Gemini response:", JSON.stringify(data));
      return res.status(500).json({ error: "No se generó respuesta. Intenta de nuevo." });
    }

    console.log(`[therapy-chat] Success: type=${type}, length=${content.length}`);
    return res.status(200).json({ result: content });

  } catch (error) {
    console.error("[therapy-chat] Error:", error);
    return res.status(500).json({ error: error.message || "Error desconocido" });
  }
}
