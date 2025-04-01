import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import EmergencyBookingForm from '@/components/dashboard/parent/EmergencyBookingForm';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Emergency Childcare Request | Childminder Connect',
  description: 'Request emergency childcare services with immediate notifications to available childminders nearby.',
};

export default async function EmergencyBookingPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect('/auth/signin?callbackUrl=/dashboard/parent/emergency-booking');
  }

  if (session.user.role !== 'parent') {
    redirect('/dashboard');
  }

  // Get the parent's children
  const children = await prisma.child.findMany({
    where: {
      parentId: session.user.id,
    },
    select: {
      id: true,
      name: true,
      age: true,
    },
    orderBy: {
      name: 'asc',
    },
  });

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Emergency Childcare</h1>
        <p className="mb-6 text-gray-600">
          Need childcare right away? Our emergency booking system will notify nearby available 
          childminders who can respond quickly.
        </p>
        
        <EmergencyBookingForm children={children} />
      </div>
    </div>
  );
} 