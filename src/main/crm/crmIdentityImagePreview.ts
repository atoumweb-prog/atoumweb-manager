import {nativeImage,type WebContents} from 'electron';
/** Decode supported images in Chromium's sandbox. NativeImage only accepts PNG/JPEG
 * buffers on Windows. Only a small PNG thumbnail returns to main; saved bytes stay original.
 * No DOM mutation, network, new BrowserWindow or business API in this isolated world. */
export async function crmIdentityImagePreview(sender:WebContents,bytes:Buffer){
 if(sender.isDestroyed())throw Error('Fenêtre fermée. Aucun visuel enregistré.');
 const dataUrl='data:application/octet-stream;base64,'+bytes.toString('base64');
 try{
  const thumbnail=await sender.executeJavaScriptInIsolatedWorld(22104,[{code:`(async()=>{const image=new Image();image.src=${JSON.stringify(dataUrl)};await image.decode();if(!image.naturalWidth||!image.naturalHeight)throw Error('Image vide');const scale=Math.min(1,160/image.naturalWidth,160/image.naturalHeight),canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(image.naturalWidth*scale));canvas.height=Math.max(1,Math.round(image.naturalHeight*scale));canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);return canvas.toDataURL('image/png')})()`}]);
  const preview=nativeImage.createFromDataURL(thumbnail);
  if(preview.isEmpty())throw Error('Aperçu vide');
  return preview;
 }catch(error){throw new Error('Image invalide ou format non pris en charge.',{cause:error});}
}
