const status = {
  IN_QUEUE: {
    text: 'Dalam Antrian',
    status: 'IN_QUEUE',
  },
  ON_PROGRESS: {
    text: 'Dalam Proses Penanganan',
    status: 'ON_PROGRESS',
  },
  ON_HOLD: {
    text: 'Ditunda Sementara',
    status: 'ON_HOLD',
  },
  SOLVED: {
    text: 'Terselesaikan',
    status: 'SOLVED',
  },
  CLOSED: {
    text: 'Masalah Ditutup',
    status: 'CLOSED',
  },
};

const priority = {
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM',
  LOW: 'LOW',
};

const category = [
  { content: 'Stuck Progress' },
  { content: 'Request Redelivery' },
  { content: 'Request Update Status' },
  { content: 'Request Takeself' },
  { content: 'Request Return' },
  { content: 'Fake Status' },
  { content: 'Damage/Lost' },
];

module.exports = {
  status,
  priority,
  category,
};
