// npm run dev启动项目
// 使用npm run build会打包到dist文件夹,
// css和html内的图片地址会自动替换为cdn地址
// html内的img标签写在同一行,不要换行

// 获取当前文件夹名
const arr = __dirname.split('/');
const dir = arr[arr.length - 1];
// CDN地址
const url = `https://m-1254038939.cos.ap-guangzhou.myqcloud.com/${dir}/`;
console.log(url);
const gulp = require('gulp'),
    minifycss = require('gulp-minify-css'), //css压缩
    concat = require('gulp-concat'), //合并文件
    uglify = require('gulp-uglify'), //js压缩
    imagemin = require('gulp-imagemin'),
    rename = require('gulp-rename'), //文件重命名
    del = require('del'),
    notify = require('gulp-notify'), //提示
    babel = require('gulp-babel'),
    gutil = require('gutil'),
    connect = require('gulp-connect'),
    cp = require('child_process'),
    htmlreplace = require('gulp-html-replace'),
    htmlmini = require('gulp-htmlmin'),
    tap = require('gulp-tap');

// css

const regCss = /url\((.*?)\/img\/(.*?)\)/g;
gulp.task('minifycss',function(){
    return gulp.src('css/*.css')      //设置css
        .pipe(tap(file => {
            const contents = file.contents.toString().replace(regCss, 'url(' + url + 'img/' + '$2' + ')')
            file.contents = Buffer.from(contents)
        }))
        .pipe(concat('index.css'))      //合并css文件到"index"
        .pipe(rename({suffix:'.min'}))         //修改文件名
        .pipe(minifycss())                    //压缩文件
        .pipe(gulp.dest('dist/css'))           //设置输出路径
        .pipe(notify({message:'css task ok'}));   //提示成功
});

//JS处理
gulp.task('minifyjs',function(){
    return gulp.src('js/*.js')  //选择合并的JS
        .pipe(babel({
            presets: ['es2015'] // es5检查机制
        }))
        .pipe(concat('bundle.js')) //合并js
        .pipe(rename({
            suffix: '.min'
        })) //重命名
        .pipe(uglify()) //压缩
        .on('error', function (err) {
            gutil.log(err.toString());
        })
        .pipe(gulp.dest('dist/js')) //输出
        .pipe(notify({message:"js task ok"}));    //提示
});
// img压缩
gulp.task('imgtask',function(){
    return gulp.src(['img/*.{jpg,png}', 'img/*/*.{png,jpg}'])
        .pipe(imagemin())
        .pipe(gulp.dest('dist/img'))
        .pipe(notify({message:"img task ok"}));    //提示
});
// html资源替换+压缩
const regHtml = /<img(.*?)src=['|"](.*?)img\/(.*?)['|"](.*?)>/g;
gulp.task('htmltask',function() {
    return gulp.src('index.html')
            .pipe(tap(file => {
                const newContent = `<img$1src="${url}img/$3"$4/>`;
                const contents = file.contents.toString().replace(regHtml, newContent);
                file.contents = Buffer.from(contents);
            }))
            .pipe(htmlreplace({
                'css': url + 'css/index.min.css',
                'js': url + 'js/bundle.min.js'
            }))
            .pipe(htmlmini({
                removeComments: true, // 去除html注释
                collapseWhitespace: true // 压缩html
            }))
            .pipe(gulp.dest('dist'))
            .pipe(notify({message:"html task ok"}));    //提示
});

// 清除原文件
gulp.task('clean', function(cb) {
    del('dist/*', cb)
});
// 生成打包任务
gulp.task('default', ['clean', 'minifyjs', 'minifycss', 'htmltask', 'imgtask']);

const platform = {
    'wind32': 'start',
    'linux': 'xdg-open',
    'darwin': 'open'
}
// 启动一个9000端口的服务
gulp.task('webserver',function(){
    connect.server({
       livereload: true,
       port: 9000
    });
    // 根据不同系统打开浏览器
    cp.exec(`${platform[process.platform]} http://localhost:9000/`)
});
// 监听文件变化自动刷新页面
gulp.task('watch',function() {
    gulp.watch('js/*.js', ['reload']);
    gulp.watch('css/*.css', ['reload']);
    gulp.watch('index.html', ['reload']);
});
// 通过connect长链接自动刷新页面
gulp.task('reload',function() {
    gulp.src(['js/*.js', 'css/*.css', 'index.html'])
    .pipe(connect.reload());
});
// 开发启动任务
gulp.task('dev', ['webserver', 'watch'])
