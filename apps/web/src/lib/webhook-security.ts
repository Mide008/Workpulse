// apps/web/src/lib/webhook-security.ts
import crypto from 'crypto'
export function hashWebhookKey(raw:string){return crypto.createHash('sha256').update(raw).digest('hex')}
export function generateWebhookKey(){const raw=`wpwh_${crypto.randomBytes(32).toString('hex')}`;return{raw,hashed:hashWebhookKey(raw)}}
export function verifyWebhookKey(raw:string,stored:string){try{return crypto.timingSafeEqual(Buffer.from(hashWebhookKey(raw),'hex'),Buffer.from(stored,'hex'))}catch{return false}}
export function verifyWebhookSignature(body:string,secret:string,signature:string){const expected=crypto.createHmac('sha256',secret).update(body).digest('hex');const sig=signature.replace('sha256=','');try{return crypto.timingSafeEqual(Buffer.from(expected,'hex'),Buffer.from(sig,'hex'))}catch{return false}}
