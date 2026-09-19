import express from "express";
import prisma from "../lib/prisma.js";

const router = express.Router();
// Status permitidos
const STATUS_VALIDOS = ["AGENDADA", "CONCLUIDA", "CANCELADA"];

// Validar ID
function idValido(valor) {
  const id = Number(valor);
  return Number.isInteger(id) && id > 0;
}

// Validar data
function dataValida(valor) {
  if (!valor) return false;
  const data = new Date(valor);
  return !Number.isNaN(data.getTime());
}

// Listar consultas
router.get("/", async (req, res) => {
  try {
    const usuarioId = req.usuario.id;
    const { status, ordem = "asc" } = req.query;
    const statusNormalizado = status ? String(status).toUpperCase() : null;

    if (statusNormalizado && !STATUS_VALIDOS.includes(statusNormalizado)) {
      return res.status(400).json({ erro: "Status de consulta inválido." });
    }

    const consultas = await prisma.consulta.findMany({
      where: {
        usuarioId,
        ...(statusNormalizado ? { status: statusNormalizado } : {}),
      },
      orderBy: { data: ordem === "desc" ? "desc" : "asc" },
      include: { paciente: true, medico: true },
    });

    return res.json(consultas);
  } catch (erro) {
    console.error("Erro ao listar consultas:", erro);
    return res.status(500).json({ erro: "Erro interno ao listar consultas." });
  }
});

// Buscar consulta por ID
router.get("/:id", async (req, res) => {
  try {
    if (!idValido(req.params.id)) {
      return res.status(400).json({ erro: "ID da consulta inválido." });
    }

    const consulta = await prisma.consulta.findFirst({
      where: {
        id: Number(req.params.id),
        usuarioId: req.usuario.id,
      },
      include: { paciente: true, medico: true },
    });

    if (!consulta) {
      return res.status(404).json({ erro: "Consulta não encontrada." });
    }

    return res.json(consulta);
  } catch (erro) {
    console.error("Erro ao buscar consulta:", erro);
    return res.status(500).json({ erro: "Erro interno ao buscar consulta." });
  }
});

// Agendar consulta
router.post("/", async (req, res) => {
  try {
    const usuarioId = req.usuario.id;
    const { data, pacienteId, medicoId } = req.body;

    if (!dataValida(data)) {
      return res.status(400).json({ erro: "Informe uma data e horário válidos." });
    }

    const dataConsulta = new Date(data);
    if (dataConsulta <= new Date()) {
      return res.status(400).json({
        erro: "Não é possível agendar uma consulta em uma data ou horário que já passou.",
      });
    }

    if (!idValido(pacienteId)) {
      return res.status(400).json({ erro: "Selecione um paciente válido." });
    }

    if (!idValido(medicoId)) {
      return res.status(400).json({ erro: "Selecione um médico válido." });
    }

    // Confere paciente e médico da conta
    const [paciente, medico] = await Promise.all([
      prisma.paciente.findFirst({
        where: { id: Number(pacienteId), usuarioId },
      }),
      prisma.medico.findFirst({
        where: { id: Number(medicoId), usuarioId },
      }),
    ]);

    if (!paciente) {
      return res.status(404).json({ erro: "Paciente não encontrado nesta conta." });
    }

    if (!medico) {
      return res.status(404).json({ erro: "Médico não encontrado nesta conta." });
    }

    const consulta = await prisma.consulta.create({
      data: {
        data: dataConsulta,
        status: "AGENDADA",
        usuarioId,
        pacienteId: Number(pacienteId),
        medicoId: Number(medicoId),
      },
      include: { paciente: true, medico: true },
    });

    return res.status(201).json(consulta);
  } catch (erro) {
    console.error("Erro ao agendar consulta:", erro);
    return res.status(500).json({ erro: "Erro interno ao agendar consulta." });
  }
});

// Atualizar consulta
router.put("/:id", async (req, res) => {
  try {
    if (!idValido(req.params.id)) {
      return res.status(400).json({ erro: "ID da consulta inválido." });
    }

    const usuarioId = req.usuario.id;
    const id = Number(req.params.id);

    const consultaExiste = await prisma.consulta.findFirst({
      where: { id, usuarioId },
    });

    if (!consultaExiste) {
      return res.status(404).json({ erro: "Consulta não encontrada." });
    }

    const { data, status, pacienteId, medicoId } = req.body;
    const dadosAtualizacao = {};

    if (data !== undefined) {
      if (!dataValida(data)) {
        return res.status(400).json({ erro: "Informe uma data e horário válidos." });
      }

      const novaData = new Date(data);
      const dataFoiAlterada = novaData.getTime() !== consultaExiste.data.getTime();

      if (dataFoiAlterada && novaData <= new Date()) {
        return res.status(400).json({
          erro: "Não é possível alterar a consulta para uma data ou horário que já passou.",
        });
      }

      dadosAtualizacao.data = novaData;
    }

    if (status !== undefined) {
      const statusNormalizado = String(status).toUpperCase();
      if (!STATUS_VALIDOS.includes(statusNormalizado)) {
        return res.status(400).json({ erro: "Status de consulta inválido." });
      }
      dadosAtualizacao.status = statusNormalizado;
    }

    if (pacienteId !== undefined) {
      if (!idValido(pacienteId)) {
        return res.status(400).json({ erro: "Paciente inválido." });
      }

      const paciente = await prisma.paciente.findFirst({
        where: { id: Number(pacienteId), usuarioId },
      });

      if (!paciente) {
        return res.status(404).json({ erro: "Paciente não encontrado nesta conta." });
      }

      dadosAtualizacao.pacienteId = Number(pacienteId);
    }

    if (medicoId !== undefined) {
      if (!idValido(medicoId)) {
        return res.status(400).json({ erro: "Médico inválido." });
      }

      const medico = await prisma.medico.findFirst({
        where: { id: Number(medicoId), usuarioId },
      });

      if (!medico) {
        return res.status(404).json({ erro: "Médico não encontrado nesta conta." });
      }

      dadosAtualizacao.medicoId = Number(medicoId);
    }

    const consulta = await prisma.consulta.update({
      where: { id },
      data: dadosAtualizacao,
      include: { paciente: true, medico: true },
    });

    return res.json(consulta);
  } catch (erro) {
    console.error("Erro ao atualizar consulta:", erro);
    return res.status(500).json({ erro: "Erro interno ao atualizar consulta." });
  }
});

// Excluir consulta
router.delete("/:id", async (req, res) => {
  try {
    if (!idValido(req.params.id)) {
      return res.status(400).json({ erro: "ID da consulta inválido." });
    }

    const usuarioId = req.usuario.id;
    const id = Number(req.params.id);

    const consulta = await prisma.consulta.findFirst({
      where: { id, usuarioId },
    });

    if (!consulta) {
      return res.status(404).json({ erro: "Consulta não encontrada." });
    }

    await prisma.consulta.delete({ where: { id } });
    return res.json({ mensagem: "Consulta excluída com sucesso." });
  } catch (erro) {
    console.error("Erro ao excluir consulta:", erro);
    return res.status(500).json({ erro: "Erro interno ao excluir consulta." });
  }
});

export default router;
