const getOrigin = () => new Promise((resolve, reject) => {
  try {
    resolve(true);
  } catch (error) {
    reject(new Error(`IDexpress: ${error?.message || 'Something Wrong'}`));
  }
});

const getDestination = () => new Promise((resolve, reject) => {
  try {
    resolve(true);
  } catch (error) {
    reject(new Error(`IDexpress: ${error?.message || 'Something Wrong'}`));
  }
});

const checkPrice = () => new Promise((resolve, reject) => {
  try {
    resolve(true);
  } catch (error) {
    reject(new Error(`IDexpress: ${error?.message || 'Something Wrong'}`));
  }
});

module.exports = {
  getOrigin,
  getDestination,
  checkPrice,
};
