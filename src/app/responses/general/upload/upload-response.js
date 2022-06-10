module.exports = class {
  constructor({ request }) {
    this.request = request;
    return this.process();
  }

  async process() {
    const isLocal = process.env.APP_ENV === 'development' ? `:${process.env.APP_PORT}` : '';
    return `${process.env.APP_HOST}${isLocal}/${this.request.file.path}`;
  }
};
