import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet';
import TerminalConsole from '@/components/dashboard/TerminalConsole';
import NeonBorder from '@/components/common/NeonBorder';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNetworkScanner } from '@/lib/hooks/useNetworkScanner';
import { useVulnerabilityScanner } from '@/lib/hooks/useVulnerabilityScanner';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const Terminal: React.FC = () => {
  const { devices } = useNetworkScanner();
  const { vulnerabilities, getVulnerabilityCounts } = useVulnerabilityScanner();
  
  // Get vulnerability counts
  const vulnCounts = getVulnerabilityCounts(vulnerabilities);
  
  // Set page title
  useEffect(() => {
    document.title = 'Terminal | CySploit';
  }, []);
  
  return (
    <>
      <Helmet>
        <title>Terminal | CySploit</title>
        <meta name="description" content="Interactive command line interface for network security analysis and management" />
      </Helmet>
      
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-rajdhani text-white mb-2">Interactive <span className="text-primary">Terminal</span></h1>
        <p className="text-gray-400">Command-line interface for advanced network security operations</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Terminal Console - Main area */}
        <div className="lg:col-span-2">
          <TerminalConsole maxHeight="h-[600px]" />
        </div>
        
        {/* Help and Statistics */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <NeonBorder color="purple">
            <CardHeader>
              <CardTitle className="font-rajdhani">Network Stats</CardTitle>
              <CardDescription>
                Current network status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Devices:</span>
                  <Badge variant="outline" className="font-mono">
                    {devices?.length || 0}
                  </Badge>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Vulnerabilities:</span>
                  <div className="flex space-x-2">
                    <Badge variant="destructive" className="font-mono">
                      {vulnCounts.critical} critical
                    </Badge>
                    <Badge variant="secondary" className="font-mono">
                      {vulnCounts.total} total
                    </Badge>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Traffic:</span>
                  <Badge variant="outline" className="font-mono">
                    1.8 GB
                  </Badge>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Last scan:</span>
                  <Badge variant="outline" className="font-mono">
                    {new Date().toLocaleTimeString()}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </NeonBorder>
          
          {/* Command Help */}
          <NeonBorder color="cyan">
            <Tabs defaultValue="basic">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="font-rajdhani">Command Help</CardTitle>
                  <TabsList>
                    <TabsTrigger value="basic">Basic</TabsTrigger>
                    <TabsTrigger value="advanced">Advanced</TabsTrigger>
                  </TabsList>
                </div>
                <CardDescription>
                  Available terminal commands
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TabsContent value="basic">
                  <div className="space-y-3">
                    <div className="bg-black p-2 rounded">
                      <div className="font-mono text-primary mb-1">scan -target [ip/cidr]</div>
                      <div className="text-xs text-gray-400">Scan network or specific device</div>
                    </div>
                    
                    <div className="bg-black p-2 rounded">
                      <div className="font-mono text-primary mb-1">vuln-scan -target [ip]</div>
                      <div className="text-xs text-gray-400">Scan for vulnerabilities</div>
                    </div>
                    
                    <div className="bg-black p-2 rounded">
                      <div className="font-mono text-primary mb-1">show devices</div>
                      <div className="text-xs text-gray-400">List all discovered devices</div>
                    </div>
                    
                    <div className="bg-black p-2 rounded">
                      <div className="font-mono text-primary mb-1">show vulns</div>
                      <div className="text-xs text-gray-400">List all vulnerabilities</div>
                    </div>
                    
                    <div className="bg-black p-2 rounded">
                      <div className="font-mono text-primary mb-1">help</div>
                      <div className="text-xs text-gray-400">Show all available commands</div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="advanced">
                  <div className="space-y-3">
                    <div className="bg-black p-2 rounded">
                      <div className="font-mono text-primary mb-1">packet-capture -i [interface] -f [filter]</div>
                      <div className="text-xs text-gray-400">Capture network packets</div>
                    </div>
                    
                    <div className="bg-black p-2 rounded">
                      <div className="font-mono text-primary mb-1">stop-capture -s [session_id]</div>
                      <div className="text-xs text-gray-400">Stop packet capture</div>
                    </div>
                    
                    <div className="bg-black p-2 rounded">
                      <div className="font-mono text-primary mb-1">network-map</div>
                      <div className="text-xs text-gray-400">Generate network map</div>
                    </div>
                    
                    <div className="bg-black p-2 rounded">
                      <div className="font-mono text-primary mb-1">show interfaces</div>
                      <div className="text-xs text-gray-400">List network interfaces</div>
                    </div>
                  </div>
                </TabsContent>
              </CardContent>
            </Tabs>
          </NeonBorder>
        </div>
      </div>
      
      {/* Command History */}
      <NeonBorder color="magenta" className="mb-8">
        <CardHeader>
          <CardTitle className="font-rajdhani">Command History</CardTitle>
          <CardDescription>
            Recently executed commands
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="bg-black bg-opacity-50 p-3 rounded-lg">
              <div className="flex items-start">
                <span className={cn("text-xs px-1.5 py-0.5 rounded mr-2", "bg-primary bg-opacity-20 text-primary")}>
                  23:15:42
                </span>
                <div className="flex-1">
                  <div className="font-mono text-sm mb-1">scan -target 192.168.1.0/24</div>
                  <div className="text-xs text-gray-400">Found 18 devices on network</div>
                </div>
                <button className="text-gray-500 hover:text-primary">
                  <i className="ri-repeat-line"></i>
                </button>
              </div>
            </div>
            
            <div className="bg-black bg-opacity-50 p-3 rounded-lg">
              <div className="flex items-start">
                <span className={cn("text-xs px-1.5 py-0.5 rounded mr-2", "bg-secondary bg-opacity-20 text-secondary")}>
                  23:10:18
                </span>
                <div className="flex-1">
                  <div className="font-mono text-sm mb-1">vuln-scan -target 192.168.1.5 -level deep</div>
                  <div className="text-xs text-gray-400">Found 3 vulnerabilities (2 critical)</div>
                </div>
                <button className="text-gray-500 hover:text-primary">
                  <i className="ri-repeat-line"></i>
                </button>
              </div>
            </div>
            
            <div className="bg-black bg-opacity-50 p-3 rounded-lg">
              <div className="flex items-start">
                <span className={cn("text-xs px-1.5 py-0.5 rounded mr-2", "bg-accent bg-opacity-20 text-accent")}>
                  22:58:33
                </span>
                <div className="flex-1">
                  <div className="font-mono text-sm mb-1">show devices</div>
                  <div className="text-xs text-gray-400">Listed 18 devices</div>
                </div>
                <button className="text-gray-500 hover:text-primary">
                  <i className="ri-repeat-line"></i>
                </button>
              </div>
            </div>
            
            <div className="bg-black bg-opacity-50 p-3 rounded-lg">
              <div className="flex items-start">
                <span className={cn("text-xs px-1.5 py-0.5 rounded mr-2", "bg-green-500 bg-opacity-20 text-green-500")}>
                  22:45:07
                </span>
                <div className="flex-1">
                  <div className="font-mono text-sm mb-1">packet-capture -i eth0 -f "host 192.168.1.5"</div>
                  <div className="text-xs text-gray-400">Started packet capture (session ID: 1)</div>
                </div>
                <button className="text-gray-500 hover:text-primary">
                  <i className="ri-repeat-line"></i>
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </NeonBorder>
    </>
  );
};

export default Terminal;
