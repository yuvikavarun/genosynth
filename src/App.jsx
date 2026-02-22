import React, { useState, useEffect, useRef } from 'react';
import { Search, Dna, Activity, Zap, Database, Upload, GitCompare } from 'lucide-react';
import { GENE_REGISTRY, BASE_TO_NOTE } from './constants';
import TrackPanel from './components/TrackPanel';

export default function App() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [bpm, setBpm] = useState(120);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMutationMode, setIsMutationMode] = useState(false);
  const [isCompareMode, setIsCompareMode] = useState(false);

  // Track 1 State
  const [gene1, setGene1] = useState(GENE_REGISTRY[0]);
  const [seq1, setSeq1] = useState('');
  const [isPlaying1, setIsPlaying1] = useState(false);
  const [isLoading1, setIsLoading1] = useState(false);
  const [codon1, setCodon1] = useState(-1);
  const [gc1, setGc1] = useState(0);
  const [apiError1, setApiError1] = useState('');

  // Track 2 State
  const [gene2, setGene2] = useState(GENE_REGISTRY[1]);
  const [seq2, setSeq2] = useState('');
  const [isPlaying2, setIsPlaying2] = useState(false);
  const [isLoading2, setIsLoading2] = useState(false);
  const [codon2, setCodon2] = useState(-1);
  const [gc2, setGc2] = useState(0);
  const [apiError2, setApiError2] = useState('');

  // Refs
  const vantaRef = useRef(null);
  const vantaEffect = useRef(null);
  const loopRef = useRef(null);
  const synth1Ref = useRef(null);
  const synth2Ref = useRef(null);
  const bassRef = useRef(null);
  
  const seqRef1 = useRef('');
  const seqRef2 = useRef('');
  const playRef1 = useRef(false);
  const playRef2 = useRef(false);
  const pHead1 = useRef(0);
  const pHead2 = useRef(0);
  
  const fileInputRef1 = useRef(null);
  const fileInputRef2 = useRef(null);

  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'icon';
    link.type = 'image/svg+xml';
    link.href = 'data:image/svg+xml,<svg xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)" viewBox="0 0 24 24" fill="none" stroke="%233b82f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 15c6.667-6 13.333 0 20-6"/><path d="M9 22c1.798-1.998 2.518-3.995 2.807-5.993"/><path d="M15 2c-1.798 1.998-2.518 3.995-2.807 5.993"/><path d="M17 6l-2.5-2.5"/><path d="M14 8l-1-1"/><path d="M7 18l2.5 2.5"/><path d="M3.5 14.5l.5.5"/><path d="M20 9.5l-.5-.5"/></svg>';
    document.head.appendChild(link);

    const loadScript = (src) => {
      return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) return resolve();
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    };

    const initSystems = async () => {
      try {
        await loadScript('[https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js](https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js)');
        await loadScript('[https://cdn.jsdelivr.net/npm/vanta@latest/dist/vanta.cells.min.js](https://cdn.jsdelivr.net/npm/vanta@latest/dist/vanta.cells.min.js)');
        await loadScript('[https://cdnjs.cloudflare.com/ajax/libs/tone/14.8.49/Tone.js](https://cdnjs.cloudflare.com/ajax/libs/tone/14.8.49/Tone.js)');
        
        if (!vantaEffect.current && window.VANTA) {
          vantaEffect.current = window.VANTA.CELLS({
            el: vantaRef.current, mouseControls: true, touchControls: true, gyroControls: false,
            minHeight: 200.00, minWidth: 200.00, scale: 1.00, color1: 0x3b82f6, color2: 0x1e293b, size: 2.00, speed: 1.50
          });
        }
        setIsLoaded(true);
        fetchSequence(GENE_REGISTRY[0].id, 1);
        fetchSequence(GENE_REGISTRY[1].id, 2); 
      } catch (err) { console.error("Failed to load external libraries", err); }
    };

    initSystems();
    return () => {
      if (vantaEffect.current) vantaEffect.current.destroy();
      if (loopRef.current && window.Tone) window.Tone.Transport.clear(loopRef.current);
    };
  }, []);

  const updateSequenceData = (seq, trackNum) => {
    const gcCount = seq.length > 0 ? (seq.match(/[GC]/g) || []).length : 0;