import type { Data } from './model';
import type { SupabaseClient } from '@supabase/supabase-js';
import { valid } from './storage';
export type Change = {path:string[]; value?:unknown; remove?:boolean};
const object=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
// Diff objects by field; chore arrays are atomic, completion keys are independent.
export function diff(before:unknown,after:unknown,path:string[]=[]):Change[]{
 if(JSON.stringify(before)===JSON.stringify(after))return [];
 if(object(before)&&object(after))return [...new Set([...Object.keys(before),...Object.keys(after)])].flatMap(k=>!(k in after)?[{path:[...path,k],remove:true}]:diff(before[k],after[k],[...path,k]));
 if(before===undefined&&object(after)&&Object.keys(after).length)return Object.keys(after).flatMap(k=>diff(undefined,after[k],[...path,k]));
 return [{path,value:after}];
}
export function apply(data:Data,changes:Change[]):Data {let result=structuredClone(data);for(const change of changes){if(!change.path.length){result=structuredClone(change.value) as Data;continue;}let node=result as unknown as Record<string,unknown>;for(const key of change.path.slice(0,-1)){if(['__proto__','constructor','prototype'].includes(key))throw Error('Invalid data path');if(!object(node[key]))node[key]={};node=node[key] as Record<string,unknown>;}const key=change.path.at(-1)!;if(['__proto__','constructor','prototype'].includes(key))throw Error('Invalid data path');if(change.remove)delete node[key];else if(object(change.value)&&!Object.keys(change.value).length&&object(node[key]))continue;else node[key]=structuredClone(change.value);}return result;}
export type Remote={data:Data;revision:number};
export interface SyncBackend {read():Promise<Remote|null>;create(data:Data):Promise<boolean>;write(data:Data,revision:number):Promise<boolean>}
export function backend(client:SupabaseClient,userId:string):SyncBackend{return {
 async read(){const {data,error}=await client.from('chore_accounts').select('data,revision').eq('user_id',userId).maybeSingle();if(error)throw error;if(data&&!valid(data.data))throw Error('Unsupported cloud data');return data as Remote|null;},
 async create(data){const {error}=await client.from('chore_accounts').insert({user_id:userId,data});if(error?.code==='23505')return false;if(error)throw error;return true;},
 async write(data,revision){const {data:rows,error}=await client.from('chore_accounts').update({data,revision:revision+1}).eq('user_id',userId).eq('revision',revision).select('revision');if(error)throw error;return !!rows?.length;}
};}
export async function flush(remote:SyncBackend,changes:Change[]):Promise<Data>{
 for(let attempt=0;attempt<5;attempt++){const current=await remote.read();if(!current)throw Error('Account data is missing');const next=apply(current.data,changes);if(!valid(next))throw Error('Invalid sync data');if(await remote.write(next,current.revision))return next;}
 throw Error('Another device is busy. Retrying shortly.');
}
