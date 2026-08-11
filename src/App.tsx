import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Index from "./pages/Index";
import PainelMigracao from "./pages/PainelMigracao";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Index />,
    errorElement: <div className="p-10 text-center">Página não encontrada</div>
  },
  {
    path: "/painel-migracao",
    element: <PainelMigracao />,
    errorElement: <div className="p-10 text-center">Erro no Painel de Migração</div>
  },
]);

const App = () => {
  return <RouterProvider router={router} />;
};

export default App;