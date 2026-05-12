import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import type { BufferGeometry } from 'three';
import { tokenStorage } from '../services/api';

const API_BASE = import.meta.env.VITE_API_URL as string;

function proxyUrl(url: string): string {
  const isDrive =
    url.includes('drive.google.com') ||
    url.includes('drive.usercontent.google.com');
  return isDrive
    ? `${API_BASE}/files/proxy?url=${encodeURIComponent(url)}`
    : url;
}

export async function fetchAndParseSTL(url: string): Promise<BufferGeometry> {
  const fetchUrl = proxyUrl(url);
  const token    = tokenStorage.getAccess();

  const res = await fetch(fetchUrl, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);

  const buffer   = await res.arrayBuffer();
  const loader   = new STLLoader();
  const geometry = loader.parse(buffer);

  geometry.center();
  geometry.computeVertexNormals();

  return geometry;
}
