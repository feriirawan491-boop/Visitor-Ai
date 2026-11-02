import AccessApp from '@/components/access/app';
import { ApplicationBoundary, DiagnosticsObserver } from '@/components/release/recovery';
export default function Page(){return <ApplicationBoundary><DiagnosticsObserver/><AccessApp/></ApplicationBoundary>;}
