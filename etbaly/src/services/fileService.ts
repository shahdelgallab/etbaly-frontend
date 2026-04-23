import api from './api';

export interface ProxyFileRequest {
  url: string;
  filename?: string;
}

export const fileService = {
  /**
   * Proxy file download through backend to avoid CORS issues
   * Uses GET /api/v1/files/proxy?url=<google-drive-url>
   */
  proxyDownload: async (url: string): Promise<Blob> => {
    const encodedUrl = encodeURIComponent(url);
    const response = await api.get(`/files/proxy?url=${encodedUrl}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  /**
   * Get file as blob URL for 3D viewer
   * Useful for loading 3D models from Google Drive
   */
  getProxyBlobUrl: async (url: string): Promise<string> => {
    const blob = await fileService.proxyDownload(url);
    return URL.createObjectURL(blob);
  },

  /**
   * Get proxied URL for direct use in img tags or fetch
   * This returns the proxy endpoint URL without fetching the file
   */
  getProxyUrl: (url: string): string => {
    const apiBaseUrl = import.meta.env.VITE_API_URL || '';
    const encodedUrl = encodeURIComponent(url);
    return `${apiBaseUrl}/files/proxy?url=${encodedUrl}`;
  },
};