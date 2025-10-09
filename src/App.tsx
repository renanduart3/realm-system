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
      setIsLoading(true);
      try {
        console.log("Starting app initialization...");

        // Check if system is configured first
        const config = await systemConfigService.getConfig();
        const configured = !!config?.is_configured;
        setIsConfigured(configured);
        console.log("System configuration checked:", configured);

        if (!configured) {
          if (window.location.pathname !== "/setup") {
            console.log("System not configured, redirecting to setup...");
            window.location.href = "/setup";
            return;
          }
        } else {
          // If configured, then initialize mock data if in dev mode
          await mockDataService.initializeMockData();
          console.log("Mock data initialization attempted.");
        }
      } catch (error) {
        console.error("Critical error during app initialization:", error);
        setIsConfigured(false);
        if (window.location.pathname !== "/setup") {
          window.location.href = "/setup";
          return;
        }
      } finally {
        // Add a small delay to prevent screen flickering
        setTimeout(() => setIsLoading(false), 500);
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
