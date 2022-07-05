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
  { code: 'REG', name: 'Sicepat REG', type: 'SICEPAT' },
  { code: 'BEST', name: 'Sicepat BEST', type: 'SICEPAT' },
  { code: 'SIUNT', name: 'Sicepat SIUNTUNG', type: 'SICEPAT' },
  { code: 'GOKIL', name: 'Sicepat GOKIL', type: 'SICEPAT' },
  { code: 'SDS', name: 'Sicepat SAMEDAY', type: 'SICEPAT' },
  { code: 'KEPO', name: 'Sicepat KEPO', type: 'SICEPAT' },
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

const orderStatus = {
  WAITING_PICKUP: 'WAITING_PICKUP',
};

const sicepatParcelCategories = {
  ORGANIC: {
    code: 'Organic',
    text: 'Organik',
  },
  NORMAL: {
    code: 'Normal',
    text: 'Normal',
  },
  ELECTRONIC: {
    code: 'FragileElectronic',
    name: 'Electronic',
  },
};

const expeditionService = [
  {
    name: 'JNE',
    code: 'JNE',
  },
  {
    name: 'Sicepat',
    code: 'SICEPAT',
  },
  {
    name: 'Ninja',
    code: 'NINJA',
  },
  {
    name: 'IDexpress',
    code: 'IDEXPRESS',
  },
];

module.exports = {
  idxServiceStatus,
  ninjaServiceStatus,
  jneServiceStatus,
  sicepatServiceStatus,
  serviceCode,
  orderStatus,
  expeditionService,
  sicepatParcelCategories,
};
