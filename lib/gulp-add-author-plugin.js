const gulpUtil = require('gulp-util');
const through = require('through2');

const addAuthor = (options) => through.obj(function(file, encode, callback) {
  // if the file is empty, go to the next plugin
  if (file.isNull()) {
    this.push(file);
    return callback();
  }

  // if the file is a stream, emit a error
  if (file.isStream()) {
    this.emit('error', new gulpUtil.PluginError(PLUGIN_NAME, 'stream is not supported'));
    this.push(file);
    return callback();
  }

  // deal with the normal logic
  const fileContent = file.contents.toString();
  const {author = 'leo'} = options;
  const date = (new Date()).getTime();
  const updatedFileContent = `
    /*
    * by ${author}
    * at ${date}
    * /
    ${fileContent}
  `;
  file.contents = new Buffer(updatedFileContent);
  this.push(file);
  callback();
});

module.exports = {addAuthor};