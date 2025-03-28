"use client";

import { useState } from "react";
import { 
  FaChild, 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaNotesMedical,
  FaBirthdayCake,
  FaInfoCircle
} from "react-icons/fa";

interface Child {
  id: number;
  name: string;
  age: number;
  birthdate: string;
  medicalInfo: string;
  allergies: string[];
  specialNeeds: string | null;
  photo?: string;
}

export default function ChildrenPage() {
  // Placeholder children data
  const [children, setChildren] = useState<Child[]>([
    {
      id: 1,
      name: "Emma Smith",
      age: 4,
      birthdate: "2020-03-15",
      medicalInfo: "No known medical conditions",
      allergies: ["Peanuts", "Dairy"],
      specialNeeds: null
    },
    {
      id: 2,
      name: "Oliver Smith",
      age: 2,
      birthdate: "2022-01-10",
      medicalInfo: "Asthma (mild)",
      allergies: [],
      specialNeeds: "Sometimes needs extra attention with new activities"
    }
  ]);

  // Function to handle delete child (placeholder)
  const handleDeleteChild = (id: number) => {
    setChildren(children.filter(child => child.id !== id));
  };

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">My Children</h1>
        <p className="mt-1 text-sm text-gray-600">Manage your children's profiles and preferences</p>
      </header>

      {/* Add child button */}
      <div className="mb-6">
        <button className="flex items-center rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2">
          <FaPlus className="mr-2 h-4 w-4" /> Add Child
        </button>
      </div>

      {/* Children profiles */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {children.map((child) => (
          <div key={child.id} className="overflow-hidden rounded-lg bg-white shadow-sm">
            <div className="h-32 bg-gradient-to-r from-violet-500 to-purple-500 flex items-center justify-center">
              {child.photo ? (
                <img
                  src={child.photo}
                  alt={`${child.name}'s photo`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <FaChild className="h-16 w-16 text-white opacity-75" />
              )}
            </div>
            <div className="p-4">
              <h2 className="text-lg font-semibold text-gray-900">{child.name}</h2>
              
              <div className="mt-3 space-y-2 text-sm text-gray-600">
                <div className="flex items-center">
                  <FaBirthdayCake className="mr-2 h-4 w-4 text-gray-400" />
                  <span>Age: {child.age} ({child.birthdate})</span>
                </div>
                <div className="flex items-start">
                  <FaNotesMedical className="mr-2 h-4 w-4 text-gray-400 mt-0.5" />
                  <div>
                    <p className="font-medium">Medical:</p>
                    <p>{child.medicalInfo}</p>
                    {child.allergies.length > 0 && (
                      <div className="mt-1">
                        <p className="font-medium">Allergies:</p>
                        <ul className="list-disc pl-4">
                          {child.allergies.map((allergy, index) => (
                            <li key={index}>{allergy}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
                {child.specialNeeds && (
                  <div className="flex items-start">
                    <FaInfoCircle className="mr-2 h-4 w-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-medium">Special Needs:</p>
                      <p>{child.specialNeeds}</p>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="mt-4 flex justify-end space-x-2">
                <button className="rounded-md bg-white px-3 py-1.5 text-sm font-medium text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
                  <FaEdit className="mr-1 inline h-4 w-4" /> Edit
                </button>
                <button 
                  onClick={() => handleDeleteChild(child.id)}
                  className="rounded-md bg-white px-3 py-1.5 text-sm font-medium text-red-600 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 hover:text-red-700"
                >
                  <FaTrash className="mr-1 inline h-4 w-4" /> Remove
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Add child card */}
        <div className="overflow-hidden rounded-lg border-2 border-dashed border-gray-300 bg-white p-4 text-center hover:border-violet-500 hover:bg-violet-50 transition-colors cursor-pointer">
          <div className="flex h-full flex-col items-center justify-center py-6">
            <FaChild className="mb-3 h-12 w-12 text-gray-400" />
            <h3 className="mb-1 text-sm font-medium text-gray-900">Add a New Child</h3>
            <p className="text-xs text-gray-500">Click to add a new child profile</p>
          </div>
        </div>
      </div>

      {/* Information notice */}
      <div className="mt-8 rounded-lg bg-blue-50 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <FaInfoCircle className="h-5 w-5 text-blue-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Why add children profiles?</h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                Adding complete profiles for your children helps childminders provide personalized care. 
                Important details like allergies and special needs ensure they can meet your child's specific requirements.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 