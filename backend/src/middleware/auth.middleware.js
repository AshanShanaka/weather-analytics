const jwt = require("jsonwebtoken");
const jwksClient = require("jwks-rsa");

const domain = process.env.AUTH0_DOMAIN;
const audience = process.env.AUTH0_AUDIENCE;

const client = jwksClient({
    jwksUri: `https://${domain}/.well-known/jwks.json`,
    cache: true,
    rateLimit: true
});

function getKey(header, callback) {
    client.getSigningKey(header.kid, function (err, key) {
        if (err) return callback(err);
        callback(null, key.getPublicKey());
    });
}

function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!token) return res.status(401).json({ error: "Missing Bearer token" });

    jwt.verify(
        token,
        getKey,
        {
            audience,
            issuer: `https://${domain}/`,
            algorithms: ["RS256"]
        },
        (err, decoded) => {
            if (err) return res.status(401).json({ error: "Invalid token" });
            req.user = decoded;
            next();
        }
    );
}

module.exports = { requireAuth };
