import express from "express";
import prisma from "../lib/prisma.js";

const router = express.Router();

// Validar ID
function idValido(valor) {
  const id = Number(valor);
  return Number.isInteger(id) && id > 0;
}

// Validar e-mail
function emailValido(email) {
  if (!email) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Validar data de nascimento
function dataNascimentoValida(valor) {
  if (!valor) return true;
  const data = new Date(valor);
  return !Number.isNaN(data.getTime()) && data <= new Date();
}

// Listar pacientes
router.get("/", async (req, res) => {
  try {
    const usuarioId = req.usuario.id;
    const { nome, ordem = "asc" } = req.query;

    const pacientes = await prisma.paciente.findMany({
      where: {
        usuarioId,
        ...(nome ? { nome: { contains: String(nome).trim() } } : {}),
      },
      orderBy: { nome: ordem === "desc" ? "desc" : "asc" },
    });

    return res.json(pacientes);
  } catch (erro) {
    console.error("Erro ao listar pacientes:", erro);
    return res.status(500).json({ erro: "Erro interno ao listar pacientes." });
  }
});

// Buscar paciente por ID
router.get("/:id", async (req, res) => {
  try {
    if (!idValido(req.params.id)) {
      return res.status(400).json({ erro: "ID do paciente inválido." });
    }

    const paciente = await prisma.paciente.findFirst({
      where: {
        id: Number(req.params.id),
        usuarioId: req.usuario.id,
      },
    });

    if (!paciente) {
      return res.status(404).json({ erro: "Paciente não encontrado." });
    }

    return res.json(paciente);
  } catch (erro) {
    console.error("Erro ao buscar paciente:", erro);
    return res.status(500).json({ erro: "Erro interno ao buscar paciente." });
  }
});

// Cadastrar paciente
router.post("/", async (req, res) => {
  try {
    const usuarioId = req.usuario.id;
    const nome = String(req.body.nome || "").trim();
    const cpf = String(req.body.cpf || "").trim();
    const telefone = String(req.body.telefone || "").trim() || null;
    const email = String(req.body.email || "").trim() || null;
    const { dataNascimento } = req.body;

    if (!nome) return res.status(400).json({ erro: "O nome do paciente é obrigatório." });
    if (!cpf) return res.status(400).json({ erro: "O CPF do paciente é obrigatório." });
    if (!emailValido(email)) return res.status(400).json({ erro: "Informe um e-mail válido." });
    if (!dataNascimentoValida(dataNascimento)) {
      return res.status(400).json({ erro: "A data de nascimento não pode estar no futuro." });
    }

    const cpfExistente = await prisma.paciente.findFirst({
      where: { usuarioId, cpf },
    });

    if (cpfExistente) {
      return res.status(409).json({ erro: "Já existe um paciente cadastrado com este CPF nesta conta." });
    }

    const paciente = await prisma.paciente.create({
      data: {
        nome,
        cpf,
        telefone,
        email,
        dataNascimento: dataNascimento ? new Date(dataNascimento) : null,
        usuarioId,
      },
    });

    return res.status(201).json(paciente);
  } catch (erro) {
    console.error("Erro ao cadastrar paciente:", erro);
    return res.status(500).json({ erro: "Erro interno ao cadastrar paciente." });
  }
});

// Atualizar paciente
router.put("/:id", async (req, res) => {
  try {
    if (!idValido(req.params.id)) {
      return res.status(400).json({ erro: "ID do paciente inválido." });
    }

    const usuarioId = req.usuario.id;
    const id = Number(req.params.id);

    const existente = await prisma.paciente.findFirst({
      where: { id, usuarioId },
    });

    if (!existente) {
      return res.status(404).json({ erro: "Paciente não encontrado." });
    }

    const nome = String(req.body.nome || "").trim();
    const cpf = String(req.body.cpf || "").trim();
    const telefone = String(req.body.telefone || "").trim() || null;
    const email = String(req.body.email || "").trim() || null;
    const { dataNascimento } = req.body;

    if (!nome) return res.status(400).json({ erro: "O nome do paciente é obrigatório." });
    if (!cpf) return res.status(400).json({ erro: "O CPF do paciente é obrigatório." });
    if (!emailValido(email)) return res.status(400).json({ erro: "Informe um e-mail válido." });
    if (!dataNascimentoValida(dataNascimento)) {
      return res.status(400).json({ erro: "A data de nascimento não pode estar no futuro." });
    }

    const cpfDeOutro = await prisma.paciente.findFirst({
      where: {
        usuarioId,
        cpf,
        NOT: { id },
      },
    });

    if (cpfDeOutro) {
      return res.status(409).json({ erro: "Já existe outro paciente cadastrado com este CPF nesta conta." });
    }

    const paciente = await prisma.paciente.update({
      where: { id },
      data: {
        nome,
        cpf,
        telefone,
        email,
        dataNascimento: dataNascimento ? new Date(dataNascimento) : null,
      },
    });

    return res.json(paciente);
  } catch (erro) {
    console.error("Erro ao atualizar paciente:", erro);
    return res.status(500).json({ erro: "Erro interno ao atualizar paciente." });
  }
});

// Excluir paciente
router.delete("/:id", async (req, res) => {
  try {
    if (!idValido(req.params.id)) {
      return res.status(400).json({ erro: "ID do paciente inválido." });
    }

    const usuarioId = req.usuario.id;
    const id = Number(req.params.id);

    const paciente = await prisma.paciente.findFirst({
      where: { id, usuarioId },
    });

    if (!paciente) {
      return res.status(404).json({ erro: "Paciente não encontrado." });
    }

    // Impede excluir paciente com consulta
    const consultas = await prisma.consulta.count({
      where: { pacienteId: id, usuarioId },
    });

    if (consultas > 0) {
      return res.status(409).json({
        erro: "Este paciente possui consultas cadastradas. Exclua ou altere as consultas antes de removê-lo.",
      });
    }

    await prisma.paciente.delete({ where: { id } });
    return res.json({ mensagem: "Paciente excluído com sucesso." });
  } catch (erro) {
    console.error("Erro ao excluir paciente:", erro);
    return res.status(500).json({ erro: "Erro interno ao excluir paciente." });
  }
});

export default router;
