const errorHandler = (error, request, response, next) => {
  const { message, status, data } = error;

  const result = (data !== undefined) ? data : '';

  const res = response.status(status || 422).json({
    code: status || 422,
    message,
    data: result,
  });

  next(res);
};

module.exports = errorHandler;
