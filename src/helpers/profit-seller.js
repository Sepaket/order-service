const profitHandler = (payload) => new Promise((resolve, reject) => {
  // console.log('profit handler : ', payload)
  try {
    const profits = payload.items.map((item) => {
      if (item.is_cod) {
        return parseFloat(item.cod_value) - parseFloat(item.shippingCalculated);
      }

      // return parseFloat(item.goods_amount) - parseFloat(item.shippingCalculated);
      return 0;
    });

    resolve(profits);
  } catch (error) {
    reject(error);
  }
});

module.exports = profitHandler;
