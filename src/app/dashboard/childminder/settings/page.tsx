"use client";

import EmergencyBookingForm from "./EmergencyBookingForm";

export default function ChildminderSettingsPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Childminder Settings</h1>
      <p className="text-gray-600 mb-8">Manage your account preferences and emergency availability settings.</p>
      
      <div className="space-y-8">
        <div className="grid grid-cols-1 gap-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Emergency Booking Settings</h2>
          <p className="text-gray-600">
            Configure your availability for emergency booking requests.
          </p>
          <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> Emergency bookings are requests from parents who need childcare on short notice (within 24 hours).
              You'll receive higher compensation for these bookings.
            </p>
            <p className="mt-2 text-sm text-yellow-800">
              <strong>Status:</strong> Emergency booking settings are active. Ensure you have set your availability correctly to receive booking requests.
            </p>
          </div>
          <EmergencyBookingForm />
        </div>
      </div>
    </div>
  );
} 