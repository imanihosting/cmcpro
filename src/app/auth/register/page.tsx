"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User_role } from "@prisma/client";
import { signIn } from "next-auth/react";
import { 
  FaUser, 
  FaEnvelope, 
  FaLock, 
  FaSpinner, 
  FaUserShield, 
  FaBaby, 
  FaPhone, 
  FaMapMarkerAlt, 
  FaEuroSign,
  FaExclamationTriangle,
  FaShieldAlt,
  FaCheck,
  FaInfoCircle
} from "react-icons/fa";
import {
  inputWithIconClass,
  textareaClass,
  textareaWithIconClass,
  checkboxClass
} from '@/components/ui/InputStyles';
import Logo from "@/components/Logo";
import { useSession } from "next-auth/react";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [city, setCity] = useState("");
  const [county, setCounty] = useState("");
  const [eircode, setEircode] = useState("");
  const [rate, setRate] = useState("");
  const [role, setRole] = useState<User_role>(User_role.parent);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSafetyNotice, setShowSafetyNotice] = useState(false);
  const { status } = useSession();

  // Show safety notice when parent role is selected
  useEffect(() => {
    setShowSafetyNotice(role === User_role.parent);
  }, [role]);

  // If user is already logged in, redirect to dashboard
  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/dashboard');
    }
  }, [status, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    try {
      // Create form data based on role
      const formData: any = {
        name,
        email,
        password,
        role,
      };

      // Add childminder specific fields
      if (role === User_role.childminder) {
        if (!phone || !streetAddress || !city || !county || !rate) {
          setError("Please fill in all required fields");
          setIsLoading(false);
          return;
        }
        formData.phone = phone;
        formData.address = {
          streetAddress,
          city,
          county,
          eircode
        };
        formData.rate = parseFloat(rate);
      }

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Something went wrong");
      }

      // Use NextAuth's signIn instead of custom API login
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password
      });

      if (result?.ok) {
        // Wait for the session to be fully established before redirecting
        console.log("Login successful, preparing to redirect...");
        
        // Force a delay to ensure the session is properly established
        await new Promise((resolve) => setTimeout(resolve, 1000));
        
        // Use the redirect URL from the API response
        window.location.href = data.redirectUrl || "/dashboard";
      } else {
        // If auto-login fails, redirect to login page
        router.push("/auth/login?registered=true");
      }
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("An error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gradient-to-b from-gray-50 to-white px-4 py-8 sm:px-6 md:py-12">
      <div className="mx-auto max-w-2xl">
        <div className="text-center">
          <div className="mb-6 flex justify-center">
            <Logo />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900">Create your account</h1>
        </div>

        <div className="overflow-hidden rounded-xl bg-white shadow-lg border border-gray-200">
          {/* Form Header */}
          <div className="bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-5 text-white">
            <h1 className="text-xl font-bold leading-tight tracking-tight sm:text-2xl">
              Create Your Account
            </h1>
            <p className="mt-1 text-sm text-white/90">
              Join our community of parents and childminders
            </p>
          </div>

          {/* Role Selection */}
          <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
            <div className="flex flex-col space-y-2 sm:flex-row sm:space-x-4 sm:space-y-0">
              <button
                type="button"
                className={`flex flex-1 items-center justify-center space-x-2 rounded-lg px-4 py-3 text-center text-sm font-medium transition-all ${
                  role === User_role.parent
                    ? "bg-violet-600 text-white shadow-md"
                    : "bg-white text-gray-700 shadow-sm hover:bg-gray-100"
                }`}
                onClick={() => setRole(User_role.parent)}
              >
                <FaUser className={role === User_role.parent ? "text-white" : "text-violet-600"} />
                <span>I'm a Parent</span>
              </button>
              <button
                type="button"
                className={`flex flex-1 items-center justify-center space-x-2 rounded-lg px-4 py-3 text-center text-sm font-medium transition-all ${
                  role === User_role.childminder
                    ? "bg-violet-600 text-white shadow-md"
                    : "bg-white text-gray-700 shadow-sm hover:bg-gray-100"
                }`}
                onClick={() => setRole(User_role.childminder)}
              >
                <FaUserShield className={role === User_role.childminder ? "text-white" : "text-violet-600"} />
                <span>I'm a Childminder</span>
              </button>
            </div>
          </div>

          {/* Form Content */}
          <div className="p-6 sm:p-8">
            {error && (
              <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-600 border border-red-200 shadow-sm">
                <div className="flex items-center">
                  <FaExclamationTriangle className="mr-2 h-5 w-5 text-red-500" />
                  <p className="font-medium">{error}</p>
                </div>
              </div>
            )}

            {/* Safety Warning for Parents */}
            {showSafetyNotice && (
              <div className="mb-6 rounded-lg bg-yellow-50 p-4 text-sm border border-yellow-200 shadow-sm">
                <div className="flex">
                  <div className="mr-3 flex-shrink-0">
                    <FaShieldAlt className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <h3 className="mb-1 font-semibold text-yellow-800">Important Safety Notice</h3>
                    <p className="text-yellow-700">
                      While we provide tools for verification, parents are responsible for verifying childminders' credentials, including:
                    </p>
                    <ul className="mt-2 list-inside list-disc space-y-1 text-yellow-700">
                      <li>Garda vetting status</li>
                      <li>Tusla registration (where applicable)</li>
                      <li>Professional qualifications</li>
                      <li>References and experience</li>
                    </ul>
                    <p className="mt-2 font-medium text-yellow-800">
                      We strongly recommend conducting thorough verification of all credentials before making any childcare arrangements.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="grid gap-6 sm:grid-cols-2">
                {/* Name Field */}
                <div className="sm:col-span-2">
                  <label
                    htmlFor="name"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Full Name
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                      <FaUser className="h-5 w-5" />
                    </div>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      autoComplete="name"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className={inputWithIconClass}
                      placeholder="Your full name"
                    />
                  </div>
                </div>

                {/* Email Field */}
                <div className="sm:col-span-2">
                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Email Address
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
                      className={inputWithIconClass}
                      placeholder="your@email.com"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <label
                    htmlFor="password"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                      <FaLock className="h-5 w-5" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="new-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={inputWithIconClass}
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                {/* Confirm Password Field */}
                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                      <FaLock className="h-5 w-5" />
                    </div>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      autoComplete="new-password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={inputWithIconClass}
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                {/* Childminder Specific Fields */}
                {role === User_role.childminder && (
                  <>
                    {/* Phone Number Field */}
                    <div>
                      <label
                        htmlFor="phone"
                        className="mb-2 block text-sm font-medium text-gray-700"
                      >
                        Phone Number <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                          <FaPhone className="h-5 w-5" />
                        </div>
                        <input
                          id="phone"
                          name="phone"
                          type="tel"
                          autoComplete="tel"
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className={inputWithIconClass}
                          placeholder="086 123 4567"
                        />
                      </div>
                    </div>

                    {/* Rate Field */}
                    <div>
                      <label
                        htmlFor="rate"
                        className="mb-2 block text-sm font-medium text-gray-700"
                      >
                        Hourly Rate (€) <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                          <FaEuroSign className="h-5 w-5" />
                        </div>
                        <input
                          id="rate"
                          name="rate"
                          type="number"
                          step="0.01"
                          min="0"
                          required
                          value={rate}
                          onChange={(e) => setRate(e.target.value)}
                          className={inputWithIconClass}
                          placeholder="15.00"
                        />
                      </div>
                    </div>

                    {/* Address Fields */}
                    <div className="sm:col-span-2">
                      <h3 className="mb-2 font-medium text-gray-700">Address <span className="text-red-500">*</span></h3>
                      
                      {/* Street Address Field */}
                      <div className="mb-3">
                        <label
                          htmlFor="streetAddress"
                          className="mb-1 block text-sm font-medium text-gray-700"
                        >
                          Street Address <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                            <FaMapMarkerAlt className="h-5 w-5" />
                          </div>
                          <input
                            id="streetAddress"
                            name="streetAddress"
                            type="text"
                            required
                            value={streetAddress}
                            onChange={(e) => setStreetAddress(e.target.value)}
                            className={inputWithIconClass}
                            placeholder="123 Main Street"
                          />
                        </div>
                      </div>
                      
                      {/* City Field */}
                      <div className="mb-3">
                        <label
                          htmlFor="city"
                          className="mb-1 block text-sm font-medium text-gray-700"
                        >
                          City/Town <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="city"
                          name="city"
                          type="text"
                          required
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className={textareaClass}
                          placeholder="Dublin"
                        />
                      </div>
                      
                      {/* County Field */}
                      <div className="mb-3">
                        <label
                          htmlFor="county"
                          className="mb-1 block text-sm font-medium text-gray-700"
                        >
                          County <span className="text-red-500">*</span>
                        </label>
                        <select
                          id="county"
                          name="county"
                          required
                          value={county}
                          onChange={(e) => setCounty(e.target.value)}
                          className={textareaClass}
                        >
                          <option value="">Select a county</option>
                          <option value="Antrim">Antrim</option>
                          <option value="Armagh">Armagh</option>
                          <option value="Carlow">Carlow</option>
                          <option value="Cavan">Cavan</option>
                          <option value="Clare">Clare</option>
                          <option value="Cork">Cork</option>
                          <option value="Derry">Derry</option>
                          <option value="Donegal">Donegal</option>
                          <option value="Down">Down</option>
                          <option value="Dublin">Dublin</option>
                          <option value="Fermanagh">Fermanagh</option>
                          <option value="Galway">Galway</option>
                          <option value="Kerry">Kerry</option>
                          <option value="Kildare">Kildare</option>
                          <option value="Kilkenny">Kilkenny</option>
                          <option value="Laois">Laois</option>
                          <option value="Leitrim">Leitrim</option>
                          <option value="Limerick">Limerick</option>
                          <option value="Longford">Longford</option>
                          <option value="Louth">Louth</option>
                          <option value="Mayo">Mayo</option>
                          <option value="Meath">Meath</option>
                          <option value="Monaghan">Monaghan</option>
                          <option value="Offaly">Offaly</option>
                          <option value="Roscommon">Roscommon</option>
                          <option value="Sligo">Sligo</option>
                          <option value="Tipperary">Tipperary</option>
                          <option value="Tyrone">Tyrone</option>
                          <option value="Waterford">Waterford</option>
                          <option value="Westmeath">Westmeath</option>
                          <option value="Wexford">Wexford</option>
                          <option value="Wicklow">Wicklow</option>
                        </select>
                      </div>
                      
                      {/* Eircode Field */}
                      <div>
                        <label
                          htmlFor="eircode"
                          className="mb-1 block text-sm font-medium text-gray-700"
                        >
                          Eircode
                        </label>
                        <input
                          id="eircode"
                          name="eircode"
                          type="text"
                          value={eircode}
                          onChange={(e) => setEircode(e.target.value)}
                          className={textareaClass}
                          placeholder="e.g. D01 F5P2"
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Terms and Conditions */}
              <div className="flex items-start">
                <div className="flex h-5 items-center">
                  <input
                    id="terms"
                    name="terms"
                    type="checkbox"
                    required
                    className={checkboxClass}
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="terms" className="text-gray-600">
                    I agree to the{" "}
                    <Link href="/terms" className="font-medium text-violet-600 hover:text-violet-500">
                      Terms and Conditions
                    </Link>{" "}
                    and{" "}
                    <Link href="/privacy" className="font-medium text-violet-600 hover:text-violet-500">
                      Privacy Policy
                    </Link>
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex w-full items-center justify-center rounded-lg bg-gradient-to-r from-violet-600 to-purple-600 py-3 px-4 font-medium text-white shadow-md transition-all hover:from-violet-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 disabled:opacity-70"
                >
                  {isLoading ? (
                    <>
                      <FaSpinner className="mr-2 h-5 w-5 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    "Create account"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="mt-8 text-center">
          <div className="text-sm text-gray-600">Already have an account?</div>
          <Link
            href="/auth/login"
            className="mt-2 inline-block font-semibold text-violet-600 hover:text-violet-500"
          >
            Sign in to your account
          </Link>
        </div>
      </div>
    </div>
  );
} 