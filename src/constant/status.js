const idxServiceStatus = [
  {
    code: '00',
    name: 'Standard',
    estimation: '3 - 4 hari',
    type: 'IDEXPRESS',
  },
  {
    code: '01',
    name: 'Same Day',
    estimation: '1 - 2 hari',
    type: 'IDEXPRESS',
  },
  {
    code: '06',
    name: 'Truck',
    estimation: '4 - 7 hari',
    type: 'IDEXPRESS',
  },
];

const ninjaServiceStatus = [
  // only standard for indonesia region
  { code: 'Standard', name: 'Ninja Standard', type: 'NINJA' },
];

const jneServiceStatus = [
  { code: 'YES19', name: 'JNE YES', type: 'JNE' },
  { code: 'REG19', name: 'JNE REG', type: 'JNE' },
  { code: 'OKE19', name: 'JNE OKE', type: 'JNE' },
  { code: 'JTR>250', name: 'JNE JTR>250', type: 'JNE' },
  { code: 'JTR<150', name: 'JNE JTR<150', type: 'JNE' },
  { code: 'JTR250', name: 'JNE JTR250', type: 'JNE' },
  { code: 'JTR18', name: 'JNE JTR', type: 'JNE' },
];

const sicepatServiceStatus = [
  { code: 'GOKIL', name: 'Sicepat GOKIL', type: 'SICEPAT' },
  { code: 'HALU', name: 'Sicepat HALU', type: 'SICEPAT' },
  { code: 'REG', name: 'Sicepat REG', type: 'SICEPAT' },
];

const serviceCode = {
  JNE: jneServiceStatus,
  SICEPAT: sicepatServiceStatus,
  NINJA: ninjaServiceStatus,
  IDEXPRESS: idxServiceStatus,
  ALL: [
    ...jneServiceStatus,
    ...sicepatServiceStatus,
    ...ninjaServiceStatus,
    ...idxServiceStatus,
  ],
};

module.exports = {
  idxServiceStatus,
  ninjaServiceStatus,
  jneServiceStatus,
  sicepatServiceStatus,
  serviceCode,
};
