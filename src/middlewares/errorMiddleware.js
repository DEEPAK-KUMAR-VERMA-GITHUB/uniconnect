export const errorMiddleware = (error, request, reply) => {
  const err = error;
  err.message = err.message || "Internal Server Error";
  err.statusCode = err.statusCode || 500;

  // duplicate key error
  if (err.code === 11000) {
    const message = `Duplicate ${
      err.keyValue ? Object.keys(err.keyValue) : ""
    } Entered`;
    err.statusCode = 400;
    err.message = message;
  }

  // wrong mongodb id error
  if (err.name === "CastError") {
    err.statusCode = 400;
    err.message = `Resource not found. Invalid: ${err.path}`;
  }

  // mongodb validation error
  if (err.name === "ValidationError") {
    const message = err.errors
      ? Object.values(err.errors).map((value) => value.message)
      : [];
    err.statusCode = 400;
    err.message = message.join(", ");
  }

  return reply
    .code(err.statusCode)
    .send({
      success: false,
      message: err.message,
    });
};
