// Recupera a sessão do usuário
const token = localStorage.getItem("token");

if (!token) {
  window.location.replace("/");
}

export const usuario = JSON.parse(localStorage.getItem("usuario") || "null");

// Faz requisições autenticadas para a API
export async function apiFetch(endpoint, options = {}) {
  const headers = {
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    Authorization: `Bearer ${token}`,
    ...(options.headers || {}),
  };

  const resposta = await fetch(`/api/${endpoint}`, {
    ...options,
    headers,
  });

  if (resposta.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    window.location.replace("/");
    throw new Error("Sua sessão expirou. Entre novamente.");
  }

  const texto = await resposta.text();
  let dados = null;

  if (texto) {
    try {
      dados = JSON.parse(texto);
    } catch {
      dados = texto;
    }
  }

  if (!resposta.ok) {
    throw new Error(dados?.erro || "Não foi possível concluir a operação.");
  }

  return dados;
}

// Prepara o menu lateral para celular
function iniciarMenuResponsivo() {
  const sidebar = document.querySelector(".sidebar");
  const topbar = document.querySelector(".topbar");

  if (!sidebar || !topbar) return;

  sidebar.id = "menu-lateral";

  const botao = document.createElement("button");
  botao.type = "button";
  botao.className = "menu-mobile";
  botao.setAttribute("aria-label", "Abrir menu");
  botao.setAttribute("aria-controls", "menu-lateral");
  botao.setAttribute("aria-expanded", "false");
  botao.innerHTML = '<svg class="icon" aria-hidden="true"><use href="/mediflow-icons.svg#menu"></use></svg>';
  topbar.insertBefore(botao, topbar.firstChild);

  const overlay = document.createElement("button");
  overlay.type = "button";
  overlay.className = "menu-overlay";
  overlay.setAttribute("aria-label", "Fechar menu");
  document.body.appendChild(overlay);

  const atualizarIcone = (aberto) => {
    const use = botao.querySelector("use");
    use?.setAttribute("href", `/mediflow-icons.svg#${aberto ? "x" : "menu"}`);
    botao.setAttribute("aria-expanded", String(aberto));
    botao.setAttribute("aria-label", aberto ? "Fechar menu" : "Abrir menu");
  };

  const fechar = () => {
    document.body.classList.remove("menu-aberto");
    atualizarIcone(false);
  };

  const alternar = () => {
    const aberto = !document.body.classList.contains("menu-aberto");
    document.body.classList.toggle("menu-aberto", aberto);
    atualizarIcone(aberto);
  };

  botao.addEventListener("click", alternar);
  overlay.addEventListener("click", fechar);

  sidebar.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      if (window.innerWidth <= 760) fechar();
    });
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 760) fechar();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") fechar();
  });
}

// Adiciona rótulos às células para a tabela virar cards no celular
function iniciarTabelasResponsivas() {
  document.querySelectorAll("table").forEach((table) => {
    const atualizar = () => {
      const rotulos = [...table.querySelectorAll("thead th")].map((th) => th.textContent.trim());

      table.querySelectorAll("tbody tr").forEach((tr) => {
        [...tr.children].forEach((td, indice) => {
          if (td.classList.contains("vazio")) {
            td.removeAttribute("data-label");
            return;
          }

          td.dataset.label = rotulos[indice] || "";
        });
      });
    };

    atualizar();

    const tbody = table.querySelector("tbody");
    if (tbody) {
      new MutationObserver(atualizar).observe(tbody, {
        childList: true,
        subtree: true,
      });
    }
  });
}

// Preenche o usuário e configura o layout
export function iniciarLayout() {
  document.querySelectorAll(".nome-usuario").forEach((elemento) => {
    elemento.textContent = usuario?.nome || "Usuário";
  });

  document.querySelectorAll(".btn-sair").forEach((botao) => {
    botao.addEventListener("click", () => {
      localStorage.removeItem("token");
      localStorage.removeItem("usuario");
      window.location.replace("/");
    });
  });

  iniciarMenuResponsivo();
  iniciarTabelasResponsivas();
}

// Evita inserir HTML vindo dos dados
export function escapar(texto = "") {
  return String(texto)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// Formata data e hora para pt-BR
export function formatarData(data) {
  if (!data) return "-";
  return new Date(data).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

// Monta os ícones SVG
export function icone(nome, classe = "") {
  return `<svg class="icon ${classe}" aria-hidden="true"><use href="/mediflow-icons.svg#${nome}"></use></svg>`;
}

// Exibe mensagens rápidas na tela
export function mensagem(texto, tipo = "sucesso") {
  const toast = document.createElement("div");
  toast.className = `toast-app ${tipo}`;
  toast.textContent = texto;
  document.body.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add("mostrar"));

  setTimeout(() => {
    toast.classList.remove("mostrar");
    setTimeout(() => toast.remove(), 250);
  }, 2400);
}
