import jwt from "jsonwebtoken";

export function requireAuth(req, res, next) {
  const auth = req.headers.authorization || "";
  const [type, token] = auth.split(" ");

  if (type !== "Bearer" || !token) {
    return res.status(401).json({message: "Missing token"});
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload; // { id, isAdmin, ... }
    return next();
  } catch (err) {
    return res.status(401).json({message: "Invalid or expired token"});
  }
}
