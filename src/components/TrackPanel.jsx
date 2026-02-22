import React from 'react';
import { Play, Pause, FastForward, Upload, Download, BarChart2, Info, Loader2 } from 'lucide-react';
import { GENE_REGISTRY, CODON_MAP } from '../constants';

export default function TrackPanel({ 
  trackNum, gene, seq, isPlaying, isLoading, gc, currentCodonIndex, 
  apiError, fileRef, otherSeq, isCompareMode, isMutationMode, 
  togglePlay, handleExport, handleFileUpload, mutateBase, setGene, fetchSequence 
}) {
  return (
    <div className="flex-1 flex flex-col gap-4 min-w-0 h-full">
      {/* Track Dashboard */}
      <div className="rounded-2xl bg-black/20 backdrop-blur-md border border-white/10 p-5 shadow-2xl flex items-center justify-between">
        <div className="flex-1 mr-4 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            {/* Both sequences allow quick selection from header in Compare Mode */}
            {isCompareMode ? (
              <div className="flex items-center gap-2">
                <select 
                  value={gene.id}
                  onChange={(e) => {
                    if(e.target.value === 'CUSTOM') return;
                    const g = GENE_REGISTRY.find(x => x.id === e.target.value);
                    if(g) { 
                      setGene(g); fetchSequence(g.id, trackNum);
                    }
                  }}
                  className="bg-black/40 text-white font-bold text-xl border border-white/20 rounded px-2 py-1 outline-none focus:border-blue-500 max-w-[150px] sm:max-w-[200px] truncate"
                >
                  {GENE_REGISTRY.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                  {gene.id === 'CUSTOM' && <option value="CUSTOM">{gene.name}</option>}
                </select>
                <button 
                  onClick={() => fileRef.current?.click()}
                  className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition shrink-0"
                  title="Upload Custom FASTA"
                >
                  <Upload className="w-4 h-4 text-blue-400" />
                </button>
              </div>
            ) : (
              <h2 className="text-2xl font-bold text-white truncate">{gene.name}</h2>
            )}
          </div>
          
          <div className="flex items-center gap-4 text-xs text-slate-400 mb-3 truncate">
            <span className="flex items-center gap-1">
              <Info className="w-3 h-3" /> {gene.species}
            </span>
            <span>Bases: {seq.length}</span>
          </div>
          
          <div className="flex items-center gap-3 max-w-xs">
            <BarChart2 className="w-4 h-4 text-yellow-400 shrink-0" />
            <span className="text-xs font-semibold text-slate-300 w-20 shrink-0">GC: {gc}%</span>
            <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-yellow-500 to-green-500 transition-all duration-500"
                style={{ width: `${gc}%` }}
              />
            </div>
          </div>
          {apiError && <p className="text-red-400 text-xs mt-2 truncate">{apiError}</p>}
        </div>
        
        <button 
          onClick={() => togglePlay(trackNum)}
          disabled={isLoading || !seq}
          className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shrink-0 ${
            isPlaying ? (trackNum === 1 ? 'bg-blue-600 shadow-[0_0_20px_rgba(37,99,235,0.5)]' : 'bg-green-600 shadow-[0_0_20px_rgba(22,163,74,0.5)]') 
                      : 'bg-slate-700 hover:bg-slate-600'
          }`}
        >
          {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
        </button>
      </div>

      {/* Track Sequence Visualizer */}
      <div className="flex-1 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 p-5 shadow-2xl flex flex-col relative overflow-hidden min-h-0">
        <div className="flex justify-between items-center mb-4 z-10 shrink-0">
          <h3 className="font-semibold flex items-center gap-2 text-sm">
            <FastForward className={`w-4 h-4 ${trackNum === 1 ? 'text-blue-400' : 'text-green-400'}`} />
            Sequence {trackNum} Timeline
          </h3>
          <div className="flex gap-2">
            <button onClick={() => handleExport(trackNum)} className="text-slate-400 hover:text-green-400 transition" title="Export Sequence">
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto font-mono text-sm leading-relaxed z-10 custom-scrollbar pr-2">
          {isLoading ? (
            <div className="flex h-full items-center justify-center text-slate-500 text-sm">Loading...</div>
          ) : (
            <div className="flex flex-wrap gap-x-2 gap-y-3">
              {Array.from({ length: Math.ceil(seq.length / 3) }).map((_, chunkIndex) => {
                const startIndex = chunkIndex * 3;
                const codon = seq.substring(startIndex, startIndex + 3);
                const isPlayingCodon = isPlaying && currentCodonIndex >= startIndex && currentCodonIndex < startIndex + 3;
                const aa = codon.length === 3 ? CODON_MAP[codon] : '';

                return (
                  <div key={chunkIndex} className={`flex flex-col items-center p-1 rounded transition-all duration-150 ${isPlayingCodon ? 'bg-white/10 scale-110 drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]' : ''}`}>
                    <span className="text-[9px] font-bold mb-[2px] text-slate-500 opacity-70">{aa || '-'}</span>
                    <div className="flex gap-[1px]">
                      {codon.split('').map((base, intraIndex) => {
                        const absoluteIndex = startIndex + intraIndex;
                        const isDiff = isCompareMode && otherSeq[absoluteIndex] && base !== otherSeq[absoluteIndex];
                        
                        let baseColor = 'text-slate-500';
                        if (base === 'A') baseColor = 'text-green-400';
                        if (base === 'C') baseColor = 'text-blue-400';
                        if (base === 'G') baseColor = 'text-yellow-400';
                        if (base === 'T') baseColor = 'text-red-400';

                        return (
                          <span 
                            key={intraIndex}
                            onClick={() => mutateBase(absoluteIndex, trackNum)}
                            className={`w-[10px] text-center select-none transition-all duration-75 rounded-sm text-xs ${baseColor} ${isPlayingCodon ? 'font-bold brightness-200' : ''} ${isMutationMode ? 'cursor-pointer hover:bg-white/20' : ''} ${isDiff ? 'bg-red-500/40 border-b border-red-500 text-white font-bold' : ''}`}
                          >
                            {base}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      {/* Hidden File Input for this Track */}
      <input type="file" ref={fileRef} onChange={(e) => handleFileUpload(e, trackNum)} accept=".txt,.fasta,.fa" className="hidden" />
    </div>
  );
}