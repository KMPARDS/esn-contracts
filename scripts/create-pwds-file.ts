import { writeFileSync } from 'fs-extra';
const password = require('prompt-sync')()('password: ', { echo: '*' });

writeFileSync('./node.pwds', password, { encoding: 'utf-8' });
