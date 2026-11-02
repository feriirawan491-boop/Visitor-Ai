import type { NextConfig } from 'next';
import { validateReleaseConfig } from './scripts/release-config.mjs';
import { sourceFingerprint } from './scripts/source-fingerprint.mjs';
validateReleaseConfig(process.env);
const distDir=process.env.VISITOR_BUILD_DIR??'.next';
if(!['.next','.next-flags'].includes(distDir))throw new Error('VISITOR_BUILD_DIR tidak valid.');
const config:NextConfig={devIndicators:false,distDir,poweredByHeader:false,env:{NEXT_PUBLIC_BUILD_FINGERPRINT:sourceFingerprint()},async headers(){return [{source:'/:path*',headers:[{key:'X-Content-Type-Options',value:'nosniff'},{key:'Referrer-Policy',value:'no-referrer'},{key:'X-Frame-Options',value:'DENY'},{key:'Permissions-Policy',value:'camera=(self), microphone=(), geolocation=()'}]}];}};
export default config;
