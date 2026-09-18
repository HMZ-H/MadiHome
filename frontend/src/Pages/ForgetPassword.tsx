import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import Logo from '../components/Logo'


export default function ForgetPassword() {
    const [email, setEmail] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setEmail(
            event.target.value  
        )};
    
    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            const response = await fetch("http://localhost:8080/api/forgot-password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({email})
            });

            console.log("Response status:", response.status);
            console.log("Response headers:", response.headers);

            if (!response.ok) {
                const errorData = await response.json();
                console.error("Forgot password failed:", errorData);
                throw new Error(errorData.message || "Forgot password failed");
            }

            const result = await response.json();
            console.log("Forgot password successful:", result);

            // Store token to local storage
            if (result.reset_token) {
                localStorage.setItem("reset_token", result.reset_token);
            }

            // Redirect to login page

            alert("Password reset email sent successfully!");
            window.location.href = "/login";

        } catch (err) {
            console.error("Forgot password failed:", err);
            setError(err instanceof Error ? err.message : "An error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                {/* Header */}
                <Link to="/">
                    <Logo size="lg" variant="simple" className="mx-auto mb-6" />
                </Link>
                {/* Forget Password Form */}
                <form className='mt-8 space-y-6' onSubmit={handleSubmit}>
                    <div className="bg-white rounded-xl shadow-lg p-8">
                        {error && (
                            <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
                                {error}
                            </div>
                        )}
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                    Email Address
                                </label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={email}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors"
                                    placeholder="Enter your email"
                                />
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full mt-6 bg-emerald-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? "Sending..." : "Send Reset Email"}
                        </button>
                    </div>

                    {/* Back to Login Link */}
                    <div className="text-center">
                        <p className="text-gray-600">
                            Remember your password?{' '}
                            <Link to="/login" className="text-emerald-600 hover:text-emerald-700 font-semibold">
                                Sign in here
                            </Link>
                        </p>
                    </div>

                </form>
            </div>
        </div>
    )
}

