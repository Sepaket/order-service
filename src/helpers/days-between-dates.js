module.exports = (startDate, endDate) => {
  let now = startDate.clone();
  const dates = [];

  while (now.isSameOrBefore(endDate)) {
    dates.push(now);
    now.add(1, 'days');
    now = now.clone();
  }

  return dates;
};
