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

// Payment success/cancel pages
const PaymentSuccess = () => {
  const searchParams = new URLSearchParams(window.location.search);
  const sessionId = searchParams.get("session_id");

  const [message, setMessage] = useState("Processing payment...");
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    if (sessionId) {
      const verifySession = async () => {
        try {
          // TODO: Update subscription status (primarily handled by webhooks, but client can trigger a refresh)
          await stripeService.handlePaymentSuccess(sessionId);
          setMessage("Payment Successful! Redirecting to your subscription...");
          setIsError(false);
          setTimeout(() => {
            window.location.href = "/subscription";
          }, 3000); // Redirect after 3 seconds
        } catch (error) {
          console.error("Error verifying payment session:", error);
          setMessage(
            "There was an issue verifying your payment. Please check your subscription status or contact support.",
          );
          setIsError(true);
          // Optionally, redirect to /subscription or a support page after a delay
          setTimeout(() => {
            window.location.href = "/subscription";
          }, 5000);
        }
      };
      verifySession();
    } else {
      setMessage("No session ID found. Redirecting...");
      setIsError(true);
      setTimeout(() => {
        window.location.href = "/subscription";
      }, 3000);
    }
  }, [sessionId]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center p-6">
        <h1
          className={`text-2xl font-bold mb-4 ${isError ? "text-red-600" : "text-green-600"}`}
        >
          {isError ? "Payment Verification Error" : "Payment Status"}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">{message}</p>
        {!isError && (
          <div className="mt-4 animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        )}
      </div>
    </div>
  );
};

const PaymentCancel = () => {
  useEffect(() => {
    // Redirect back to subscription page after a short delay
    const timer = setTimeout(() => {
      window.location.href = "/subscription";
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Payment Cancelled
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          You'll be redirected back to the subscription page...
        </p>
      </div>
    </div>
  );
};

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
