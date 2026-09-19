const API_URL = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");

const authContainer = document.getElementById("authContainer");
const switchMode = document.getElementById("switchMode");
const panelTitle = document.getElementById("panelTitle");
const panelDescription = document.getElementById("panelDescription");
const panelBadge = document.getElementById("panelBadge");
const panelQuestion = document.getElementById("panelQuestion");

const loginForm = document.getElementById("loginForm");
const loginEmail = document.getElementById("loginEmail");
const loginSenha = document.getElementById("loginSenha");
const mensagemLogin = document.getElementById("mensagemLogin");
const btnEntrar = document.getElementById("btnEntrar");

const cadastroForm = document.getElementById("cadastroForm");
const cadastroNome = document.getElementById("cadastroNome");
const cadastroEmail = document.getElementById("cadastroEmail");
const cadastroSenha = document.getElementById("cadastroSenha");
const confirmarSenha = document.getElementById("confirmarSenha");
const mensagemCadastro = document.getElementById("mensagemCadastro");
const btnCadastrar = document.getElementById("btnCadastrar");

const mobileIrCadastro = document.getElementById("mobileIrCadastro");
const mobileIrLogin = document.getElementById("mobileIrLogin");

// Controla login e cadastro
let modoCadastro = false;

// Alterna entre as telas de login e cadastro
function atualizarModo() {
  if (modoCadastro) {
    authContainer.classList.add("cadastro-ativo");
    panelBadge.textContent = "Acesso MediFlow";
    panelTitle.textContent = "Que bom ter você por aqui.";
    panelDescription.textContent = "Se você já possui uma conta, entre novamente e continue gerenciando sua clínica.";
    panelQuestion.textContent = "Já possui uma conta?";
    switchMode.textContent = "Entrar";
  } else {
    authContainer.classList.remove("cadastro-ativo");
    panelBadge.textContent = "Gestão médica inteligente";
    panelTitle.textContent = "Sua clínica organizada em um só lugar.";
    panelDescription.textContent = "Gerencie pacientes, médicos e consultas através de uma plataforma simples, segura e moderna.";
    panelQuestion.textContent = "Ainda não possui uma conta?";
    switchMode.textContent = "Cadastre-se";
  }
}

async function lerResposta(resposta) {
  const texto = await resposta.text();

  if (!texto) return null;

  try {
    return JSON.parse(texto);
  } catch {
    throw new Error(
      resposta.ok
        ? "A API respondeu em um formato inesperado."
        : "Não foi possível comunicar com o servidor."
    );
  }
}

function limparMensagem(elemento) {
  elemento.className = "mensagem";
  elemento.textContent = "";
}

function limparMensagens() {
  limparMensagem(mensagemLogin);
  limparMensagem(mensagemCadastro);
}

// Exibe mensagens nos formulários
function mostrarMensagem(elemento, texto, tipo) {
  elemento.className = `mensagem ${tipo}`;
  elemento.textContent = texto;
}

function irParaCadastro() {
  modoCadastro = true;
  limparMensagens();
  atualizarModo();
}

function irParaLogin() {
  modoCadastro = false;
  limparMensagens();
  atualizarModo();
}

switchMode.addEventListener("click", () => {
  modoCadastro = !modoCadastro;
  limparMensagens();
  atualizarModo();
});
mobileIrCadastro.addEventListener("click", irParaCadastro);
mobileIrLogin.addEventListener("click", irParaLogin);

// Mostrar ou ocultar senha
document.querySelectorAll(".show-password").forEach((botao) => {
  botao.addEventListener("click", () => {
    const campo = document.getElementById(botao.dataset.target);
    const exibindo = campo.type === "text";
    campo.type = exibindo ? "password" : "text";
    botao.textContent = exibindo ? "Mostrar" : "Ocultar";
  });
});

// Enviar login
loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  limparMensagem(mensagemLogin);

  const email = loginEmail.value.trim();
  const senha = loginSenha.value;

  if (!email || !senha) {
    mostrarMensagem(mensagemLogin, "Preencha o e-mail e a senha.", "erro");
    return;
  }

  try {
    btnEntrar.disabled = true;
    btnEntrar.textContent = "Entrando...";

    const resposta = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, senha }),
    });

    const dados = await lerResposta(resposta);
    if (!resposta.ok) throw new Error(dados?.erro || "Não foi possível realizar o login.");

    localStorage.setItem("token", dados.token);
    localStorage.setItem("usuario", JSON.stringify(dados.usuario));
    window.location.replace("/dashboard.html");
  } catch (erro) {
    mostrarMensagem(mensagemLogin, erro.message, "erro");
  } finally {
    btnEntrar.disabled = false;
    btnEntrar.textContent = "Entrar";
  }
});

// Cadastrar nova conta
cadastroForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  limparMensagem(mensagemCadastro);

  const nome = cadastroNome.value.trim();
  const email = cadastroEmail.value.trim();
  const senha = cadastroSenha.value;
  const senhaConfirmada = confirmarSenha.value;

  if (!nome || !email || !senha || !senhaConfirmada) {
    mostrarMensagem(mensagemCadastro, "Preencha todos os campos.", "erro");
    return;
  }
  if (senha !== senhaConfirmada) {
    mostrarMensagem(mensagemCadastro, "As senhas não coincidem.", "erro");
    return;
  }
  if (senha.length < 6) {
    mostrarMensagem(mensagemCadastro, "A senha precisa ter pelo menos 6 caracteres.", "erro");
    return;
  }

  try {
    btnCadastrar.disabled = true;
    btnCadastrar.textContent = "Criando conta...";

    const resposta = await fetch(`${API_URL}/usuarios`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, email, senha }),
    });

    const dados = await lerResposta(resposta);
    if (!resposta.ok) throw new Error(dados?.erro || "Não foi possível criar sua conta.");

    mostrarMensagem(mensagemCadastro, "Conta criada com sucesso!", "sucesso");
    loginEmail.value = email;
    cadastroForm.reset();

    setTimeout(() => {
      irParaLogin();
      loginSenha.focus();
    }, 450);
  } catch (erro) {
    mostrarMensagem(mensagemCadastro, erro.message, "erro");
  } finally {
    btnCadastrar.disabled = false;
    btnCadastrar.textContent = "Criar conta";
  }
});

atualizarModo();
