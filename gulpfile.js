const gulp = require('gulp');
const istanbul = require('gulp-istanbul');
const mocha = require('gulp-mocha');

gulp.task('test', () => {
  return gulp.src(['test/**/*.js'])
    .pipe(mocha())
    // .once('error', () => {
    //   process.exit(1);
    // })
    .once('end', () => {
      process.exit();
    });
});

gulp.task('pre-coverage', () => {
  return gulp.src(['lib/**/*.js'])
    .pipe(istanbul())
    .pipe(istanbul.hookRequire());
});

gulp.task('coverage', ['pre-coverage'], () => {
  return gulp.src(['test/**/*.js'])
    .pipe(mocha())
    .pipe(istanbul.writeReports({
      reporters: [ 'lcov', 'json', 'text', 'text-summary'],
    }))
    .pipe(istanbul.enforceThresholds({ thresholds: { global: 90 } }))
    // .once('error', () => {
    //   process.exit(1);
    // })
    .once('end', () => {
      process.exit();
    });
});

gulp.task('default', () => {
  console.log('Usage:');
  console.log('  test....... Run unit test');
  console.log('  coverage... Run coverage test');
});