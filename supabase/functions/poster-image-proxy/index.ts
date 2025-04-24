
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the image URL from the request body
    const { imageUrl } = await req.json();
    
    if (!imageUrl) {
      return new Response(
        JSON.stringify({ error: "No image URL provided" }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 400 
        }
      );
    }

    console.log(`Proxying image request for: ${imageUrl}`);

    // Replace http with https if needed
    const secureUrl = imageUrl.replace(/^http:\/\//i, 'https://');
    
    // Fetch the image from the remote server
    const imageResponse = await fetch(secureUrl, {
      headers: {
        'Accept': 'image/jpeg, image/png, image/webp, image/*',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
    });

    if (!imageResponse.ok) {
      console.error(`Failed to fetch image: ${imageResponse.status} ${imageResponse.statusText}`);
      throw new Error(`Failed to fetch image: ${imageResponse.status} ${imageResponse.statusText}`);
    }

    // Get the image data
    const imageData = await imageResponse.arrayBuffer();
    const contentType = imageResponse.headers.get('Content-Type') || 'application/octet-stream';
    
    console.log(`Successfully fetched image, size: ${imageData.byteLength} bytes, type: ${contentType}`);
    
    // Return the binary data directly with proper headers
    return new Response(imageData, {
      headers: {
        ...corsHeaders,
        'Content-Type': contentType,
        'Content-Length': imageData.byteLength.toString(),
        'Cache-Control': 'public, max-age=86400',
      }
    });

  } catch (error) {
    console.error("Error proxying image:", error);
    
    return new Response(
      JSON.stringify({ 
        error: "Failed to proxy image", 
        details: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 500 
      }
    );
  }
});
