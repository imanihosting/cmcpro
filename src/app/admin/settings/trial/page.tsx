"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FaCog, FaSpinner, FaToggleOn, FaToggleOff, FaCheck, FaTimes } from "react-icons/fa";

export default function TrialSettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isTrialEnabled, setIsTrialEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  useEffect(() => {
    // Check if user is admin
    if (status === "authenticated") {
      if (session.user.role !== "admin") {
        router.push("/dashboard");
        return;
      }
      // Fetch current trial setting
      fetchTrialSetting();
    } else if (status === "unauthenticated") {
      router.push("/auth/login");
    }
  }, [status, session, router]);

  const fetchTrialSetting = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/admin/settings/trial");
      if (response.ok) {
        const data = await response.json();
        setIsTrialEnabled(data.enabled);
      }
    } catch (error) {
      console.error("Error fetching trial setting:", error);
      setMessage({ text: "Failed to load trial settings", type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTrialSetting = async () => {
    try {
      setIsSaving(true);
      setMessage({ text: "", type: "" });
      
      const response = await fetch("/api/admin/settings/trial", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ enabled: !isTrialEnabled }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setIsTrialEnabled(!isTrialEnabled);
        setMessage({ text: data.message, type: "success" });
      } else {
        setMessage({ text: data.error || "Failed to update setting", type: "error" });
      }
    } catch (error) {
      console.error("Error toggling trial setting:", error);
      setMessage({ text: "An error occurred while updating the setting", type: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center p-8">
        <FaSpinner className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="mb-2 text-2xl font-bold text-gray-900">Free Trial Settings</h1>
        <p className="text-gray-600">
          Configure the automatic free trial feature for new user registrations
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-md">
        <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
          <div className="flex items-center">
            <FaCog className="mr-2 text-violet-600" />
            <h2 className="text-lg font-medium text-gray-900">Free Trial Configuration</h2>
          </div>
        </div>

        <div className="p-6">
          {message.text && (
            <div
              className={`mb-6 rounded-md p-4 ${
                message.type === "success" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
              }`}
            >
              <div className="flex items-center">
                {message.type === "success" ? (
                  <FaCheck className="mr-2 h-5 w-5 text-green-500" />
                ) : (
                  <FaTimes className="mr-2 h-5 w-5 text-red-500" />
                )}
                <p>{message.text}</p>
              </div>
            </div>
          )}

          <div className="space-y-6">
            <div className="rounded-md bg-gray-50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Automatic Free Trial</h3>
                  <p className="mt-1 text-sm text-gray-600">
                    When enabled, new users will receive a free trial based on their role:
                  </p>
                  <ul className="mt-2 list-inside list-disc text-sm text-gray-600">
                    <li>Parents: 30 days free trial</li>
                    <li>Childminders: 60 days free trial</li>
                  </ul>
                </div>
                <button
                  onClick={toggleTrialSetting}
                  disabled={isSaving}
                  className="inline-flex items-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSaving ? (
                    <FaSpinner className="mr-2 h-4 w-4 animate-spin" />
                  ) : isTrialEnabled ? (
                    <FaToggleOn className="mr-2 h-6 w-6 text-violet-600" />
                  ) : (
                    <FaToggleOff className="mr-2 h-6 w-6 text-gray-400" />
                  )}
                  {isTrialEnabled ? "Enabled" : "Disabled"}
                </button>
              </div>
            </div>

            <div className="rounded-md bg-blue-50 p-4 text-sm text-blue-800">
              <p>
                <strong>Current status:</strong> The free trial feature is{" "}
                <span className={isTrialEnabled ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>
                  {isTrialEnabled ? "enabled" : "disabled"}
                </span>
                .
              </p>
              <p className="mt-2">
                {isTrialEnabled
                  ? "New users will automatically receive a free trial period based on their role."
                  : "New users will be directed to the subscription page immediately after registration."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 