const formatCurrency = (
  amountArg,
  prefix = '',
  decimalCountArg = 0,
  decimal = ',',
  thousands = '.',
) => {
  let decimalCount = decimalCountArg;
  let amount = amountArg;

  decimalCount = Math.abs(decimalCount);
  decimalCount = Number.isNaN(decimalCount) ? 2 : decimalCount;

  const i = parseInt(
    (
      amount = Math.abs(Number(amount) || 0).toFixed(decimalCount)
    ), 10,
  ).toString();

  const j = i.length > 3 ? i.length % 3 : 0;

  const returnValue = `${prefix.length > 0 ? `${prefix} ` : ''}${j ? i.substr(0, j) + thousands : ''}${i
    .substr(j)
    .replace(/(\d{3})(?=\d)/g, `$1${thousands}`)}${
    decimalCount
      ? `${decimal}${Math.abs(amount - i)
        .toFixed(decimalCount)
        .slice(2)}`
      : ''
  }`;
  if (amountArg < 0) {
    return `(${  returnValue})`;
  } else {
    return returnValue;
  }

};

module.exports = {
  formatCurrency,
};
