const sicepatStatus = {
  PROCESSED: [
    'PICKREQ', // SICEPAT - Permintaan pickup dari platform partner
    'PICK', // SICEPAT - Paket sukses di pickup oleh kurir
    'UNPICK', // SICEPAT - Paket gagal di pickup oleh kurir.
    'DROP', // SICEPAT - Paket di drop oleh seller di gerai sicepat yang terdekat.
    'IN', // SICEPAT - Inbound di cabang SiCepat
    'OUT', // SICEPAT - Outbound di cabang SiCepat
    'ANT', // SICEPAT - Penugasan kurir antar
  ],
  DELIVERED: [
    'DELIVERED', // SICEPAT - delivered
  ],
  CANCELED: [],
  RETURN_TO_SELLER: [
    'RETUR PUSAT', // SICEPAT - Posisi paket di gerai last mile dan akan diretur ke hub retur.
    'RTA', // SICEPAT - Posisi paket dari hub retur dalam perjalanan kembali ke gerai first mile.
    'RETURN TO SHIPPER', // SICEPAT - Paket sudah di terima pengirim.
    'UNRTS', // SICEPAT - Proses retur mengalami kendala/bermasalah.
    'SIW', // SICEPAT - Paket disimpan diwarehouse sicepat.
    'RTW', // SICEPAT - Paket dalam perjalanan ke warehouse sicepat.
    'RTC', // SICEPAT - Posisi paket di gerai transit dan dalam perjalanan retur ke gerai last mile sebelum di statuskan RTN / Retur.
  ],
  PROBLEM: [
    'CNEE UNKNOWN', // SICEPAT - Penerima tidak di kenal dilingkungan.
    'NOT AT HOME', // SICEPAT - Penerima tidak ada di rumah.
    'ANTAR ULANG ', // SICEPAT - Paket akan di antar kembali besok.
    'BAD ADDRESS ', // SICEPAT - Alamat tidak dikenal / tidak ditemukan.
    'CRISS CROSS', // SICEPAT - Paket mengalami kesalahan sortir ketika diproses pada fasilitas hub sicepat
    'CLOSED ONCE DELIVERY ATTEMPT', // SICEPAT - Kantor / Toko tutup diluar jam operasional.
    'HILANG', // SICEPAT - Paket hilang
    'BROKEN', // SICEPAT - Paket Rusak
    'OTS', // SICEPAT - Transit terjadwal.
    'OSD', // SICEPAT - Pengiriman terjadwal atas kesepakatan penerima.
    'THP', // SICEPAT - Pengiriman dengan menggunakan pihak ketiga
    'HOLD / PENDING', // SICEPAT - Pengiriman di HOLD berdasarkan permintaan seller.
    'CODB', // SICEPAT - Customer tidak merasa memesan paket
    'RBA', // SICEPAT - Paket ditolak di bandara.
    'RBC', // SICEPAT - Paket ditolak oleh buyer
    'PDA', // SICEPAT - Paket dihancurkan berdasarkan perserujuan.
    'DETAINED_BY_CUSTOMS', // SICEPAT - Paket sedang dalam pemeriksaan terkait perizinannya.
    'FORCE MAJEURE', // SICEPAT - Paket mengalami kendala saat pengantaran dikarenakan uncontrolable factor. (Gempa Bumi, Tornado).
    'CODOC', // Paket COD diluar jangkauan pengiriman.
  ],
};

module.exports = sicepatStatus;
