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
    link.href = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%233b82f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 15c6.667-6 13.333 0 20-6"/><path d="M9 22c1.798-1.998 2.518-3.995 2.807-5.993"/><path d="M15 2c-1.798 1.998-2.518 3.995-2.807 5.993"/><path d="M17 6l-2.5-2.5"/><path d="M14 8l-1-1"/><path d="M7 18l2.5 2.5"/><path d="M3.5 14.5l.5.5"/><path d="M20 9.5l-.5-.5"/></svg>';
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
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js');
        await loadScript('https://cdn.jsdelivr.net/npm/vanta@latest/dist/vanta.cells.min.js');
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/tone/14.8.49/Tone.js');
        
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
    const gcPercent = seq.length > 0 ? ((gcCount / seq.length) * 100).toFixed(1) : 0;
    if (trackNum === 1) { setSeq1(seq); seqRef1.current = seq; setGc1(gcPercent); } 
    else { setSeq2(seq); seqRef2.current = seq; setGc2(gcPercent); }
  };

  const fetchSequence = async (id, trackNum) => {
    if (trackNum === 1) { setIsLoading1(true); setApiError1(''); }
    else { setIsLoading2(true); setApiError2(''); }

    try {
      const response = await fetch(`https://rest.ensembl.org/sequence/id/${id}?content-type=application/json`);
      if (!response.ok) throw new Error('Failed to fetch from Ensembl');
      const data = await response.json();
      updateSequenceData(data.seq.substring(0, 600).toUpperCase(), trackNum);
    } catch (err) {
      const fallback = "ATGCGTACTGATCGATCGTACGATCGTAGCTAGCTAGCTGATCGATCGTACGATCGTAGC".repeat(10);
      updateSequenceData(fallback, trackNum);
      if (trackNum === 1) setApiError1('API Error. Using synthetic sequence.');
      else setApiError2('API Error. Using synthetic sequence.');
    } finally {
      if (trackNum === 1) { setIsLoading1(false); pHead1.current = 0; setCodon1(-1); }
      else { setIsLoading2(false); pHead2.current = 0; setCodon2(-1); }
    }
  };

  const initAudio = async () => {
    if (!window.Tone) return;
    await window.Tone.start(); 

    if (!synth1Ref.current) {
      const synthConfig = { oscillator: { type: "sine" }, envelope: { attack: 0.1, decay: 0.2, sustain: 0.4, release: 1 } };
      synth1Ref.current = new window.Tone.PolySynth(window.Tone.Synth, synthConfig).toDestination();
      synth2Ref.current = new window.Tone.PolySynth(window.Tone.Synth, synthConfig).toDestination();
      
      const reverb = new window.Tone.Reverb({ decay: 2, wet: 0.4 }).toDestination();
      synth1Ref.current.connect(reverb);
      synth2Ref.current.connect(reverb);
      bassRef.current = new window.Tone.MembraneSynth().toDestination();
      window.Tone.Transport.bpm.value = bpm;

      loopRef.current = window.Tone.Transport.scheduleRepeat((time) => {
        if (playRef1.current && seqRef1.current.length >= 3) {
          const pH1 = pHead1.current;
          const codon1 = seqRef1.current.slice(pH1, pH1 + 3);
          if (codon1.length === 3) {
            synth1Ref.current.triggerAttackRelease(codon1.split('').map(b => BASE_TO_NOTE[b] || 'C4'), "8n", time);
            if ((pH1 / 3) % 4 === 0) bassRef.current.triggerAttackRelease("C2", "8n", time);
          }
          window.Tone.Draw.schedule(() => setCodon1(pH1), time);
          pHead1.current = pH1 + 3 >= seqRef1.current.length - 2 ? 0 : pH1 + 3;
        }

        if (playRef2.current && seqRef2.current.length >= 3) {
          const pH2 = pHead2.current;
          const codon2 = seqRef2.current.slice(pH2, pH2 + 3);
          if (codon2.length === 3) {
            synth2Ref.current.triggerAttackRelease(codon2.split('').map(b => BASE_TO_NOTE[b] || 'C4'), "8n", time);
            if (!playRef1.current && (pH2 / 3) % 4 === 0) bassRef.current.triggerAttackRelease("C2", "8n", time);
          }
          window.Tone.Draw.schedule(() => setCodon2(pH2), time);
          pHead2.current = pH2 + 3 >= seqRef2.current.length - 2 ? 0 : pH2 + 3;
        }
      }, "4n"); 
    }
  };

  const togglePlay = async (trackNum) => {
    if (!isLoaded || !window.Tone) return;
    await window.Tone.start();
    if (!synth1Ref.current) await initAudio();

    if (trackNum === 1) {
      const nextPlay = !isPlaying1;
      setIsPlaying1(nextPlay); playRef1.current = nextPlay;
    } else {
      const nextPlay = !isPlaying2;
      setIsPlaying2(nextPlay); playRef2.current = nextPlay;
    }

    if (playRef1.current || playRef2.current) {
      if (window.Tone.Transport.state !== 'started') window.Tone.Transport.start();
    } else { window.Tone.Transport.pause(); }
  };

  const handleBpmChange = (e) => {
    const newBpm = parseInt(e.target.value);
    setBpm(newBpm);
    if (window.Tone && window.Tone.Transport) window.Tone.Transport.bpm.rampTo(newBpm, 0.1);
  };

  const handleFileUpload = (e, trackNum) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const cleanSeq = event.target.result.replace(/^>.*$/gm, '').replace(/[^ACGT]/gi, '').toUpperCase();
      if (cleanSeq.length < 3) return trackNum === 1 ? setApiError1('Invalid sequence file.') : setApiError2('Invalid sequence file.');
      
      const limitedSeq = cleanSeq.substring(0, 600);
      const customGene = { id: 'CUSTOM', name: file.name.replace(/\.[^/.]+$/, "").substring(0, 15), desc: 'User sequence', species: 'Custom' };
      
      if (trackNum === 1) { setGene1(customGene); setApiError1(''); pHead1.current = 0; setCodon1(-1); } 
      else { setGene2(customGene); setApiError2(''); pHead2.current = 0; setCodon2(-1); }
      updateSequenceData(limitedSeq, trackNum);
    };
    reader.readAsText(file);
    e.target.value = null;
  };

  const handleExport = (trackNum) => {
    const targetSeq = trackNum === 1 ? seq1 : seq2;
    const targetGene = trackNum === 1 ? gene1 : gene2;
    const blob = new Blob([`>${targetGene.name} | Genosynth Export\n${targetSeq}`], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${targetGene.name}_mutated.fasta`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  const mutateBase = (index, trackNum) => {
    if (!isMutationMode) return;
    const targetSeq = trackNum === 1 ? seq1 : seq2;
    const bases = ['A', 'C', 'G', 'T'];
    const newSeq = targetSeq.substring(0, index) + (bases[(bases.indexOf(targetSeq[index]) + 1) % 4] || 'A') + targetSeq.substring(index + 1);
    updateSequenceData(newSeq, trackNum);
  };

  return (
    <div className="relative min-h-screen text-slate-200 overflow-hidden" style={{ fontFamily: "'Advercase', sans-serif" }}>
      <div ref={vantaRef} style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: -1 }} />

      <div className="relative z-10 container mx-auto px-4 py-6 h-screen flex flex-col">
        <header className="flex flex-wrap justify-between items-center gap-4 mb-4 p-4 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg border border-blue-500/50"><Dna className="w-8 h-8 text-blue-400" /></div>
            <div>
              <h1 className="text-2xl font-bold text-blue-400 tracking-widest">GENOSYNTH</h1>
              <p className="text-[10px] text-slate-400 tracking-wider uppercase">DNA Sonification Engine</p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-4 md:gap-6">
            <div className="flex items-center gap-3 bg-black/20 px-4 py-2 rounded-lg border border-white/10">
              <Activity className="w-4 h-4 text-slate-400" />
              <input type="range" min="60" max="240" value={bpm} onChange={handleBpmChange} className="w-24 md:w-32 accent-blue-500" />
              <span className="text-xs font-mono w-14">{bpm} BPM</span>
            </div>
            
            <button onClick={() => setIsCompareMode(!isCompareMode)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${isCompareMode ? 'bg-green-500/20 text-green-300 border border-green-500/50 shadow-[0_0_15px_rgba(34,197,94,0.4)]' : 'bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10'}`}>
              <GitCompare className="w-4 h-4" /> Compare Mode
            </button>
            <button onClick={() => setIsMutationMode(!isMutationMode)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${isMutationMode ? 'bg-purple-500/20 text-purple-300 border border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.4)]' : 'bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10'}`}>
              <Zap className="w-4 h-4" /> Mutation Mode
            </button>
          </div>
        </header>

        <div className="flex gap-5 flex-1 min-h-0">
          <aside className={`${isCompareMode ? 'w-1/4 max-w-[280px]' : 'w-1/3 max-w-sm'} flex flex-col gap-4 rounded-2xl bg-black/20 backdrop-blur-md border border-white/10 p-5 shadow-2xl shrink-0 transition-all duration-300`}>
            <div className="flex items-center gap-2 mb-1">
              <Database className="w-5 h-5 text-blue-400" />
              <h2 className="text-base font-semibold text-white">Sequence 1 Discovery</h2>
            </div>
            
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input type="text" placeholder="Search starter genes..." className="w-full bg-black/50 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-blue-500 transition-colors" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
              {GENE_REGISTRY.filter(g => g.name.toLowerCase().includes(searchQuery.toLowerCase()) || g.desc.toLowerCase().includes(searchQuery.toLowerCase())).map((gene) => (
                <button key={gene.id} onClick={() => { setGene1(gene); fetchSequence(gene.id, 1); }} className={`w-full text-left p-3 rounded-xl border transition-all ${gene1.id === gene.id ? 'bg-blue-500/20 border-blue-500/50 shadow-inner' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}>
                  <div className="font-bold text-blue-300 mb-1 text-sm">{gene.name}</div>
                  <div className="text-[10px] text-slate-400 line-clamp-2">{gene.desc}</div>
                </button>
              ))}
            </div>

            <div className="mt-2 pt-4 border-t border-white/10 shrink-0">
              <button onClick={() => fileInputRef1.current?.click()} className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 transition-all text-xs font-medium text-slate-300">
                <Upload className="w-4 h-4 text-blue-400" /> Upload Sequence 1 (.FASTA)
              </button>
            </div>
          </aside>

          <main className="flex-1 flex gap-5 min-w-0">
            <TrackPanel trackNum={1} gene={gene1} seq={seq1} isPlaying={isPlaying1} isLoading={isLoading1} gc={gc1} currentCodonIndex={codon1} apiError={apiError1} fileRef={fileInputRef1} otherSeq={seq2} isCompareMode={isCompareMode} isMutationMode={isMutationMode} togglePlay={togglePlay} handleExport={handleExport} handleFileUpload={handleFileUpload} mutateBase={mutateBase} setGene={setGene1} fetchSequence={fetchSequence} />
            {isCompareMode && (
              <TrackPanel trackNum={2} gene={gene2} seq={seq2} isPlaying={isPlaying2} isLoading={isLoading2} gc={gc2} currentCodonIndex={codon2} apiError={apiError2} fileRef={fileInputRef2} otherSeq={seq1} isCompareMode={isCompareMode} isMutationMode={isMutationMode} togglePlay={togglePlay} handleExport={handleExport} handleFileUpload={handleFileUpload} mutateBase={mutateBase} setGene={setGene2} fetchSequence={fetchSequence} />
            )}
          </main>
        </div>

        <footer className="mt-3 text-center text-[10px] text-slate-500 font-mono tracking-widest uppercase opacity-70 shrink-0">
          Built by Yuvika Varun
        </footer>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.cdnfonts.com/css/advercase');
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.02); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.15); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.3); }
      `}} />
    </div>
  );
}