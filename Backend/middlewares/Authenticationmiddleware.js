// Protected Route Middleware - Here we implement JWT authentication and authorization logic to protect certain routes.
import crypto from "crypto";

// Protected Route Middleware
const AuthenticationMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization; // "Bearer <token>" This is the authorization header that contains the token.

    // 1. Check if header exists
    if (!authHeader) {
        return res.status(401).json({ message: "No token provided" });
    }

    // 2. Extract token from "Bearer <token>"
    const token = authHeader.split(" ")[1];
    if (!token) {
        return res.status(401).json({ message: "Invalid token format" });
    }

    try {
        // 3. Split token
        const [headerEncoded, payloadEncoded, signatureReceived] = token.split(".");

        // 4. Decode (base64url → JSON)
        const header = JSON.parse(Buffer.from(headerEncoded, "base64url").toString("utf-8"));
        const payload = JSON.parse(Buffer.from(payloadEncoded, "base64url").toString("utf-8")); 
        // payload is the user information that we stored in the token. -> { username, userId, exp, iat } - userId is the mongodb id object of the user.

        // 5. Check expiration
        const currentTime = Math.floor(Date.now() / 1000);
        if (currentTime > payload.exp) {
            return res.status(401).json({ message: "Token expired" });
        }

        // 6. Recreate signature
        const secretKey = process.env.JWT_SECRET || "your_secret_key";

        const data = `${headerEncoded}.${payloadEncoded}`;
        const expectedSignature = crypto
            .createHmac("sha256", secretKey)
            .update(data)
            .digest("base64url");

        // 7. Compare signatures
        if (expectedSignature !== signatureReceived) {
            return res.status(401).json({ message: "Invalid token" });
        }

        // 8. Attach user to request - req.user is just convention because it’s easy to understand that it represents the authenticated user.
        // You could do req.info, req.auth, req.account, etc. It's just a convention.
        req.user = payload;
        console.log("🔥 req.user payload:", payload);

        next();
    } catch (error) {
        return res.status(401).json({ message: "Invalid token format" });
    }
};

export default AuthenticationMiddleware;

