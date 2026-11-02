'use client';
import { FrameworkFailure } from '@/components/release/recovery';
export default function ErrorPage({reset}:{reset:()=>void}){return <FrameworkFailure reset={reset}/>;}
