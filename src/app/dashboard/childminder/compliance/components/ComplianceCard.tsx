import { FC } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { InfoIcon, AlertTriangleIcon, CheckCircleIcon, XCircleIcon, ClockIcon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface Document {
  id: string;
  name: string;
  type: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  expirationDate?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface ComplianceCardProps {
  title: string;
  description: string;
  documents: Document[];
  isCompliant: boolean;
  expiryDate?: Date | null;
}

const ComplianceCard: FC<ComplianceCardProps> = ({
  title,
  description,
  documents,
  isCompliant,
  expiryDate
}) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <Badge className="bg-green-600">Approved</Badge>;
      case 'PENDING':
        return <Badge variant="outline" className="text-amber-600 border-amber-600">Pending</Badge>;
      case 'REJECTED':
        return <Badge className="bg-red-600">Rejected</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };
  
  const isDocumentExpiring = (doc: Document) => {
    if (!doc.expirationDate) return false;
    
    const expiryDate = new Date(doc.expirationDate);
    const today = new Date();
    const differenceInDays = Math.floor((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    return differenceInDays <= 30 && differenceInDays > 0;
  };
  
  const isDocumentExpired = (doc: Document) => {
    if (!doc.expirationDate) return false;
    
    const expiryDate = new Date(doc.expirationDate);
    const today = new Date();
    
    return expiryDate < today;
  };
  
  const getExpiryBadge = (doc: Document) => {
    if (isDocumentExpired(doc)) {
      return <Badge className="bg-red-600 ml-2">Expired</Badge>;
    }
    
    if (isDocumentExpiring(doc)) {
      return <Badge className="bg-amber-600 ml-2">Expiring Soon</Badge>;
    }
    
    return null;
  };
  
  const formatExpiryDate = (date: Date | null | undefined) => {
    if (!date) return 'No expiry date';
    
    const expiryDate = new Date(date);
    const today = new Date();
    
    if (expiryDate < today) {
      return `Expired ${formatDistanceToNow(expiryDate, { addSuffix: true })}`;
    }
    
    return `Expires ${formatDistanceToNow(expiryDate, { addSuffix: true })}`;
  };
  
  return (
    <Card className="shadow-md">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{title}</CardTitle>
          {isCompliant ? (
            <Badge className="bg-green-600">Compliant</Badge>
          ) : (
            <Badge className="bg-red-600">Non-Compliant</Badge>
          )}
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {expiryDate && (
          <div className="mb-4">
            <div className="flex items-center gap-2">
              <ClockIcon className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium">{formatExpiryDate(expiryDate)}</span>
              {expiryDate < new Date() && (
                <Badge className="bg-red-600">Expired</Badge>
              )}
            </div>
          </div>
        )}
        
        {documents.length > 0 ? (
          <div className="space-y-3">
            {documents.map((doc) => (
              <div key={doc.id} className="border rounded-md p-3 bg-gray-50">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium">{doc.name}</div>
                    <div className="text-sm text-gray-500">{doc.type}</div>
                    {doc.expirationDate && (
                      <div className="text-sm mt-1">
                        {formatExpiryDate(doc.expirationDate)}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(doc.status)}
                    {getExpiryBadge(doc)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Alert className="bg-amber-50 border-amber-200">
            <AlertTriangleIcon className="h-4 w-4 text-amber-600" />
            <AlertTitle>No documents uploaded</AlertTitle>
            <AlertDescription>
              Upload your {title} documentation to maintain compliance.
            </AlertDescription>
          </Alert>
        )}
        
        {!isCompliant && documents.length > 0 && (
          <Alert className="mt-4 bg-red-50 border-red-200">
            <XCircleIcon className="h-4 w-4 text-red-600" />
            <AlertTitle>Compliance issue detected</AlertTitle>
            <AlertDescription>
              {documents.some(doc => doc.status === 'REJECTED') 
                ? 'One or more documents have been rejected. Please upload new versions.'
                : documents.some(doc => isDocumentExpired(doc))
                  ? 'One or more documents have expired. Please upload renewed versions.'
                  : 'Documents are pending approval or missing. Please check status.'}
            </AlertDescription>
          </Alert>
        )}
        
        {documents.some(doc => isDocumentExpiring(doc)) && (
          <Alert className="mt-4 bg-amber-50 border-amber-200">
            <InfoIcon className="h-4 w-4 text-amber-600" />
            <AlertTitle>Documents expiring soon</AlertTitle>
            <AlertDescription>
              One or more documents will expire soon. Please upload renewed versions before they expire.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter>
        <Button asChild variant="outline" className="w-full">
          <Link href="/dashboard/childminder/documents">
            {documents.length > 0 ? 'Manage Documents' : 'Upload Documents'}
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ComplianceCard; 