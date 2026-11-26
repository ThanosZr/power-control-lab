// T008 is the sole sketch solver for both its GUI and feature history.
import {solve, sample} from '../cad_t008/sketch.mjs';
import {readFileSync} from 'node:fs';

const input = readFileSync(0, 'utf8');
if (Buffer.byteLength(input) > 65536) throw Error('Sketch request limit');
const result = process.argv[2] === 'sample' ? sample() : solve(JSON.parse(input));
process.stdout.write(JSON.stringify(result));
