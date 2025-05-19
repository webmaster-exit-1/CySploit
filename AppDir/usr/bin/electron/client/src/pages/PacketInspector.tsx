import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useNetworkScanner } from '@/lib/hooks/useNetworkScanner';
import { usePacketAnalyzer } from '@/lib/hooks/usePacketAnalyzer';
import { useSessions } from '@/lib/hooks/useSessions';
import { Packet, TrafficAnalysis } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Helmet } from 'react-helmet';
import NeonBorder from '@/components/common/NeonBorder';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

const PacketInspector: React.FC = () => {
  const { networkInterfaces, isLoadingInterfaces } = useNetworkScanner();
  const {
    startCaptureMutation,
    stopCaptureMutation,
    getSessionPackets,
    formatPacketForDisplay,
    analyzeTrafficMutation,
    captureInProgress,
    isSessionActive,
    generatePacketMutation
  } = usePacketAnalyzer();
  const { sessions, getSession, isLoadingSessions } = useSessions();

  const [selectedInterface, setSelectedInterface] = useState<string>('');
  const [captureFilter, setCaptureFilter] = useState<string>('');
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [packetAnalysis, setPacketAnalysis] = useState<TrafficAnalysis | null>(null);
  const [selectedPacket, setSelectedPacket] = useState<Packet | null>(null);

  const { toast } = useToast();

  // Get session packets when session is selected
  const {
    data: sessionPackets,
    isLoading: isLoadingPackets
  } = getSessionPackets(selectedSessionId || 0);

  // Set page title
  useEffect(() => {
    document.title = 'Packet Inspector | CySploit';
  }, []);

  const handleStartCapture = async () => {
    if (!selectedInterface) {
      toast({
        title: "Invalid Selection",
        description: "Please select a network interface",
        variant: "destructive"
      });
      return;
    }

    try {
      const result = await startCaptureMutation.mutateAsync({
        interface_: selectedInterface,
        filter: captureFilter,
        sessionName: `Packet Capture - ${selectedInterface}${captureFilter ? ` (${captureFilter})` : ''}`
      });

      setSelectedSessionId(result.sessionId);

      toast({
        title: "Capture Started",
        description: `Session ID: ${result.sessionId}`
      });
    } catch (error) {
      toast({
        title: "Failed to Start Capture",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    }
  };

  const handleStopCapture = async () => {
    if (!selectedSessionId) {
      toast({
        title: "Invalid Session",
        description: "No active capture session to stop",
        variant: "destructive"
      });
      return;
    }

    try {
      const result = await stopCaptureMutation.mutateAsync(selectedSessionId);

      toast({
        title: "Capture Stopped",
        description: `Session ID: ${result.sessionId}`
      });
    } catch (error) {
      toast({
        title: "Failed to Stop Capture",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    }
  };

  const handleAnalyzeTraffic = async () => {
    if (!selectedSessionId) {
      toast({
        title: "Invalid Session",
        description: "Please select a session to analyze",
        variant: "destructive"
      });
      return;
    }

    try {
      const result = await analyzeTrafficMutation.mutateAsync(selectedSessionId);
      setPacketAnalysis(result);

      toast({
        title: "Traffic Analysis Complete",
        description: `Found ${result.anomalies.length} anomalies`
      });
    } catch (error) {
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    }
  };

  const handlePacketClick = (packet: Packet) => {
    setSelectedPacket(packet);
  };

  // Prepare protocol distribution data for chart
  const prepareProtocolData = () => {
    if (!packetAnalysis) return [];

    return Object.entries(packetAnalysis.statistics.protocolDistribution).map(([protocol, count]) => ({
      name: protocol,
      value: count,
      color: getProtocolColor(protocol)
    }));
  };

  // Get color for protocol
  const getProtocolColor = (protocol: string) => {
    const colors: Record<string, string> = {
      'TCP': '#00FFFF', // cyan
      'UDP': '#FF00FF', // magenta
      'HTTP': '#9D00FF', // purple
      'HTTPS': '#00FF66', // green
      'DNS': '#FFCC00', // yellow
      'ICMP': '#FF3366'  // red
    };

    return colors[protocol] || '#AAAAAA';
  };

  // Format protocols
  const formatProtocol = (protocol: string) => {
    if (!protocol) return 'Unknown';

    // If protocol is already uppercase, return it
    if (protocol === protocol.toUpperCase()) return protocol;

    // Otherwise, capitalize first letter
    return protocol.charAt(0).toUpperCase() + protocol.slice(1);
  };

  const protocolChartData = prepareProtocolData();

  return (
    <>
      <Helmet>
        <title>Packet Inspector | CySploit</title>
        <meta name="description" content="Inspect and analyze network traffic packets with real-time capture and visualization" />
      </Helmet>

      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-rajdhani text-white mb-2">Packet <span className="text-primary">Inspector</span></h1>
        <p className="text-gray-400">Capture and analyze network traffic packets in real-time</p>
      </div>

      {/* Capture Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <NeonBorder color="cyan" className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-rajdhani">Packet Capture</CardTitle>
            <CardDescription>
              Configure and start packet capture on a network interface
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Network Interface</label>
                <Select value={selectedInterface} onValueChange={setSelectedInterface} disabled={captureInProgress}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select network interface" />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingInterfaces ? (
                      <SelectItem value="loading" disabled>Loading interfaces...</SelectItem>
                    ) : Array.isArray(networkInterfaces) && networkInterfaces.length > 0 ? (
                      networkInterfaces.map((iface: any) => (
                        <SelectItem key={iface.name} value={iface.name}>
                          {iface.name} ({iface.address})
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>No interfaces found</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-2 block">Capture Filter (Optional)</label>
                <Input
                  value={captureFilter}
                  onChange={(e) => setCaptureFilter(e.target.value)}
                  placeholder="e.g. host 192.168.1.5 or port 80"
                  disabled={captureInProgress}
                />
              </div>
            </div>

            <div className="flex justify-between">
              <Button
                onClick={handleStartCapture}
                disabled={!selectedInterface || captureInProgress}
                className="flex-1 mr-2"
              >
                <i className="ri-play-circle-line mr-2"></i>
                Start Capture
              </Button>

              <Button
                onClick={handleStopCapture}
                disabled={!captureInProgress || !selectedSessionId}
                variant="destructive"
                className="flex-1 ml-2"
              >
                <i className="ri-stop-circle-line mr-2"></i>
                Stop Capture
              </Button>
            </div>
          </CardContent>
        </NeonBorder>

        <NeonBorder color="magenta">
          <CardHeader>
            <CardTitle className="font-rajdhani">Sessions</CardTitle>
            <CardDescription>
              Select a capture session to analyze
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select
              value={selectedSessionId?.toString() || ""}
              onValueChange={(value) => setSelectedSessionId(parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a capture session" />
              </SelectTrigger>
              <SelectContent>
                {isLoadingSessions ? (
                  <SelectItem value="loading" disabled>Loading sessions...</SelectItem>
                ) : sessions && sessions.length > 0 ? (
                  sessions.map((session: any) => (
                    <SelectItem key={session.id} value={session.id.toString()}>
                      {session.name} {session.isActive && '(Active)'}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="none" disabled>No sessions found</SelectItem>
                )}
              </SelectContent>
            </Select>

            <Button
              onClick={handleAnalyzeTraffic}
              disabled={!selectedSessionId}
              className="w-full mt-4"
              variant="outline"
            >
              <i className="ri-bar-chart-line mr-2"></i>
              Analyze Traffic
            </Button>
          </CardContent>
        </NeonBorder>
      </div>

      {/* Packet Capture Results */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Packet List */}
        <NeonBorder color="purple" className="lg:col-span-2">
          <div className="p-4 border-b border-gray-800 flex justify-between items-center">
            <h2 className="text-xl font-bold font-rajdhani text-white flex items-center">
              <i className="ri-file-list-line mr-2 text-accent"></i>
              Captured Packets
            </h2>
            <div className="flex items-center">
              {selectedSessionId && isSessionActive(selectedSessionId) && (
                <div className="flex items-center mr-3">
                  <span className="relative flex h-2 w-2 mr-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                  </span>
                  <span className="text-xs text-primary">Capturing</span>
                </div>
              )}
              <div className="text-sm text-gray-400">
                {Array.isArray(sessionPackets) ? sessionPackets.length : 0} packets
              </div>
            </div>
          </div>

          <ScrollArea className="h-80">
            {isLoadingPackets ? (
              <div className="flex justify-center items-center h-full">
                <p className="text-gray-400">Loading packets...</p>
              </div>
            ) : Array.isArray(sessionPackets) && sessionPackets.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Destination</TableHead>
                    <TableHead>Protocol</TableHead>
                    <TableHead>Size</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessionPackets.map((packet: Packet) => {
                    const formattedPacket = formatPacketForDisplay(packet);
                    return (
                      <TableRow
                        key={packet.id}
                        className={cn(
                          "cursor-pointer hover:bg-background transition-colors",
                          selectedPacket?.id === packet.id && "bg-background"
                        )}
                        onClick={() => handlePacketClick(packet)}
                      >
                        <TableCell>{packet.id}</TableCell>
                        <TableCell>{new Date(packet.timestamp).toLocaleTimeString()}</TableCell>
                        <TableCell>{packet.sourceIp}:{packet.sourcePort}</TableCell>
                        <TableCell>{packet.destinationIp}:{packet.destinationPort}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            style={{
                              color: getProtocolColor(packet.protocol || ''),
                              borderColor: getProtocolColor(packet.protocol || '')
                            }}
                          >
                            {formatProtocol(packet.protocol || 'Unknown')}
                          </Badge>
                        </TableCell>
                        <TableCell>{packet.size || 0} bytes</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="flex justify-center items-center h-full">
                <p className="text-gray-400">No packets captured yet</p>
              </div>
            )}
          </ScrollArea>
        </NeonBorder>

        {/* Packet Details */}
        <NeonBorder color="cyan">
          <div className="p-4 border-b border-gray-800">
            <h2 className="text-xl font-bold font-rajdhani text-white flex items-center">
              <i className="ri-file-search-line mr-2 text-primary"></i>
              Packet Details
            </h2>
          </div>

          <ScrollArea className="h-80 p-4">
            {selectedPacket ? (
              <div className="space-y-4">
                <div className="bg-background p-3 rounded-lg">
                  <h3 className="text-sm text-gray-400 mb-1">Header</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-gray-400">Protocol:</p>
                      <p className="font-mono">{formatProtocol(selectedPacket.protocol || 'Unknown')}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Size:</p>
                      <p className="font-mono">{selectedPacket.size || 0} bytes</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Source:</p>
                      <p className="font-mono">{selectedPacket.sourceIp}:{selectedPacket.sourcePort}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Destination:</p>
                      <p className="font-mono">{selectedPacket.destinationIp}:{selectedPacket.destinationPort}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Timestamp:</p>
                      <p className="font-mono">{new Date(selectedPacket.timestamp).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Session ID:</p>
                      <p className="font-mono">{selectedPacket.sessionId || 'None'}</p>
                    </div>
                  </div>
                </div>

                {selectedPacket.data && (
                  <div className="bg-background p-3 rounded-lg">
                    <h3 className="text-sm text-gray-400 mb-1">Packet Data</h3>
                    <pre className="text-xs font-mono bg-black p-2 rounded overflow-x-auto">
                      {JSON.stringify(selectedPacket.data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex justify-center items-center h-full">
                <p className="text-gray-400">Select a packet to view details</p>
              </div>
            )}
          </ScrollArea>
        </NeonBorder>
      </div>

      {/* Traffic Analysis */}
      {packetAnalysis && (
        <NeonBorder color="magenta" className="mb-8">
          <CardHeader>
            <CardTitle className="font-rajdhani">Traffic Analysis Results</CardTitle>
            <CardDescription>
              Analysis for session ID: {selectedSessionId}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Protocol Distribution */}
              <div className="bg-background p-4 rounded-lg">
                <h3 className="text-lg font-medium mb-2">Protocol Distribution</h3>
                {protocolChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={protocolChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={60}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {protocolChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => [`${value} packets`, 'Count']}
                        contentStyle={{
                          backgroundColor: 'rgba(13, 17, 23, 0.9)',
                          border: '1px solid #323B4F',
                          borderRadius: '0.25rem'
                        }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex justify-center items-center h-40">
                    <p className="text-gray-400">No protocol data available</p>
                  </div>
                )}
              </div>

              {/* Top Destinations */}
              <div className="bg-background p-4 rounded-lg">
                <h3 className="text-lg font-medium mb-2">Top Destinations</h3>
                {packetAnalysis.statistics.topDestinations &&
                 packetAnalysis.statistics.topDestinations.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart
                      data={packetAnalysis.statistics.topDestinations}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(50, 59, 79, 0.5)" />
                      <XAxis type="number" />
                      <YAxis
                        dataKey="ip"
                        type="category"
                        width={100}
                        tick={{ fontSize: 10 }}
                      />
                      <Tooltip
                        formatter={(value: number) => [`${value} packets`, 'Count']}
                        contentStyle={{
                          backgroundColor: 'rgba(13, 17, 23, 0.9)',
                          border: '1px solid #323B4F',
                          borderRadius: '0.25rem'
                        }}
                      />
                      <Bar dataKey="count" fill="#00FFFF" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex justify-center items-center h-40">
                    <p className="text-gray-400">No destination data available</p>
                  </div>
                )}
              </div>

              {/* Anomalies */}
              <div className="bg-background p-4 rounded-lg">
                <h3 className="text-lg font-medium mb-2">Detected Anomalies</h3>
                {packetAnalysis.anomalies && packetAnalysis.anomalies.length > 0 ? (
                  <ul className="space-y-2">
                    {packetAnalysis.anomalies.map((anomaly, index) => (
                      <li key={index} className="p-2 bg-black bg-opacity-50 rounded flex items-start">
                        <i className="ri-error-warning-line text-yellow-500 mr-2 mt-0.5"></i>
                        <span className="text-sm">{anomaly}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="flex justify-center items-center h-40">
                    <p className="text-gray-400">No anomalies detected</p>
                  </div>
                )}

                <div className="mt-4 pt-4 border-t border-gray-800">
                  <h4 className="text-sm font-medium mb-2">Summary</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-400">Total Packets:</p>
                      <p className="font-mono">{packetAnalysis.statistics.packetCount}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Total Size:</p>
                      <p className="font-mono">{packetAnalysis.statistics.totalSize} bytes</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </NeonBorder>
      )}
    </>
  );
};

export default PacketInspector;
