import { useEffect } from "react";

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

export default PaymentCancel;