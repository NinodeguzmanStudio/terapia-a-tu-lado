import { useEffect, useState, useRef } from "react";

export type WeatherState = "storm" | "rain" | "cloudy" | "clearing" | "sunny";

interface WeatherBackgroundProps {
  weather: WeatherState;
}

// ====== Rain drops — darker, more visible ======
function RainParticles({ intensity }: { intensity: "light" | "heavy" }) {
  const count = intensity === "heavy" ? 55 : 30;
  const drops = useRef(
    Array.from({ length: count }, (_, i) => ({
      id: i,
      left: Math.random() * 115 - 8,
      height: 6 + Math.random() * 14,
      duration: 0.35 + Math.random() * 0.55,
      delay: Math.random() * 2.5,
      opacity: intensity === "heavy"
        ? 0.35 + Math.random() * 0.25
        : 0.2 + Math.random() * 0.2,
      color: intensity === "heavy"
        ? `rgba(100,130,175,${0.35 + Math.random() * 0.25})`
        : `rgba(120,150,190,${0.2 + Math.random() * 0.2})`,
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
            top: "-14px",
            width: "2px",
            height: `${d.height}px`,
            borderRadius: "2px",
            backgroundColor: d.color,
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

// ====== Snow — more visible flakes ======
function SnowParticles() {
  const flakes = useRef(
    Array.from({ length: 25 }, (_, i) => ({
      id: i,
      char: ["❄", "❅", "✦", "·", "°"][Math.floor(Math.random() * 5)],
      left: Math.random() * 100,
      size: 8 + Math.random() * 12,
      duration: 6 + Math.random() * 10,
      delay: Math.random() * 12,
      opacity: 0.25 + Math.random() * 0.35,
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
            color: `rgba(140,160,190,${f.opacity})`,
            textShadow: "0 0 4px rgba(140,160,190,0.3)",
            animationDuration: `${f.duration}s`,
            animationDelay: `${f.delay}s`,
          }}
        >
          {f.char}
        </span>
      ))}
    </>
  );
}

// ====== Lightning ======
function LightningFlash() {
  return (
    <div
      className="absolute inset-0 pointer-events-none animate-lightning"
      style={{ background: "white", zIndex: 1 }}
    />
  );
}

// ====== Clouds — more visible ======
function CloudParticles({ count = 4, darkness = 0.06 }: { count?: number; darkness?: number }) {
  const clouds = useRef(
    Array.from({ length: count }, (_, i) => ({
      id: i,
      top: 4 + i * 12 + Math.random() * 8,
      width: 90 + Math.random() * 140,
      height: 16 + Math.random() * 16,
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
            background: `rgba(150,145,135,${darkness})`,
            filter: "blur(10px)",
            animationDuration: `${c.duration}s`,
            animationDelay: `${c.delay}s`,
          }}
        />
      ))}
    </>
  );
}

// ====== Warm particles — brighter ======
function WarmParticles({ intensity }: { intensity: "soft" | "bright" }) {
  const count = intensity === "bright" ? 16 : 10;
  const particles = useRef(
    Array.from({ length: count }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      size: 2 + Math.random() * 3,
      duration: 6 + Math.random() * 10,
      delay: Math.random() * 10,
      alpha: intensity === "bright" ? 0.4 + Math.random() * 0.3 : 0.25 + Math.random() * 0.2,
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
            background: `rgba(210,170,60,${p.alpha})`,
            boxShadow: `0 0 ${p.size * 4}px rgba(210,170,60,${p.alpha * 0.5})`,
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

  useEffect(() => {
    const timer = setTimeout(() => setDisplayWeather(weather), 600);
    return () => clearTimeout(timer);
  }, [weather]);

  // Background tints — noticeable but not overpowering
  const bgTint: Record<WeatherState, string> = {
    storm: "linear-gradient(180deg, rgba(160,170,195,0.18) 0%, rgba(140,155,180,0.12) 100%)",
    rain: "linear-gradient(180deg, rgba(165,178,200,0.12) 0%, rgba(155,168,190,0.08) 100%)",
    cloudy: "linear-gradient(180deg, rgba(175,170,160,0.07) 0%, rgba(170,165,155,0.04) 100%)",
    clearing: "linear-gradient(180deg, rgba(230,210,150,0.08) 0%, rgba(225,200,140,0.05) 100%)",
    sunny: "linear-gradient(180deg, rgba(240,215,120,0.1) 0%, rgba(235,205,110,0.06) 100%)",
  };

  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none"
      style={{
        background: bgTint[weather],
        transition: "background 3s ease",
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
          <CloudParticles count={3} darkness={0.07} />
        </>
      )}
      {displayWeather === "cloudy" && <CloudParticles count={5} darkness={0.06} />}
      {displayWeather === "clearing" && (
        <>
          <WarmParticles intensity="soft" />
          <CloudParticles count={2} darkness={0.04} />
        </>
      )}
      {displayWeather === "sunny" && <WarmParticles intensity="bright" />}
    </div>
  );
}

// ====== MOOD ANALYZER — reads messages in real time ======
const NEGATIVE_WORDS = [
  "triste", "mal", "dolor", "sufr", "llorar", "lloro", "miedo", "ansiedad", "ansios",
  "angustia", "desesper", "solo", "sola", "muerte", "morir", "odio", "rabia", "ira",
  "impotencia", "cansad", "agotad", "abrum", "no puedo", "no sé qué hacer",
  "perdid", "vacío", "vacía", "culpa", "vergüenza", "insomnio", "pánico",
  "depresión", "deprimid", "maltrat", "abuso", "violencia", "golpe",
  "tristeza", "horrible", "terrible", "insoportable", "asust", "aterr",
  "fracas", "inútil", "no sirvo", "no valgo", "nadie me", "estoy hart",
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
  "puedo", "motivad", "energía", "ilusión", "bonito", "bonita",
  "sonr", "risa", "divert", "disfrut",
  // Portuguese
  "melhor", "bem", "obrigad", "tranquil", "paz", "calmo", "alegr", "feliz",
  "esperança", "agradec", "alívio", "respir", "progresso", "avanço",
  "força", "livre", "amor", "vou tentar", "consigo", "motivad",
];

const CRISIS_WORDS = [
  "suicid", "matar", "no quiero vivir", "acabar con todo",
  "no vale la pena", "desaparecer", "quiero morir",
  "suicíd", "não quero viver", "acabar com tudo",
];

export function analyzeMessageMood(
  messages: Array<{ role: string; content: string }>
): WeatherState {
  if (messages.length === 0) return "cloudy";

  const recentUserMsgs = messages
    .filter((m) => m.role === "user")
    .slice(-4)
    .map((m) => m.content.toLowerCase());

  if (recentUserMsgs.length === 0) return "cloudy";

  let negScore = 0;
  let posScore = 0;
  let crisisDetected = false;

  recentUserMsgs.forEach((msg, idx) => {
    const weight = 1 + idx * 0.5; // Recent messages weigh more

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

  if (crisisDetected) return "storm";

  const total = negScore + posScore;
  if (total === 0) return "cloudy";

  const ratio = posScore / total;

  if (negScore > 8 && ratio < 0.15) return "storm";
  if (negScore > 3 && ratio < 0.3) return "rain";
  if (ratio < 0.45) return "cloudy";
  if (ratio < 0.65) return "clearing";
  return "sunny";
}
