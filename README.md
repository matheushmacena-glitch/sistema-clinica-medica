# MediFlow

Projeto separado em duas partes para evitar mistura entre código do servidor e código do navegador.

## Estrutura

```text
MediFlow_ORGANIZADO/
├── backend/
│   ├── server.js
│   ├── package.json
│   ├── prisma/
│   └── src/
│       ├── lib/
│       ├── middlewares/
│       └── routes/
└── frontend/
    ├── index.html
    ├── dashboard.html
    ├── pacientes.html
    ├── medicos.html
    ├── consultas.html
    ├── public/
    └── src/
```

## Primeira execução

### 1. Backend

Abra um terminal na raiz do repositório:

```bash
cd backend
npm install
npm run db:update
npm run dev
```

O backend roda em `http://localhost:3000`.

> O banco começa limpo. A migração mais recente cria o isolamento por usuário, então cada conta vê apenas seus próprios pacientes, médicos e consultas.

### 2. Frontend

Abra outro terminal:

```bash
cd frontend
npm install
npm run dev
```

O frontend roda em `http://localhost:5173`.

## Importante

- Nunca coloque arquivos de `backend/src/routes` dentro de `frontend/src`.
- Arquivos do backend usam `express` e `prisma`.
- Arquivos do frontend usam `document`, `fetch`, `localStorage` e `common.js`.
- O `.env` do backend está ignorado pelo Git.


## Comentários no código
Os arquivos principais do backend e frontend possuem comentários curtos para identificar rotas, validações e funções importantes.

## Responsividade
A interface foi ajustada para desktop, tablet e celular. Em telas pequenas, o menu lateral vira um menu deslizante e as tabelas se transformam em cards, evitando rolagem horizontal.
