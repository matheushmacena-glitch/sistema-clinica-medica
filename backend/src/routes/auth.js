import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma.js";

const router = express.Router();

// Padroniza o e-mail
function normalizarEmail(valor = "") {
  return String(valor).trim().toLowerCase();
}

// Cadastrar usuário
router.post("/usuarios", async (req, res) => {
  try {
    const nome = String(req.body.nome || "").trim();
    const email = normalizarEmail(req.body.email);
    const senha = String(req.body.senha || "");

    if (!nome || !email || !senha) {
      return res.status(400).json({
        erro: "Nome, e-mail e senha são obrigatórios.",
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ erro: "Informe um e-mail válido." });
    }

    if (senha.length < 6) {
      return res.status(400).json({
        erro: "A senha precisa ter pelo menos 6 caracteres.",
      });
    }

    const usuarioExistente = await prisma.usuario.findUnique({
      where: { email },
    });

    if (usuarioExistente) {
      return res.status(409).json({
        erro: "Já existe um usuário com esse e-mail.",
      });
    }

    // Criptografa a senha
    const senhaCriptografada = await bcrypt.hash(senha, 10);

    const usuario = await prisma.usuario.create({
      data: {
        nome,
        email,
        senha: senhaCriptografada,
      },
    });

    return res.status(201).json({
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
    });
  } catch (erro) {
    console.error("Erro ao cadastrar usuário:", erro);
    return res.status(500).json({ erro: "Erro ao cadastrar usuário." });
  }
});

// Realizar login
router.post("/login", async (req, res) => {
  try {
    const email = normalizarEmail(req.body.email);
    const senha = String(req.body.senha || "");

    if (!email || !senha) {
      return res.status(400).json({ erro: "E-mail e senha são obrigatórios." });
    }

    const usuario = await prisma.usuario.findUnique({ where: { email } });

    if (!usuario) {
      return res.status(401).json({ erro: "E-mail ou senha inválidos." });
    }

    const senhaCorreta = await bcrypt.compare(senha, usuario.senha);

    if (!senhaCorreta) {
      return res.status(401).json({ erro: "E-mail ou senha inválidos." });
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET não definida no arquivo .env");
    }

    // Gera o token de acesso
    const token = jwt.sign(
      { id: usuario.id, email: usuario.email },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    return res.json({
      mensagem: "Login realizado com sucesso.",
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
      },
      token,
    });
  } catch (erro) {
    console.error("Erro ao realizar login:", erro);
    return res.status(500).json({ erro: "Erro ao realizar login." });
  }
});

export default router;
