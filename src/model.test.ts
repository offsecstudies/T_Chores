import { describe,it,expect } from 'vitest';
import {seed,weekKey,ensureWeek,stats,updateSettings} from './model';
describe('weekly routines',()=>{
 it('uses local Monday keys across Sunday, year boundaries and daylight saving',()=>{expect(weekKey(new Date(2026,0,4))).toBe('2025-12-29');expect(weekKey(new Date(2026,0,5))).toBe('2026-01-05');expect(weekKey(new Date(2026,2,8))).toBe('2026-03-02');});
 it('counts assigned instances, completed points and daily percentages',()=>{const d=ensureWeek(seed(),'2026-11-02');const w=d.weeks['2026-11-02'];w.completed={'bed:0':true,'teeth:0':true,'toys:0':true,'table:0':true,'plants:0':true};expect(stats(w,0)).toEqual({total:4,done:4,points:30,percent:100});expect(stats(w).total).toBe(27);expect(stats(w).points).toBe(30);});
 it('rolls to a fresh week while retaining prior progress and snapshots',()=>{let d=ensureWeek(seed(),'2026-11-02');d.weeks['2026-11-02'].completed['bed:0']=true;d=ensureWeek(d,'2026-11-09');d=updateSettings(d,'2026-11-09',[],{title:'New reward',target:50,mode:'completion'});expect(d.weeks['2026-11-02'].chores).toHaveLength(5);expect(d.weeks['2026-11-02'].completed['bed:0']).toBe(true);expect(d.weeks['2026-11-02'].reward.mode).toBe('points');expect(stats(d.weeks['2026-11-09']).done).toBe(0);expect(d.weeks['2026-11-09'].chores).toEqual([]);});
 it('preserves existing weeks on repeated initialization',()=>{const d=ensureWeek(seed(),'2026-11-02');expect(ensureWeek(d,'2026-11-02')).toBe(d);});
 it('handles an empty schedule without NaN',()=>{expect(stats({chores:[],completed:{},reward:seed().reward}).percent).toBe(0);});
});
