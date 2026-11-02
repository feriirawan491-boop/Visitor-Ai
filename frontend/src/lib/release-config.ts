import { validateReleaseConfig } from '../../scripts/release-config.mjs';
export type FeatureName='access'|'analytics'|'provider'|'definitions';
export const releaseConfig=validateReleaseConfig({
  NEXT_PUBLIC_APP_MODE:process.env.NEXT_PUBLIC_APP_MODE,
  NEXT_PUBLIC_DATA_SOURCE:process.env.NEXT_PUBLIC_DATA_SOURCE,
  NEXT_PUBLIC_PHASE4_ACCESS_ENABLED:process.env.NEXT_PUBLIC_PHASE4_ACCESS_ENABLED,
  NEXT_PUBLIC_PHASE5_ANALYTICS_ENABLED:process.env.NEXT_PUBLIC_PHASE5_ANALYTICS_ENABLED,
  NEXT_PUBLIC_PHASE6_PROVIDER_ENABLED:process.env.NEXT_PUBLIC_PHASE6_PROVIDER_ENABLED,
  NEXT_PUBLIC_PHASE7_DEFINITIONS_ENABLED:process.env.NEXT_PUBLIC_PHASE7_DEFINITIONS_ENABLED,
});
export const buildFingerprint=process.env.NEXT_PUBLIC_BUILD_FINGERPRINT??'unverified';
