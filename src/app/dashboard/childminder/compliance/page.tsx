import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import ComplianceCard from './components/ComplianceCard';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircleIcon, AlertTriangleIcon } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Compliance Dashboard | Childminder Connect',
  description: 'Monitor and manage your certification compliance status',
};

async function getChildminderDocuments(userId: string) {
  try {
    // Get the childminder profile with required compliance fields
    const childminder = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        gardaVetted: true,
        firstAidCert: true,
        firstAidCertExpiry: true,
        tuslaRegistered: true,
        tuslaRegistrationNumber: true,
        childrenFirstCert: true,
        Document_Document_userIdToUser: {
          select: {
            id: true,
            name: true,
            type: true,
            status: true,
            createdAt: true,
            updatedAt: true,
            category: true,
            expirationDate: true,
          }
        }
      }
    }) as any; // Type assertion to bypass TypeScript error

    if (!childminder) {
      throw new Error('Childminder not found');
    }

    // Get all documents
    const documents = childminder.Document_Document_userIdToUser || [];
    
    // Categorize documents by type
    const gardaVettingDocs = documents.filter(doc => 
      doc.type.toLowerCase().includes('garda') || 
      doc.category?.toLowerCase().includes('garda')
    );
    
    const tuslaRegistrationDocs = documents.filter(doc => 
      doc.type.toLowerCase().includes('tusla') || 
      doc.category?.toLowerCase().includes('tusla') ||
      doc.type.toLowerCase().includes('registration')
    );
    
    const firstAidDocs = documents.filter(doc => 
      doc.type.toLowerCase().includes('first aid') || 
      doc.category?.toLowerCase().includes('first aid')
    );
    
    const childrenFirstDocs = documents.filter(doc => 
      doc.type.toLowerCase().includes('children first') || 
      doc.category?.toLowerCase().includes('children first')
    );

    const otherDocs = documents.filter(doc => 
      !gardaVettingDocs.includes(doc) && 
      !tuslaRegistrationDocs.includes(doc) && 
      !firstAidDocs.includes(doc) && 
      !childrenFirstDocs.includes(doc)
    );
    
    // Calculate compliance status for each category
    const currentDate = new Date();
    
    const hasValidGardaVetting = gardaVettingDocs.some(doc => 
      doc.status === 'APPROVED' && 
      (!doc.expirationDate || new Date(doc.expirationDate) > currentDate)
    ) || childminder.gardaVetted === true;
    
    const hasValidTuslaRegistration = tuslaRegistrationDocs.some(doc => 
      doc.status === 'APPROVED' && 
      (!doc.expirationDate || new Date(doc.expirationDate) > currentDate)
    ) || childminder.tuslaRegistered === true;
    
    const hasValidFirstAid = firstAidDocs.some(doc => 
      doc.status === 'APPROVED' && 
      (!doc.expirationDate || new Date(doc.expirationDate) > currentDate)
    ) || (childminder.firstAidCert === true && 
           childminder.firstAidCertExpiry && 
           childminder.firstAidCertExpiry > currentDate);
    
    const hasValidChildrenFirst = childrenFirstDocs.some(doc => 
      doc.status === 'APPROVED' && 
      (!doc.expirationDate || new Date(doc.expirationDate) > currentDate)
    ) || childminder.childrenFirstCert === true;
    
    // Calculate overall compliance
    const isFullyCompliant = hasValidGardaVetting && 
                            hasValidTuslaRegistration && 
                            hasValidFirstAid && 
                            hasValidChildrenFirst;
    
    return {
      childminder,
      complianceStatus: {
        isFullyCompliant,
        gardaVetting: {
          isCompliant: hasValidGardaVetting,
          documents: gardaVettingDocs
        },
        tuslaRegistration: {
          isCompliant: hasValidTuslaRegistration,
          documents: tuslaRegistrationDocs
        },
        firstAid: {
          isCompliant: hasValidFirstAid,
          documents: firstAidDocs,
          expiryDate: childminder.firstAidCertExpiry
        },
        childrenFirst: {
          isCompliant: hasValidChildrenFirst,
          documents: childrenFirstDocs
        },
        otherDocuments: {
          documents: otherDocs
        }
      }
    };
  } catch (error) {
    console.error('Error fetching childminder documents:', error);
    throw error;
  }
}

export default async function CompliancePage() {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    redirect('/login');
  }
  
  if (session.user.role !== 'childminder') {
    redirect('/dashboard');
  }
  
  const { complianceStatus } = await getChildminderDocuments(session.user.id);
  
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Compliance Dashboard</h1>
      
      {complianceStatus.isFullyCompliant ? (
        <Alert className="mb-6 bg-green-50 border-green-200">
          <CheckCircleIcon className="h-4 w-4 text-green-600" />
          <AlertTitle>Fully Compliant</AlertTitle>
          <AlertDescription>
            All your documentation is up to date. Keep monitoring this dashboard for any upcoming expirations.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert className="mb-6 bg-red-50 border-red-200">
          <AlertTriangleIcon className="h-4 w-4 text-red-600" />
          <AlertTitle>Compliance Issues Detected</AlertTitle>
          <AlertDescription>
            Some of your required documentation is missing, expired, or awaiting approval. Please address the issues below.
          </AlertDescription>
        </Alert>
      )}
      
      <div className="grid gap-6 md:grid-cols-2">
        <ComplianceCard 
          title="Garda Vetting"
          description="Required for working with children and vulnerable people"
          documents={complianceStatus.gardaVetting.documents}
          isCompliant={complianceStatus.gardaVetting.isCompliant}
        />
        
        <ComplianceCard 
          title="Tusla Registration"
          description="Required registration with the Child and Family Agency"
          documents={complianceStatus.tuslaRegistration.documents}
          isCompliant={complianceStatus.tuslaRegistration.isCompliant}
        />
        
        <ComplianceCard 
          title="First Aid Certification"
          description="Required certification in pediatric first aid"
          documents={complianceStatus.firstAid.documents}
          isCompliant={complianceStatus.firstAid.isCompliant}
          expiryDate={complianceStatus.firstAid.expiryDate}
        />
        
        <ComplianceCard 
          title="Children First Training"
          description="Required training in child protection and welfare"
          documents={complianceStatus.childrenFirst.documents}
          isCompliant={complianceStatus.childrenFirst.isCompliant}
        />
        
        {complianceStatus.otherDocuments.documents.length > 0 && (
          <div className="md:col-span-2">
            <ComplianceCard 
              title="Other Documents"
              description="Additional qualification and certification documents"
              documents={complianceStatus.otherDocuments.documents}
              isCompliant={true}
            />
          </div>
        )}
      </div>
    </div>
  );
} 