"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FaEnvelope, FaLock, FaSpinner, FaBaby } from "react-icons/fa";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (result?.error) {
        setError("Invalid email or password");
        setIsLoading(false);
        return;
      }

      // Redirect based on user role
      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      setError("An error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-64px)] bg-gradient-to-b from-gray-50 to-white px-4 py-8 sm:px-6 md:py-12">
      <div className="mx-auto w-full max-w-md">
        {/* Logo and Brand */}
        <div className="mb-8 flex justify-center">
          <div className="flex items-center space-x-2">
            <FaBaby className="h-8 w-8 text-violet-600" />
            <span className="bg-gradient-to-r from-violet-600 to-purple-500 bg-clip-text text-2xl font-bold text-transparent">
              ChildminderConnect
            </span>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl bg-white shadow-xl">
          {/* Form Header */}
          <div className="bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-5 text-white">
            <h1 className="text-xl font-bold leading-tight tracking-tight sm:text-2xl">
              Welcome Back
            </h1>
            <p className="mt-1 text-sm text-white/80">
              Sign in to access your account
            </p>
          </div>

          {/* Form Content */}
          <div className="p-6 sm:p-8">
            {error && (
              <div className="mb-6 rounded-md bg-red-50 p-3 text-sm text-red-600">
                <p>{error}</p>
              </div>
            )}

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Email address
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                    <FaEnvelope className="h-5 w-5" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full rounded-lg border border-gray-300 bg-white py-3 pl-12 pr-4 text-gray-900 shadow-sm transition-colors focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                    placeholder="your@email.com"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Password
                  </label>
                  <div className="text-sm">
                    <Link
                      href="/auth/forgot-password"
                      className="font-medium text-violet-600 hover:text-violet-500"
                    >
                      Forgot password?
                    </Link>
                  </div>
                </div>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                    <FaLock className="h-5 w-5" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full rounded-lg border border-gray-300 bg-white py-3 pl-12 pr-4 text-gray-900 shadow-sm transition-colors focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-5 w-5 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                />
                <label
                  htmlFor="remember-me"
                  className="ml-2 block text-sm text-gray-700"
                >
                  Remember me
                </label>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex w-full items-center justify-center rounded-lg bg-gradient-to-r from-violet-600 to-purple-600 py-3 px-4 font-medium text-white shadow-md transition-all hover:from-violet-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 disabled:opacity-70"
                >
                  {isLoading ? (
                    <>
                      <FaSpinner className="mr-2 h-5 w-5 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign in"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="mt-8 text-center">
          <div className="text-sm text-gray-600">Don't have an account?</div>
          <Link
            href="/auth/register"
            className="mt-2 inline-block font-semibold text-violet-600 hover:text-violet-500"
          >
            Create a free account
          </Link>
        </div>
      </div>
    </div>
  );
} 