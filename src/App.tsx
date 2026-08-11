import { createBrowserRouter } from "react-router-dom";
import Index from "./pages/Index";
import PainelMigracao from "./pages/PainelMigracao";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Index />,
  },
  {
    path: "/painel-migracao",
    element: <PainelMigracao />,
  },
]);
