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
  { code: 'Standard', name: 'Ninja COD', type: 'NINJA' },
];

const jneServiceStatus = [
  { code: 'CTCSPS', name: 'JNE CTCSPS', type: 'JNE' },
  { code: 'CTCYES', name: 'JNE CTCYES', type: 'JNE' },
  { code: 'YES19', name: 'JNE YES', type: 'JNE' },
  { code: 'REG19', name: 'JNE REG', type: 'JNE' },
  { code: 'OKE19', name: 'JNE OKE', type: 'JNE' },
  { code: 'JTR>250', name: 'JNE JTR>250', type: 'JNE' },
  { code: 'JTR<150', name: 'JNE JTR<150', type: 'JNE' },
  { code: 'JTR250', name: 'JNE JTR250', type: 'JNE' },
  { code: 'JTR18', name: 'JNE JTR', type: 'JNE' },
  { code: 'REG19', name: 'JNE COD', type: 'JNE' },
];

const sicepatServiceStatus = [
  { code: 'REG', name: 'Sicepat REG', type: 'SICEPAT' },
  { code: 'BEST', name: 'Sicepat BEST', type: 'SICEPAT' },
  { code: 'SIUNT', name: 'Sicepat SIUNTUNG', type: 'SICEPAT' },
  { code: 'GOKIL', name: 'Sicepat GOKIL', type: 'SICEPAT' },
  { code: 'SDS', name: 'Sicepat SAMEDAY', type: 'SICEPAT' },
  { code: 'KEPO', name: 'Sicepat KEPO', type: 'SICEPAT' },
  { code: 'SIUNT', name: 'Sicepat COD', type: 'SICEPAT' },
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
  // {
  //   name: 'IDexpress',
  //   code: 'IDEXPRESS',
  // },
];

const paymentStatus = {
  PENDING: {
    text: 'PENDING',
  },
  PAID: {
    text: 'PAID',
  },
  EXPIRED: {
    text: 'EXPIRED',
  },
  FAILED: {
    text: 'FAILED',
  },
};

module.exports = {
  paymentStatus,
  idxServiceStatus,
  ninjaServiceStatus,
  jneServiceStatus,
  sicepatServiceStatus,
  serviceCode,
  expeditionService,
  sicepatParcelCategories,
};
