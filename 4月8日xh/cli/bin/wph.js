#!/usr/bin/env node
const program = require('commander');
// 版本号
program.version(require('../package').version);

program
    .command('init <name>')
    .description('生成落地页模版')
    .action(require('../lib/init.js'))
program.parse(process.argv);