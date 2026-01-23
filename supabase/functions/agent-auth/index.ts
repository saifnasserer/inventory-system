// Supabase Edge Function: agent-auth
// Handles OAuth authentication for TechFlow Hardware Agent
// 
// Endpoints:
// - GET /agent-auth?action=authorize&redirect_uri=...  -> Redirects to login
// - GET /agent-auth?action=callback&...               -> Handles auth callback
// - GET /agent-auth?action=verify                     -> Verifies token

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const url = new URL(req.url);
        const action = url.searchParams.get('action');

        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseAnonKey);

        // ========================================
        // ACTION: authorize
        // Initiates OAuth flow, redirects to login
        // ========================================
        if (action === 'authorize') {
            const redirectUri = url.searchParams.get('redirect_uri');

            if (!redirectUri) {
                return new Response(
                    JSON.stringify({ error: 'redirect_uri is required' }),
                    { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                );
            }

            // Validate redirect_uri is localhost (Agent requirement)
            const redirectUrl = new URL(redirectUri);
            if (!redirectUrl.hostname.includes('localhost') && !redirectUrl.hostname.includes('127.0.0.1')) {
                return new Response(
                    JSON.stringify({ error: 'redirect_uri must be localhost for Agent authentication' }),
                    { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                );
            }

            // Store redirect_uri in session/state for callback
            // Using the state parameter to pass the redirect_uri
            const state = encodeURIComponent(redirectUri);

            // Get the auth URL for Supabase
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google', // or your preferred provider
                options: {
                    redirectTo: `${supabaseUrl}/functions/v1/agent-auth?action=callback&state=${state}`,
                    queryParams: {
                        prompt: 'consent',
                    },
                },
            });

            if (error) {
                return new Response(
                    JSON.stringify({ error: error.message }),
                    { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                );
            }

            // Redirect to auth URL
            return Response.redirect(data.url, 302);
        }

        // ========================================
        // ACTION: callback
        // Handles OAuth callback after login
        // ========================================
        if (action === 'callback') {
            const state = url.searchParams.get('state');
            const accessToken = url.searchParams.get('access_token');
            const refreshToken = url.searchParams.get('refresh_token');

            // Get tokens from hash fragment if present
            const hashParams = new URLSearchParams(url.hash.substring(1));
            const token = accessToken || hashParams.get('access_token');

            if (!state) {
                return new Response(
                    JSON.stringify({ error: 'Invalid callback state' }),
                    { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                );
            }

            const redirectUri = decodeURIComponent(state);

            // If we have a token, redirect to Agent with it
            if (token) {
                // Get user info
                const { data: { user }, error } = await supabase.auth.getUser(token);

                if (error || !user) {
                    return new Response(
                        JSON.stringify({ error: 'Failed to get user info' }),
                        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                    );
                }

                // Redirect back to Agent with token
                const agentCallback = new URL(redirectUri);
                agentCallback.searchParams.set('token', token);
                agentCallback.searchParams.set('user', user.email || user.id);

                return Response.redirect(agentCallback.toString(), 302);
            }

            // Return HTML page that extracts token from URL hash and redirects
            const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Authenticating...</title>
          <script>
            // Extract tokens from hash fragment
            const hash = window.location.hash.substring(1);
            const params = new URLSearchParams(hash);
            const token = params.get('access_token');
            const redirectUri = decodeURIComponent('${state}');
            
            if (token) {
              // Redirect to Agent with token
              const url = new URL(redirectUri);
              url.searchParams.set('token', token);
              window.location.href = url.toString();
            } else {
              document.body.innerHTML = '<h2>Authentication failed. Please try again.</h2>';
            }
          </script>
        </head>
        <body>
          <h2>Authenticating, please wait...</h2>
        </body>
        </html>
      `;

            return new Response(html, {
                headers: { ...corsHeaders, 'Content-Type': 'text/html' },
            });
        }

        // ========================================
        // ACTION: verify
        // Verifies a token and returns user info
        // ========================================
        if (action === 'verify') {
            const authHeader = req.headers.get('Authorization');

            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return new Response(
                    JSON.stringify({ valid: false, error: 'Missing or invalid Authorization header' }),
                    { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                );
            }

            const token = authHeader.substring(7);
            const { data: { user }, error } = await supabase.auth.getUser(token);

            if (error || !user) {
                return new Response(
                    JSON.stringify({ valid: false, error: error?.message || 'Invalid token' }),
                    { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                );
            }

            // Get additional user info from users table
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('id, full_name, role, company_id')
                .eq('id', user.id)
                .single();

            return new Response(
                JSON.stringify({
                    valid: true,
                    user: {
                        id: user.id,
                        email: user.email,
                        name: userData?.full_name || user.email,
                        role: userData?.role,
                        company_id: userData?.company_id,
                    },
                }),
                { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // ========================================
        // ACTION: me
        // Returns current user info (alias for verify)
        // ========================================
        if (action === 'me') {
            const authHeader = req.headers.get('Authorization');

            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return new Response(
                    JSON.stringify({ error: 'Missing Authorization header' }),
                    { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                );
            }

            const token = authHeader.substring(7);
            const supabaseWithAuth = createClient(supabaseUrl, supabaseAnonKey, {
                global: { headers: { Authorization: `Bearer ${token}` } },
            });

            const { data: { user }, error } = await supabaseWithAuth.auth.getUser();

            if (error || !user) {
                return new Response(
                    JSON.stringify({ error: 'Unauthorized' }),
                    { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                );
            }

            const { data: userData } = await supabaseWithAuth
                .from('users')
                .select('*')
                .eq('id', user.id)
                .single();

            return new Response(
                JSON.stringify({ user: userData }),
                { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Unknown action
        return new Response(
            JSON.stringify({
                error: 'Unknown action',
                available_actions: ['authorize', 'callback', 'verify', 'me'],
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        console.error('Error:', error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
