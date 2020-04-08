const { promisify } = require('util');
module.exports.clone = async (repo, desc) => {
    const download = promisify(require('download-git-repo'));
    const ora = require('ora');
    const proess = ora(`下载模版中....请等待...${repo}`);
    proess.start();
    await download(repo, desc);
    proess.succeed();
}