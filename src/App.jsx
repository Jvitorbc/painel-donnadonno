import { Routes, Route } from "react-router-dom";
import RotaProtegida from "./components/RotaProtegida";
import Topbar from "./components/Topbar";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Produtos from "./pages/Produtos";
import ProdutoForm from "./pages/ProdutoForm";
import Marcas from "./pages/Marcas";
import Categorias from "./pages/Categorias";

/** Layout comum das páginas internas: barra do topo + conteúdo da página. */
function Interno({ children }) {
  return (
    <RotaProtegida>
      <Topbar />
      <main className="conteudo-principal">{children}</main>
    </RotaProtegida>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <Interno>
            <Dashboard />
          </Interno>
        }
      />
      <Route
        path="/produtos"
        element={
          <Interno>
            <Produtos />
          </Interno>
        }
      />
      <Route
        path="/produtos/novo"
        element={
          <Interno>
            <ProdutoForm />
          </Interno>
        }
      />
      <Route
        path="/produtos/:id/editar"
        element={
          <Interno>
            <ProdutoForm />
          </Interno>
        }
      />
      <Route
        path="/marcas"
        element={
          <Interno>
            <Marcas />
          </Interno>
        }
      />
      <Route
        path="/categorias"
        element={
          <Interno>
            <Categorias />
          </Interno>
        }
      />
    </Routes>
  );
}
