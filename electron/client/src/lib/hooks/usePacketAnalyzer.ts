import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Packet, TrafficAnalysis, CaptureSession } from '@/lib/types';
import { queryClient } from '@/lib/queryClient';

export const usePacketAnalyzer = () => {
  const [captureInProgress, setCaptureInProgress] = useState(false);
  const [activeCaptureSessions, setActiveCaptureSessions] = useState<Record<number, boolean>>({});

  // Get packets for a session
  const getSessionPackets = (sessionId: number) => {
    return useQuery({
      queryKey: [`/api/sessions/${sessionId}/packets`],
      enabled: !!sessionId,
      refetchOnWindowFocus: false,
    });
  };

  // Start packet capture
  const startCaptureMutation = useMutation({
    mutationFn: async (params: { 
      interface_: string, 
      filter?: string, 
      sessionName?: string 
    }): Promise<{ sessionId: number, message: string }> => {
      setCaptureInProgress(true);
      const response = await apiRequest('POST', '/api/packets/capture/start', params);
      const result = await response.json();
      setActiveCaptureSessions(prev => ({ ...prev, [result.sessionId]: true }));
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sessions'] });
    }
  });

  // Stop packet capture
  const stopCaptureMutation = useMutation({
    mutationFn: async (sessionId: number): Promise<{ sessionId: number, message: string }> => {
      const response = await apiRequest('POST', '/api/packets/capture/stop', { sessionId });
      const result = await response.json();
      setCaptureInProgress(false);
      setActiveCaptureSessions(prev => {
        const newSessions = { ...prev };
        delete newSessions[sessionId];
        return newSessions;
      });
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sessions'] });
    }
  });

  // Analyze traffic
  const analyzeTrafficMutation = useMutation({
    mutationFn: async (sessionId: number): Promise<TrafficAnalysis> => {
      const response = await apiRequest('POST', '/api/packets/analyze', { sessionId });
      return await response.json();
    }
  });

  // Generate a packet (for testing)
  const generatePacketMutation = useMutation({
    mutationFn: async (params: {
      sourceIp: string,
      destinationIp: string,
      sourcePort?: number,
      destinationPort?: number,
      sessionId?: number
    }): Promise<Packet> => {
      const response = await apiRequest('POST', '/api/packets/generate', params);
      return await response.json();
    },
    onSuccess: (data) => {
      if (data.sessionId) {
        queryClient.invalidateQueries({ queryKey: [`/api/sessions/${data.sessionId}/packets`] });
      }
    }
  });

  // Helper function to format packet data for display
  const formatPacketForDisplay = (packet: Packet) => {
    return {
      ...packet,
      formattedTimestamp: new Date(packet.timestamp).toLocaleTimeString(),
      formattedSize: `${packet.size} bytes`,
      summary: `${packet.sourceIp}:${packet.sourcePort} → ${packet.destinationIp}:${packet.destinationPort} (${packet.protocol})`
    };
  };

  // Helper function to track active capture sessions
  const isSessionActive = (sessionId: number): boolean => {
    return !!activeCaptureSessions[sessionId];
  };

  // Helper function to group packets by protocol for charting
  const groupPacketsByProtocol = (packets?: Packet[]) => {
    if (!packets) return {};
    
    const protocolCounts: Record<string, number> = {};
    
    packets.forEach(packet => {
      const protocol = packet.protocol || 'Unknown';
      protocolCounts[protocol] = (protocolCounts[protocol] || 0) + 1;
    });
    
    return protocolCounts;
  };

  return {
    getSessionPackets,
    startCaptureMutation,
    stopCaptureMutation,
    analyzeTrafficMutation,
    generatePacketMutation,
    formatPacketForDisplay,
    captureInProgress,
    isSessionActive,
    groupPacketsByProtocol
  };
};
