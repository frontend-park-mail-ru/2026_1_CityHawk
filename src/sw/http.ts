export function isSuccessfulResponse(response: Response): boolean {
  return response.ok || response.type === 'opaque';
}

export function createJsonResponse(payload: string, status = 200): Response {
  return new Response(payload, {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
