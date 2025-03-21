import { Suspense } from "react";
import { useRoutes } from "react-router-dom";
import AppRoutes from "./routes";
import routes from "tempo-routes";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { Toaster } from "./components/ui/toaster";

function App() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <ThemeProvider>
        <AuthProvider>
          {import.meta.env.VITE_TEMPO === "true" && useRoutes(routes)}
          <AppRoutes />
          <Toaster />
        </AuthProvider>
      </ThemeProvider>
    </Suspense>
  );
}

export default App;
