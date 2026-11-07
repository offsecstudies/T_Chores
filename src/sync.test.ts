import {describe,it,expect} from 'vitest';
import {apply,diff,flush,type SyncBackend} from './sync';
import {seed,ensureWeek} from './model';
const initial=()=>ensureWeek(seed(),'2026-11-02');
describe('cloud synchronization',()=>{
 it('preserves unrelated checkoffs made on another device',()=>{const a=initial(),b=structuredClone(a),remote=structuredClone(a);b.weeks['2026-11-02'].completed['bed:0']=true;remote.weeks['2026-11-02'].completed['teeth:0']=true;const merged=apply(remote,diff(a,b));expect(merged.weeks['2026-11-02'].completed).toEqual({'bed:0':true,'teeth:0':true});});
 it('retains explicit unchecks and chore deletion',()=>{const a=initial();a.weeks['2026-11-02'].completed['bed:0']=true;const b=structuredClone(a);b.weeks['2026-11-02'].completed['bed:0']=false;b.chores=[];expect(apply(a,diff(a,b))).toEqual(b);});
 it('retries concurrent writes using fresh cloud data',async()=>{let data=initial(),revision=0,writes=0;const local=structuredClone(data);local.weeks['2026-11-02'].completed['bed:0']=true;const remote:SyncBackend={read:async()=>({data:structuredClone(data),revision}),create:async()=>false,write:async(next,expected)=>{writes++;if(writes===1){data.weeks['2026-11-02'].completed['teeth:0']=true;revision++;return false;}if(expected!==revision)return false;data=next;revision++;return true;}};const result=await flush(remote,diff(initial(),local));expect(writes).toBe(2);expect(result.weeks['2026-11-02'].completed).toEqual({'bed:0':true,'teeth:0':true});});
 it('surfaces network failures without claiming a save',async()=>{const remote:SyncBackend={read:async()=>{throw Error('offline');},create:async()=>false,write:async()=>false};await expect(flush(remote,[])).rejects.toThrow('offline');});
 it('does not erase checkoffs when two devices roll into a new week',()=>{const old=initial(),a=ensureWeek(old,'2026-11-09'),b=ensureWeek(old,'2026-11-09');b.weeks['2026-11-09'].completed['bed:0']=true;expect(apply(b,diff(old,a)).weeks['2026-11-09'].completed['bed:0']).toBe(true);expect(apply(old,diff(old,a))).toEqual(a);});
 it('rejects unsafe paths',()=>{expect(()=>apply(initial(),[{path:['__proto__','polluted'],value:true}])).toThrow();});
});
