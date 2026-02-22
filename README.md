# GENOSYNTH - [View Live Demo](https://genosynth-v3.vercel.app/)

Genosynth is a web-based DNA sonification engine. It takes raw genetic sequences and translates them into rhythmic, polyphonic musical compositions in real-time. By reading DNA bases in triplet codons, the engine maps structural biology into auditory patterns, allowing users to "hear" the genome.

## Core Features
- Live Data Fetching: Connects directly to the Ensembl REST API to pull real genetic sequences (like TP53 or Insulin) using their Ensembl IDs.
- Compare Mode: Features twin timelines that allow you to load two different genes (or a mutated gene and an original) to visually and audibly compare them simultaneously.
- Mutation Engine: Users can click on any individual base to mutate it and instantly hear the resulting change in the sequence's chord structure.
- Custom Uploads: Supports importing your own .fasta or .txt DNA sequence files directly into the engine.
- Scientific Accuracy: Translates bases into their actual Amino Acid abbreviations, tracks GC-content percentages in real-time, and only triggers the rhythmic bassline when reading inside an active reading frame (Start to Stop codon).

## Tech Stack
- React: Frontend architecture and state management.
- Vite: Fast build tool and development server.
- Tailwind CSS: For the responsive, dark-mode glassmorphism interface.
- Tone.js: The core audio engine, utilizing Web Audio API for polyphonic synthesis and scheduling.
- Vanta.js & Three.js: Handles the animated, interactive cellular background rendering.
- Ensembl REST API: The bioinformatics database used for fetching live genomic strings.

## Future Improvements
- While the current engine is fully functional, there are several areas planned for future expansion:
- Audio Export: Allowing users to record the Tone.js transport and export the resulting composition as a .wav or .mp3 file.
- Advanced Parameter Mapping: Tying the tempo or audio effects (like reverb and delay) dynamically to the GC-content or the physical properties of the translated amino acids (e.g., hydrophobic vs hydrophilic).
- Expanded Built-in Database: Adding a wider array of starter genes across different species for quick discovery without needing external Ensembl IDs.
- Custom Synth Design: Letting users tweak the ADSR envelopes and oscillator types of the synthesizers directly from the UI.

**Built By Yuvika Varun :)**
