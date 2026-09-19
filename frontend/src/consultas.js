import { apiFetch, iniciarLayout, mensagem, escapar, formatarData, icone } from "./common.js";

iniciarLayout();

const form = document.getElementById("formConsulta");
const consultaId = document.getElementById("consultaId");
const pacienteId = document.getElementById("pacienteId");
const medicoId = document.getElementById("medicoId");
const data = document.getElementById("data");
const status = document.getElementById("status");
const lista = document.getElementById("listaConsultas");
let consultas = [];
let dataOriginalEdicao = null;

// Definir status ao cadastrar uma nova consulta
function statusNovaConsulta() {
  status.innerHTML = '<option value="AGENDADA">AGENDADA</option>';
  status.value = "AGENDADA";
  status.disabled = true;
}

// Liberar todos os status ao editar uma consulta
function statusEditarConsulta(statusAtual) {
  status.disabled = false;
  status.innerHTML = `
    <option value="AGENDADA">AGENDADA</option>
    <option value="CONCLUIDA">CONCLUÍDA</option>
    <option value="CANCELADA">CANCELADA</option>
  `;
  status.value = statusAtual;
}

statusNovaConsulta();

// Formatar data para o campo de horário
function formatarDataHoraLocal(valor = new Date()) {
  const d = valor instanceof Date ? valor : new Date(valor);
  const ano = d.getFullYear();
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  const hora = String(d.getHours()).padStart(2, "0");
  const minuto = String(d.getMinutes()).padStart(2, "0");
  return `${ano}-${mes}-${dia}T${hora}:${minuto}`;
}

// Bloquear horários anteriores ao atual
function atualizarHorarioMinimo() {
  if (!consultaId.value) data.min = formatarDataHoraLocal();
  else data.removeAttribute("min");
}

atualizarHorarioMinimo();
data.addEventListener("focus", atualizarHorarioMinimo);

// Carregar pacientes, médicos e consultas
async function carregarTudo() {
  try {
    const [pacientes, medicos, dadosConsultas] = await Promise.all([
      apiFetch("pacientes"), apiFetch("medicos"), apiFetch("consultas"),
    ]);
    consultas = dadosConsultas;

    pacienteId.innerHTML = '<option value="">Selecione o paciente</option>' + pacientes.map((p) => `<option value="${p.id}">${escapar(p.nome)}</option>`).join("");
    medicoId.innerHTML = '<option value="">Selecione o médico</option>' + medicos.map((m) => `<option value="${m.id}">${escapar(m.nome)} - ${escapar(m.especialidade)}</option>`).join("");
    renderizar();
  } catch (erro) {
    mensagem(erro.message, "erro");
  }
}

// Mostrar consultas na tabela
function renderizar() {
  if (!consultas.length) {
    lista.innerHTML = '<tr><td colspan="6" class="vazio">Nenhuma consulta cadastrada.</td></tr>';
    return;
  }

  lista.innerHTML = [...consultas]
    .sort((a, b) => new Date(b.data) - new Date(a.data))
    .map((consulta) => `
      <tr>
        <td>${escapar(consulta.paciente?.nome || "-")}</td>
        <td>${escapar(consulta.medico?.nome || "-")}</td>
        <td>${escapar(consulta.medico?.especialidade || "-")}</td>
        <td>${formatarData(consulta.data)}</td>
        <td><span class="status ${String(consulta.status).toLowerCase()}">${escapar(consulta.status)}</span></td>
        <td><div class="acoes">
          <button class="btn btn-editar" type="button" data-editar="${consulta.id}">${icone("edit")}<span>Editar</span></button>
          <button class="btn btn-excluir" type="button" data-excluir="${consulta.id}">${icone("trash")}<span>Excluir</span></button>
        </div></td>
      </tr>
    `).join("");
}

// Salvar ou editar consulta
form.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!pacienteId.value) return mensagem("Selecione um paciente.", "erro");
  if (!medicoId.value) return mensagem("Selecione um médico.", "erro");
  if (!data.value) return mensagem("Informe a data e o horário da consulta.", "erro");

  const dataSelecionada = new Date(data.value);
  const agora = new Date();
  if (Number.isNaN(dataSelecionada.getTime())) return mensagem("Informe uma data válida.", "erro");

  if (!consultaId.value && dataSelecionada <= agora) {
    mensagem("Não é possível agendar uma consulta em uma data ou horário que já passou.", "erro");
    atualizarHorarioMinimo();
    return;
  }

  if (consultaId.value && dataSelecionada <= agora && data.value !== dataOriginalEdicao) {
    mensagem("Não é possível alterar a consulta para uma data ou horário que já passou.", "erro");
    return;
  }

  const payload = {
    data: dataSelecionada.toISOString(),
    pacienteId: Number(pacienteId.value),
    medicoId: Number(medicoId.value),
  };

  try {
    if (consultaId.value) {
      await apiFetch(`consultas/${consultaId.value}`, {
        method: "PUT",
        body: JSON.stringify({ ...payload, status: status.value }),
      });
      mensagem("Consulta atualizada com sucesso.");
    } else {
      await apiFetch("consultas", { method: "POST", body: JSON.stringify(payload) });
      mensagem("Consulta agendada com sucesso.");
    }
    limpar();
    await carregarTudo();
  } catch (erro) {
    mensagem(erro.message, "erro");
  }
});

// Editar ou excluir consulta
lista.addEventListener("click", async (event) => {
  const botao = event.target.closest("button");
  if (!botao) return;

  const editar = botao.dataset.editar;
  const excluir = botao.dataset.excluir;

  if (editar) {
    const consulta = consultas.find((item) => item.id === Number(editar));
    if (!consulta) return;
    consultaId.value = consulta.id;
    pacienteId.value = consulta.pacienteId;
    medicoId.value = consulta.medicoId;
    statusEditarConsulta(consulta.status);
    data.value = formatarDataHoraLocal(consulta.data);
    dataOriginalEdicao = data.value;
    document.getElementById("tituloForm").textContent = "Editar consulta";
    atualizarHorarioMinimo();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (excluir) {
    if (!confirm("Deseja realmente excluir esta consulta?")) return;
    try {
      await apiFetch(`consultas/${excluir}`, { method: "DELETE" });
      mensagem("Consulta excluída com sucesso.");
      await carregarTudo();
    } catch (erro) {
      mensagem(erro.message, "erro");
    }
  }
});

// Limpar formulário
function limpar() {
  form.reset();
  consultaId.value = "";
  dataOriginalEdicao = null;
  statusNovaConsulta();
  document.getElementById("tituloForm").textContent = "Agendar consulta";
  atualizarHorarioMinimo();
}

document.getElementById("btnCancelar").addEventListener("click", limpar);
carregarTudo();
