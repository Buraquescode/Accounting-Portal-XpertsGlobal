// Lets controllers be `async` without try/catch: a rejected promise is passed on to the error handler.
export const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
