import {describe,it,expect} from 'vitest';
import {connectionError} from './errors';
describe('connection error guidance',()=>{
 it('identifies a missing Supabase table from a plain object',()=>expect(connectionError({code:'PGRST205',message:'Could not find table'})).toContain('table is missing'));
 it('explains permission failures',()=>expect(connectionError({code:'42501',message:'permission denied'})).toContain('restore account permissions'));
 it('preserves unexpected PostgREST details for diagnosis',()=>expect(connectionError({code:'OTHER',message:'Actual server message'})).toBe('Actual server message (OTHER)'));
 it('handles native and unknown errors',()=>{expect(connectionError(new Error('Failed to fetch'))).toBe('Failed to fetch');expect(connectionError(null)).toContain('Could not reach Supabase');});
});
