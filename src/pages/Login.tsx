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
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/50 p-8">
                <div className="flex flex-col items-center justify-center w-full">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <h3 className="mb-3 text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">Bem-vindo</h3>
                    <p className="mb-8 text-gray-600 dark:text-gray-400 text-center leading-relaxed">Conecte-se com sua conta Google para acessar sua plataforma</p>
                    <button
                        type="button"
                        onClick={handleGoogleSignIn}
                        className="flex items-center justify-center w-full py-4 px-6 text-sm font-semibold transition-all duration-300 rounded-xl text-gray-700 bg-white border-2 border-gray-200 hover:border-gray-300 hover:shadow-lg transform hover:-translate-y-0.5 focus:ring-4 focus:ring-blue-500/20 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:border-gray-500 group"
                    >
                        <img className="h-6 mr-3 transition-transform group-hover:scale-110" src="https://raw.githubusercontent.com/Loopple/loopple-public-assets/main/motion-tailwind/img/logos/logo-google.png" alt="Google logo" />
                        <span>Continuar com Google</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
