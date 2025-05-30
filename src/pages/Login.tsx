import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// import { LogIn } from 'lucide-react'; // LogIn icon not used, can be removed
import { useAuth } from '../contexts/AuthContext';
// import { appConfig } from '../config/app.config'; // appConfig not used

export default function Login() {
    const navigate = useNavigate();
    // signInWithEmailPassword removed from useAuth() import
    const { loginWithGoogle, isAuthenticated } = useAuth(); 
    // formData state removed
    // handleInputChange, handleSubmit, handleForgotPassword, handleCreateAccount removed

    useEffect(() => {
        if (isAuthenticated) {
            navigate('/', { replace: true });
        }
    }, [isAuthenticated, navigate]);

    const handleGoogleSignIn = async () => {
        try {
            await loginWithGoogle();
            // Most of the Google OAuth flow is a redirect, so errors might not be caught here
            // unless the signInWithOAuth call itself fails immediately.
            // Successful login will trigger onAuthStateChange and useEffect for navigation.
        } catch (error: any) {
            console.error("Error initiating Google Sign-In:", error);
            alert(`Google Sign-In error: ${error.message || 'Unknown error'}`);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-800 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-lg shadow-lg p-8">
                <div className="flex flex-col items-center justify-center w-full"> {/* Simplified structure */}
                    <h3 className="mb-6 text-4xl font-extrabold text-dark-grey-900 dark:text-white">Entrar</h3>
                    <p className="mb-8 text-grey-700 dark:text-gray-300">Use sua conta Google para continuar.</p>
                    <button
                        type="button"
                        onClick={handleGoogleSignIn}
                        className="flex items-center justify-center w-full py-4 text-sm font-medium transition duration-300 rounded-2xl text-grey-900 bg-grey-300 hover:bg-grey-400 focus:ring-4 focus:ring-grey-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
                    >
                        <img className="h-6 mr-3" src="https://raw.githubusercontent.com/Loopple/loopple-public-assets/main/motion-tailwind/img/logos/logo-google.png" alt="Google logo" />
                        <span>Sign in with Google</span>
                    </button>
                    {/* Removed email/password form, "or" separator, forgot password, and create account links */}
                </div>
            </div>
        </div>
    );
}
