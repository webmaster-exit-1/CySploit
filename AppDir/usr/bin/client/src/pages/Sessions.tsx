import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNetworkScanner } from '@/lib/hooks/useNetworkScanner';
import { useVulnerabilityScanner } from '@/lib/hooks/useVulnerabilityScanner';
import { usePacketAnalyzer } from '@/lib/hooks/usePacketAnalyzer';
import { useSessions } from '@/lib/hooks/useSessions';
import { Session } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import NeonBorder from '@/components/common/NeonBorder';
import { formatDate } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

const Sessions: React.FC = () => {
  const { sessions, isLoadingSessions, getActiveSessions, getRecentSessions, formatSessionDuration, endSessionMutation } = useSessions();
  const { toast } = useToast();
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  
  // Set page title
  useEffect(() => {
    document.title = 'Sessions | CySploit';
  }, []);
  
  // Active and completed sessions
  const activeSessions = getActiveSessions();
  const recentSessions = getRecentSessions();
  
  const handleEndSession = async (id: number) => {
    try {
      await endSessionMutation.mutateAsync(id);
      
      toast({
        title: "Session Ended",
        description: `Session ${id} has been successfully ended`
      });
      
      // If this was the selected session, deselect it
      if (selectedSession && selectedSession.id === id) {
        setSelectedSession(null);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to end session: ${error instanceof Error ? error.message : "Unknown error"}`,
        variant: "destructive"
      });
    }
  };
  
  // Format session type
  const getSessionTypeInfo = (session: Session) => {
    const { networkData } = session;
    
    if (!networkData) return { type: "Unknown", icon: "ri-question-line", color: "gray" };
    
    if (networkData.scanType === "network") {
      return { 
        type: "Network Scan", 
        icon: "ri-radar-line", 
        color: "primary",
        details: `Scanned ${networkData.cidr || "network"}, found ${networkData.deviceCount || 0} devices`
      };
    }
    
    if (networkData.scanType === "vulnerability") {
      return { 
        type: "Vulnerability Scan", 
        icon: "ri-shield-check-line", 
        color: "secondary",
        details: `Found ${networkData.vulnerabilityCount || 0} vulnerabilities`
      };
    }
    
    if (networkData.captureType === "live") {
      return { 
        type: "Packet Capture", 
        icon: "ri-file-search-line", 
        color: "accent",
        details: `Interface: ${networkData.interface}, Filter: ${networkData.filter || "none"}`
      };
    }
    
    return { type: "Other", icon: "ri-file-line", color: "gray" };
  };
  
  // Generate stats for charts
  const generateSessionStats = () => {
    if (!sessions) return [];
    
    const sessionTypes: Record<string, number> = {};
    
    sessions.forEach(session => {
      const { networkData } = session;
      if (!networkData) {
        sessionTypes["Other"] = (sessionTypes["Other"] || 0) + 1;
        return;
      }
      
      if (networkData.scanType === "network") {
        sessionTypes["Network Scan"] = (sessionTypes["Network Scan"] || 0) + 1;
      } else if (networkData.scanType === "vulnerability") {
        sessionTypes["Vulnerability Scan"] = (sessionTypes["Vulnerability Scan"] || 0) + 1;
      } else if (networkData.captureType === "live") {
        sessionTypes["Packet Capture"] = (sessionTypes["Packet Capture"] || 0) + 1;
      } else {
        sessionTypes["Other"] = (sessionTypes["Other"] || 0) + 1;
      }
    });
    
    return Object.entries(sessionTypes).map(([name, value]) => ({ name, value }));
  };
  
  const sessionStats = generateSessionStats();

  return (
    <>
      <Helmet>
        <title>Sessions | CySploit</title>
        <meta name="description" content="Manage and review network scanning and monitoring sessions" />
      </Helmet>
      
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-rajdhani text-white mb-2">Session <span className="text-primary">Management</span></h1>
        <p className="text-gray-400">Manage and review your network scanning and monitoring sessions</p>
      </div>
      
      {/* Sessions Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Session Stats */}
        <NeonBorder color="purple">
          <CardHeader>
            <CardTitle className="font-rajdhani">Session Statistics</CardTitle>
            <CardDescription>
              Overview of session types and activity
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingSessions ? (
              <div className="flex justify-center items-center h-64">
                <p className="text-gray-400">Loading statistics...</p>
              </div>
            ) : sessionStats.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart
                  data={sessionStats}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(50, 59, 79, 0.5)" />
                  <XAxis dataKey="name" stroke="#767676" />
                  <YAxis stroke="#767676" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(13, 17, 23, 0.9)',
                      border: '1px solid #323B4F',
                      borderRadius: '0.25rem'
                    }}
                  />
                  <Bar dataKey="value" name="Count" fill="#00FFFF" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex justify-center items-center h-64">
                <p className="text-gray-400">No sessions data available</p>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="bg-background p-3 rounded-lg text-center">
                <p className="text-xs text-gray-400 mb-1">Active Sessions</p>
                <p className="text-2xl font-bold text-primary">{activeSessions?.length || 0}</p>
              </div>
              <div className="bg-background p-3 rounded-lg text-center">
                <p className="text-xs text-gray-400 mb-1">Total Sessions</p>
                <p className="text-2xl font-bold text-white">{sessions?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </NeonBorder>
        
        {/* Session Management */}
        <NeonBorder color="cyan" className="lg:col-span-2">
          <Tabs defaultValue="active">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="font-rajdhani">Manage Sessions</CardTitle>
                <TabsList>
                  <TabsTrigger value="active">Active</TabsTrigger>
                  <TabsTrigger value="recent">Recent</TabsTrigger>
                </TabsList>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <TabsContent value="active" className="mt-0">
                {isLoadingSessions ? (
                  <div className="flex justify-center items-center p-8">
                    <p className="text-gray-400">Loading sessions...</p>
                  </div>
                ) : activeSessions?.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Started</TableHead>
                          <TableHead>Duration</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {activeSessions.map((session: Session) => {
                          const sessionType = getSessionTypeInfo(session);
                          return (
                            <TableRow 
                              key={session.id}
                              className="cursor-pointer hover:bg-background"
                              onClick={() => setSelectedSession(session)}
                            >
                              <TableCell>{session.id}</TableCell>
                              <TableCell>{session.name}</TableCell>
                              <TableCell>
                                <div className="flex items-center">
                                  <i className={`${sessionType.icon} mr-2 text-${sessionType.color}`}></i>
                                  {sessionType.type}
                                </div>
                              </TableCell>
                              <TableCell>{formatDate(session.startedAt)}</TableCell>
                              <TableCell>{formatSessionDuration(session)}</TableCell>
                              <TableCell>
                                <div className="flex space-x-1">
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedSession(session);
                                    }}
                                  >
                                    <i className="ri-information-line"></i>
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    className="text-destructive"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEndSession(session.id);
                                    }}
                                  >
                                    <i className="ri-stop-circle-line"></i>
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="flex justify-center items-center p-8">
                    <p className="text-gray-400">No active sessions</p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="recent" className="mt-0">
                {isLoadingSessions ? (
                  <div className="flex justify-center items-center p-8">
                    <p className="text-gray-400">Loading sessions...</p>
                  </div>
                ) : recentSessions?.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Started</TableHead>
                          <TableHead>Duration</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {recentSessions.map((session: Session) => {
                          const sessionType = getSessionTypeInfo(session);
                          return (
                            <TableRow 
                              key={session.id}
                              className="cursor-pointer hover:bg-background"
                              onClick={() => setSelectedSession(session)}
                            >
                              <TableCell>{session.id}</TableCell>
                              <TableCell>{session.name}</TableCell>
                              <TableCell>
                                <div className="flex items-center">
                                  <i className={`${sessionType.icon} mr-2 text-${sessionType.color}`}></i>
                                  {sessionType.type}
                                </div>
                              </TableCell>
                              <TableCell>{formatDate(session.startedAt)}</TableCell>
                              <TableCell>{formatSessionDuration(session)}</TableCell>
                              <TableCell>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedSession(session);
                                  }}
                                >
                                  <i className="ri-information-line"></i>
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="flex justify-center items-center p-8">
                    <p className="text-gray-400">No recent sessions</p>
                  </div>
                )}
              </TabsContent>
            </CardContent>
          </Tabs>
        </NeonBorder>
      </div>
      
      {/* Selected Session Details */}
      {selectedSession && (
        <NeonBorder color="magenta" className="mb-8">
          <CardHeader className="flex flex-row items-start justify-between space-y-0">
            <div>
              <CardTitle className="font-rajdhani">Session Details</CardTitle>
              <CardDescription>{selectedSession.name}</CardDescription>
            </div>
            <Badge variant={selectedSession.isActive ? "default" : "outline"}>
              {selectedSession.isActive ? "Active" : "Completed"}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm text-gray-400 mb-1">Session Information</h3>
                  <div className="bg-background p-3 rounded-lg space-y-2">
                    <div className="grid grid-cols-3 gap-2">
                      <div className="text-gray-400 text-sm">ID:</div>
                      <div className="col-span-2 font-mono">{selectedSession.id}</div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="text-gray-400 text-sm">Started:</div>
                      <div className="col-span-2 font-mono">{formatDate(selectedSession.startedAt)}</div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="text-gray-400 text-sm">Ended:</div>
                      <div className="col-span-2 font-mono">
                        {selectedSession.endedAt ? formatDate(selectedSession.endedAt) : 'Still active'}
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="text-gray-400 text-sm">Duration:</div>
                      <div className="col-span-2 font-mono">{formatSessionDuration(selectedSession)}</div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm text-gray-400 mb-1">Session Type</h3>
                  <div className="bg-background p-3 rounded-lg">
                    <div className="flex items-center mb-2">
                      {(() => {
                        const sessionType = getSessionTypeInfo(selectedSession);
                        return (
                          <>
                            <div className={`w-8 h-8 rounded-full bg-${sessionType.color} bg-opacity-20 flex items-center justify-center mr-2`}>
                              <i className={`${sessionType.icon} text-${sessionType.color}`}></i>
                            </div>
                            <div className="font-medium">{sessionType.type}</div>
                          </>
                        );
                      })()}
                    </div>
                    <div className="text-sm text-gray-400">
                      {(() => {
                        const sessionType = getSessionTypeInfo(selectedSession);
                        return sessionType.details || 'No additional details';
                      })()}
                    </div>
                  </div>
                </div>
                
                {selectedSession.isActive && (
                  <Button 
                    variant="destructive" 
                    onClick={() => handleEndSession(selectedSession.id)}
                    className="w-full"
                  >
                    <i className="ri-stop-circle-line mr-2"></i>
                    End Session
                  </Button>
                )}
              </div>
              
              <div>
                <h3 className="text-sm text-gray-400 mb-1">Session Data</h3>
                <div className="bg-background p-3 rounded-lg h-64 overflow-auto">
                  <pre className="text-xs font-mono">
                    {selectedSession.networkData ? 
                      JSON.stringify(selectedSession.networkData, null, 2) : 
                      'No additional data'}
                  </pre>
                </div>
                
                <div className="mt-4 flex space-x-2">
                  <Button variant="outline" className="flex-1">
                    <i className="ri-file-download-line mr-2"></i>
                    Export
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <i className="ri-bar-chart-line mr-2"></i>
                    Analyze
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </NeonBorder>
      )}
    </>
  );
};

export default Sessions;
