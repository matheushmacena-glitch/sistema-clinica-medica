import "dotenv/config";
import jwt from "jsonwebtoken";

// Valida o token enviado pelo usuário
function autenticarToken(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const [tipo, token] = authHeader.split(" ");

  if (tipo !== "Bearer" || !token) {
    return res.status(401).json({ erro: "Token não informado ou inválido." });
  }

  // Verifica se o token é válido
  try {
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET não definida");
    }
    req.usuario = jwt.verify(token, process.env.JWT_SECRET);
    return next();
  } catch {
    return res.status(401).json({ erro: "Token inválido ou expirado." });
  }
}

export default autenticarToken;
