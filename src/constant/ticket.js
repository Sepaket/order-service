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

const categories = [
  { id: 1, content: 'Stuck Progress' },
  { id: 2, content: 'Request Redelivery' },
  { id: 3, content: 'Request Update Status' },
  { id: 4, content: 'Request Takeself' },
  { id: 5, content: 'Request Return' },
  { id: 6, content: 'Fake Status' },
  { id: 7, content: 'Damage/Lost' },
];

module.exports = {
  status,
  priority,
  categories,
};
