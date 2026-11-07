import { seed, type Data } from './model';
// Replace this adapter with a Supabase repository when accounts are introduced.
// IDs and week keys remain stable; historical weeks own their chore/reward snapshots.
export interface ChoreRepository { load(): Data; save(data: Data): void }
function valid(value: unknown): value is Data {
 const d=value as Data; if(!d || d.version!==1 || !Array.isArray(d.chores) || !d.weeks || typeof d.weeks!=='object') return false;
 const chore=(c: Data['chores'][number])=>c && typeof c.id==='string' && typeof c.title==='string' && typeof c.category==='string' && Number.isFinite(c.points) && c.points>=0 && Array.isArray(c.days) && c.days.every(n=>Number.isInteger(n)&&n>=0&&n<=6);
 const reward=(r: Data['reward'])=>r && typeof r.title==='string' && ['points','completion'].includes(r.mode) && Number.isFinite(r.target) && r.target>0;
 return d.chores.every(chore) && reward(d.reward) && Object.entries(d.weeks).every(([key,w])=>/^\d{4}-\d{2}-\d{2}$/.test(key) && w && Array.isArray(w.chores)&&w.chores.every(chore)&&reward(w.reward)&&w.completed&&typeof w.completed==='object'&&Object.values(w.completed).every(v=>typeof v==='boolean'));
}
export const localRepository: ChoreRepository = { load(){const raw=localStorage.getItem('teddy-chores:v1'); if(!raw)return seed(); const data:unknown=JSON.parse(raw); if(!valid(data))throw new Error('Saved data is not supported.');return data;},save(data){localStorage.setItem('teddy-chores:v1',JSON.stringify(data));} };
