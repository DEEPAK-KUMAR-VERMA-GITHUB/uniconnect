// middleware function that takes a promise as a input parameter and execute it and catch any errors
export const catchAsyncErrors = (passedFunction) => (req, res, next) => {
  Promise.resolve(passedFunction(req, res, next)).catch(next);
};
