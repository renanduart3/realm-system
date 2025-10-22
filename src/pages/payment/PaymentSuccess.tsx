import { useEffect, useState } from "react";
import { stripeService } from "../../services/payment/StripeService";
import { systemConfigService } from "../../services/systemConfigService";
import { useAuth } from "../../contexts/AuthContext";

const PaymentSuccess = () => {
  const { refreshSubscription } = useAuth();
  const searchParams = new URLSearchParams(window.location.search);
  const sessionId = searchParams.get("session_id");

  const [message, setMessage] = useState("Processing payment...");
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    if (sessionId) {
      const verifySession = async () => {
        try {
          await stripeService.handlePaymentSuccess(sessionId);
          await refreshSubscription(); // Refresh subscription status
          // Mark system configured after successful payment
          try {
            const cfg = await systemConfigService.getConfig();
            if (cfg && !cfg.is_configured) {
              await systemConfigService.saveConfig({ id: 'system-config', is_configured: true, configured_at: new Date().toISOString() } as any);
            }
          } catch (e) {
            console.error('Failed to mark system configured after payment:', e);
          }
          setMessage("Payment Successful! Redirecting to your subscription...");
          setIsError(false);
          setTimeout(() => {
            window.location.href = "/subscription";
          }, 3000);
        } catch (error) {
          console.error("Error verifying payment session:", error);
          setMessage(
            "There was an issue verifying your payment. Please check your subscription status or contact support.",
          );
          setIsError(true);
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

export default PaymentSuccess;
