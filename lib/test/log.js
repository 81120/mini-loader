testLoader.define(function(requrie, exports, module) {
  module.exports = function(msg) {
    console.log('in the log.js')
    document.body.innerHTML = msg
  }
})