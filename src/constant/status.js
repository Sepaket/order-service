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
  { code: 'NINJACOD', name: 'Ninja COD', type: 'NINJA' },
];

const jneServiceStatus = [
  // { code: 'CTCSPS', name: 'JNE CTCSPS', type: 'JNE' },
  // { code: 'CTCYES', name: 'JNE CTCYES', type: 'JNE' },
  { code: 'YES19', name: 'JNE YES', type: 'JNE' },
  { code: 'REG19', name: 'JNE REG', type: 'JNE' },
  { code: 'OKE19', name: 'JNE OKE', type: 'JNE' },
  { code: 'JTR>250', name: 'JNE JTR>250', type: 'JNE' },
  { code: 'JTR<150', name: 'JNE JTR<150', type: 'JNE' },
  { code: 'JTR250', name: 'JNE JTR250', type: 'JNE' },
  { code: 'JTR23', name: 'JNE JTR', type: 'JNE' },
  { code: 'JNECOD', name: 'JNE COD', type: 'JNE' },
];

const sicepatServiceStatus = [
  { code: 'REG', name: 'Sicepat REG', type: 'SICEPAT' },
  { code: 'BEST', name: 'Sicepat BEST', type: 'SICEPAT' },
  { code: 'SIUNT', name: 'Sicepat SIUNTUNG', type: 'SICEPAT' },
  { code: 'GOKIL', name: 'Sicepat GOKIL', type: 'SICEPAT' },
  { code: 'SDS', name: 'Sicepat SAMEDAY', type: 'SICEPAT' },
  { code: 'KEPO', name: 'Sicepat KEPO', type: 'SICEPAT' },
  { code: 'SICEPATCOD', name: 'Sicepat COD', type: 'SICEPAT' },
];

const sapServiceStatus = [
  { code: 'UDRREG', name: 'SAP REG', type: 'SAP' },
  { code: 'UDRONS', name: 'SAP ODS', type: 'SAP' },
  { code: 'UDRSDS', name: 'SAP SDS', type: 'SAP' },
  { code: 'UDRURG', name: 'SAP URGENT', type: 'SAP' },
  { code: 'DRGREG', name: 'SAP REGULAR DARAT', type: 'SAP' },
  { code: 'CRLREG', name: 'SAP REGULAR LAUT', type: 'SAP' },
  { code: 'ITCREG', name: 'SAP CITY REGULAR', type: 'SAP' },
  { code: 'ITCODS', name: 'SAP CITY URGENT', type: 'SAP' },
  { code: 'TRC01', name: 'SAP TRUCKING', type: 'SAP' },
  { code: 'CRCODS', name: 'SAP ODS CC', type: 'SAP' },
  { code: 'ATM', name: 'SAP ATM', type: 'SAP' },
  { code: 'SAPCOD', name: 'SAP COD', type: 'SAP' },
];

const serviceCode = {
  JNE: jneServiceStatus,
  SICEPAT: sicepatServiceStatus,
  NINJA: ninjaServiceStatus,
  SAP: sapServiceStatus,
  IDEXPRESS: idxServiceStatus,
  ALL: [
    ...jneServiceStatus,
    ...sicepatServiceStatus,
    ...ninjaServiceStatus,
    ...sapServiceStatus,
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
  {
    name: 'SAP',
    code: 'SAP',
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
