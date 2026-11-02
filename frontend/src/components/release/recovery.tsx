'use client';
import { Component, useEffect, useState, type ErrorInfo, type ReactNode } from 'react';
import { CircleAlert, RefreshCw, ScanLine } from 'lucide-react';
import { recordDiagnostic, type DiagnosticArea } from '@/lib/diagnostics';
import { Button } from '../ui/button';
export function SafeFailure({reference,onRetry,compact=false}:{reference:string|null;onRetry:()=>void;compact?:boolean}){
  const content=<section className={compact?'release-recovery compact':'release-recovery'} role="alert"><span><CircleAlert size={30}/></span><h2>Tampilan belum dapat dimuat</h2><p>Coba tampilkan kembali. Data yang sudah tersimpan tidak dihapus.</p><p className="release-reference">Referensi frontend: {reference??'Menyiapkan referensi…'}</p><Button onClick={onRetry}><RefreshCw/>Coba tampilkan kembali</Button></section>;
  return compact?content:<main>{content}</main>;
}
export class ApplicationBoundary extends Component<{children:ReactNode;area?:DiagnosticArea;compact?:boolean;onReset?:()=>void},{failed:boolean;reference:string|null}>{
  state:{failed:boolean;reference:string|null}={failed:false,reference:null};
  static getDerivedStateFromError(){return {failed:true,reference:null};}
  componentDidCatch(_error:Error,_info:ErrorInfo){const event=recordDiagnostic('render',this.props.area??'application');this.setState({reference:event.reference});}
  render(){return this.state.failed?<SafeFailure compact={this.props.compact} reference={this.state.reference} onRetry={()=>{this.props.onReset?.();this.setState({failed:false,reference:null});}}/>:this.props.children;}
}
export function DiagnosticsObserver(){
  useEffect(()=>{const error=()=>{recordDiagnostic('uncaught','application');};const rejected=()=>{recordDiagnostic('promise','application');};window.addEventListener('error',error);window.addEventListener('unhandledrejection',rejected);return()=>{window.removeEventListener('error',error);window.removeEventListener('unhandledrejection',rejected);};},[]);return null;
}
export function FrameworkFailure({reset}:{reset:()=>void}){const [reference,setReference]=useState<string|null>(null);useEffect(()=>{setReference(recordDiagnostic('render','framework').reference);},[]);return <SafeFailure reference={reference} onRetry={reset}/>;}
export function FeatureUnavailable({feature,access=false}:{feature:string;access?:boolean}){return <main className="release-paused"><a className="brand" href="/"><span className="brand-icon"><ScanLine size={25}/></span><span>visitor<span className="brand-ai">ai</span></span></a><section><span><CircleAlert size={31}/></span><h1>{access?'Akses workspace dinonaktifkan':`${feature} dinonaktifkan`}</h1><p>Fitur ini dinonaktifkan pada konfigurasi build saat ini. Tidak ada data workspace yang dimuat.</p><p>Hubungi pengelola rilis untuk mengaktifkannya kembali pada build berikutnya.</p>{!access&&<Button asChild variant="outline"><a href="#/login">Pilih akun demo lain</a></Button>}</section></main>;}
