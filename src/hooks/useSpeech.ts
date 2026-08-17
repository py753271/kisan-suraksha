'use client';

import { useState, useEffect, useCallback } from 'react';

export function useSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [synth, setSynth] = useState<SpeechSynthesis | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      setSynth(window.speechSynthesis);
    }
  }, []);

  const speak = useCallback((text: string, lang: 'en' | 'hi' | 'gu') => {
    if (!synth) return;
    synth.cancel(); // cancel any active speech

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Choose appropriate voice tag prefix
    if (lang === 'hi') {
      utterance.lang = 'hi-IN';
    } else if (lang === 'gu') {
      utterance.lang = 'gu-IN';
    } else {
      utterance.lang = 'en-IN';
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    synth.speak(utterance);
  }, [synth]);

  const stop = useCallback(() => {
    if (!synth) return;
    synth.cancel();
    setIsSpeaking(false);
  }, [synth]);

  return { speak, stop, isSpeaking };
}
