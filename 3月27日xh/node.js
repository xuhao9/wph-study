const http = require('http');
const fs = require('fs');
http.createServer((req, res) => {
    console.log(req.method)
    const url = req.url;
    fs.readFile('./data.json', (err, data) => {
        if (err) res.end('读取文件错误')
        const mockData = JSON.parse(data);
        if (mockData[url]) {
            res.end(JSON.stringify(mockData[url]))
        } else {
            res.end('未找到')
        }
    })
}).listen(3000, () => {
    console.log('listen at 3000')
})