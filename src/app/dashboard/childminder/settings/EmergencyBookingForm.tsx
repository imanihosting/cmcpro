"use client";

import React, { useState, useEffect } from "react";
import { FaTrash, FaPlus, FaClock } from "react-icons/fa";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format, addHours, parseISO } from "date-fns";

type TimeSlot = {
  id: string;
  dayOfWeek: number | null; // null for one-time slots, 0-6 for recurring (0 = Sunday)
  startTime: string;
  endTime: string;
  date: string | null; // null for recurring slots, ISO date for one-time slots
};

export default function EmergencyBookingForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [lastMinuteAvailable, setLastMinuteAvailable] = useState(false);
  const [lastMinuteRadius, setLastMinuteRadius] = useState(5);
  
  // Schedule state
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [slotType, setSlotType] = useState<"recurring" | "one-time">("recurring");
  const [selectedDay, setSelectedDay] = useState<number>(1); // Monday default
  const [oneTimeDate, setOneTimeDate] = useState<Date>(new Date());
  const [startTime, setStartTime] = useState<string>("09:00");
  const [endTime, setEndTime] = useState<string>("17:00");
  
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  // Fetch current settings on component mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        // Fetch basic settings
        const response = await fetch("/api/user/last-minute-settings");
        if (!response.ok) {
          throw new Error("Failed to fetch settings");
        }
        const data = await response.json();
        console.log("Last minute settings:", data);
        setLastMinuteAvailable(data.lastMinuteAvailable);
        setLastMinuteRadius(data.lastMinuteRadius || 5);
        
        // Fetch schedule
        const scheduleResponse = await fetch("/api/user/last-minute-schedule");
        if (scheduleResponse.ok) {
          const scheduleData = await scheduleResponse.json();
          console.log("Last minute schedule:", scheduleData);
          setTimeSlots(scheduleData.timeSlots || []);
        }
      } catch (error) {
        console.error("Error fetching last-minute settings:", error);
        window.alert("Failed to load your settings");
      }
    };

    fetchSettings();
  }, []);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Save basic settings
      const settingsPayload = {
        lastMinuteAvailable,
        lastMinuteRadius,
      };
      
      console.log("Saving emergency settings:", settingsPayload);
      
      const basicSettingsResponse = await fetch("/api/user/last-minute-settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settingsPayload),
      });

      const settingsResult = await basicSettingsResponse.json();
      console.log("Settings update response:", settingsResult);

      if (!basicSettingsResponse.ok) {
        throw new Error("Failed to update basic settings");
      }

      // Save schedule
      const scheduleResponse = await fetch("/api/user/last-minute-schedule", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          timeSlots,
        }),
      });

      if (!scheduleResponse.ok) {
        throw new Error("Failed to update schedule");
      }

      window.alert("Emergency booking settings updated successfully");
    } catch (error) {
      console.error("Error updating last-minute settings:", error);
      window.alert("Failed to update your settings");
    } finally {
      setIsLoading(false);
    }
  };

  // Add new time slot
  const handleAddTimeSlot = () => {
    const newSlot: TimeSlot = {
      id: Date.now().toString(),
      dayOfWeek: slotType === "recurring" ? selectedDay : null,
      startTime,
      endTime,
      date: slotType === "one-time" ? oneTimeDate.toISOString() : null,
    };
    
    setTimeSlots([...timeSlots, newSlot]);
    setShowAddForm(false);
  };

  // Remove time slot
  const handleRemoveTimeSlot = (id: string) => {
    setTimeSlots(timeSlots.filter(slot => slot.id !== id));
  };

  const formatSlotTime = (slot: TimeSlot) => {
    if (slot.dayOfWeek !== null) {
      return `${dayNames[slot.dayOfWeek]}: ${slot.startTime} - ${slot.endTime}`;
    } else if (slot.date) {
      return `${format(parseISO(slot.date), "MMM d, yyyy")}: ${slot.startTime} - ${slot.endTime}`;
    }
    return "";
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h3 className="text-xl font-bold text-gray-900 mb-4">Emergency Childcare Availability</h3>
      <p className="text-base text-gray-700 mb-6">
        Enable emergency bookings to allow parents to request your childcare services with short notice during urgent situations.
      </p>
      
      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Last Minute Availability Toggle */}
          <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
            <div>
              <label htmlFor="lastMinuteAvailable" className="text-base font-medium text-gray-900">
                Accept Emergency Bookings
              </label>
              <p className="text-sm text-gray-600 mt-1">
                When enabled, parents can send you urgent childcare requests outside of your regular schedule
              </p>
            </div>
            <div className="relative inline-block w-14 h-7">
              <input
                type="checkbox"
                id="lastMinuteAvailable"
                className="sr-only"
                checked={lastMinuteAvailable}
                onChange={(e) => setLastMinuteAvailable(e.target.checked)}
              />
              <label 
                htmlFor="lastMinuteAvailable"
                className={`absolute inset-0 rounded-full transition duration-200 ease-in-out ${
                  lastMinuteAvailable ? 'bg-blue-600' : 'bg-gray-300'
                } cursor-pointer`}
              >
                <span 
                  className={`absolute bg-white w-6 h-6 rounded-full transition-transform duration-200 ease-in-out transform ${
                    lastMinuteAvailable ? 'translate-x-7' : 'translate-x-1'
                  } top-0.5`}
                />
              </label>
            </div>
          </div>

          {/* Last Minute Radius Selector */}
          {lastMinuteAvailable && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <label htmlFor="lastMinuteRadius" className="block text-base font-medium text-gray-900 mb-2">
                Maximum Travel Distance
              </label>
              <select
                id="lastMinuteRadius"
                value={lastMinuteRadius}
                onChange={(e) => setLastMinuteRadius(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-md p-2 mb-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                disabled={isLoading}
              >
                <option value="1">1 kilometer</option>
                <option value="2">2 kilometers</option>
                <option value="5">5 kilometers</option>
                <option value="10">10 kilometers</option>
                <option value="15">15 kilometers</option>
                <option value="20">20 kilometers</option>
                <option value="30">30 kilometers</option>
                <option value="50">50 kilometers</option>
              </select>
              <p className="text-sm text-gray-600">
                Only parents within this distance from your location will see your emergency availability
              </p>
            </div>
          )}

          {/* Emergency Availability Schedule */}
          {lastMinuteAvailable && (
            <div className="mt-8 bg-gray-50 p-4 rounded-lg">
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Emergency Availability Schedule</h4>
              <p className="text-base text-gray-700 mb-4">
                Define when you're available for emergency bookings. You can set regular weekly slots or specific dates.
              </p>

              {/* Time slots list */}
              {timeSlots.length > 0 ? (
                <div className="space-y-3 mb-4">
                  <p className="font-medium text-gray-700">Your Current Availability:</p>
                  {timeSlots.map((slot) => (
                    <div 
                      key={slot.id} 
                      className="flex justify-between items-center p-3 bg-white rounded-md border border-gray-200"
                    >
                      <div className="flex items-center">
                        <FaClock className="text-blue-500 mr-2" />
                        <span className="text-gray-800">{formatSlotTime(slot)}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveTimeSlot(slot.id)}
                        className="text-red-500 hover:text-red-700 p-1"
                        aria-label="Remove time slot"
                      >
                        <FaTrash size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-3 rounded-md mb-4">
                  <p className="text-sm">
                    No availability slots added yet. Add your available times below to receive emergency booking requests.
                  </p>
                </div>
              )}

              {/* Add new time slot */}
              {showAddForm ? (
                <div className="border border-gray-200 rounded-md p-4 mb-4 bg-white">
                  <h5 className="font-medium text-gray-900 mb-3">Add Availability Time Slot</h5>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Type of Availability</label>
                      <div className="flex space-x-4">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="slotType"
                            checked={slotType === "recurring"}
                            onChange={() => setSlotType("recurring")}
                            className="mr-2"
                          />
                          <span className="text-gray-800">Weekly (recurring)</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="slotType"
                            checked={slotType === "one-time"}
                            onChange={() => setSlotType("one-time")}
                            className="mr-2"
                          />
                          <span className="text-gray-800">Specific date (one-time)</span>
                        </label>
                      </div>
                    </div>

                    {slotType === "recurring" ? (
                      <div>
                        <label htmlFor="day" className="block text-sm font-medium text-gray-700 mb-1">Day of Week</label>
                        <select
                          id="day"
                          value={selectedDay}
                          onChange={(e) => setSelectedDay(Number(e.target.value))}
                          className="w-full border border-gray-300 rounded-md p-2 bg-white"
                        >
                          {dayNames.map((day, index) => (
                            <option key={day} value={index}>
                              {day}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Specific Date</label>
                        <DatePicker
                          selected={oneTimeDate}
                          onChange={(date: Date | null) => date && setOneTimeDate(date)}
                          minDate={new Date()}
                          className="w-full border border-gray-300 rounded-md p-2 bg-white"
                          dateFormat="MMMM d, yyyy"
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                        <input
                          type="time"
                          id="startTime"
                          value={startTime}
                          onChange={(e) => setStartTime(e.target.value)}
                          className="w-full border border-gray-300 rounded-md p-2 bg-white"
                        />
                      </div>
                      <div>
                        <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                        <input
                          type="time"
                          id="endTime"
                          value={endTime}
                          onChange={(e) => setEndTime(e.target.value)}
                          className="w-full border border-gray-300 rounded-md p-2 bg-white"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end space-x-3 mt-4">
                      <button
                        type="button"
                        onClick={() => setShowAddForm(false)}
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleAddTimeSlot}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        Add This Time Slot
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowAddForm(true)}
                  className="flex items-center text-blue-600 hover:text-blue-800 bg-white px-4 py-2 rounded-md border border-blue-200"
                >
                  <FaPlus className="mr-2" size={12} /> Add New Availability Slot
                </button>
              )}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md shadow-sm disabled:opacity-50 disabled:cursor-not-allowed text-base"
          >
            {isLoading ? "Saving Your Settings..." : "Save Emergency Booking Settings"}
          </button>
        </div>
      </form>
    </div>
  );
} 