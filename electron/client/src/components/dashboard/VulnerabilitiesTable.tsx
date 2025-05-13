import React, { useState } from 'react';
import NeonBorder from '@/components/common/NeonBorder';
import { Button } from '@/components/ui/button';
import { Vulnerability } from '@/lib/types';
import { useVulnerabilityScanner } from '@/lib/hooks/useVulnerabilityScanner';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface VulnerabilitiesTableProps {
  maxItems?: number;
  showPagination?: boolean;
}

const VulnerabilitiesTable: React.FC<VulnerabilitiesTableProps> = ({ 
  maxItems = 5,
  showPagination = true
}) => {
  const { vulnerabilities, isLoadingVulnerabilities, updateVulnerabilityMutation } = useVulnerabilityScanner();
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();

  const handleFilter = () => {
    toast({
      title: "Filter",
      description: "Filtering vulnerabilities...",
    });
  };

  const handleExport = () => {
    toast({
      title: "Export",
      description: "Exporting vulnerabilities...",
    });
  };

  const handleInfoClick = (vuln: Vulnerability) => {
    toast({
      title: vuln.title,
      description: vuln.description || `CVE ID: ${vuln.cveId}`,
    });
  };

  const handleMitigateClick = async (vuln: Vulnerability) => {
    try {
      let newStatus: string;
      
      if (vuln.status === 'detected' || vuln.status === 'unpatched') {
        newStatus = 'mitigated';
      } else if (vuln.status === 'mitigated') {
        newStatus = 'unpatched';
      } else {
        newStatus = 'detected';
      }
      
      await updateVulnerabilityMutation.mutateAsync({
        id: vuln.id,
        status: newStatus
      });
      
      toast({
        title: "Vulnerability Updated",
        description: `Status changed to ${newStatus}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update vulnerability status",
        variant: "destructive"
      });
    }
  };

  // Pagination logic
  const itemsPerPage = maxItems;
  const totalItems = vulnerabilities?.length || 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  const paginatedVulnerabilities = vulnerabilities ? 
    vulnerabilities.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage) : 
    [];

  // Severity badge
  const renderSeverityBadge = (severity: string) => {
    const severityColors = {
      critical: "bg-destructive text-white",
      high: "bg-destructive text-white",
      medium: "bg-yellow-500 text-black",
      low: "bg-gray-400 text-black"
    };
    
    const color = severityColors[severity as keyof typeof severityColors] || severityColors.low;
    
    return (
      <span className="flex items-center">
        <span className={`w-2 h-2 rounded-full ${severity === 'critical' || severity === 'high' ? 'bg-destructive' : severity === 'medium' ? 'bg-yellow-500' : 'bg-gray-400'} mr-2`}></span>
        <span className={`font-medium`}>
          {severity.charAt(0).toUpperCase() + severity.slice(1)}
        </span>
      </span>
    );
  };

  // Status badge
  const renderStatusBadge = (status: string) => {
    const statusColors = {
      unpatched: "bg-destructive bg-opacity-20 text-destructive",
      detected: "bg-yellow-500 bg-opacity-20 text-yellow-500",
      mitigated: "bg-green-500 bg-opacity-20 text-green-500",
      ignored: "bg-gray-700 text-gray-300"
    };
    
    const color = statusColors[status as keyof typeof statusColors] || statusColors.detected;
    
    return (
      <span className={`text-xs ${color} px-2 py-1 rounded-full`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <NeonBorder color="magenta">
      <div className="p-4 border-b border-gray-800 flex justify-between items-center">
        <h2 className="text-xl font-bold font-rajdhani text-white flex items-center">
          <i className="ri-bug-line mr-2 text-secondary"></i>
          Vulnerabilities Detected
        </h2>
        <div className="flex space-x-3">
          <Button 
            onClick={handleFilter}
            variant="outline" 
            size="sm" 
            className="text-gray-400 hover:text-white flex items-center"
          >
            <i className="ri-filter-3-line mr-1"></i> Filter
          </Button>
          <Button 
            onClick={handleExport}
            variant="outline" 
            size="sm" 
            className="text-gray-400 hover:text-white flex items-center"
          >
            <i className="ri-file-download-line mr-1"></i> Export
          </Button>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        {isLoadingVulnerabilities ? (
          <div className="text-center py-8 text-gray-400">
            Loading vulnerabilities...
          </div>
        ) : paginatedVulnerabilities.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            No vulnerabilities detected
          </div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="bg-background text-gray-400 text-xs uppercase">
              <tr>
                <th className="px-4 py-3">Severity</th>
                <th className="px-4 py-3">IP Address</th>
                <th className="px-4 py-3">Vulnerability</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedVulnerabilities.map((vuln: Vulnerability) => {
                // Find associated device to get IP address
                const device = vulnerabilities?.find((v: any) => v.id === vuln.deviceId);
                const ipAddress = device?.ipAddress || "Unknown";
                
                return (
                  <tr key={vuln.id} className="border-b border-gray-800 hover:bg-background transition duration-150">
                    <td className="px-4 py-3">
                      {renderSeverityBadge(vuln.severity)}
                    </td>
                    <td className="px-4 py-3 text-gray-300">{ipAddress}</td>
                    <td className="px-4 py-3 text-gray-300">
                      <div>{vuln.cveId || "CVE-XXXX-XXXX"}</div>
                      <div className="text-gray-500 text-xs">{vuln.title}</div>
                    </td>
                    <td className="px-4 py-3">
                      {renderStatusBadge(vuln.status)}
                    </td>
                    <td className="px-4 py-3">
                      <button 
                        onClick={() => handleInfoClick(vuln)}
                        className="text-primary hover:text-white mr-2"
                      >
                        <i className="ri-information-line"></i>
                      </button>
                      <button 
                        onClick={() => handleMitigateClick(vuln)}
                        className="text-secondary hover:text-white"
                      >
                        <i className="ri-shield-flash-line"></i>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      
      {showPagination && totalPages > 1 && (
        <div className="p-4 border-t border-gray-800 flex justify-between items-center">
          <div className="text-sm text-gray-400">
            Showing {paginatedVulnerabilities.length} of {totalItems} vulnerabilities
          </div>
          <div className="flex space-x-1">
            <button 
              className={cn(
                "w-8 h-8 flex items-center justify-center rounded-md text-gray-400 hover:text-white",
                currentPage === 1 ? "bg-background opacity-50" : "bg-background"
              )}
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              <i className="ri-arrow-left-s-line"></i>
            </button>
            
            {Array.from({ length: Math.min(totalPages, 3) }).map((_, index) => {
              // Show pages around current page
              let pageNum = currentPage;
              if (totalPages <= 3) {
                pageNum = index + 1;
              } else if (currentPage === 1) {
                pageNum = index + 1;
              } else if (currentPage === totalPages) {
                pageNum = totalPages - 2 + index;
              } else {
                pageNum = currentPage - 1 + index;
              }
              
              return (
                <button
                  key={pageNum}
                  className={cn(
                    "w-8 h-8 flex items-center justify-center rounded-md",
                    currentPage === pageNum ? "bg-popover text-white" : "bg-background text-gray-400 hover:text-white"
                  )}
                  onClick={() => setCurrentPage(pageNum)}
                >
                  {pageNum}
                </button>
              );
            })}
            
            <button 
              className={cn(
                "w-8 h-8 flex items-center justify-center rounded-md text-gray-400 hover:text-white",
                currentPage === totalPages ? "bg-background opacity-50" : "bg-background"
              )}
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              <i className="ri-arrow-right-s-line"></i>
            </button>
          </div>
        </div>
      )}
    </NeonBorder>
  );
};

export default VulnerabilitiesTable;
