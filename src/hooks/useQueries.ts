import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../utils/api';

// 1. Weather Queries
export const useWeatherQuery = (lat: number, lon: number) => {
  return useQuery({
    queryKey: ['weather', lat, lon],
    queryFn: async () => {
      const res = await api.get('/weather/current', { params: { lat, lon } });
      return res.data.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes stale time
    enabled: !!lat && !!lon,
  });
};

// 2. Early Warning Alerts Queries
export const useAlertsQuery = (lat: number, lon: number) => {
  return useQuery({
    queryKey: ['alerts', lat, lon],
    queryFn: async () => {
      const res = await api.get('/alerts/live', { params: { lat, lon, radius: 15000 } });
      return res.data.data;
    },
    staleTime: 30 * 1000, // 30 seconds stale
    enabled: !!lat && !!lon,
  });
};

// 3. GIS Map Overlays and Boundaries
export const useMapLayerQuery = (layerName: string) => {
  return useQuery({
    queryKey: ['mapLayer', layerName],
    queryFn: async () => {
      const res = await api.get(`/map/layers/${layerName}`);
      return res.data.data;
    },
    staleTime: 10 * 60 * 1000,
  });
};

// 4. Crop Advisories and Recommendations
export const useCropAdvisoriesQuery = (lat: number, lon: number) => {
  return useQuery({
    queryKey: ['cropAdvisories', lat, lon],
    queryFn: async () => {
      const res = await api.get('/crop-advisory/current', { params: { lat, lon } });
      return res.data.data;
    },
    staleTime: 2 * 60 * 1000,
    enabled: !!lat && !!lon,
  });
};

export const useCropRecommendationsQuery = (lat: number, lon: number) => {
  return useQuery({
    queryKey: ['cropRecommendations', lat, lon],
    queryFn: async () => {
      const res = await api.get('/crop-advisory/recommendation', { params: { lat, lon } });
      return res.data.data;
    },
    staleTime: 10 * 60 * 1000,
    enabled: !!lat && !!lon,
  });
};

// 5. Emergency SOS and Shelters Proximity
export const useSOSRequestsQuery = () => {
  return useQuery({
    queryKey: ['sosRequests'],
    queryFn: async () => {
      const res = await api.get('/emergency/sos');
      return res.data.data;
    },
  });
};

export const useNearbySheltersQuery = (lat: number, lon: number) => {
  return useQuery({
    queryKey: ['nearbyShelters', lat, lon],
    queryFn: async () => {
      const res = await api.get('/emergency/shelters/nearby', { params: { lat, lon, limit: 5 } });
      return res.data.data;
    },
    enabled: !!lat && !!lon,
  });
};

export const useSOSMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { latitude: number; longitude: number; disasterType: string; notes?: string }) => {
      const res = await api.post('/emergency/sos', data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sosRequests'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardOverview'] });
    },
  });
};

// 6. Notifications Queries & Mutations
export const useNotificationsQuery = () => {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await api.get('/notifications');
      return res.data.data;
    },
  });
};

export const useUnreadCountQuery = () => {
  return useQuery({
    queryKey: ['unreadCount'],
    queryFn: async () => {
      const res = await api.get('/notifications/unread-count');
      return res.data.data;
    },
    refetchInterval: 15 * 1000, // checks every 15s
  });
};

export const useReadNotificationMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardOverview'] });
    },
  });
};

export const usePreferencesQuery = () => {
  return useQuery({
    queryKey: ['notificationPreferences'],
    queryFn: async () => {
      const res = await api.get('/notifications/preferences');
      return res.data.data;
    },
  });
};

export const useUpdatePreferencesMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (preferences: any[]) => {
      const res = await api.patch('/notifications/preferences', { preferences });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificationPreferences'] });
    },
  });
};

// 7. Dashboard Overview Query
export const useDashboardOverviewQuery = () => {
  return useQuery({
    queryKey: ['dashboardOverview'],
    queryFn: async () => {
      const res = await api.get('/dashboard/overview');
      return res.data.data;
    },
    staleTime: 15 * 1000,
  });
};

// 8. AI Predictions
export const useAIPredictionsQuery = (type: 'WEATHER_TREND' | 'CROP_RISK' | 'YIELD_ADVISORY') => {
  const endpointMap = {
    WEATHER_TREND: '/predictions/weather',
    CROP_RISK: '/predictions/risk',
    YIELD_ADVISORY: '/predictions/crops',
  };
  return useQuery({
    queryKey: ['aiPredictions', type],
    queryFn: async () => {
      const res = await api.get(endpointMap[type]);
      return res.data.data;
    },
    staleTime: 5 * 60 * 1000,
  });
};

// 9. Government Sync Integrations
export const useIntegrationsStatusQuery = () => {
  return useQuery({
    queryKey: ['integrationsStatus'],
    queryFn: async () => {
      const res = await api.get('/integrations/status');
      return res.data.data;
    },
    staleTime: 60 * 1000,
  });
};

export const useContactsQuery = (state: string) => {
  return useQuery({
    queryKey: ['contacts', state],
    queryFn: async () => {
      const res = await api.get('/emergency/contacts', { params: { state } });
      return res.data.data;
    },
    staleTime: 60 * 60 * 1000, // 1 hour cached state
  });
};
