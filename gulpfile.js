const gulp = require('gulp');
const {addAuthor} = require('./lib/gulp-add-author-plugin.js');

// just test the gulp work flow
gulp.task('test', () => {
  gulp.src(['src/*.scss'])
      .pipe(addAuthor({
        author: 'Alexander Grothendieck'
      }))
      .pipe(gulp.dest('dist'));
});