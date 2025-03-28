import React from 'react';
import { Booking_status } from '@prisma/client';

interface StatusBadgeProps {
  status: Booking_status;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getStatusClasses = () => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      case 'LATE_CANCELLED':
        return 'bg-orange-100 text-orange-800';
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getStatusLabel = () => {
    switch (status) {
      case 'CONFIRMED':
        return 'Confirmed';
      case 'PENDING':
        return 'Pending';
      case 'CANCELLED':
        return 'Cancelled';
      case 'LATE_CANCELLED':
        return 'Late Cancelled';
      case 'COMPLETED':
        return 'Completed';
      default:
        return status;
    }
  };
  
  return (
    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getStatusClasses()}`}>
      {getStatusLabel()}
    </span>
  );
};

export default StatusBadge; 