import React from 'react'
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Logo from '../components/Logo';
import { Link } from 'react-router-dom';


export default function ResetPassword() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleReset = async (event: React.FormEvent) => {
        event.preventDefault();

        if (newPassword !== confirmPassword) {
            alert("Passwords do not match");
            return;
        }
        
        try {
            setIsLoading(true);

            if (!token) {
                setError("Invalid or expired reset link");
                return;
            }

            const response = await fetch(`http://localhost:8080/api/reset-password/${encodeURIComponent(token)}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ new_password: newPassword }),
            });

            const result = await response.json();

            if (result.success) {
                alert("Password reset successfully");
                navigate("/login");
            } else {
                alert(result.message || "Invalid or expired reset link");
            }

        } catch (err) {
            console.error("Reset password failed:", err);
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
                

                {/* Reset Password Form */}
                <h2 className="text-3xl font-bold text-gray-800">Reset Your Password</h2>

                {!token ? (
                    <p className="text-red-600 text-center">Invalid or expired reset link</p>

                ): (
                    <form onSubmit={handleReset}>
                        <div className="bg-white rounded-xl shadow-lg p-8">
                            <label htmlFor="" className="block text-gray-700 font-medium mb-2">
                                New Password
                            </label>
                            <input
                                id="newPassword"
                                name="newPassword"
                                type="password"
                                required
                                value={newPassword}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg  focus:ring-emerald-500 focus:border-transparent transition-colors"
                                onChange={(e) => setNewPassword(e.target.value)}
                            />
                        
                        <div className="mb-4">
                            <label htmlFor="" className="block text-gray-700 font-medium mb-2">
                                Confirm Password
                            </label>
                            <input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                required
                                value={confirmPassword}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg  focus:ring-emerald-500 focus:border-transparent transition-colors"
                                onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full mt-6 bg-emerald-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? "Resetting..." : "Reset Password"}
                        </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    )

}