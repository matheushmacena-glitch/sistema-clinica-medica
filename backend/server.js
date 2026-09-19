import express from "express";
import cors from "cors";
import "dotenv/config";

import autenticarToken from "./src/middlewares/autenticarToken.js";

import pacientesRoutes from "./src/routes/pacientes.js";
import medicosRoutes from "./src/routes/medicos.js";
import consultasRoutes from "./src/routes/consultas.js";
import authRoutes from "./src/routes/auth.js";


// Configura o servidor Express

const app = express();

app.use(cors());
app.use(express.json());


// Rota principal da API

app.get("/", (req, res) => {
  res.json({
    mensagem: "API da clínica funcionando!"
  });
});


// Rotas públicas de cadastro e login

app.use(authRoutes);


// Rotas protegidas de pacientes

app.use(
  "/pacientes",
  autenticarToken,
  pacientesRoutes
);


// Rotas protegidas de médicos

app.use(
  "/medicos",
  autenticarToken,
  medicosRoutes
);


// Rotas protegidas de consultas

app.use(
  "/consultas",
  autenticarToken,
  consultasRoutes
);


// Resposta para rotas inexistentes

app.use((req, res) => {
  res.status(404).json({
    erro: "Rota não encontrada",
  });
});


// Inicia o servidor

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});