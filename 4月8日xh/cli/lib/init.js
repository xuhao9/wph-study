const { promisify } = require('util');
const figlet = promisify(require('figlet'));
const clear = require('clear');
const chalk = require('chalk');
const { clone } = require('../lib/download');
// 打印特殊颜色字体
const log = async content => console.log(chalk.green(content));

module.exports = async name => {
    clear(); // 清除命令行
    log(await figlet('welcome'));
    log(`🚀创建 ${name}`)
    await clone('github:xuhao9/cli-project', name);
    const ora = require('ora');
    const proess = ora('项目创建成功,安装依赖...请等待...');
    proess.start();
    await spawn('cnpm', ['install'], { cwd: `./${name}` });
    proess.succeed();
    log('安装完成');
    await spawn('npm', ['run', 'dev'], { cwd: `./${name}` });
};

const spawn = async (...args) => {
    const { spawn } = require('child_process');
    return new Promise(resolve => {
        const proc = spawn(...args);
        proc.stdout.pipe(process.stdout)
        proc.stderr.pipe(process.stderr)
        proc.on('close', () => {
            resolve()
        })
    });
};