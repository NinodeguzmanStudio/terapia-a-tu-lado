import { useEffect, useState, useRef } from "react";

export type WeatherState = "storm" | "rain" | "cloudy" | "clearing" | "sunny";

interface WeatherBackgroundProps {
  weather: WeatherState;
}

function RainParticles({ intensity }: { intensity: "light" | "heavy" }) {
  const count = intensity === "heavy" ? 70 : 40;
  const drops = useRef(
    Array.from({ length: count }, (_, i) => ({
      id: i,
      left: Math.random() * 115 - 8,
      height: 10 + Math.random() * 18,
      duration: 0.4 + Math.random() * 0.5,
      delay: Math.random() * 2.5,
      opacity: intensity === "heavy"
        ? 0.5 + Math.random() * 0.3
        : 0.35 + Math.random() * 0.25,
      color: intensity === "heavy"
        ? `rgba(80,110,160,${0.5 + Math.random() * 0.3})`
        : `rgba(100,130,175,${0.35 + Math.random() * 0.25})`,
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

function DaisyParticles() {
  const flakes = useRef(
    Array.from({ length: 35 }, (_, i) => ({
      id: i,
      char: ["✿", "❀", "✾", "✿", "❀"][Math.floor(Math.random() * 5)],
      left: Math.random() * 100,
      size: 8 + Math.random() * 12,
      duration: 7 + Math.random() * 12,
      delay: Math.random() * 12,
      opacity: 0.4 + Math.random() * 0.4,
    }))
  ).current;

  return (
    <>
      {flakes.map((f) => (
        <span
          key={f.id}
          className="absolute pointer-events-none animate-daisyfall"
          style={{
            left: `${f.left}%`,
            top: "-20px",
            fontSize: `${f.size}px`,
            color: `rgba(220,200,240,${f.opacity})`,
            textShadow: "0 0 6px rgba(200,180,230,0.4)",
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

function LightningFlash() {
  return (
    <div
      className="absolute inset-0 pointer-events-none animate-lightning"
      style={{ background: "white", zIndex: 1 }}
    />
  );
}

function CloudParticles({ count = 4, darkness = 0.15 }: { count?: number; darkness?: number }) {
  const clouds = useRef(
    Array.from({ length: count }, (_, i) => ({
      id: i,
      top: 4 + i * 12 + Math.random() * 8,
      width: 120 + Math.random() * 180,
      height: 24 + Math.random() * 24,
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
            background: `rgba(130,135,150,${darkness})`,
            filter: "blur(8px)",
            animationDuration: `${c.duration}s`,
            animationDelay: `${c.delay}s`,
          }}
        />
      ))}
    </>
  );
}

function WarmParticles({ intensity }: { intensity: "soft" | "bright" }) {
  const count = intensity === "bright" ? 20 : 12;
  const particles = useRef(
    Array.from({ length: count }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      size: 3 + Math.random() * 5,
      duration: 8 + Math.random() * 12,
      delay: Math.random() * 10,
      alpha: intensity === "bright" ? 0.5 + Math.random() * 0.35 : 0.35 + Math.random() * 0.25,
    }))
  ).current;

  return (
    <>
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute pointer-events-none animate-warmfall"
          style={{
            left: `${p.left}%`,
            top: "-10px",
            width: `${p.size}px`,
            height: `${p.size}px`,
            borderRadius: "50%",
            background: `rgba(220,180,50,${p.alpha})`,
            boxShadow: `0 0 ${p.size * 5}px rgba(220,180,50,${p.alpha * 0.6})`,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </>
  );
}

export function WeatherBackground({ weather }: WeatherBackgroundProps) {
  const [displayWeather, setDisplayWeather] = useState<WeatherState>(weather);

  useEffect(() => {
    const timer = setTimeout(() => setDisplayWeather(weather), 600);
    return () => clearTimeout(timer);
  }, [weather]);

  const bgTint: Record<WeatherState, string> = {
    storm: "linear-gradient(180deg, rgba(100,110,140,0.25) 0%, rgba(80,90,120,0.18) 100%)",
    rain: "linear-gradient(180deg, rgba(120,140,175,0.18) 0%, rgba(110,130,165,0.12) 100%)",
    cloudy: "linear-gradient(180deg, rgba(160,158,150,0.12) 0%, rgba(150,148,140,0.08) 100%)",
    clearing: "linear-gradient(180deg, rgba(235,210,140,0.14) 0%, rgba(230,200,130,0.08) 100%)",
    sunny: "linear-gradient(180deg, rgba(245,220,100,0.16) 0%, rgba(240,210,90,0.10) 100%)",
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
          <DaisyParticles />
          <LightningFlash />
        </>
      )}
      {displayWeather === "rain" && (
        <>
          <RainParticles intensity="light" />
          <CloudParticles count={4} darkness={0.18} />
        </>
      )}
      {displayWeather === "cloudy" && <CloudParticles count={6} darkness={0.15} />}
      {displayWeather === "clearing" && (
        <>
          <WarmParticles intensity="soft" />
          <CloudParticles count={2} darkness={0.1} />
        </>
      )}
      {displayWeather === "sunny" && <WarmParticles intensity="bright" />}
    </div>
  );
}

const NEGATIVE_WORDS = [
  "triste", "mal", "dolor", "sufr", "llorar", "lloro", "miedo", "ansiedad", "ansios",
  "angustia", "desesper", "solo", "sola", "muerte", "morir", "odio", "rabia", "ira",
  "impotencia", "cansad", "agotad", "abrum", "no puedo", "no sé qué hacer",
  "perdid", "vacío", "vacía", "culpa", "vergüenza", "insomnio", "pánico",
  "depresión", "deprimid", "maltrat", "abuso", "violencia", "golpe",
  "tristeza", "horrible", "terrible", "insoportable", "asust", "aterr",
  "fracas", "inútil", "no sirvo", "no valgo", "nadie me", "estoy hart",
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

  if (crisisDetected) return "storm";

  const total = negScore + posScore;
  if (total === 0) return "cloudy";

  const ratio = posScore / total;

  if (negScore > 6 && ratio < 0.2) return "storm";
  if (negScore > 2 && ratio < 0.35) return "rain";
  if (ratio < 0.5) return "cloudy";
  if (ratio < 0.7) return "clearing";
  return "sunny";
}
