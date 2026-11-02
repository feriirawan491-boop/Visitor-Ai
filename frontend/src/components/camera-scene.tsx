'use client';
import { useId } from 'react';
import { useSvgTypography } from '@/lib/use-svg-typography';
import type { GateConfig } from '@/lib/demo';

export function CameraScene({ id, config, overlay = true, boxes = true, editor = false, onPoint }: { id: number; config: GateConfig; overlay?: boolean; boxes?: boolean; editor?: boolean; onPoint?: (x: number, y: number) => void }) {
  const {ref,fontSize,scale}=useSvgTypography(800);
  const uid = useId().replace(/:/g, '');
  const prefix = `scene${uid}`;
  const partial = config.mode === 'partial_line';
  const x1 = partial ? config.xStart * 8 : 35;
  const x2 = partial ? config.xEnd * 8 : 765;
  return <svg ref={ref} viewBox="0 0 800 450" className={`camera-scene ${editor ? 'cursor-crosshair' : ''}`} role="img" aria-label={`Ilustrasi kamera ${id}, bukan rekaman CCTV nyata${editor ? '. Klik untuk menambah titik polygon; posisi juga dapat diatur melalui kontrol angka.' : ''}`} onClick={e => { if (!onPoint) return; const rect = e.currentTarget.getBoundingClientRect(); onPoint(Math.round((e.clientX-rect.left)/rect.width*100), Math.round((e.clientY-rect.top)/rect.height*100)); }}>
    <defs>
      <linearGradient id={`${prefix}floor`} x1="0" y1="0" x2="0.5" y2="1"><stop stopColor="#8d918b"/><stop offset="1" stopColor="#484f50"/></linearGradient>
      <linearGradient id={`${prefix}wall`}><stop stopColor="#b1b0a1"/><stop offset="1" stopColor="#5d6663"/></linearGradient>
      <linearGradient id={`${prefix}glass`} x2="1" y2="1"><stop stopColor="#b4c4bd" stopOpacity=".65"/><stop offset="1" stopColor="#617b7b" stopOpacity=".22"/></linearGradient>
      <pattern id={`${prefix}slats`} width="13" height="20" patternUnits="userSpaceOnUse"><rect width="7" height="20" fill="#4f4e40"/><rect x="7" width="6" height="20" fill="#85816c"/></pattern>
      <filter id={`${prefix}shadow`}><feGaussianBlur stdDeviation="7"/></filter>
    </defs>
    <rect width="800" height="450" fill="#777e77"/>
    <path d="M0 0H800V142L462 101 0 154Z" fill="#343d3b"/>
    <path d="M0 145 460 100 800 142V450H0Z" fill={`url(#${prefix}floor)`}/>
    <path d="M0 145 460 100 460 0H0Z" fill={`url(#${prefix}wall)`}/>
    <path d="M800 0H460V100L800 145Z" fill="#77817a"/>
    <path d="M20 0H196V151L20 193Z" fill={`url(#${prefix}slats)`}/>
    <path d="M218 10 445 15V116L218 164Z" fill="#252f2e"/>
    <path d="M229 20H434V107L229 151Z" fill={`url(#${prefix}glass)`}/>
    <path d="M320 18V131M230 105 435 80" stroke="#c5c9b8" strokeWidth="4" opacity=".6"/>
    <path d="M484 8 755 22V134L484 104Z" fill="#233330"/>
    <path d="M495 19 744 32V123L495 96Z" fill={`url(#${prefix}glass)`}/>
    <path d="M576 23V106M665 28V115" stroke="#c2c6b5" strokeWidth="3" opacity=".6"/>
    <path d="M0 80 800 60M320 0 355 113M600 0 570 113" stroke="#c4c8ba" opacity=".16" strokeWidth="2"/>
    <path d="M460 108 0 440M460 108 240 450M460 108 590 450M460 108 800 340M0 225 800 218M0 321 800 320" stroke="#d2d1b9" strokeWidth="1.3" opacity=".16"/>
    <path d="M0 240 161 204 191 248 188 328 0 391Z" fill="#283c3a"/>
    <path d="M0 232 160 200 174 221 0 270Z" fill="#6e8072"/>
    <path d="M0 279 180 237M70 251 76 363" stroke="#8c9788" strokeWidth="2" opacity=".4"/>
    <path d="M628 240 800 285V395L622 326Z" fill="#2b3e3a"/>
    <path d="M636 221 800 263V289L626 247Z" fill="#798779"/>
    <path d="M717 259 712 361" stroke="#8c9788" strokeWidth="2" opacity=".4"/>
    <ellipse cx="577" cy="201" rx="44" ry="12" fill="#4a5147"/><path d="M575 200V264M552 267H600" stroke="#b4b4a4" strokeWidth="4"/>
    <path d="M75 130 116 123 128 166 87 176Z" fill="#343c33"/>
    <g fill="#476047"><path d="M101 144Q42 83 75 66Q113 72 105 130"/><path d="M104 140Q140 72 148 93Q155 123 107 151"/><path d="M100 140Q76 33 103 46Q127 66 105 140"/></g>
    <rect x={343-63*scale} y={46-18*scale} width={126*scale} height={27*scale} rx="2" fill="#1d2927"/>
    <text x="343" y="46" textAnchor="middle" fill="#dedbc6" fontSize={fontSize} letterSpacing="1">LOUNGE</text>
    <ellipse cx={id===1?401:449} cy="362" rx="38" ry="10" fill="#172522" opacity=".5" filter={`url(#${prefix}shadow)`}/>
    <g transform={`translate(${id===1?360:410} 153)`}>
      <ellipse cx="40" cy="28" rx="16" ry="20" fill="#ab9e86"/>
      <path d="M24 23Q20 1 41 4Q61 5 55 23Z" fill="#2e3331"/>
      <path d="M24 51Q40 44 56 52L69 118 57 136H23L15 111Z" fill={id===1?'#c0bba4':'#657675'}/>
      <path d="M24 54 7 116 15 121 34 72M56 55 79 111 71 116 49 75" fill="#989a87"/>
      <path d="M24 127 20 190 34 192 42 140 49 190 62 187 56 127Z" fill="#303d3c"/>
      <path d="M17 187 33 187 34 200H12ZM49 187H62L69 198H49Z" fill="#1e2929"/>
      <path d="M61 90 84 100 83 147 62 142Z" fill="#293d3a"/>
    </g>
    <rect width="800" height="450" fill="#0f2528" opacity=".15"/>
    {boxes && <g stroke="#5eead4" fill="none" strokeWidth="1.6"><rect x={id===1?357:407} y="151" width="91" height="210" rx="2"/><path d={`M${id===1?357:407} 165v-14h14M${id===1?434:484} 151h14v14`} strokeWidth="3"/><rect x={id===1?357:407} y={151-22*scale} width={104*scale} height={22*scale} fill="#5eead4" stroke="none"/><text x={id===1?365:415} y={151-7*scale} fill="#123834" fontSize={fontSize} fontFamily="monospace" stroke="none">TRK-{id===1?'0248':'0176'}</text></g>}
    {overlay && <g fontFamily="monospace" fontSize={fontSize}>
      {(config.mode==='line'||partial) && <>
        <rect x={x1} y={config.lineA*4.5} width={x2-x1} height={(config.lineB-config.lineA)*4.5} fill="#38bdf8" opacity=".07"/>
        <path d={`M${x1} ${config.lineA*4.5}H${x2}`} stroke="#38bdf8" strokeWidth="2" strokeDasharray="9 6"/><path d={`M${x1} ${config.lineB*4.5}H${x2}`} stroke="#5eead4" strokeWidth="2" strokeDasharray="9 6"/>
        <rect x={x1} y={config.lineA*4.5-22*scale} width={63*scale} height={21*scale} rx="3" fill="#0c4a6e"/><text x={x1+8*scale} y={config.lineA*4.5-7*scale} fill="#bae6fd">LINE A</text>
        <rect x={x1} y={config.lineB*4.5+2} width={63*scale} height={21*scale} rx="3" fill="#134e4a"/><text x={x1+8*scale} y={config.lineB*4.5+17*scale} fill="#99f6e4">LINE B</text>
        <path d={`M${x2-32} ${config.lineA*4.5+16}v${Math.max(0,(config.lineB-config.lineA)*4.5-30)}m-6-6 6 6 6-6`} stroke="#5eead4" fill="none" strokeWidth="2"/>
      </>}
      {config.mode==='polygon' && <><polygon points={config.points.map(p=>`${p.x*8},${p.y*4.5}`).join(' ')} fill="#2dd4bf" fillOpacity=".14" stroke="#5eead4" strokeWidth="2"/>{config.points.map((p,i)=><g key={i}><circle cx={p.x*8} cy={p.y*4.5} r="6" fill="#fff" stroke="#0d9488" strokeWidth="2"/><text x={p.x*8+10} y={p.y*4.5-8} fill="white">{i+1}</text></g>)}</>}
      {config.mode==='near' && <><rect x="295" y={420-config.threshold*4} width="210" height={config.threshold*4} rx="8" fill="#38bdf8" fillOpacity=".09" stroke="#38bdf8" strokeWidth="2" strokeDasharray="8 5"/><text x="310" y={410-config.threshold*4} fill="#bae6fd">NEAR {config.threshold}%</text></>}
    </g>}
    <text x="25" y="426" fill="#d2e1de" fontSize={fontSize} fontFamily="monospace" opacity=".8">CAM 0{id} · DEMO</text>
  </svg>;
}
