/** @type {import('next').NextConfig} */
const isDev = process.env.NODE_ENV !== 'production';
const securityHeaders=[
 {key:'X-Content-Type-Options',value:'nosniff'},
 {key:'X-Frame-Options',value:'DENY'},
 {key:'Referrer-Policy',value:'strict-origin-when-cross-origin'},
 {key:'Permissions-Policy',value:'camera=(), microphone=(), geolocation=(), payment=(self)'},
 ...(process.env.NODE_ENV === 'production' ? [{key:'Strict-Transport-Security',value:'max-age=63072000; includeSubDomains; preload'}] : []),
 {key:'Content-Security-Policy',value:`default-src 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}; connect-src 'self'${isDev ? " ws: wss:" : ""}; font-src 'self' data:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'`},
];
const nextConfig={poweredByHeader:false,reactStrictMode:true,async headers(){return[
 {source:'/api/:path*',headers:[...securityHeaders,{key:'Cache-Control',value:'no-store'}]},
 {source:'/(.*)',headers:securityHeaders},
 {source:'/sw.js',headers:[{key:'Service-Worker-Allowed',value:'/'},{key:'Cache-Control',value:'no-cache'},{key:'Content-Type',value:'application/javascript'}]},
 ];}};
module.exports=nextConfig;
