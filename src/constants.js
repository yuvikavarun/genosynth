export const GENE_REGISTRY = [
  { id: 'ENSG00000254647', name: 'INS', desc: 'Insulin - Regulates blood sugar', species: 'Homo sapiens' },
  { id: 'ENSG00000141510', name: 'TP53', desc: 'Tumor Protein p53 - "Guardian of the genome"', species: 'Homo sapiens' },
  { id: 'ENSG00000244734', name: 'HBB', desc: 'Hemoglobin Subunit Beta', species: 'Homo sapiens' },
  { id: 'ENSG00000111206', name: 'FOXO3', desc: 'Forkhead box O3 - Longevity associated', species: 'Homo sapiens' },
  { id: 'ENSG00000157764', name: 'BRAF', desc: 'B-Raf Proto-Oncogene', species: 'Homo sapiens' }
];

export const CODON_MAP = {
  TTT: 'F', TTC: 'F', TTA: 'L', TTG: 'L', CTT: 'L', CTC: 'L', CTA: 'L', CTG: 'L',
  ATT: 'I', ATC: 'I', ATA: 'I', ATG: 'M', GTT: 'V', GTC: 'V', GTA: 'V', GTG: 'V',
  TCT: 'S', TCC: 'S', TCA: 'S', TCG: 'S', CCT: 'P', CCC: 'P', CCA: 'P', CCG: 'P',
  ACT: 'T', ACC: 'T', ACA: 'T', ACG: 'T', GCT: 'A', GCC: 'A', GCA: 'A', GCG: 'A',
  TAT: 'Y', TAC: 'Y', TAA: '*', TAG: '*', CAT: 'H', CAC: 'H', CAA: 'Q', CAG: 'Q',
  AAT: 'N', AAC: 'N', AAA: 'K', AAG: 'K', GAT: 'D', GAC: 'D', GAA: 'E', GAG: 'E',
  TGT: 'C', TGC: 'C', TGA: '*', TGG: 'W', CGT: 'R', CGC: 'R', CGA: 'R', CGG: 'R',
  AGT: 'S', AGC: 'S', AGA: 'R', AGG: 'R', GGT: 'G', GGC: 'G', GGA: 'G', GGG: 'G'
};

export const BASE_TO_NOTE = {
  'A': 'C4',
  'C': 'Eb4',
  'G': 'G4',
  'T': 'Bb4',
  'N': 'C3'
};