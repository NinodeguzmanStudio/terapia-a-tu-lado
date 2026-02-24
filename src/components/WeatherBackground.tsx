import { useEffect, useState, useRef } from "react";

export type WeatherState = "storm" | "rain" | "cloudy" | "clearing" | "sunny";

interface WeatherBackgroundProps {
  weather: WeatherState;
}

// ====== Snowflake particles (for storm only — cold emotional state) ======
function SnowParticles() {
  const flakes = useRef(
    Array.from({ length: 30 }, (_, i) => ({
      id: i,
      char: ["❄", "❅", "✦", "·", "°"][Math.floor(Math.random() * 5)],
      left: Math.random() * 100,
      size: 7 + Math.random() * 10,
      duration: 6 + Math.random() * 10,
      delay: Math.random() * 12,
      opacity: 0.12 + Math.random() * 0.25,
    }))
  ).current;

  return (
    <>
      {flakes.map((f) => (
        <span
          key={f.id}
          className="absolute pointer-events-none animate-snowfall"
          style={{
            left: `${f.left}%`,
            top: "-20px",
            fontSize: `${f.size}px`,
            color: "rgba(200,210,225,0.5)",
            animationDuration: `${f.duration}s`,
            animationDelay: `${f.delay}s`,
            opacity: f.opacity,
          }}
        >
          {f.char}
        </span>
      ))}
    </>
  );
}

// ====== Rain drops ======
function RainParticles({ intensity }: { intensity: "light" | "heavy" }) {
  const count = intensity === "heavy" ? 50 : 25;
  const drops = useRef(
    Array.from({ length: count }, (_, i) => ({
      id: i,
      left: Math.random() * 115 - 8,
      height: 4 + Math.random() * 10,
      duration: 0.4 + Math.random() * 0.6,
      delay: Math.random() * 2.5,
      opacity: intensity === "heavy"
        ? 0.2 + Math.random() * 0.2
        : 0.12 + Math.random() * 0.12,
    }))
  ).current;

  return (
    <>
      {drops.map((d) => (
        <div
          key={d.id}
          className="absolute pointer-events-none animate-rainfall"
          style={{
            left: `${d.left}%`,
            top: "-12px",
            width: "1.5px",
            height: `${d.height}px`,
            borderRadius: "2px",
            backgroundColor: `rgba(155,180,215,${d.opacity})`,
            animationDuration: `${d.duration}s`,
            animationDelay: `${d.delay}s`,
            transform: "rotate(25deg)",
            transformOrigin: "top left",
          }}
        />
      ))}
    </>
  );
}

// ====== Storm lightning flash ======
function LightningFlash() {
  return (
    <div
      className="absolute inset-0 pointer-events-none animate-lightning"
      style={{ background: "white", zIndex: 1 }}
    />
  );
}

// ====== Clouds ======
function CloudParticles({ count = 4 }: { count?: number }) {
  const clouds = useRef(
    Array.from({ length: count }, (_, i) => ({
      id: i,
      top: 4 + i * 12 + Math.random() * 8,
      width: 80 + Math.random() * 130,
      height: 14 + Math.random() * 14,
      duration: 22 + Math.random() * 28,
      delay: -Math.random() * 22,
    }))
  ).current;

  return (
    <>
      {clouds.map((c) => (
        <div
          key={c.id}
          className="absolute pointer-events-none animate-clouddrift"
          style={{
            top: `${c.top}%`,
            width: `${c.width}px`,
            height: `${c.height}px`,
            borderRadius: "50px",
            background: "rgba(180,170,155,0.045)",
            filter: "blur(8px)",
            animationDuration: `${c.duration}s`,
            animationDelay: `${c.delay}s`,
          }}
        />
      ))}
    </>
  );
}

// ====== Warm particles (clearing / sunny) ======
function WarmParticles({ intensity }: { intensity: "soft" | "bright" }) {
  const count = intensity === "bright" ? 14 : 8;
  const particles = useRef(
    Array.from({ length: count }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      size: 1.5 + Math.random() * 2.5,
      duration: 6 + Math.random() * 10,
      delay: Math.random() * 10,
      alpha: intensity === "bright" ? 0.25 + Math.random() * 0.2 : 0.15 + Math.random() * 0.15,
    }))
  ).current;

  return (
    <>
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute pointer-events-none animate-particlerise"
          style={{
            left: `${p.left}%`,
            bottom: "-8px",
            width: `${p.size}px`,
            height: `${p.size}px`,
            borderRadius: "50%",
            background: `rgba(225,190,110,${p.alpha})`,
            boxShadow: `0 0 ${p.size * 3}px rgba(225,190,110,${p.alpha * 0.6})`,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </>
  );
}

// ====== MAIN COMPONENT ======
export function WeatherBackground({ weather }: WeatherBackgroundProps) {
  const [displayWeather, setDisplayWeather] = useState<WeatherState>(weather);

  // Gradual transition: delay particle swap to sync with background fade
  useEffect(() => {
    const timer = setTimeout(() => setDisplayWeather(weather), 800);
    return () => clearTimeout(timer);
  }, [weather]);

  // Background tints — very subtle, never covering text
  const bgTint: Record<WeatherState, string> = {
    storm: "rgba(180,190,210,0.06)",
    rain: "rgba(175,190,215,0.04)",
    cloudy: "rgba(180,175,165,0.03)",
    clearing: "rgba(225,200,140,0.03)",
    sunny: "rgba(240,210,130,0.025)",
  };

  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none"
      style={{
        background: bgTint[weather],
        transition: "background 4s ease",
        zIndex: 0,
      }}
    >
      {displayWeather === "storm" && (
        <>
          <RainParticles intensity="heavy" />
          <SnowParticles />
          <LightningFlash />
        </>
      )}
      {displayWeather === "rain" && (
        <>
          <RainParticles intensity="light" />
          <CloudParticles count={3} />
        </>
      )}
      {displayWeather === "cloudy" && <CloudParticles count={4} />}
      {displayWeather === "clearing" && (
        <>
          <WarmParticles intensity="soft" />
          <CloudParticles count={2} />
        </>
      )}
      {displayWeather === "sunny" && <WarmParticles intensity="bright" />}
    </div>
  );
}

// ====== MOOD ANALYZER — reads messages and returns weather ======
const NEGATIVE_WORDS = [
  "triste", "mal", "dolor", "sufr", "llorar", "lloro", "miedo", "ansiedad", "ansios",
  "angustia", "desesper", "solo", "sola", "muerte", "morir", "odio", "rabia", "ira",
  "impotencia", "cansad", "agotad", "abrum", "no puedo", "no sé qué hacer",
  "perdid", "vacío", "vacía", "culpa", "vergüenza", "insomnio", "pánico",
  "depresión", "deprimid", "maltrat", "abuso", "violencia", "golpe",
  "triste", "tristeza", "horrible", "terrible", "insoportable",
  // Portuguese
  "triste", "dor", "sofr", "chorar", "medo", "ansiedade", "angústia",
  "desespero", "sozinho", "sozinha", "morte", "morrer", "ódio", "raiva",
  "cansad", "esgotad", "não consigo", "não sei",
  "depressão", "deprimid", "abuso", "violência",
];

const POSITIVE_WORDS = [
  "mejor", "bien", "gracias", "tranquil", "paz", "calm", "alegr", "feliz",
  "esperanza", "agradec", "contento", "contenta", "alivia", "respir",
  "progreso", "avance", "logr", "entend", "comprend", "claridad",
  "fuerza", "valiente", "libre", "amor", "quiero intentar", "voy a",
  "puedo", "motivad", "energía", "ilusión",
  // Portuguese
  "melhor", "bem", "obrigad", "tranquil", "paz", "calmo", "alegr", "feliz",
  "esperança", "agradec", "alívio", "respir", "progresso", "avanço",
  "força", "livre", "amor", "vou tentar", "consigo", "motivad",
];

const CRISIS_WORDS = [
  "suicid", "matar", "no quiero vivir", "acabar con todo",
  "no vale la pena", "desaparecer",
  "suicíd", "matar", "não quero viver", "acabar com tudo",
];

export function analyzeMessageMood(
  messages: Array<{ role: string; content: string }>
): WeatherState {
  if (messages.length === 0) return "cloudy"; // Neutral start

  // Analyze last 4 user messages (recent mood)
  const recentUserMsgs = messages
    .filter((m) => m.role === "user")
    .slice(-4)
    .map((m) => m.content.toLowerCase());

  if (recentUserMsgs.length === 0) return "cloudy";

  let negScore = 0;
  let posScore = 0;
  let crisisDetected = false;

  recentUserMsgs.forEach((msg, idx) => {
    // Recent messages weigh more
    const weight = 1 + idx * 0.5;

    CRISIS_WORDS.forEach((w) => {
      if (msg.includes(w)) crisisDetected = true;
    });

    NEGATIVE_WORDS.forEach((w) => {
      if (msg.includes(w)) negScore += weight;
    });

    POSITIVE_WORDS.forEach((w) => {
      if (msg.includes(w)) posScore += weight;
    });
  });

  // Crisis → storm always
  if (crisisDetected) return "storm";

  const total = negScore + posScore;
  if (total === 0) return "cloudy";

  const ratio = posScore / total;

  // Graduated scale
  if (negScore > 8 && ratio < 0.15) return "storm";
  if (negScore > 4 && ratio < 0.3) return "rain";
  if (ratio < 0.45) return "cloudy";
  if (ratio < 0.65) return "clearing";
  return "sunny";
}

// ====== HISTORICAL MOOD — for cross-session weather ======
export function emotionDataToWeather(emotionData: {
  anxiety: number;
  anger: number;
  sadness: number;
  stability: number;
  joy: number;
} | null): WeatherState {
  if (!emotionData) return "cloudy";

  const { anxiety, anger, sadness, stability, joy } = emotionData;
  const negative = anxiety + anger + sadness;
  const positive = stability + joy;

  if (anger > 40 || (anxiety > 35 && sadness > 25)) return "storm";
  if (negative > 65) return "rain";
  if (positive > negative + 10) return positive > 70 ? "sunny" : "clearing";
  return "cloudy";
}
