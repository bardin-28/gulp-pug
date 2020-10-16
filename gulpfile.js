let project_folder = require("path").basename('dist'),
    source_folder = "#src",
    fs = require('fs');
    
let { src, dest }   = require('gulp'),
    gulp            = require('gulp'),                            // Сам сборщик Gulp
    plumber         = require('gulp-plumber'),                    // Настройка обработки ошибок в Gulp
    browsersync     = require("browser-sync").create(),           // виртуальный сервер  
    concat          = require('gulp-concat'),               	  // конкатенация (соединение нескольких файлов в один файл JS)
    del             = require("del"),                             // очистка старой сборки
    scss            = require("gulp-sass"),                       // SCSS для проекта
    autoprefixer    = require("gulp-autoprefixer"),               // Пакет расстановки вендорных перфиксов
    rename          = require('gulp-rename'),                     // Переименование файлов в Gulp
    uglify          = require('gulp-uglify-es').default,          // Минификация JS-файлов
    ttf2woff        = require('gulp-ttf2woff'),                   // Шрифты WOFF
    ttf2woff2       = require('gulp-ttf2woff2'),                  // Шрифты WOFF2
    fonter          = require('gulp-fonter'),                     // Преобразование шрифтов
    sourcemaps      = require('gulp-sourcemaps'),                 // Sourcemaps
    pug             = require('gulp-pug'),                        // Pug
    clean_css       = require('gulp-clean-css'),                  // Чистый CSS
    imagemin        = require('gulp-imagemin'),                   // Сжатие картинок
    babel           = require('gulp-babel');                      // Конвертируем JS

/* Define paths & directories
 * ========================================================================= */
let path = {
    build: {
        html: project_folder + "/",
        css: project_folder + "/css/",
        js: project_folder + "/scripts/",
        img: project_folder + "/images/",
        fonts: project_folder + "/fonts/"
    },
    src: {
        html: source_folder + "/html/*.pug",
        css: source_folder + "/styles/style.scss",
        js: source_folder + "/scripts/*.js",
        img: source_folder + "/images/**/*.*",
        fonts: source_folder + "/fonts/*.{ttf,woff,woff2}"
    },
    watch: {
        html: source_folder + "/html/**/*.pug",
        css: source_folder + "/styles/**/*.scss",
        js: source_folder + "/scripts/**/*.js",
        img: source_folder + "/images/**/*.{jpg,png,svg,gif,ico,webp}"
    },
    clean: "./dist"
}

/* Define paths & directories
 * ========================================================================= */
function browserSyns(params) {
    browsersync.init({
        server: {
            baseDir: "./dist/",
            startPath: "./index.html"
        },
        port: 8080,
        notify: false
    })
}

function html() {
    return gulp.src(path.src.html)
        .pipe(pug({
            pretty: true
        }))
        .pipe(gulp.dest(path.build.html))
        .pipe(browsersync.stream())
}

function css() {
    return src(path.src.css)
        .pipe(
            scss({
                outputStyle: "expanded"
            }))
        .pipe(
            autoprefixer({
                overrideBrowserslist: ["last 5 versions"],
                cascade: true
            })
        )
        .pipe(dest(path.build.css))
        .pipe(clean_css())
        .pipe(rename({
            extname: ".min.css"
        }))
        .pipe(dest(path.build.css))
        .pipe(browsersync.stream())
}

function js() {
    return src([ // Добавление самописных файлов скриптов
        '#src/scripts/home.js',
        '#src/scripts/about.js'
        ])
        .pipe(concat('scripts.js'))
        .pipe(babel({
            presets: ['@babel/env']
        }))
        .pipe(dest(path.build.js))
        .pipe(uglify())
        .pipe(rename({
            extname: ".min.js"
        }))
        .pipe(dest(path.build.js))
        .pipe(browsersync.stream())
}

function scripts_libraries() {
    return gulp.src([       // Добавление новых библиотек и файлов
            // '#src/libraries/jquery-3.4.1/jquery-3.4.1.min.js',
            // '#src/libraries/bootstrap/bootstrap.min.js',
            // '#src/libraries/wow/wow.min.js',
            '#src/libraries/swiper/swiper-bundle.min.js'
        ])
        // .pipe(sourcemaps.init())
        .pipe(concat('all.js'))
        // .pipe(sourcemaps.write('./maps'))
        .pipe(rename('libraries.min.js'))
        .pipe(gulp.dest('dist/scripts/'));
}

function images() {
    return src(path.src.img)
        .pipe(imagemin({
            progressive: true
        }))
        .pipe(dest(path.build.img))
        .pipe(browsersync.stream())
}

function fonts() {
    src(path.src.fonts)
        .pipe(ttf2woff())
        .pipe(dest(path.build.fonts));
    src(path.src.fonts)
        .pipe(ttf2woff2())
        .pipe(dest(path.build.fonts));
    return src(path.src.fonts)
        .pipe(dest(path.build.fonts));
}

/*
  ============== Подключение шрифтов ==============
  При удалении | замене шрифтов нужно назначать все первые переменные одинаковые для одного шрифта,
  и заменять font weight на корректный в файле _fonts.scss
  fontsStyle отработает корректно только если _fonts.scss будет пустым перед выполнением

  font('Общее значение шрифта', 'файл-исходник', 'font weight', 'стиль шрифта')

*/

function fontsStyle(params) {
    let file_content = fs.readFileSync(source_folder + '/styles/utils/_fonts.scss');
    if (file_content == '') {
        fs.writeFile(source_folder + '/styles/utils/_fonts.scss', '', cb);
        return fs.readdir(path.build.fonts, function (err, items) {
            if (items) {
                let c_fontname;
                for (var i = 0; i < items.length; i++) {
                    let fontname = items[i].split('.');
                    fontname = fontname[0];
                    if (c_fontname != fontname) {
                        fs.appendFile(source_folder + '/styles/utils/_fonts.scss', '@include font("' + fontname + '", "' + fontname + '", "400", "normal");\r\n', cb);
                    }
                    c_fontname = fontname;
                }
            }
        })
    }
}

function cb() {} // Нужен для корректной работы

function watchFiles(params) {
    gulp.watch([path.watch.html], html);
    gulp.watch([path.watch.css], css);
    gulp.watch([path.watch.js], js);
    gulp.watch([path.watch.img], images);
}

function clean(params) {
    return del(path.clean)
}

/* GULP RUN
 * ========================================================================= */

// Register tasks to expose to the CLI
// ------------------------------------------------------------------------- */

let build = gulp.series(clean, gulp.parallel(js, css, html, images, fonts, scripts_libraries), fontsStyle)
let watch = gulp.parallel(build, watchFiles, browserSyns);

/* -------------------------------------------------------------------------
 * Define default task that can be called by just running `gulp` from cli
 * -------------------------------------------------------------------------
 */ 

exports.fontsStyle = fontsStyle;
exports.fonts = fonts;
exports.images = images;
exports.js = js;
exports.css = css;
exports.html = html;
exports.build = build;
exports.watch = watch;
exports.default = watch;