// middleware/internalAccess.js
const internalAccessOnly = (req, res, next) => {
  const clientIP =
    req.headers["x-forwarded-for"] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    "";

  const allowedPrefixes = [
    "10.",
    "192.168.",
    "172.16.",
    "172.17.",
    "172.18.",
    "172.19.",
    "172.20.",
    "172.21.",
    "172.22.",
    "172.23.",
    "172.24.",
    "172.25.",
    "172.26.",
    "172.27.",
    "172.28.",
    "172.29.",
    "172.30.",
    "172.31.",
    "127.0.0.1", // localhost
  ];

  const isInternal = allowedPrefixes.some((prefix) =>
    clientIP.includes(prefix)
  );

  if (!isInternal) {
    console.warn(`[ACCESS BLOCKED] ${clientIP} mencoba mengakses server.`);
    return res.status(403).json({
      message: "Access restricted to internal network only.",
    });
  }

  next();
};

module.exports = internalAccessOnly;
