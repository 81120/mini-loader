testLoader.define(function(require, exports, module) {
  console.log('in the index.js')
  var log = require('log.js')
  var msg = require('msg.js')
  log(msg)
  module.exports = {
    log: log,
    msg: msg
  }
})