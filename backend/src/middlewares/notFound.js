// Any URL no route matched gets a JSON 404 instead of Express's default HTML page.
export const notFound = (req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
};
