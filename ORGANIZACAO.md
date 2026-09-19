# Organização aplicada

- Backend movido para `backend/`.
- Frontend mantido integralmente em `frontend/`.
- Rotas Express/Prisma ficam apenas em `backend/src/routes/`.
- JavaScript do navegador fica apenas em `frontend/src/`.
- Banco local não é incluído no ZIP para começar vazio.
- Migrações Prisma mantidas, incluindo isolamento dos dados por usuário.
- `.env` local fica dentro de `backend/` e é ignorado pelo Git.
