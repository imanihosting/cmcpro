import { format } from "date-fns";
import { FaTimes, FaUserCircle, FaEnvelope, FaIdCard, FaCalendar, FaUser, FaCreditCard, FaMapMarkerAlt, FaInfoCircle } from "react-icons/fa";
import Image from "next/image";

type ViewUserModalProps = {
  userData: any;
  isOpen: boolean;
  onClose: () => void;
};

export default function ViewUserModal({ userData, isOpen, onClose }: ViewUserModalProps) {
  if (!isOpen || !userData) {
    return null;
  }

  // Get user profile image or default to placeholder
  const userImage = userData.profileImage || userData.image || null;
  
  // Format date for display
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "N/A";
    return format(new Date(dateString), "MMM d, yyyy");
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-end justify-center px-4 pb-20 pt-4 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        {/* Modal panel */}
        <div className="inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-3xl sm:align-middle">
          {/* Header */}
          <div className="bg-indigo-600 px-4 py-3 sm:px-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-white">User Details</h3>
              <button
                type="button"
                className="rounded-md bg-indigo-600 text-gray-200 hover:text-white focus:outline-none"
                onClick={onClose}
              >
                <FaTimes className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-4 py-5 sm:p-6">
            <div className="sm:flex sm:items-start">
              {/* User avatar and basic info */}
              <div className="mb-4 sm:mb-0 sm:mr-6 sm:flex-shrink-0">
                <div className="flex flex-col items-center">
                  <div className="relative h-32 w-32 overflow-hidden rounded-full">
                    {userImage ? (
                      <Image
                        src={userImage}
                        alt={userData.name || "User"}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gray-200">
                        <FaUserCircle className="h-16 w-16 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="mt-3 text-center">
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                      userData.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                      userData.role === 'childminder' ? 'bg-green-100 text-green-800' :
                      userData.role === 'parent' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {userData.role}
                    </span>
                  </div>
                  <div className="mt-2 text-center">
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                      userData.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                      userData.status === 'INACTIVE' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {userData.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* User details */}
              <div className="w-full">
                <div className="grid grid-cols-1 gap-y-4 md:grid-cols-2 md:gap-x-6">
                  <div className="flex items-center">
                    <FaUser className="mr-2 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Name</p>
                      <p className="text-sm font-medium text-gray-900">{userData.name || "Not provided"}</p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <FaEnvelope className="mr-2 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Email</p>
                      <p className="text-sm font-medium text-gray-900">{userData.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <FaIdCard className="mr-2 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">User ID</p>
                      <p className="text-sm font-medium text-gray-900">{userData.id}</p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <FaCalendar className="mr-2 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Registered On</p>
                      <p className="text-sm font-medium text-gray-900">{formatDate(userData.createdAt)}</p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <FaCreditCard className="mr-2 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Subscription</p>
                      <p className="text-sm font-medium text-gray-900">
                        {userData.subscriptionStatus} 
                        {userData.Subscription?.plan ? ` - ${userData.Subscription.plan}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <FaMapMarkerAlt className="mr-2 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Location</p>
                      <p className="text-sm font-medium text-gray-900">{userData.location || "Not provided"}</p>
                    </div>
                  </div>
                </div>

                {/* Additional information based on role */}
                {userData.role === 'childminder' && (
                  <div className="mt-6">
                    <h4 className="mb-3 text-sm font-medium text-gray-700">Childminder Details</h4>
                    <div className="grid grid-cols-1 gap-y-4 md:grid-cols-2 md:gap-x-6">
                      <div>
                        <p className="text-xs text-gray-500">Garda Vetted</p>
                        <p className="text-sm font-medium text-gray-900">
                          {userData.gardaVetted ? "Yes" : "No"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Tusla Registered</p>
                        <p className="text-sm font-medium text-gray-900">
                          {userData.tuslaRegistered ? "Yes" : "No"}
                        </p>
                      </div>
                      {userData.tuslaRegistered && userData.tuslaRegistrationNumber && (
                        <div>
                          <p className="text-xs text-gray-500">Tusla Registration Number</p>
                          <p className="text-sm font-medium text-gray-900">{userData.tuslaRegistrationNumber}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-xs text-gray-500">First Aid Certified</p>
                        <p className="text-sm font-medium text-gray-900">
                          {userData.firstAidCert ? "Yes" : "No"}
                        </p>
                      </div>
                      {userData.firstAidCert && userData.firstAidCertExpiry && (
                        <div>
                          <p className="text-xs text-gray-500">First Aid Cert Expiry</p>
                          <p className="text-sm font-medium text-gray-900">{formatDate(userData.firstAidCertExpiry)}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-xs text-gray-500">Children First Certified</p>
                        <p className="text-sm font-medium text-gray-900">
                          {userData.childrenFirstCert ? "Yes" : "No"}
                        </p>
                      </div>
                      {userData.maxChildrenCapacity && (
                        <div>
                          <p className="text-xs text-gray-500">Max Children Capacity</p>
                          <p className="text-sm font-medium text-gray-900">{userData.maxChildrenCapacity}</p>
                        </div>
                      )}
                      {userData.yearsOfExperience && (
                        <div>
                          <p className="text-xs text-gray-500">Years of Experience</p>
                          <p className="text-sm font-medium text-gray-900">{userData.yearsOfExperience}</p>
                        </div>
                      )}
                      {userData.rate && (
                        <div>
                          <p className="text-xs text-gray-500">Rate</p>
                          <p className="text-sm font-medium text-gray-900">€{userData.rate.toString()}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Activity counts */}
                {userData._count && (
                  <div className="mt-6">
                    <h4 className="mb-3 text-sm font-medium text-gray-700">Activity</h4>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {userData.role === 'parent' && (
                        <>
                          <div className="rounded-lg bg-blue-50 p-3">
                            <p className="text-xs text-blue-600">Children</p>
                            <p className="text-xl font-semibold text-blue-700">{userData._count.Child}</p>
                          </div>
                          <div className="rounded-lg bg-green-50 p-3">
                            <p className="text-xs text-green-600">Bookings</p>
                            <p className="text-xl font-semibold text-green-700">{userData._count.Booking_Booking_parentIdToUser}</p>
                          </div>
                        </>
                      )}
                      
                      {userData.role === 'childminder' && (
                        <div className="rounded-lg bg-green-50 p-3">
                          <p className="text-xs text-green-600">Bookings</p>
                          <p className="text-xl font-semibold text-green-700">{userData._count.Booking_Booking_childminderIdToUser}</p>
                        </div>
                      )}
                      
                      <div className="rounded-lg bg-purple-50 p-3">
                        <p className="text-xs text-purple-600">Documents</p>
                        <p className="text-xl font-semibold text-purple-700">{userData._count.Document_Document_userIdToUser}</p>
                      </div>
                      
                      <div className="rounded-lg bg-yellow-50 p-3">
                        <p className="text-xs text-yellow-600">Support Tickets</p>
                        <p className="text-xl font-semibold text-yellow-700">{userData._count.SupportTicket}</p>
                      </div>
                      
                      {userData.role === 'childminder' && (
                        <div className="rounded-lg bg-indigo-50 p-3">
                          <p className="text-xs text-indigo-600">Reviews</p>
                          <p className="text-xl font-semibold text-indigo-700">{userData._count.Review_Review_revieweeIdToUser}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Recent activity logs */}
                {userData.recentActivity && userData.recentActivity.length > 0 && (
                  <div className="mt-6">
                    <h4 className="mb-3 text-sm font-medium text-gray-700">Recent Activity</h4>
                    <div className="max-h-48 overflow-y-auto rounded border border-gray-200">
                      <ul className="divide-y divide-gray-200">
                        {userData.recentActivity.map((activity: any) => (
                          <li key={activity.id} className="px-4 py-2">
                            <div className="flex items-start">
                              <FaInfoCircle className="mt-1 mr-2 text-gray-400" />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                                {activity.details && (
                                  <p className="text-xs text-gray-600">{activity.details}</p>
                                )}
                                <p className="text-xs text-gray-500">
                                  {formatDate(activity.timestamp)} 
                                  {new Date(activity.timestamp).toLocaleTimeString()}
                                </p>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
            <button
              type="button"
              className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none sm:mt-0 sm:w-auto sm:text-sm"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 