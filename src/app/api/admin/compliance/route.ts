import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// Define Document interface for proper typing
interface Document {
  id: string;
  name: string;
  type: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  reviewDate?: Date | null;
  expirationDate?: Date | null;
  category?: string | null;
  documentIdentifier?: string | null;
  issuingAuthority?: string | null;
}

// GET /api/admin/compliance - Get overview of document compliance status
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated and is an admin
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized access. Admin privileges required.' },
        { status: 403 }
      );
    }
    
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const expiryDays = searchParams.get('expiryDays');
    
    // Base query to find childminders only
    const baseQuery = {
      role: 'childminder',
    } as any; // Type assertion to bypass TypeScript error
    
    // Get childminders with their documents
    const childminders = await prisma.user.findMany({
      where: baseQuery,
      select: {
        id: true,
        name: true,
        email: true,
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
            reviewDate: true,
            expirationDate: true,
            category: true,
            documentIdentifier: true,
            issuingAuthority: true
          }
        }
      }
    }) as any[]; // Type assertion to bypass TypeScript error
    
    // Calculate current date
    const currentDate = new Date();
    
    // Filter expiring documents based on request parameters
    const expiryFilter = expiryDays ? parseInt(expiryDays) : 30; // Default to 30 days
    const expiryThreshold = new Date();
    expiryThreshold.setDate(currentDate.getDate() + expiryFilter);
    
    // Process and format the compliance data
    const complianceData = childminders.map(childminder => {
      // Get all documents and categorize them
      const documents = childminder.Document_Document_userIdToUser || [] as Document[];
      
      // Find specific document types
      const gardaVettingDocs = documents.filter((doc: Document) => 
        doc.type.toLowerCase().includes('garda') || 
        doc.category?.toLowerCase().includes('garda')
      );
      
      const tuslaRegistrationDocs = documents.filter((doc: Document) => 
        doc.type.toLowerCase().includes('tusla') || 
        doc.category?.toLowerCase().includes('tusla') ||
        doc.type.toLowerCase().includes('registration')
      );
      
      const firstAidDocs = documents.filter((doc: Document) => 
        doc.type.toLowerCase().includes('first aid') || 
        doc.category?.toLowerCase().includes('first aid')
      );
      
      const childrenFirstDocs = documents.filter((doc: Document) => 
        doc.type.toLowerCase().includes('children first') || 
        doc.category?.toLowerCase().includes('children first')
      );
      
      // Find expiring documents
      const expiringDocuments = documents.filter((doc: Document) => {
        if (!doc.expirationDate) return false;
        return doc.expirationDate <= expiryThreshold && doc.expirationDate > currentDate;
      });
      
      // Find expired documents
      const expiredDocuments = documents.filter((doc: Document) => {
        if (!doc.expirationDate) return false;
        return doc.expirationDate < currentDate;
      });
      
      // Check compliance status 
      const hasValidGardaVetting = gardaVettingDocs.some((doc: Document) => 
        doc.status === 'APPROVED' && 
        (!doc.expirationDate || doc.expirationDate > currentDate)
      );
      
      const hasValidTuslaRegistration = tuslaRegistrationDocs.some((doc: Document) => 
        doc.status === 'APPROVED' && 
        (!doc.expirationDate || doc.expirationDate > currentDate)
      );
      
      const hasValidFirstAid = firstAidDocs.some((doc: Document) => 
        doc.status === 'APPROVED' && 
        (!doc.expirationDate || doc.expirationDate > currentDate)
      ) || (childminder.firstAidCert && 
             childminder.firstAidCertExpiry && 
             childminder.firstAidCertExpiry > currentDate);
      
      const hasValidChildrenFirst = childrenFirstDocs.some((doc: Document) => 
        doc.status === 'APPROVED' && 
        (!doc.expirationDate || doc.expirationDate > currentDate)
      ) || childminder.childrenFirstCert;
      
      // Calculate overall compliance
      const isFullyCompliant = hasValidGardaVetting && 
                              hasValidTuslaRegistration && 
                              hasValidFirstAid && 
                              hasValidChildrenFirst;
      
      // Format the response data
      return {
        id: childminder.id,
        name: childminder.name,
        email: childminder.email,
        compliance: {
          isFullyCompliant,
          gardaVetting: {
            compliant: hasValidGardaVetting,
            documents: gardaVettingDocs
          },
          tuslaRegistration: {
            compliant: hasValidTuslaRegistration,
            registrationNumber: childminder.tuslaRegistrationNumber,
            documents: tuslaRegistrationDocs
          },
          firstAid: {
            compliant: hasValidFirstAid,
            expiry: childminder.firstAidCertExpiry,
            documents: firstAidDocs
          },
          childrenFirst: {
            compliant: hasValidChildrenFirst,
            documents: childrenFirstDocs
          }
        },
        documents: {
          all: documents,
          expiring: expiringDocuments,
          expired: expiredDocuments
        }
      };
    });
    
    // Filter results based on query params if needed
    let filteredData = complianceData;
    if (status === 'compliant') {
      filteredData = complianceData.filter(item => item.compliance.isFullyCompliant);
    } else if (status === 'non-compliant') {
      filteredData = complianceData.filter(item => !item.compliance.isFullyCompliant);
    }
    
    // Add summary statistics
    const summary = {
      total: childminders.length,
      compliant: complianceData.filter(item => item.compliance.isFullyCompliant).length,
      nonCompliant: complianceData.filter(item => !item.compliance.isFullyCompliant).length,
      expiringDocuments: complianceData.reduce((sum, item) => sum + item.documents.expiring.length, 0),
      expiredDocuments: complianceData.reduce((sum, item) => sum + item.documents.expired.length, 0)
    };
    
    return NextResponse.json({
      summary,
      childminders: filteredData
    });
    
  } catch (error) {
    console.error('Error fetching compliance data:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred while fetching compliance data' },
      { status: 500 }
    );
  }
} 