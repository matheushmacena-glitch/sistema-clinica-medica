import { apiFetch, iniciarLayout, mensagem, escapar, icone } from "./common.js";

iniciarLayout();

const form = document.getElementById("formPaciente");
const id = document.getElementById("pacienteId");
const nome = document.getElementById("nome");
const cpf = document.getElementById("cpf");
const telefone = document.getElementById("telefone");
const email = document.getElementById("email");
const dataNascimento = document.getElementById("dataNascimento");
const cep = document.getElementById("cep");
const endereco = document.getElementById("endereco");
const lista = document.getElementById("listaPacientes");
const busca = document.getElementById("busca");
let pacientes = [];

// Retorna a data atual para o calendário
function dataLocalHoje() {
  const agora = new Date();
  const ano = agora.getFullYear();
  const mes = String(agora.getMonth() + 1).padStart(2, "0");
  const dia = String(agora.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

dataNascimento.max = dataLocalHoje();

// Carregar pacientes
async function carregar() {
  try {
    pacientes = await apiFetch("pacientes");
    renderizar(pacientes);
  } catch (erro) {
    mensagem(erro.message, "erro");
  }
}

// Mostrar pacientes na tabela
function renderizar(dados) {
  if (!dados.length) {
    lista.innerHTML = '<tr><td colspan="5" class="vazio">Nenhum paciente encontrado.</td></tr>';
    return;
  }

  lista.innerHTML = dados.map((paciente) => `
    <tr>
      <td>${escapar(paciente.nome)}</td>
      <td>${escapar(paciente.cpf)}</td>
      <td>${escapar(paciente.telefone || "-")}</td>
      <td>${escapar(paciente.email || "-")}</td>
      <td><div class="acoes">
        <button class="btn btn-editar" type="button" data-editar="${paciente.id}">${icone("edit")}<span>Editar</span></button>
        <button class="btn btn-excluir" type="button" data-excluir="${paciente.id}">${icone("trash")}<span>Excluir</span></button>
      </div></td>
    </tr>
  `).join("");
}

// Salvar ou editar paciente
form.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (dataNascimento.value && dataNascimento.value > dataLocalHoje()) {
    mensagem("A data de nascimento não pode estar no futuro.", "erro");
    return;
  }
  if (!nome.value.trim()) return mensagem("Informe o nome do paciente.", "erro");
  if (!cpf.value.trim()) return mensagem("Informe o CPF do paciente.", "erro");

  const dados = {
    nome: nome.value.trim(),
    cpf: cpf.value.trim(),
    telefone: telefone.value.trim() || null,
    email: email.value.trim() || null,
    dataNascimento: dataNascimento.value ? `${dataNascimento.value}T12:00:00.000Z` : null,
  };

  try {
    if (id.value) {
      await apiFetch(`pacientes/${id.value}`, { method: "PUT", body: JSON.stringify(dados) });
      mensagem("Paciente atualizado com sucesso.");
    } else {
      await apiFetch("pacientes", { method: "POST", body: JSON.stringify(dados) });
      mensagem("Paciente cadastrado com sucesso.");
    }
    limpar();
    await carregar();
  } catch (erro) {
    mensagem(erro.message, "erro");
  }
});

// Editar ou excluir paciente
lista.addEventListener("click", async (event) => {
  const botao = event.target.closest("button");
  if (!botao) return;

  const editar = botao.dataset.editar;
  const excluir = botao.dataset.excluir;

  if (editar) {
    const paciente = pacientes.find((item) => item.id === Number(editar));
    if (!paciente) return;
    id.value = paciente.id;
    nome.value = paciente.nome;
    cpf.value = paciente.cpf;
    telefone.value = paciente.telefone || "";
    email.value = paciente.email || "";
    dataNascimento.value = paciente.dataNascimento ? paciente.dataNascimento.slice(0, 10) : "";
    document.getElementById("tituloForm").textContent = "Editar paciente";
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (excluir) {
    if (!confirm("Deseja realmente excluir este paciente?")) return;
    try {
      await apiFetch(`pacientes/${excluir}`, { method: "DELETE" });
      mensagem("Paciente excluído com sucesso.");
      await carregar();
    } catch (erro) {
      mensagem(erro.message, "erro");
    }
  }
});

// Filtrar pacientes pelo nome
busca.addEventListener("input", () => {
  const termo = busca.value.trim().toLowerCase();
  renderizar(pacientes.filter((paciente) => paciente.nome.toLowerCase().includes(termo)));
});

document.getElementById("btnCancelar").addEventListener("click", limpar);

// Limpar formulário
function limpar() {
  form.reset();
  id.value = "";
  endereco.value = "";
  dataNascimento.max = dataLocalHoje();
  document.getElementById("tituloForm").textContent = "Novo paciente";
}

// Formatar CEP
cep.addEventListener("input", () => {
  const numeros = cep.value.replace(/\D/g, "").slice(0, 8);
  cep.value = numeros.length > 5 ? `${numeros.slice(0, 5)}-${numeros.slice(5)}` : numeros;
});

// Consultar endereço no ViaCEP
cep.addEventListener("blur", async () => {
  const valor = cep.value.replace(/\D/g, "");
  if (!valor) { endereco.value = ""; return; }
  if (valor.length !== 8) { endereco.value = "CEP inválido."; return; }

  endereco.value = "Consultando CEP...";
  try {
    const resposta = await fetch(`https://viacep.com.br/ws/${valor}/json/`);
    if (!resposta.ok) throw new Error();
    const dados = await resposta.json();
    if (dados.erro) { endereco.value = "CEP não encontrado."; return; }
    const partes = [dados.logradouro, dados.bairro].filter(Boolean).join(", ");
    endereco.value = `${partes}${partes ? " - " : ""}${dados.localidade}/${dados.uf}`;
  } catch {
    endereco.value = "Erro ao consultar o CEP.";
  }
});

carregar();
