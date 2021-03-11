// const PRECACHE = 'precache-v1';
// const RUNTIME = 'runtime';

// // A list of local resources we always want to be cached.
// const PRECACHE_URLS = [
//   'stockbrowser.html',
//   'stockbr.js'
// ];

// // The install handler takes care of precaching the resources we always need.
// self.addEventListener('install', event => {
//   event.waitUntil(
//     caches.open(PRECACHE)
//       .then(cache => cache.addAll(PRECACHE_URLS))
//       .then(self.skipWaiting())
//   );
// });

// // The activate handler takes care of cleaning up old caches.
// self.addEventListener('activate', event => {
//   const currentCaches = [PRECACHE, RUNTIME];
//   event.waitUntil(
//     caches.keys().then(cacheNames => {
//       return cacheNames.filter(cacheName => !currentCaches.includes(cacheName));
//     }).then(cachesToDelete => {
//       return Promise.all(cachesToDelete.map(cacheToDelete => {
//         return caches.delete(cacheToDelete);
//       }));
//     }).then(() => self.clients.claim())
//   );
// });

// We support the GET, POST, HEAD, and OPTIONS methods from any origin,
// and accept the Content-Type header on requests. These headers must be
// present on all responses to all CORS requests. In practice, this means
// all responses to OPTIONS requests.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, HEAD, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
}

// The URL for the remote third party API you want to fetch from
// but does not implement CORS
const API_URL = "https://examples.cloudflareworkers.com/demos/demoapi"

// The endpoint you want the CORS reverse proxy to be on
const PROXY_ENDPOINT = "/y/"

// The rest of this snippet for the demo page
async function rawHtmlResponse(html) {
  return new Response(html, {
    headers: {
      "content-type": "text/html;charset=UTF-8",
    },
  })
}


async function handleRequest(request) {
  const url = new URL(request.url)
  // let apiUrl ="https://redbubble.com";
  console.log(url.pathname)
  // if(url.pathname.startsWith(PROXY_ENDPOINT+"ch/")){
  //    apiUrl = "https://query1.finance.yahoo.com/v8/finance/chart/"+url.pathname.substr(6)+url.search;
  // }
  // else if(url.pathname.startsWith(PROXY_ENDPOINT+"q")){
  //    apiUrl = "https://query1.finance.yahoo.com/v7/finance/quote"+url.search;
  // }
  // console.log(PROXY_ENDPOINT+"q")
  //let apiUrl = url.searchParams.get("apiu")

  // if (apiUrl == null) {
  //   apiUrl = API_URL
  // }

  // Rewrite request to point to API url. This also makes the request mutable
  // so we can add the correct Origin header to make the API server think
  // that this request isn't cross-site.
  request = new Request(request.url, request)
  request.headers.set("Origin", "https://finance.yahoo.com")
  let response = await fetch(request)

  // Recreate the response so we can modify the headers
  response = new Response(response.body, response)

  // Set CORS headers
  response.headers.set("Access-Control-Allow-Origin", "*")

  // Append to/Add Vary header so browser will cache response correctly
  response.headers.append("Vary", "Origin")

  return response
}

function handleOptions(request) {
  // Make sure the necessary headers are present
  // for this to be a valid pre-flight request
  if(
    request.headers.get("Origin") !== null &&
    request.headers.get("Access-Control-Request-Method") !== null &&
    request.headers.get("Access-Control-Request-Headers") !== null
  ){
    // Handle CORS pre-flight request.
    // If you want to check the requested method + headers
    // you can do that here.
    return new Response(null, {
      headers: corsHeaders,
    })
  }
  else {
    // Handle standard OPTIONS request.
    // If you want to allow other HTTP Methods, you can do that here.
    return new Response(null, {
      headers: {
        Allow: "GET, HEAD, POST, OPTIONS",
      },
    })
  }
}

self.addEventListener('fetch', event => {

  const request = event.request
  const url = new URL(request.url)
  // if(url.pathname.startsWith(PROXY_ENDPOINT)){
    if (request.method === "OPTIONS") {
      // Handle CORS preflight requests
      event.respondWith(handleOptions(request))
    }
    else if(
      request.method === "GET" ||
      request.method === "HEAD" ||
      request.method === "POST"
    ){
      // Handle requests to the API server
      event.respondWith(handleRequest(request))
    }
    else {
      event.respondWith(
        new Response(null, {
          status: 405,
          statusText: "Method Not Allowed",
        }),
      )
    }
  // }
  // else {
  //   // Serve demo page
  //   event.respondWith(rawHtmlResponse(DEMO_PAGE))
  // }
});