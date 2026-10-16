// Checks req.body / req.query / req.params against a zod schema before the controller runs.
// The cleaned data is stored in req.valid[source]; req.body is also replaced.
// (Express 5 makes req.query read-only, so later code reads req.valid.query.)
export const validate = (schema, source = 'body') => (req, res, next) => {
  const result = schema.safeParse(req[source]);
  if (!result.success) return next(result.error); // the error handler turns this into a 400
  req.valid = { ...req.valid, [source]: result.data };
  if (source === 'body') req.body = result.data;
  return next();
};
