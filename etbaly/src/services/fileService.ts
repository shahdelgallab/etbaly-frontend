import api from './api';

export interface ProxyFileRequest {
  url: string;
  filename?: string;
}

export const fileService = {
  // Proxy file download through backend to avoid CORS issues
  proxyDownload: async (url: string, filename?: string): Promise<Blob> => {
    const response = await api.post('/files/proxy-download', 
      { url, filename }, 
      { 
        responseType: 'blob',
        headers: { 'Content-Type': 'application/json' }
      }
    );
    return response.data;
  },

  // Get file as blob URL for 3D viewer
  getProxyBlobUrl: async (url: string): Promise<string> => {
    const blob = await fileService.proxyDownload(url);
    return URL.createObjectURL(blob);
  },
};