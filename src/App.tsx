import { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ToastProvider } from "./contexts/ToastContext";
import { AuthProvider } from "./contexts/AuthContext";
import { mockDataService } from "./services/mockDataService";
import { systemConfigService } from "./services/systemConfigService";
import { stripeService } from "./services/payment/StripeService";
import Layout from "./components/Layout";
import PaymentSuccess from "./pages/payment/PaymentSuccess";
import PaymentCancel from "./pages/payment/PaymentCancel";
import Dashboard from "./pages/Dashboard";
import Sales from "./pages/Sales";
import Clients from "./pages/Clients";
import PersonClientManager from "./components/PersonClientManager";
import Products from "./pages/Products";
import Settings from "./pages/Settings";
import Expenses from "./pages/Expenses";
import ComponentsTest from "./pages/ComponentsTest";
import FullSale from "./pages/FullSale";
import Login from "./pages/Login";
import Income from "./pages/Income";
import SetupWizard from "./pages/SetupWizard";
import SubscriptionStatus from "./pages/SubscriptionStatus";
import Preloader from "./components/Preloader";


function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log("Starting app initialization...");

        // Initialize mock data when the app starts
        try {
          await mockDataService.initializeMockData();
          console.log("Mock data initialized successfully");
        } catch (mockError) {
          console.error("Failed to initialize mock data:", mockError);
          // Continue initialization even if mock data fails
        }

        // Check if system is configured
        try {
          const config = await systemConfigService.getConfig();
          const configured = config?.is_configured || false;
          setIsConfigured(configured);
          console.log("System configuration checked:", configured);

          // Se não estiver configurado e não estiver na página de setup, redireciona
          if (!configured && window.location.pathname !== "/setup") {
            console.log("System not configured, redirecting to setup...");
            window.location.href = "/setup";
            return; // Exit early to prevent further initialization
          }
        } catch (configError) {
          console.error("Failed to check system config:", configError);
          // If config check fails or database doesn't exist (after reset), assume not configured
          setIsConfigured(false);
          if (window.location.pathname !== "/setup") {
            console.log("Config check failed, redirecting to setup...");
            window.location.href = "/setup";
            return; // Exit early to prevent further initialization
          }
        }

        // Simulate minimum loading time for better UX
        await new Promise((resolve) => setTimeout(resolve, 1000));
        console.log("App initialization completed");
      } catch (error) {
        console.error("Critical error during app initialization:", error);
        // Even on critical error, we should stop loading
        setIsConfigured(false);
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  if (isLoading) {
    return <Preloader />;
  }

  return (
    <Router>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <Routes>
              {/* Routes without Layout (no navbar/sidebar) */}
              <Route path="/login" element={<Login />} />
              <Route path="/setup" element={<SetupWizard />} />
              <Route path="/payment/success" element={<PaymentSuccess />} />
              <Route path="/payment/cancel" element={<PaymentCancel />} />
              
              {/* Routes with Layout (with navbar/sidebar) */}
              <Route path="/*" element={
                <Layout>
                  <Routes>
                    <Route
                      path="/"
                      element={
                        !isConfigured ? (
                          <Navigate to="/setup" replace />
                        ) : (
                          <Dashboard />
                        )
                      }
                    />
                    <Route
                      path="/sales"
                      element={
                        !isConfigured ? <Navigate to="/setup" replace /> : <Sales />
                      }
                    />
                    <Route
                      path="/sales/full"
                      element={
                        !isConfigured ? (
                          <Navigate to="/setup" replace />
                        ) : (
                          <FullSale />
                        )
                      }
                    />
                    <Route
                      path="/expenses"
                      element={
                        !isConfigured ? (
                          <Navigate to="/setup" replace />
                        ) : (
                          <Expenses />
                        )
                      }
                    />
                    <Route
                      path="/products"
                      element={
                        !isConfigured ? (
                          <Navigate to="/setup" replace />
                        ) : (
                          <Products />
                        )
                      }
                    />
                    <Route
                      path="/settings"
                      element={
                        !isConfigured ? (
                          <Navigate to="/setup" replace />
                        ) : (
                          <Settings />
                        )
                      }
                    />
                    <Route
                      path="/componentes"
                      element={
                        !isConfigured ? (
                          <Navigate to="/setup" replace />
                        ) : (
                          <ComponentsTest />
                        )
                      }
                    />
                    <Route
                      path="/persons"
                      element={
                        !isConfigured ? (
                          <Navigate to="/setup" replace />
                        ) : (
                          <PersonClientManager />
                        )
                      }
                    />
                    <Route
                      path="/clients"
                      element={
                        !isConfigured ? (
                          <Navigate to="/setup" replace />
                        ) : (
                          <Clients />
                        )
                      }
                    />
                    <Route
                      path="/income"
                      element={
                        !isConfigured ? (
                          <Navigate to="/setup" replace />
                        ) : (
                          <Income />
                        )
                      }
                    />
                    <Route
                      path="/subscription"
                      element={
                        !isConfigured ? (
                          <Navigate to="/setup" replace />
                        ) : (
                          <SubscriptionStatus />
                        )
                      }
                    />
                  </Routes>
                </Layout>
              } />
            </Routes>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
