-- ATENÇÃO:
-- Esta migração limpa os dados antigos porque eles não possuíam vínculo com usuário.
-- Após esta migração, cada conta terá seus próprios pacientes, médicos e consultas.

PRAGMA foreign_keys=OFF;

DROP TABLE "Consulta";
DROP TABLE "Paciente";
DROP TABLE "Medico";
DROP TABLE "Usuario";

CREATE TABLE "Usuario" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha" TEXT NOT NULL
);

CREATE TABLE "Paciente" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "telefone" TEXT,
    "email" TEXT,
    "dataNascimento" DATETIME,
    "usuarioId" INTEGER NOT NULL,
    CONSTRAINT "Paciente_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "Medico" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "crm" TEXT NOT NULL,
    "especialidade" TEXT NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    CONSTRAINT "Medico_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "Consulta" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "data" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'AGENDADA',
    "usuarioId" INTEGER NOT NULL,
    "pacienteId" INTEGER NOT NULL,
    "medicoId" INTEGER NOT NULL,
    CONSTRAINT "Consulta_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Consulta_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "Paciente" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Consulta_medicoId_fkey" FOREIGN KEY ("medicoId") REFERENCES "Medico" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");
CREATE UNIQUE INDEX "Paciente_usuarioId_cpf_key" ON "Paciente"("usuarioId", "cpf");
CREATE INDEX "Paciente_usuarioId_idx" ON "Paciente"("usuarioId");
CREATE UNIQUE INDEX "Medico_usuarioId_crm_key" ON "Medico"("usuarioId", "crm");
CREATE INDEX "Medico_usuarioId_idx" ON "Medico"("usuarioId");
CREATE INDEX "Consulta_usuarioId_idx" ON "Consulta"("usuarioId");
CREATE INDEX "Consulta_pacienteId_idx" ON "Consulta"("pacienteId");
CREATE INDEX "Consulta_medicoId_idx" ON "Consulta"("medicoId");

PRAGMA foreign_keys=ON;
