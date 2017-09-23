var globalObject = window

global.define = define
global.miniLoader = {
  use: use,
  require: requrie,
  modules: {},
  config: {
    root: '/'
  },
  setConfig: function(obj) {
    for(var key in obj) {
      this.config[key] = obj[key]
    }
  },
  MODULE_STATUS: {
    PENDING: 0,
    LOADING: 1,
    COMPLETED: 2,
    ERROR: 3
  }
}

function use(ids, callback) {
  if(!Array.isArray(ids)) {
    ids = [ids]
  }
  Promise.all(ids.map(function(id) {
    return load(miniLoader.config.root + id)
  })).then(function(list) {
    if (typeof callback == 'function') {
      callback.apply(window, list)
    }
  }).catch(function(error) {
    throw error
  })
}

function load(id, callback) {
  return new Promise(function(resolve, reject) {
    var mod = miniLoader.modules[id] || Module.create(id)
    mod.on('complete', function() {
      var exp = getModuleExports(mod)
      if (typeof callback == 'function') {
        callback(exp)
      }
    })
    mod.on('error', reject)
  })
}

function Module(id) {
  miniLoader.modules[id] = this
  this.id = id
  this.status = miniLoader.MODULE_STATUS.PENDING
  this.factory = null
  this.dependences = null
  this.callbacks = {}
  this.load()
}

Module.create = function(id) {
  return new Module(id)
}

Module.prototype.load = function() {
  var id = this.id;
  var script = document.createElement('script')
  script.src = id
  script.onerror = function(event) {
    this.setStatus(miniLoader.MODULE_STATUS.ERROR, {
      id: id,
      error: (this.error = new Error('module can not load'))
    })
  }.bind(this)
  document.head.appendChild(script)
  this.setStatus(miniLoader.MODULE_STATUS.LOADING)
}

Module.prototype.on = function(event, callback) {
  (this.callbacks[event] || (this.callbacks[event] = [])).push(callback)
  if (
    (this.status === miniLoader.MODULE_STATUS.LOADING && event === 'load') || 
    (this.status === miniLoader.MODULE_STATUS.COMPLETED && event === 'complete')
  ) {
    callback(this)
  }

  if (this.status === miniLoader.MODULE_STATUS.ERROR && event === 'error') {
    callback(this, this.error)
  }
}

Module.prototype.fire = function(event, arg) {
  (this.callbacks[event] || []).forEach(function(callback) {
    callback(arg || this)
  }.bind(this))
}

Module.prototype.setStatus = function(status, info) {
  if (this.status !== status) {
    this.status = status
    switch (status) {
      case miniLoader.MODULE_STATUS.LOADING: {
        this.fire('load')
        break
      }
      case miniLoader.MODULE_STATUS.COMPLETED: {
        this.fire('complete')
        break
      }
      case miniLoader.MODULE_STATUS.ERROR: {
        this.fire('error', info)
        break
      }
      default: break
    }
  }
}

function exports(factory) {
  var id = getCurrentScript().replace(location.origin, '')
  var mod = miniLoader.modules[id]
  var dependences = mod.dependences = getDependence(factory.toString())
  mod.factory = factory
  if (dependences) {
    Promise.all(dependences.map(function(id) {
      return new Promise(function(resolve, reject) {
        id = miniLoader.config.root + id 
        var depMode = miniLoader.modules[id] || Module.create(id)
        depMode.on('complete', resolve)
        depMode.on('error', reject)
      })
    })).then(function() {
      mod.setStatus(miniLoader.MODULE_STATUS.COMPLETED)
    }).catch(function() {
      mod.setStatus(miniLoader.MODULE_STATUS.ERROR, error)
    })
  }
  else {
    mod.setStatus(miniLoader.MODULE_STATUS.COMPLETED)
  }
}

function getCurrentScript() {
  var doc = document;
  if (doc.currentScript) {
    return doc.currentScript.src
  }
  var stack;
  try {
    a.b.c()
  } catch(e) {
    stack = e.stack
    if(!stack && window.opera) {
      stack = (String(e).match(/of linked script \S+/g) || []).join(" ")
    }
    if(stack) {
      stack = stack.split( /[@ ]/g).pop()
      stack = stack[0] == "(" ? stack.slice(1, -1) : stack
      return stack.replace(/(:\d+)?:\d+$/i, "")
    }
    var nodes = head.getElementsByTagName('script')
    for(var i = 0, node; node = nodes[i++];) {
      if(node.readyState === 'interactive') {
        return node.className = node.src
      }
    }
  }
}

function getDenpendence(factory) {
  var list = factory.match(/require\(.+?\)/g)
  if (list) {
    list = list.map(function (dep) {
      return dep.replace(/(^require\(['"])|(['"]\)$)/g, '')
    })
  }
  return list
}

function getModuleExports(mod) {
  if (!mod.exports) {
    mod.exports = {}
    mod.factory(miniLoader.require, mod.exports, mod)
  }
  return mod.exports
}

function require(id) {
  id = miniLoader.config.root + id
  var mod = miniLoader.modules[id]
  if (mod) {
    return getModuleExports(mod)
  }
  else {
    throw 'can not get module by id: ' + id
  }
}

require.async = function(ids, callback) {
  miniLoader.use(ids, callback)
}