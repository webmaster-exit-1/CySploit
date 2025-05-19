import { useQuery, useMutation } from '@tanstack/react-query';
import { Session } from '@/lib/types';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';

export const useSessions = () => {
  // Get all sessions
  const {
    data: sessions,
    isLoading: isLoadingSessions
  } = useQuery<Session[]>({
    queryKey: ['/api/sessions'],
    refetchOnWindowFocus: false,
  });

  // Get a specific session
  const getSession = (id: number) => {
    return useQuery({
      queryKey: [`/api/sessions/${id}`],
      enabled: !!id,
      refetchOnWindowFocus: false,
    });
  };

  // Create a new session
  const createSessionMutation = useMutation({
    mutationFn: async (sessionData: {
      name: string,
      isActive: boolean,
      networkData?: Record<string, any>
    }): Promise<Session> => {
      const response = await apiRequest('POST', '/api/sessions', sessionData);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sessions'] });
    }
  });

  // End a session
  const endSessionMutation = useMutation({
    mutationFn: async (sessionId: number): Promise<Session> => {
      const response = await apiRequest('POST', `/api/sessions/${sessionId}/end`, {});
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sessions'] });
    }
  });

  // Get active sessions
  const getActiveSessions = () => {
    if (!sessions) return [];
    return sessions.filter((session: Session) => session.isActive);
  };

  // Get recent sessions (completed)
  const getRecentSessions = () => {
    if (!sessions) return [];
    return sessions
      .filter((session: Session) => !session.isActive)
      .sort((a: Session, b: Session) =>
        new Date(b.endedAt || b.startedAt).getTime() -
        new Date(a.endedAt || a.startedAt).getTime()
      )
      .slice(0, 5);
  };

  // Format session duration
  const formatSessionDuration = (session: Session) => {
    const start = new Date(session.startedAt).getTime();
    const end = session.endedAt ? new Date(session.endedAt).getTime() : Date.now();

    const durationMs = end - start;
    const seconds = Math.floor(durationMs / 1000);

    if (seconds < 60) {
      return `${seconds} sec`;
    } else if (seconds < 3600) {
      return `${Math.floor(seconds / 60)} min`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const mins = Math.floor((seconds % 3600) / 60);
      return `${hours} hr ${mins} min`;
    }
  };

  return {
    sessions,
    isLoadingSessions,
    getSession,
    createSessionMutation,
    endSessionMutation,
    getActiveSessions,
    getRecentSessions,
    formatSessionDuration
  };
};
