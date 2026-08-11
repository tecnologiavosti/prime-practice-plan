import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Index from "./pages/Index";
import PainelMigracao from "./pages/PainelMigracao";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Index />,
  },
  {
    path: "/painel-migracao",
    element: <PainelMigracao />,
  },
]);

const App = () => {
  return <RouterProvider router={router} />;
};

export default App;