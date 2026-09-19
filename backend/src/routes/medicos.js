import express from "express";
import prisma from "../lib/prisma.js";

const router = express.Router();

// Validar ID
function idValido(valor) {
  const id = Number(valor);
  return Number.isInteger(id) && id > 0;
}

// Listar médicos
router.get("/", async (req, res) => {
  try {
    const usuarioId = req.usuario.id;
    const { especialidade, ordem = "asc" } = req.query;

    const medicos = await prisma.medico.findMany({
      where: {
        usuarioId,
        ...(especialidade
          ? { especialidade: { contains: String(especialidade).trim() } }
          : {}),
      },
      orderBy: { nome: ordem === "desc" ? "desc" : "asc" },
    });

    return res.json(medicos);
  } catch (erro) {
    console.error("Erro ao listar médicos:", erro);
    return res.status(500).json({ erro: "Erro interno ao listar médicos." });
  }
});

// Buscar médico por ID
router.get("/:id", async (req, res) => {
  try {
    if (!idValido(req.params.id)) {
      return res.status(400).json({ erro: "ID do médico inválido." });
    }

    const medico = await prisma.medico.findFirst({
      where: {
        id: Number(req.params.id),
        usuarioId: req.usuario.id,
      },
    });

    if (!medico) return res.status(404).json({ erro: "Médico não encontrado." });
    return res.json(medico);
  } catch (erro) {
    console.error("Erro ao buscar médico:", erro);
    return res.status(500).json({ erro: "Erro interno ao buscar médico." });
  }
});

// Cadastrar médico
router.post("/", async (req, res) => {
  try {
    const usuarioId = req.usuario.id;
    const nome = String(req.body.nome || "").trim();
    const crm = String(req.body.crm || "").trim();
    const especialidade = String(req.body.especialidade || "").trim();

    if (!nome || !crm || !especialidade) {
      return res.status(400).json({ erro: "Nome, CRM e especialidade são obrigatórios." });
    }

    const crmExistente = await prisma.medico.findFirst({
      where: { usuarioId, crm },
    });

    if (crmExistente) {
      return res.status(409).json({ erro: "Já existe um médico cadastrado com este CRM nesta conta." });
    }

    const medico = await prisma.medico.create({
      data: { nome, crm, especialidade, usuarioId },
    });

    return res.status(201).json(medico);
  } catch (erro) {
    console.error("Erro ao cadastrar médico:", erro);
    return res.status(500).json({ erro: "Erro interno ao cadastrar médico." });
  }
});

// Atualizar médico
router.put("/:id", async (req, res) => {
  try {
    if (!idValido(req.params.id)) {
      return res.status(400).json({ erro: "ID do médico inválido." });
    }

    const usuarioId = req.usuario.id;
    const id = Number(req.params.id);

    const existente = await prisma.medico.findFirst({
      where: { id, usuarioId },
    });

    if (!existente) return res.status(404).json({ erro: "Médico não encontrado." });

    const nome = String(req.body.nome || "").trim();
    const crm = String(req.body.crm || "").trim();
    const especialidade = String(req.body.especialidade || "").trim();

    if (!nome || !crm || !especialidade) {
      return res.status(400).json({ erro: "Nome, CRM e especialidade são obrigatórios." });
    }

    const crmDeOutro = await prisma.medico.findFirst({
      where: {
        usuarioId,
        crm,
        NOT: { id },
      },
    });

    if (crmDeOutro) {
      return res.status(409).json({ erro: "Já existe outro médico cadastrado com este CRM nesta conta." });
    }

    const medico = await prisma.medico.update({
      where: { id },
      data: { nome, crm, especialidade },
    });

    return res.json(medico);
  } catch (erro) {
    console.error("Erro ao atualizar médico:", erro);
    return res.status(500).json({ erro: "Erro interno ao atualizar médico." });
  }
});

// Excluir médico
router.delete("/:id", async (req, res) => {
  try {
    if (!idValido(req.params.id)) {
      return res.status(400).json({ erro: "ID do médico inválido." });
    }

    const usuarioId = req.usuario.id;
    const id = Number(req.params.id);

    const medico = await prisma.medico.findFirst({
      where: { id, usuarioId },
    });

    if (!medico) return res.status(404).json({ erro: "Médico não encontrado." });

    // Impede excluir médico com consulta
    const consultas = await prisma.consulta.count({
      where: { medicoId: id, usuarioId },
    });

    if (consultas > 0) {
      return res.status(409).json({
        erro: "Este médico possui consultas cadastradas. Exclua ou altere as consultas antes de removê-lo.",
      });
    }

    await prisma.medico.delete({ where: { id } });
    return res.json({ mensagem: "Médico excluído com sucesso." });
  } catch (erro) {
    console.error("Erro ao excluir médico:", erro);
    return res.status(500).json({ erro: "Erro interno ao excluir médico." });
  }
});

export default router;
