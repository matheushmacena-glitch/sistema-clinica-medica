import { apiFetch, iniciarLayout, escapar, formatarData } from "./common.js";

iniciarLayout();

// Carrega os dados do dashboard
async function carregarDashboard() {
  const tbody = document.getElementById("consultasRecentes");

  try {
    const [pacientes, medicos, consultas] = await Promise.all([
      apiFetch("pacientes"),
      apiFetch("medicos"),
      apiFetch("consultas"),
    ]);

    document.getElementById("totalPacientes").textContent = pacientes.length;
    document.getElementById("totalMedicos").textContent = medicos.length;
    document.getElementById("totalConsultas").textContent = consultas.length;

    // Separa as cinco consultas mais recentes
    const recentes = [...consultas]
      .sort((a, b) => new Date(b.data) - new Date(a.data))
      .slice(0, 5);

    if (!recentes.length) {
      tbody.innerHTML = '<tr><td colspan="4" class="vazio">Nenhuma consulta cadastrada.</td></tr>';
      return;
    }

    tbody.innerHTML = recentes.map((consulta) => `
      <tr>
        <td>${escapar(consulta.paciente?.nome || "-")}</td>
        <td>${escapar(consulta.medico?.nome || "-")}</td>
        <td>${formatarData(consulta.data)}</td>
        <td><span class="status ${String(consulta.status).toLowerCase()}">${escapar(consulta.status)}</span></td>
      </tr>
    `).join("");
  } catch (erro) {
    tbody.innerHTML = `<tr><td colspan="4" class="vazio">${escapar(erro.message)}</td></tr>`;
  }
}

carregarDashboard();
