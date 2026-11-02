import type { Metadata } from 'next';
import '@fontsource-variable/plus-jakarta-sans/wght.css';
import '@fontsource/bebas-neue/latin-400.css';
import './globals.css';
import './identity.css';
import './operations.css';
import './access.css';
import './analytics.css';
import './typography.css';
import './provider.css';
import './definition.css';
import './release.css';
export const metadata: Metadata = { title: 'Visitor AI — Lounge Intelligence', description: 'Workspace lounge dengan login demo, role, site scope, monitoring, identitas dan operasional. Frontend Phase 1–8 dengan Management Analytics, Provider Workspace, serta navigasi Entertaint dan Protocol.' };
const themeInit = `(function(){var t;try{t=localStorage.getItem('visitor-ai.theme')}catch(e){}document.documentElement.dataset.theme=t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches)?'dark':'light'})()`;
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="id" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{ __html: themeInit }}/></head><body>{children}</body></html>; }
