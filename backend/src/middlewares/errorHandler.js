module.exports = (err, req, res, next) => {
  // Map common Mongoose failures to 4xx so bad input surfaces as an actionable
  // client error instead of an opaque 500 (and isn't logged as a server fault).
  let status = err.status || err.statusCode || 500;
  if (err.name === 'ValidationError') status = 400;
  else if (err.name === 'CastError') status = 400;

  const message = status === 500 ? 'Internal server error' : (err.message || 'Something went wrong');

  if (status === 500) {
    // Log the full stack for real server faults, not just the message.
    console.error(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}:`, err.stack || err);
  }

  // If a response has already started (e.g. an SSE stream that flushed headers
  // then threw), calling res.status().json() throws ERR_HTTP_HEADERS_SENT and
  // would crash the process. Delegate to Express's default handler, which just
  // destroys the socket.
  if (res.headersSent) return next(err);

  res.status(status).json({ message });
};
