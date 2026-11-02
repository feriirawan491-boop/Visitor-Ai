'use client';
import { releaseConfig, type FeatureName } from '@/lib/release-config';
import { FeatureUnavailable } from './recovery';
const names:Record<FeatureName,string>={access:'Akses workspace',analytics:'Management Analytics',provider:'Provider Workspace',definitions:'Entertaint & Protocol'};
export function FeatureGate({feature,children}:{feature:FeatureName;children:React.ReactNode}){return releaseConfig.features[feature]?children:<FeatureUnavailable feature={names[feature]} access={feature==='access'}/>;}
