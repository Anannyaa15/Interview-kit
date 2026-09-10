import dns from 'node:dns/promises';
import net from 'node:net';

export class UrlValidationError extends Error {
  constructor(message: string) { super(message); this.name = 'UrlValidationError'; }
}

function isPrivateIp(ip: string) {
  if (net.isIPv4(ip)) {
    const [a,b] = ip.split('.').map(Number);
    return a === 10 || a === 127 || a === 0 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168);
  }
  if (net.isIPv6(ip)) {
    const normalized = ip.toLowerCase();
    return normalized === '::1' || normalized.startsWith('fc') || normalized.startsWith('fd') || normalized.startsWith('fe80:');
  }
  return false;
}

export async function validateExternalUrl(raw: string, allowLocal = false) {
  let url: URL;
  try { url = new URL(raw); } catch { throw new UrlValidationError('Invalid company URL.'); }
  if (!['http:', 'https:'].includes(url.protocol)) throw new UrlValidationError('Only HTTP and HTTPS URLs are supported.');
  if (!url.hostname) throw new UrlValidationError('Company URL must include a hostname.');
  if (!allowLocal && ['localhost', 'localhost.localdomain'].includes(url.hostname.toLowerCase())) {
    throw new UrlValidationError('Local and loopback addresses are not allowed in production.');
  }
  const addresses = await dns.lookup(url.hostname, { all: true }).catch(() => []);
  if (!allowLocal && addresses.some(a => isPrivateIp(a.address))) throw new UrlValidationError('Private and loopback addresses are not allowed.');
  return url;
}
