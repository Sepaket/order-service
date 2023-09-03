const { Location } = require('../app/models');

const isExist = async ({ param, identifier, model }) => new Promise((resolve) => {
  model.findOne({
    where: { [`${identifier}`]: param },
  })
    .then((result) => resolve(!result))
    .catch(() => resolve(false));
});

const required = (param) => new Promise((resolve) => {
  if (param === '' || param === null) resolve(true);
  else resolve(false);
});

const validate = (payload) => new Promise(async (resolve, reject) => {
  try {
    const error = [];
    const {
      shippingCharge,
      codCondition,
      creditCondition,
      weight,
    } = payload;
    // console.log('ordfer validator ')

    const categories = ['Normal', 'Organic', 'FragileElectronic'];

    if (!shippingCharge)
    {
      error.push({ message: 'Destinasi yang dituju tidak ditemukan - Shipping Charge not found' });
    }

    if (!codCondition) {
      error.push({ message: 'Tipe penjemputan ini tidak tersedia saat anda memilih COD.' });
    }
    if (payload.ongkirminuscod < 0) {
      error.push({ message: 'Ongkir lebih besar dari COD value' });
    }
    if (!payload.is_cod && !creditCondition) error.push({ message: 'Saldo anda tidak cukup untuk melakukan pengiriman non COD' });
    if (payload.is_cod && !payload.cod_value) error.push({ message: 'COD Value harus diisi untuk tipe COD' });
    if (!payload.is_cod && !payload.goods_amount) error.push({ message: 'Goods Amount harus diisi untuk tipe non COD' });
    if (!weight || weight === null || weight === '') error.push({ message: 'Berat harus di isi dan minimal 1 KG' });
    if (await required(payload?.is_cod)) error.push({ message: 'Metode pengiriman harus diisi 1 atau 0' });
    if (await required(payload?.sender_name)) error.push({ message: 'Nama pengirim harus diisi' });
    if (await required(payload?.sender_phone)) error.push({ message: 'No. Telepon pengirim harus diisi' });
    if (await required(payload?.receiver_name)) error.push({ message: 'Nama penerima harus diisi' });
    if (await required(payload?.receiver_phone)) error.push({ message: 'No. Telepon tujuan harus diisi' });
    if (await required(payload?.receiver_address)) error.push({ message: 'Alamat tujuan harus diisi' });
    if (await required(payload?.receiver_location_id)) error.push({ message: 'Alamat Detail tujuan harus diisi' });
    if (await required(payload?.sellerLocation)) error.push({ message: 'Alamat Anda tidak ada di database' });
    if (await required(payload?.goods_content)) error.push({ message: 'Isi paket harus diisi' });
    if (await required(payload?.goods_category)) error.push({ message: 'Jenis pengiriman harus diisi' });
    if (await required(payload?.goods_qty)) error.push({ message: 'Jumlah/pcs harus diisi' });
    if (await required(payload?.is_insurance)) error.push({ message: 'Asuransi harus diisi 1 atau 0' });
    if (payload?.goods_qty?.toString()?.length > 5) error.push({ message: 'Jumlah/pcs maksimum 5 digit' });
    // if (payload?.goods_content?.length >= 50) error.push({ message: 'Isi paket maximal 50 karakter' });
    // if (payload?.receiver_address?.length >= 10) error.push({ message: 'Alamat tujuan maximal 200 karakter' });
    // if (payload?.receiver_address_note?.length >= 100) error.push({ message: 'Patokan alamat tujuan maximal 100 karakter' });
    // if (payload?.notes?.length >= 10) error.push({ message: 'Catatan maximal 150 karakter' });
    // if (payload?.receiver_address && payload?.receiver_address?.length <= 10) error.push({ message: 'Alamat tujuan minimal 10 karakter' });

    if (await isExist({ param: payload?.receiver_location_id, identifier: 'id', model: Location })) {
      error.push({ message: 'Alamat tujuan yang anda pilih tidak ditemukan' });
    }

    if (
      !await required(payload.goods_category)
      && !categories.find((item) => item === payload?.goods_category)
    ) {
      error.push({ message: 'Jenis pengiriman hanya bisa Normal, Organik, dan Elektronik' });
    }

    if (!await required(payload?.is_cod) && payload.is_cod && await required(payload.cod_value)) {
      error.push({ message: 'Nilai COD harus diisi ketika anda memilih metode pengiriman COD' });

      if (parseFloat(payload.cod_value) >= 5000000) error.push({ message: 'Nilai COD maximal Rp. 5.000.000' });
      if (parseFloat(payload.cod_value) <= 10000) error.push({ message: 'Nilai COD minimal Rp. 10.000' });
    }

    if (
      !await required(payload?.is_cod)
      && !payload.is_cod
      && await required(payload.goods_amount)
    ) {
      error.push({ message: 'Nilai barang harus diisi ketika anda memilih metode pengiriman Non COD' });

      if (parseFloat(payload.goods_amount) >= 5000000) error.push({ message: 'Nilai barang maximal Rp. 5.000.000' });
      if (parseFloat(payload.goods_amount) <= 10000) error.push({ message: 'Nilai barang minimal Rp. 10.000' });
    }
    resolve(error);
  } catch (error) {
    reject(error);
  }
});

module.exports = validate;
