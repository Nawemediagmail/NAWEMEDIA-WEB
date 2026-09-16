export const config = {
  runtime: 'edge',
};

export default async function handler(request) {
  const url = new URL(request.url);
  const pathname = url.pathname.replace('/api/protect-electric-side', '');

  // FAIL-CLOSED: Validate env vars exist before any other logic
  const expectedUser = process.env.ELECTRIC_SIDE_USER;
  const expectedPassword = process.env.ELECTRIC_SIDE_PASSWORD;

  if (!expectedUser || !expectedPassword) {
    console.error('SECURITY: ELECTRIC_SIDE_USER or ELECTRIC_SIDE_PASSWORD not configured');
    return new Response('Service Unavailable', {
      status: 503,
      headers: {
        'cache-control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'content-type': 'text/plain',
        'retry-after': '3600',
      },
    });
  }

  // Check for Authorization header
  const authHeader = request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return new Response('Unauthorized', {
      status: 401,
      headers: {
        'www-authenticate': 'Basic realm="Electric Side"',
        'cache-control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'content-type': 'text/plain',
      },
    });
  }

  try {
    // Decode Basic Auth credentials
    const base64Credentials = authHeader.slice(6);
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
    const [username, password] = credentials.split(':');

    // Validate credentials
    if (username !== expectedUser || password !== expectedPassword) {
      return new Response('Unauthorized', {
        status: 401,
        headers: {
          'www-authenticate': 'Basic realm="Electric Side"',
          'cache-control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'content-type': 'text/plain',
        },
      });
    }

    // Credentials valid - fetch the actual protected content
    // Construct the path to the static file
    let targetPath = pathname || '/index.html';
    if (targetPath === '/' || targetPath === '') {
      targetPath = '/index.html';
    }

    try {
      // Attempt to fetch from the origin server
      const staticUrl = new URL(`https://${request.headers.get('host') || 'nawemedia.com'}${targetPath}`);

      // Create a new request without the auth header to prevent infinite loops
      const staticResponse = await fetch(staticUrl.toString(), {
        method: request.method,
        headers: {
          ...Object.fromEntries(request.headers.entries()),
          'authorization': undefined,
        },
      });

      if (staticResponse.status === 404) {
        return new Response('Not Found', { status: 404 });
      }

      // Return the protected content with cache control headers
      const response = new Response(staticResponse.body, staticResponse);
      response.headers.set('cache-control', 'private, no-cache, no-store, must-revalidate');
      response.headers.set('x-protected-by', 'basic-auth');
      return response;
    } catch (fetchError) {
      console.error('Error fetching protected content:', fetchError);
      return new Response('Internal Server Error', { status: 500 });
    }
  } catch (error) {
    console.error('Auth error:', error);
    return new Response('Invalid Authorization header', {
      status: 400,
      headers: {
        'www-authenticate': 'Basic realm="Electric Side"',
        'content-type': 'text/plain',
      },
    });
  }
}
