'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, CheckCircle, AlertTriangle, XCircle, Clock, Download } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';

// Interface for document types
interface Document {
  id: string;
  name: string;
  type: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  expirationDate?: Date | null;
  category?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Interface for compliance data from API
interface ComplianceData {
  id: string;
  name: string | null;
  email: string;
  compliance: {
    isFullyCompliant: boolean;
    gardaVetting: {
      compliant: boolean;
      documents: Document[];
    };
    tuslaRegistration: {
      compliant: boolean;
      registrationNumber?: string | null;
      documents: Document[];
    };
    firstAid: {
      compliant: boolean;
      expiry?: Date | null;
      documents: Document[];
    };
    childrenFirst: {
      compliant: boolean;
      documents: Document[];
    };
  };
  documents: {
    all: Document[];
    expiring: Document[];
    expired: Document[];
  };
}

// Interface for API response
interface ComplianceResponse {
  summary: {
    total: number;
    compliant: number;
    nonCompliant: number;
    expiringDocuments: number;
    expiredDocuments: number;
  };
  childminders: ComplianceData[];
}

export default function AdminCompliancePage() {
  const [data, setData] = useState<ComplianceResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expiryFilter, setExpiryFilter] = useState<string>('30');
  const router = useRouter();

  // Fetch compliance data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/admin/compliance?status=${statusFilter}&expiryDays=${expiryFilter}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch compliance data');
        }
        
        const result: ComplianceResponse = await response.json();
        setData(result);
        setError(null);
      } catch (err) {
        setError('Error fetching compliance data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [statusFilter, expiryFilter]);

  // Filter childminders by search term
  const filteredChildminders = data?.childminders.filter(childminder => {
    const searchString = `${childminder.name} ${childminder.email}`.toLowerCase();
    return searchString.includes(searchTerm.toLowerCase());
  }) || [];
  
  // Get status badge for compliance status
  const getStatusBadge = (isCompliant: boolean) => {
    return isCompliant 
      ? <Badge className="bg-green-600">Compliant</Badge>
      : <Badge className="bg-red-600">Non-Compliant</Badge>;
  };
  
  // Get icon for compliance status
  const getStatusIcon = (isCompliant: boolean) => {
    return isCompliant 
      ? <CheckCircle className="h-5 w-5 text-green-600" />
      : <XCircle className="h-5 w-5 text-red-600" />;
  };
  
  // Format expiry date
  const formatExpiry = (date: Date | null | undefined) => {
    if (!date) return 'N/A';
    
    const expiryDate = new Date(date);
    const now = new Date();
    
    if (expiryDate < now) {
      return `Expired ${formatDistanceToNow(expiryDate, { addSuffix: true })}`;
    }
    
    return `Expires ${formatDistanceToNow(expiryDate, { addSuffix: true })}`;
  };
  
  // Handle clicking on a childminder row
  const handleRowClick = (id: string) => {
    router.push(`/dashboard/admin/documents?userId=${id}`);
  };
  
  // Render loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        <span className="ml-2">Loading compliance data...</span>
      </div>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <div className="container mx-auto py-6">
        <div className="bg-red-50 border border-red-200 p-4 rounded-md">
          <h2 className="text-red-600 font-semibold">Error</h2>
          <p>{error}</p>
          <Button onClick={() => window.location.reload()} className="mt-2">Retry</Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Compliance Dashboard</h1>
      
      {/* Summary Cards */}
      {data && (
        <div className="grid gap-4 md:grid-cols-5 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-500">Total Childminders</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{data.summary.total}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-500">Compliant</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
              <p className="text-2xl font-bold">{data.summary.compliant}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-500">Non-Compliant</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center">
              <XCircle className="h-5 w-5 text-red-600 mr-2" />
              <p className="text-2xl font-bold">{data.summary.nonCompliant}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-500">Expiring Soon</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center">
              <Clock className="h-5 w-5 text-amber-600 mr-2" />
              <p className="text-2xl font-bold">{data.summary.expiringDocuments}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-500">Expired</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
              <p className="text-2xl font-bold">{data.summary.expiredDocuments}</p>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <Input
            placeholder="Search by name or email"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="sm:w-48">
          <Select 
            value={statusFilter} 
            onValueChange={setStatusFilter}
          >
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Childminders</SelectItem>
              <SelectItem value="compliant">Compliant Only</SelectItem>
              <SelectItem value="non-compliant">Non-Compliant Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="sm:w-48">
          <Select 
            value={expiryFilter} 
            onValueChange={setExpiryFilter}
          >
            <SelectTrigger>
              <SelectValue placeholder="Expiry threshold" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Next 7 days</SelectItem>
              <SelectItem value="14">Next 14 days</SelectItem>
              <SelectItem value="30">Next 30 days</SelectItem>
              <SelectItem value="60">Next 60 days</SelectItem>
              <SelectItem value="90">Next 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Button variant="outline" className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>
      
      {/* Compliance Table */}
      <div className="bg-white rounded-md shadow overflow-hidden">
        <Tabs defaultValue="all">
          <TabsList className="px-4 pt-4">
            <TabsTrigger value="all">All Childminders</TabsTrigger>
            <TabsTrigger value="expiring">Expiring Documents</TabsTrigger>
            <TabsTrigger value="expired">Expired Documents</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Childminder</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Garda Vetting</TableHead>
                  <TableHead>Tusla Registration</TableHead>
                  <TableHead>First Aid</TableHead>
                  <TableHead>Children First</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredChildminders.length > 0 ? (
                  filteredChildminders.map((childminder) => (
                    <TableRow 
                      key={childminder.id} 
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleRowClick(childminder.id)}
                    >
                      <TableCell>
                        <div>
                          <p className="font-medium">{childminder.name || 'Unknown'}</p>
                          <p className="text-sm text-gray-500">{childminder.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(childminder.compliance.isFullyCompliant)}</TableCell>
                      <TableCell>{getStatusIcon(childminder.compliance.gardaVetting.compliant)}</TableCell>
                      <TableCell>{getStatusIcon(childminder.compliance.tuslaRegistration.compliant)}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          {getStatusIcon(childminder.compliance.firstAid.compliant)}
                          {childminder.compliance.firstAid.expiry && (
                            <span className="text-xs text-gray-500 mt-1">
                              {formatExpiry(childminder.compliance.firstAid.expiry)}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusIcon(childminder.compliance.childrenFirst.compliant)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4">
                      No childminders match your search criteria
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TabsContent>
          
          <TabsContent value="expiring">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Childminder</TableHead>
                  <TableHead>Document</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Expiry Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredChildminders.flatMap(childminder => 
                  childminder.documents.expiring.map(doc => (
                    <TableRow 
                      key={`${childminder.id}-${doc.id}`} 
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleRowClick(childminder.id)}
                    >
                      <TableCell>
                        <div>
                          <p className="font-medium">{childminder.name || 'Unknown'}</p>
                          <p className="text-sm text-gray-500">{childminder.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>{doc.name}</TableCell>
                      <TableCell>{doc.type}</TableCell>
                      <TableCell>
                        {doc.expirationDate && (
                          <div className="flex flex-col">
                            <span>{format(new Date(doc.expirationDate), 'MMM d, yyyy')}</span>
                            <span className="text-xs text-amber-600">
                              {formatDistanceToNow(new Date(doc.expirationDate), { addSuffix: true })}
                            </span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-amber-600">Expiring Soon</Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TabsContent>
          
          <TabsContent value="expired">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Childminder</TableHead>
                  <TableHead>Document</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Expired On</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredChildminders.flatMap(childminder => 
                  childminder.documents.expired.map(doc => (
                    <TableRow 
                      key={`${childminder.id}-${doc.id}`} 
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleRowClick(childminder.id)}
                    >
                      <TableCell>
                        <div>
                          <p className="font-medium">{childminder.name || 'Unknown'}</p>
                          <p className="text-sm text-gray-500">{childminder.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>{doc.name}</TableCell>
                      <TableCell>{doc.type}</TableCell>
                      <TableCell>
                        {doc.expirationDate && (
                          <div className="flex flex-col">
                            <span>{format(new Date(doc.expirationDate), 'MMM d, yyyy')}</span>
                            <span className="text-xs text-red-600">
                              {formatDistanceToNow(new Date(doc.expirationDate), { addSuffix: true })}
                            </span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-red-600">Expired</Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 