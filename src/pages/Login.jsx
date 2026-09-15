import { useState } from "react";
import { Navigate, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { sessao, entrar } = useAuth();
  const navegar = useNavigate();
  const local = useLocation();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  // Já logado? Não precisa ver a tela de login de novo.
  if (sessao) return <Navigate to={local.state?.de || "/"} replace />;

  async function aoEnviar(evento) {
    evento.preventDefault();
    setErro("");
    setEnviando(true);
    const erroLogin = await entrar(email, senha);
    setEnviando(false);
    if (erroLogin) {
      setErro("E-mail ou senha incorretos.");
      return;
    }
    navegar("/", { replace: true });
  }

  return (
    <div className="tela-login">
      <form className="cartao-login" onSubmit={aoEnviar}>
        <h1>Donna Donno</h1>
        <p className="cartao-login__subtitulo">Painel administrativo</p>

        <label htmlFor="email">E-mail</label>
        <input
          id="email"
          type="email"
          required
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <label htmlFor="senha">Senha</label>
        <input
          id="senha"
          type="password"
          required
          autoComplete="current-password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
        />

        {erro && (
          <p className="mensagem-erro" role="alert">
            {erro}
          </p>
        )}

        <button type="submit" className="botao botao--primario" disabled={enviando}>
          {enviando ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </div>
  );
}
