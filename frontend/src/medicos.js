import { apiFetch, iniciarLayout, mensagem, escapar, icone } from "./common.js";

iniciarLayout();

const form = document.getElementById("formMedico");
const id = document.getElementById("medicoId");
const nome = document.getElementById("nome");
const crm = document.getElementById("crm");
const especialidade = document.getElementById("especialidade");
const lista = document.getElementById("listaMedicos");
let medicos = [];

// Carregar médicos
async function carregar() {
  try {
    medicos = await apiFetch("medicos");
    renderizar();
  } catch (erro) {
    mensagem(erro.message, "erro");
  }
}

// Mostrar médicos na tabela
function renderizar() {
  if (!medicos.length) {
    lista.innerHTML = '<tr><td colspan="4" class="vazio">Nenhum médico cadastrado.</td></tr>';
    return;
  }

  lista.innerHTML = medicos.map((medico) => `
    <tr>
      <td>${escapar(medico.nome)}</td>
      <td>${escapar(medico.crm)}</td>
      <td>${escapar(medico.especialidade)}</td>
      <td><div class="acoes">
        <button class="btn btn-editar" type="button" data-editar="${medico.id}">${icone("edit")}<span>Editar</span></button>
        <button class="btn btn-excluir" type="button" data-excluir="${medico.id}">${icone("trash")}<span>Excluir</span></button>
      </div></td>
    </tr>
  `).join("");
}

// Salvar ou editar médico
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const dados = {
    nome: nome.value.trim(),
    crm: crm.value.trim(),
    especialidade: especialidade.value.trim(),
  };

  if (!dados.nome || !dados.crm || !dados.especialidade) {
    mensagem("Preencha nome, CRM e especialidade.", "erro");
    return;
  }

  try {
    if (id.value) {
      await apiFetch(`medicos/${id.value}`, { method: "PUT", body: JSON.stringify(dados) });
      mensagem("Médico atualizado com sucesso.");
    } else {
      await apiFetch("medicos", { method: "POST", body: JSON.stringify(dados) });
      mensagem("Médico cadastrado com sucesso.");
    }
    limpar();
    await carregar();
  } catch (erro) {
    mensagem(erro.message, "erro");
  }
});

// Editar ou excluir médico
lista.addEventListener("click", async (event) => {
  const botao = event.target.closest("button");
  if (!botao) return;

  const editar = botao.dataset.editar;
  const excluir = botao.dataset.excluir;

  if (editar) {
    const medico = medicos.find((item) => item.id === Number(editar));
    if (!medico) return;
    id.value = medico.id;
    nome.value = medico.nome;
    crm.value = medico.crm;
    especialidade.value = medico.especialidade;
    document.getElementById("tituloForm").textContent = "Editar médico";
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (excluir) {
    if (!confirm("Deseja realmente excluir este médico?")) return;
    try {
      await apiFetch(`medicos/${excluir}`, { method: "DELETE" });
      mensagem("Médico excluído com sucesso.");
      await carregar();
    } catch (erro) {
      mensagem(erro.message, "erro");
    }
  }
});

// Limpar formulário
function limpar() {
  form.reset();
  id.value = "";
  document.getElementById("tituloForm").textContent = "Novo médico";
}

document.getElementById("btnCancelar").addEventListener("click", limpar);
carregar();
