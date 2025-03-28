import { Booking_status } from '@prisma/client';

type StatusBadgeProps = {
  status: Booking_status;
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const getStatusConfig = (status: Booking_status) => {
    switch (status) {
      case 'PENDING':
        return {
          bgColor: 'bg-yellow-100',
          textColor: 'text-yellow-800',
          label: 'Pending'
        };
      case 'CONFIRMED':
        return {
          bgColor: 'bg-green-100',
          textColor: 'text-green-800',
          label: 'Confirmed'
        };
      case 'CANCELLED':
        return {
          bgColor: 'bg-red-100',
          textColor: 'text-red-800',
          label: 'Cancelled'
        };
      case 'LATE_CANCELLED':
        return {
          bgColor: 'bg-orange-100',
          textColor: 'text-orange-800',
          label: 'Late Cancelled'
        };
      case 'COMPLETED':
        return {
          bgColor: 'bg-blue-100',
          textColor: 'text-blue-800',
          label: 'Completed'
        };
      default:
        return {
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-800',
          label: status
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.bgColor} ${config.textColor}`}
    >
      {config.label}
    </span>
  );
} 