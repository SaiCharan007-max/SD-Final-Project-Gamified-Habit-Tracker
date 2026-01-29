import jwt from "jsonwebtoken";

export const authMiddleware = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                message: "Unauthorized"
            });
        }

        const parts = authHeader.split(" ");

        if (parts.length != 2 || parts[0] != "Bearer") {
            return res.status(401).json({ message: "Invalid Authorization Format" });
        }

        const token = parts[1];

        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

        req.userId = decoded.userId;

        next();
    } catch (err) {
        return res.status(401).json({message: "Invalid or expired token"});
    }


}