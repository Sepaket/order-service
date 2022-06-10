const UploadResponse = require('../../responses/general/upload/upload-response');

module.exports = async (request, response, next) => {
  try {
    const result = await new UploadResponse({ request });

    response.send({
      code: 200,
      message: 'OK',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
