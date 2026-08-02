"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { Play, Square, VolumeX } from "lucide-react";

/**
 * Lectura en voz alta usando el motor del propio navegador.
 *
 * Dos problemas conocidos que resuelve este componente:
 *
 * 1. Chrome en Android corta la lectura a los ~15 segundos si el texto es
 *    largo. Por eso el texto se parte en frases y se encolan de a una: en
 *    cuanto una termina arranca la siguiente, y el motor nunca ve un
 *    bloque lo bastante largo como para cortarse.
 *
 * 2. En algunos navegadores la lista de voces llega vacía en el primer
 *    render y se puebla después, de forma asíncrona. Se escucha el evento
 *    `voiceschanged` para elegir la voz en español cuando aparezca.
 */

type SpeechState = {
  speakingId: string | null;
  /** Índice de la frase que se está leyendo, para poder resaltarla. */
  chunkIndex: number;
  speak: (id: string, chunks: string[]) => void;
  stop: () => void;
  supported: boolean;
};

const SpeechContext = createContext<SpeechState | null>(null);

export function SpeechProvider({ children }: { children: React.ReactNode }) {
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [chunkIndex, setChunkIndex] = useState(-1);
  const [supported, setSupported] = useState(false);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);
  // Marca de la reproducción actual: si cambia, las callbacks viejas se
  // descartan en vez de seguir avanzando una cola ya cancelada.
  const runRef = useRef(0);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    setSupported(true);

    function pickVoice() {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length === 0) return;
      voiceRef.current =
        voices.find((v) => /^es[-_]EC/i.test(v.lang)) ??
        voices.find((v) => /^es[-_](MX|419|US)/i.test(v.lang)) ??
        voices.find((v) => /^es/i.test(v.lang)) ??
        null;
    }

    pickVoice();
    window.speechSynthesis.addEventListener("voiceschanged", pickVoice);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", pickVoice);
      window.speechSynthesis.cancel();
    };
  }, []);

  function stop() {
    runRef.current++;
    window.speechSynthesis.cancel();
    setSpeakingId(null);
    setChunkIndex(-1);
  }

  function speak(id: string, chunks: string[]) {
    if (!supported) return;

    // Tocar el botón de algo que ya está sonando lo detiene
    if (speakingId === id) {
      stop();
      return;
    }

    window.speechSynthesis.cancel();
    const run = ++runRef.current;
    setSpeakingId(id);
    setChunkIndex(0);

    const queue = chunks.filter((c) => c.trim().length > 0);

    function sayFrom(i: number) {
      if (run !== runRef.current) return;
      if (i >= queue.length) {
        setSpeakingId(null);
        setChunkIndex(-1);
        return;
      }
      setChunkIndex(i);
      const u = new SpeechSynthesisUtterance(queue[i]);
      u.lang = voiceRef.current?.lang ?? "es-ES";
      if (voiceRef.current) u.voice = voiceRef.current;
      u.rate = 0.95;
      u.onend = () => sayFrom(i + 1);
      u.onerror = () => sayFrom(i + 1);
      window.speechSynthesis.speak(u);
    }

    sayFrom(0);
  }

  return (
    <SpeechContext.Provider
      value={{ speakingId, chunkIndex, speak, stop, supported }}
    >
      {children}
    </SpeechContext.Provider>
  );
}

export function useSpeech() {
  const ctx = useContext(SpeechContext);
  if (!ctx) {
    // Fuera del provider el componente simplemente no hace nada, en vez
    // de reventar la página.
    return {
      speakingId: null,
      chunkIndex: -1,
      speak: () => {},
      stop: () => {},
      supported: false,
    } satisfies SpeechState;
  }
  return ctx;
}

export function SpeakButton({
  id,
  chunks,
  label,
  size = "sm",
}: {
  id: string;
  chunks: string[];
  label?: string;
  size?: "sm" | "lg";
}) {
  const { speakingId, speak, supported } = useSpeech();
  const active = speakingId === id;

  if (!supported) return null;

  const isLarge = size === "lg";

  return (
    <button
      type="button"
      onClick={() => speak(id, chunks)}
      aria-label={active ? "Detener lectura" : `Leer ${label ?? "en voz alta"}`}
      aria-pressed={active}
      className={`inline-flex items-center gap-1.5 rounded-full border font-medium transition-colors active:scale-95 shrink-0 ${
        isLarge ? "h-11 px-4 text-sm" : "h-8 px-3 text-xs"
      } ${
        active
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-card hover:bg-accent"
      }`}
    >
      {active ? (
        <Square className={isLarge ? "size-4 fill-current" : "size-3 fill-current"} />
      ) : (
        <Play className={isLarge ? "size-4 fill-current" : "size-3 fill-current"} />
      )}
      {label && <span>{active ? "Detener" : label}</span>}
    </button>
  );
}

/** Aviso para cuando el navegador no trae motor de voz. */
export function SpeechUnsupportedNote() {
  const { supported } = useSpeech();
  if (supported) return null;
  return (
    <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
      <VolumeX className="size-3.5" />
      Este navegador no puede leer en voz alta.
    </p>
  );
}
