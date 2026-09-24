import express from "express";
import request from "supertest";
import consultasRouter from "../src/routes/consultas.js";
import prisma from "../src/lib/prisma.js";

// Mock do Prisma
jest.mock("../src/lib/prisma.js", () => ({
  __esModule: true,
  default: {
    consulta: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    paciente: {
      findFirst: jest.fn(),
    },
    medico: {
      findFirst: jest.fn(),
    },
  },
}));

// Criar aplicação somente para os testes
const app = express();

app.use(express.json());

// Simula usuário autenticado
app.use((req, res, next) => {
  req.usuario = {
    id: 1,
  };

  next();
});

app.use("/consultas", consultasRouter);

describe("Módulo de Consultas", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // =========================================================
  // GET /consultas
  // =========================================================

  describe("GET /consultas", () => {
    test("deve listar as consultas do usuário", async () => {
      const consultas = [
        {
          id: 1,
          data: new Date("2030-10-10T10:00:00.000Z"),
          status: "AGENDADA",
          usuarioId: 1,
          pacienteId: 1,
          medicoId: 1,
          paciente: {
            id: 1,
            nome: "João",
          },
          medico: {
            id: 1,
            nome: "Dr. Carlos",
          },
        },
      ];

      prisma.consulta.findMany.mockResolvedValue(consultas);

      const response = await request(app)
        .get("/consultas");

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].status).toBe("AGENDADA");

      expect(prisma.consulta.findMany).toHaveBeenCalledWith({
        where: {
          usuarioId: 1,
        },
        orderBy: {
          data: "asc",
        },
        include: {
          paciente: true,
          medico: true,
        },
      });
    });

    test("deve filtrar por status AGENDADA", async () => {
      prisma.consulta.findMany.mockResolvedValue([]);

      const response = await request(app)
        .get("/consultas?status=AGENDADA");

      expect(response.status).toBe(200);

      expect(prisma.consulta.findMany).toHaveBeenCalledWith({
        where: {
          usuarioId: 1,
          status: "AGENDADA",
        },
        orderBy: {
          data: "asc",
        },
        include: {
          paciente: true,
          medico: true,
        },
      });
    });

    test("deve aceitar status CONCLUIDA", async () => {
      prisma.consulta.findMany.mockResolvedValue([]);

      const response = await request(app)
        .get("/consultas?status=CONCLUIDA");

      expect(response.status).toBe(200);

      expect(prisma.consulta.findMany).toHaveBeenCalledWith({
        where: {
          usuarioId: 1,
          status: "CONCLUIDA",
        },
        orderBy: {
          data: "asc",
        },
        include: {
          paciente: true,
          medico: true,
        },
      });
    });

    test("deve aceitar status CANCELADA", async () => {
      prisma.consulta.findMany.mockResolvedValue([]);

      const response = await request(app)
        .get("/consultas?status=CANCELADA");

      expect(response.status).toBe(200);

      expect(prisma.consulta.findMany).toHaveBeenCalledWith({
        where: {
          usuarioId: 1,
          status: "CANCELADA",
        },
        orderBy: {
          data: "asc",
        },
        include: {
          paciente: true,
          medico: true,
        },
      });
    });

    test("deve aceitar status em letras minúsculas", async () => {
      prisma.consulta.findMany.mockResolvedValue([]);

      const response = await request(app)
        .get("/consultas?status=concluida");

      expect(response.status).toBe(200);

      expect(prisma.consulta.findMany).toHaveBeenCalledWith({
        where: {
          usuarioId: 1,
          status: "CONCLUIDA",
        },
        orderBy: {
          data: "asc",
        },
        include: {
          paciente: true,
          medico: true,
        },
      });
    });

    test("deve rejeitar status inválido", async () => {
      const response = await request(app)
        .get("/consultas?status=INVALIDO");

      expect(response.status).toBe(400);

      expect(response.body).toEqual({
        erro: "Status de consulta inválido.",
      });

      expect(prisma.consulta.findMany).not.toHaveBeenCalled();
    });

    test("deve ordenar por data decrescente", async () => {
      prisma.consulta.findMany.mockResolvedValue([]);

      const response = await request(app)
        .get("/consultas?ordem=desc");

      expect(response.status).toBe(200);

      expect(prisma.consulta.findMany).toHaveBeenCalledWith({
        where: {
          usuarioId: 1,
        },
        orderBy: {
          data: "desc",
        },
        include: {
          paciente: true,
          medico: true,
        },
      });
    });

    test("deve retornar erro 500 se o banco falhar", async () => {
      prisma.consulta.findMany.mockRejectedValue(
        new Error("Erro no banco")
      );

      const response = await request(app)
        .get("/consultas");

      expect(response.status).toBe(500);

      expect(response.body).toEqual({
        erro: "Erro interno ao listar consultas.",
      });
    });
  });

  // =========================================================
  // GET /consultas/:id
  // =========================================================

  describe("GET /consultas/:id", () => {
    test("deve buscar uma consulta pelo ID", async () => {
      const consulta = {
        id: 1,
        data: new Date("2030-10-10T10:00:00.000Z"),
        status: "AGENDADA",
        usuarioId: 1,
        pacienteId: 1,
        medicoId: 1,
        paciente: {
          id: 1,
          nome: "João",
        },
        medico: {
          id: 1,
          nome: "Dr. Carlos",
        },
      };

      prisma.consulta.findFirst.mockResolvedValue(consulta);

      const response = await request(app)
        .get("/consultas/1");

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(1);

      expect(prisma.consulta.findFirst).toHaveBeenCalledWith({
        where: {
          id: 1,
          usuarioId: 1,
        },
        include: {
          paciente: true,
          medico: true,
        },
      });
    });

    test("deve rejeitar ID inválido", async () => {
      const response = await request(app)
        .get("/consultas/abc");

      expect(response.status).toBe(400);

      expect(response.body).toEqual({
        erro: "ID da consulta inválido.",
      });

      expect(prisma.consulta.findFirst).not.toHaveBeenCalled();
    });

    test("deve rejeitar ID zero", async () => {
      const response = await request(app)
        .get("/consultas/0");

      expect(response.status).toBe(400);

      expect(response.body).toEqual({
        erro: "ID da consulta inválido.",
      });
    });

    test("deve retornar 404 quando a consulta não existe", async () => {
      prisma.consulta.findFirst.mockResolvedValue(null);

      const response = await request(app)
        .get("/consultas/999");

      expect(response.status).toBe(404);

      expect(response.body).toEqual({
        erro: "Consulta não encontrada.",
      });
    });

    test("deve retornar 500 se o banco falhar", async () => {
      prisma.consulta.findFirst.mockRejectedValue(
        new Error("Erro no banco")
      );

      const response = await request(app)
        .get("/consultas/1");

      expect(response.status).toBe(500);

      expect(response.body).toEqual({
        erro: "Erro interno ao buscar consulta.",
      });
    });
  });

  // =========================================================
  // POST /consultas
  // =========================================================

  describe("POST /consultas", () => {
    test("deve agendar uma consulta válida", async () => {
      const data = "2030-10-10T10:00:00.000Z";

      prisma.paciente.findFirst.mockResolvedValue({
        id: 1,
        usuarioId: 1,
      });

      prisma.medico.findFirst.mockResolvedValue({
        id: 1,
        usuarioId: 1,
      });

      prisma.consulta.create.mockResolvedValue({
        id: 1,
        data: new Date(data),
        status: "AGENDADA",
        usuarioId: 1,
        pacienteId: 1,
        medicoId: 1,
        paciente: {
          id: 1,
          nome: "João",
        },
        medico: {
          id: 1,
          nome: "Dr. Carlos",
        },
      });

      const response = await request(app)
        .post("/consultas")
        .send({
          data,
          pacienteId: 1,
          medicoId: 1,
        });

      expect(response.status).toBe(201);

      expect(response.body.status).toBe("AGENDADA");
      expect(response.body.usuarioId).toBe(1);

      expect(prisma.consulta.create).toHaveBeenCalledWith({
        data: {
          data: new Date(data),
          status: "AGENDADA",
          usuarioId: 1,
          pacienteId: 1,
          medicoId: 1,
        },
        include: {
          paciente: true,
          medico: true,
        },
      });
    });

    test("deve rejeitar data ausente", async () => {
      const response = await request(app)
        .post("/consultas")
        .send({
          pacienteId: 1,
          medicoId: 1,
        });

      expect(response.status).toBe(400);

      expect(response.body).toEqual({
        erro: "Informe uma data e horário válidos.",
      });
    });

    test("deve rejeitar data inválida", async () => {
      const response = await request(app)
        .post("/consultas")
        .send({
          data: "data-invalida",
          pacienteId: 1,
          medicoId: 1,
        });

      expect(response.status).toBe(400);

      expect(response.body).toEqual({
        erro: "Informe uma data e horário válidos.",
      });
    });

    test("deve rejeitar data que já passou", async () => {
      const response = await request(app)
        .post("/consultas")
        .send({
          data: "2020-01-01T10:00:00.000Z",
          pacienteId: 1,
          medicoId: 1,
        });

      expect(response.status).toBe(400);

      expect(response.body.erro).toBe(
        "Não é possível agendar uma consulta em uma data ou horário que já passou."
      );
    });

    test("deve rejeitar paciente inválido", async () => {
      const response = await request(app)
        .post("/consultas")
        .send({
          data: "2030-10-10T10:00:00.000Z",
          pacienteId: 0,
          medicoId: 1,
        });

      expect(response.status).toBe(400);

      expect(response.body).toEqual({
        erro: "Selecione um paciente válido.",
      });
    });

    test("deve rejeitar médico inválido", async () => {
      const response = await request(app)
        .post("/consultas")
        .send({
          data: "2030-10-10T10:00:00.000Z",
          pacienteId: 1,
          medicoId: 0,
        });

      expect(response.status).toBe(400);

      expect(response.body).toEqual({
        erro: "Selecione um médico válido.",
      });
    });

    test("deve retornar 404 se o paciente não pertencer à conta", async () => {
      prisma.paciente.findFirst.mockResolvedValue(null);

      prisma.medico.findFirst.mockResolvedValue({
        id: 1,
        usuarioId: 1,
      });

      const response = await request(app)
        .post("/consultas")
        .send({
          data: "2030-10-10T10:00:00.000Z",
          pacienteId: 999,
          medicoId: 1,
        });

      expect(response.status).toBe(404);

      expect(response.body).toEqual({
        erro: "Paciente não encontrado nesta conta.",
      });
    });

    test("deve retornar 404 se o médico não pertencer à conta", async () => {
      prisma.paciente.findFirst.mockResolvedValue({
        id: 1,
        usuarioId: 1,
      });

      prisma.medico.findFirst.mockResolvedValue(null);

      const response = await request(app)
        .post("/consultas")
        .send({
          data: "2030-10-10T10:00:00.000Z",
          pacienteId: 1,
          medicoId: 999,
        });

      expect(response.status).toBe(404);

      expect(response.body).toEqual({
        erro: "Médico não encontrado nesta conta.",
      });
    });
  });

  // =========================================================
  // PUT /consultas/:id
  // =========================================================

  describe("PUT /consultas/:id", () => {
    test("deve atualizar o status para CONCLUIDA", async () => {
      const consultaAtual = {
        id: 1,
        data: new Date("2030-10-10T10:00:00.000Z"),
        status: "AGENDADA",
        usuarioId: 1,
      };

      const consultaAtualizada = {
        ...consultaAtual,
        status: "CONCLUIDA",
      };

      prisma.consulta.findFirst.mockResolvedValue(consultaAtual);
      prisma.consulta.update.mockResolvedValue(consultaAtualizada);

      const response = await request(app)
        .put("/consultas/1")
        .send({
          status: "CONCLUIDA",
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("CONCLUIDA");

      expect(prisma.consulta.update).toHaveBeenCalledWith({
        where: {
          id: 1,
        },
        data: {
          status: "CONCLUIDA",
        },
        include: {
          paciente: true,
          medico: true,
        },
      });
    });

    test("deve atualizar o status para CANCELADA", async () => {
      const consultaAtual = {
        id: 1,
        data: new Date("2030-10-10T10:00:00.000Z"),
        status: "AGENDADA",
        usuarioId: 1,
      };

      prisma.consulta.findFirst.mockResolvedValue(consultaAtual);

      prisma.consulta.update.mockResolvedValue({
        ...consultaAtual,
        status: "CANCELADA",
      });

      const response = await request(app)
        .put("/consultas/1")
        .send({
          status: "CANCELADA",
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("CANCELADA");
    });

    test("deve aceitar status em letras minúsculas", async () => {
      const consultaAtual = {
        id: 1,
        data: new Date("2030-10-10T10:00:00.000Z"),
        status: "AGENDADA",
        usuarioId: 1,
      };

      prisma.consulta.findFirst.mockResolvedValue(consultaAtual);

      prisma.consulta.update.mockResolvedValue({
        ...consultaAtual,
        status: "CONCLUIDA",
      });

      const response = await request(app)
        .put("/consultas/1")
        .send({
          status: "concluida",
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("CONCLUIDA");
    });

    test("deve rejeitar status inválido", async () => {
      prisma.consulta.findFirst.mockResolvedValue({
        id: 1,
        data: new Date("2030-10-10T10:00:00.000Z"),
        status: "AGENDADA",
        usuarioId: 1,
      });

      const response = await request(app)
        .put("/consultas/1")
        .send({
          status: "PENDENTE",
        });

      expect(response.status).toBe(400);

      expect(response.body).toEqual({
        erro: "Status de consulta inválido.",
      });

      expect(prisma.consulta.update).not.toHaveBeenCalled();
    });

    test("deve atualizar a data", async () => {
      const dataNova = "2030-11-10T10:00:00.000Z";

      prisma.consulta.findFirst.mockResolvedValue({
        id: 1,
        data: new Date("2030-10-10T10:00:00.000Z"),
        status: "AGENDADA",
        usuarioId: 1,
      });

      prisma.consulta.update.mockResolvedValue({
        id: 1,
        data: new Date(dataNova),
        status: "AGENDADA",
        usuarioId: 1,
      });

      const response = await request(app)
        .put("/consultas/1")
        .send({
          data: dataNova,
        });

      expect(response.status).toBe(200);

      expect(prisma.consulta.update).toHaveBeenCalled();
    });

    test("deve rejeitar nova data inválida", async () => {
      prisma.consulta.findFirst.mockResolvedValue({
        id: 1,
        data: new Date("2030-10-10T10:00:00.000Z"),
        status: "AGENDADA",
        usuarioId: 1,
      });

      const response = await request(app)
        .put("/consultas/1")
        .send({
          data: "data-invalida",
        });

      expect(response.status).toBe(400);

      expect(response.body).toEqual({
        erro: "Informe uma data e horário válidos.",
      });
    });

    test("deve rejeitar alteração para data passada", async () => {
      prisma.consulta.findFirst.mockResolvedValue({
        id: 1,
        data: new Date("2030-10-10T10:00:00.000Z"),
        status: "AGENDADA",
        usuarioId: 1,
      });

      const response = await request(app)
        .put("/consultas/1")
        .send({
          data: "2020-01-01T10:00:00.000Z",
        });

      expect(response.status).toBe(400);

      expect(response.body.erro).toBe(
        "Não é possível alterar a consulta para uma data ou horário que já passou."
      );
    });

    test("deve atualizar paciente", async () => {
      prisma.consulta.findFirst.mockResolvedValue({
        id: 1,
        data: new Date("2030-10-10T10:00:00.000Z"),
        status: "AGENDADA",
        usuarioId: 1,
      });

      prisma.paciente.findFirst.mockResolvedValue({
        id: 2,
        usuarioId: 1,
      });

      prisma.consulta.update.mockResolvedValue({
        id: 1,
        pacienteId: 2,
        usuarioId: 1,
      });

      const response = await request(app)
        .put("/consultas/1")
        .send({
          pacienteId: 2,
        });

      expect(response.status).toBe(200);

      expect(prisma.consulta.update).toHaveBeenCalled();
    });

    test("deve atualizar médico", async () => {
      prisma.consulta.findFirst.mockResolvedValue({
        id: 1,
        data: new Date("2030-10-10T10:00:00.000Z"),
        status: "AGENDADA",
        usuarioId: 1,
      });

      prisma.medico.findFirst.mockResolvedValue({
        id: 2,
        usuarioId: 1,
      });

      prisma.consulta.update.mockResolvedValue({
        id: 1,
        medicoId: 2,
        usuarioId: 1,
      });

      const response = await request(app)
        .put("/consultas/1")
        .send({
          medicoId: 2,
        });

      expect(response.status).toBe(200);

      expect(prisma.consulta.update).toHaveBeenCalled();
    });

    test("deve rejeitar ID inválido", async () => {
      const response = await request(app)
        .put("/consultas/abc")
        .send({
          status: "CONCLUIDA",
        });

      expect(response.status).toBe(400);

      expect(response.body).toEqual({
        erro: "ID da consulta inválido.",
      });
    });

    test("deve retornar 404 para consulta inexistente", async () => {
      prisma.consulta.findFirst.mockResolvedValue(null);

      const response = await request(app)
        .put("/consultas/999")
        .send({
          status: "CONCLUIDA",
        });

      expect(response.status).toBe(404);

      expect(response.body).toEqual({
        erro: "Consulta não encontrada.",
      });
    });
  });

  // =========================================================
  // DELETE /consultas/:id
  // =========================================================

  describe("DELETE /consultas/:id", () => {
    test("deve excluir uma consulta", async () => {
      prisma.consulta.findFirst.mockResolvedValue({
        id: 1,
        usuarioId: 1,
      });

      prisma.consulta.delete.mockResolvedValue({
        id: 1,
      });

      const response = await request(app)
        .delete("/consultas/1");

      expect(response.status).toBe(200);

      expect(response.body).toEqual({
        mensagem: "Consulta excluída com sucesso.",
      });

      expect(prisma.consulta.delete).toHaveBeenCalledWith({
        where: {
          id: 1,
        },
      });
    });

    test("deve rejeitar ID inválido", async () => {
      const response = await request(app)
        .delete("/consultas/abc");

      expect(response.status).toBe(400);

      expect(response.body).toEqual({
        erro: "ID da consulta inválido.",
      });

      expect(prisma.consulta.delete).not.toHaveBeenCalled();
    });

    test("deve retornar 404 se a consulta não existir", async () => {
      prisma.consulta.findFirst.mockResolvedValue(null);

      const response = await request(app)
        .delete("/consultas/999");

      expect(response.status).toBe(404);

      expect(response.body).toEqual({
        erro: "Consulta não encontrada.",
      });

      expect(prisma.consulta.delete).not.toHaveBeenCalled();
    });

    test("deve retornar 500 se ocorrer erro no banco", async () => {
      prisma.consulta.findFirst.mockRejectedValue(
        new Error("Erro no banco")
      );

      const response = await request(app)
        .delete("/consultas/1");

      expect(response.status).toBe(500);

      expect(response.body).toEqual({
        erro: "Erro interno ao excluir consulta.",
      });
    });
  });
});