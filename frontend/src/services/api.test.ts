import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe('backend URL configuration', () => {
  it.each([
    [undefined, ''],
    ['', ''],
    ['https://backend.example.test', 'https://backend.example.test'],
    [' https://backend.example.test/// ', 'https://backend.example.test'],
  ])('uses base %s for requests and backend links', async (value, expected) => {
    vi.stubEnv('VITE_API_BASE_URL', value);
    const { api, backendUrl } = await import('./api');
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => [] });
    vi.stubGlobal('fetch', fetchMock);

    await api.invoices();
    expect(fetchMock).toHaveBeenCalledWith(
      `${expected}/api/invoices`,
      expect.objectContaining({ headers: { 'Content-Type': 'application/json' } }),
    );
    for (const path of ['/docs', '/openapi.json', '/api/invoices/123/document'] as const) {
      expect(backendUrl(path)).toBe(`${expected}${path}`);
    }
  });

  it('sends uploads to the configured backend without overriding multipart headers', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://backend.example.test/');
    const { api } = await import('./api');
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
    vi.stubGlobal('fetch', fetchMock);
    await api.upload(new File(['pdf'], 'invoice.pdf', { type: 'application/pdf' }));
    expect(fetchMock).toHaveBeenCalledWith('https://backend.example.test/api/invoices/upload', {
      method: 'POST',
      body: expect.any(FormData),
      headers: undefined,
    });
  });
});
