import React, { useEffect, useRef, useState } from 'react';
import AppLoading from './AppLoading';
import { getPendingViewRequests, subscribeViewRequests } from '../../utils/viewRequests.mjs';

// The route mounts behind the overlay, so its effects, data and images can load.
export default function ViewReady({ children }) {
  const content = useRef(null);
  const [ready,setReady] = useState(false);
  useEffect(() => {
    let disposed=false, settled=false, firstFrame, secondFrame, revision=0;
    const waitingImages=new WeakSet();
    const schedule=() => {
      if(disposed || settled) return;
      const current=++revision;
      cancelAnimationFrame(firstFrame);cancelAnimationFrame(secondFrame);
      firstFrame=requestAnimationFrame(() => { secondFrame=requestAnimationFrame(async () => {
        if(disposed || current!==revision || getPendingViewRequests() || content.current?.querySelector('[data-view-loading]')) return;
        const images=[...content.current.querySelectorAll('img')].filter(img=>{
          const box=img.getBoundingClientRect();
          return !img.hidden && box.width>0 && box.height>0 && box.bottom>0 && box.top<window.innerHeight;
        });
        const pending=images.filter(img=>!img.complete);
        if(pending.length){
          for(const img of pending)if(!waitingImages.has(img)){
            waitingImages.add(img);img.addEventListener('load',schedule,{once:true});img.addEventListener('error',schedule,{once:true});
          }
          return;
        }
        if(document.fonts) await document.fonts.ready;
        await Promise.all(images.filter(img=>img.naturalWidth && img.decode).map(img=>img.decode().catch(()=>{})));
        if(!disposed && current===revision && !getPendingViewRequests() && !content.current.querySelector('[data-view-loading]')) { settled=true; observer.disconnect(); unsubscribe(); setReady(true); }
      }); });
    };
    const observer=new MutationObserver(schedule);
    observer.observe(content.current,{childList:true,subtree:true,attributes:true,attributeFilter:['src','srcset','data-view-loading']});
    const unsubscribe=subscribeViewRequests(schedule);
    schedule();
    return()=>{disposed=true;observer.disconnect();unsubscribe();cancelAnimationFrame(firstFrame);cancelAnimationFrame(secondFrame);};
  },[]);
  return <><div ref={content} className="tlr-view-content" aria-busy={!ready} {...(!ready ? {inert:''} : {})}>{children}</div>{!ready && <AppLoading />}</>;
}
