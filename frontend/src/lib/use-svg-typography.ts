'use client';
import { useCallback, useEffect, useState } from 'react';

// SVG text uses viewBox units; compensate for scaling to keep labels >= 12 CSS px.
export function useSvgTypography(viewBoxWidth:number){
  const [svg,setSvg]=useState<SVGSVGElement|null>(null);const ref=useCallback((node:SVGSVGElement|null)=>setSvg(node),[]);const [size,setSize]=useState(12);
  useEffect(()=>{
    if(!svg)return;
    const update=()=>{const width=svg.getBoundingClientRect().width;if(width>0)setSize(12/Math.min(1,width/viewBoxWidth));};
    update();const observer=new ResizeObserver(update);observer.observe(svg);return()=>observer.disconnect();
  },[svg,viewBoxWidth]);
  return {ref,fontSize:size,scale:size/12};
}
