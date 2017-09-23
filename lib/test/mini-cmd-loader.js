const generatePath = (id) => `${testLoader.config.root}${id}`

const getModuleExports = (mod) => {
  if (!mod.exports) {
    mod.exports = {}
    mod.factory(testLoader.require, mod.exports, mod)
  }
  return mod.exports
}

const getCurrentScript = () => document.currentScript.src

const getDependence = (factoryString) => {
  let list = factoryString.match(/require\(.+?\)/g) || []
  return list.map((dep) => dep.replace(/(^require\(['"])|(['"]\)$)/g, ''))
}

const require = (id) => {
  id = generatePath(id)
  let mod = testLoader.modules[id]
  if (mod) {
    return getModuleExports(mod)
  }
  else {
    throw 'can not get module by id: ' + id
  }
}

const load = (id) => new Promise((resolve, reject) => {
  let mod = testLoader.modules[id] || (new Module(id))
  mod.on('complete', () => {
    let exp = getModuleExports(mod)
    resolve(exp)
  })
  mod.on('error', reject)
})

const bootstrap = (ids, callback) => {
  ids = Array.isArray(ids) ? ids : [ids]
  Promise.all(ids.map((id) => load(generatePath(id))))
  .then((list) => {
    callback.apply(window, list)
  }).catch((error) => {
    throw error
  })
}

const define = (factory) => {
  let id = getCurrentScript().replace(location.origin, '')
  let mod = testLoader.modules[id]
  mod.dependences = getDependence(factory.toString())
  mod.factory = factory
  if(mod.dependences.length === 0) {
    mod.setStatus(testLoader.MODULE_STATUS.COMPLETED)
    return
  }
  Promise.all(mod.dependences.map((id) => new Promise((resolve, reject) => {
      id = generatePath(id) 
      let depMode = testLoader.modules[id] || (new Module(id))
      depMode.on('complete', resolve)
      depMode.on('error', reject)
    })
  )).then((list) => {
    mod.setStatus(testLoader.MODULE_STATUS.COMPLETED)
  }).catch((error) => {
    mod.setStatus(testLoader.MODULE_STATUS.ERROR, error)
  })
}

class Module {
  constructor(id) {
    this.id = id 
    testLoader.modules[id] = this
    this.status = testLoader.MODULE_STATUS.PENDING
    this.factory = null
    this.dependences = null
    this.callbacks = {}
    this.load()
  }

  load() {
    let id = this.id
    let script = document.createElement('script')
    script.src = id
    script.onerror = (event) => {
      this.setStatus(testLoader.MODULE_STATUS.ERROR, {
        id: id,
        error: new Error('module can not load')
      })
    }
    document.head.appendChild(script)
    this.setStatus(testLoader.MODULE_STATUS.LOADING)
  }

  on(event, callback) {
    (this.callbacks[event] || (this.callbacks[event] = [])).push(callback)
    if (
      (this.status === testLoader.MODULE_STATUS.LOADING && event === 'load') || 
      (this.status === testLoader.MODULE_STATUS.COMPLETED && event === 'complete')
    ) {
      callback(this)
    }

    if (this.status === testLoader.MODULE_STATUS.ERROR && event === 'error') {
      callback(this, this.error)
    }
  }

  emit(event, arg) {
    (this.callbacks[event] || []).forEach((callback) => {
      callback(arg || this)
    })
  }

  setStatus(status, info) {
    if (this.status === status) return
    if (status === testLoader.MODULE_STATUS.LOADING) {
      this.emit('load')
    }
    else if (status === testLoader.MODULE_STATUS.COMPLETED) {
      this.emit('complete')
    }
    else if (status === testLoader.MODULE_STATUS.ERROR) {
      this.emit('error', info)
    }
    else return
  }
}

window.testLoader = {
  define: define,
  bootstrap: bootstrap,
  require: require,
  modules: {},
  config: {
    root: ''
  },
  config: function(obj) {
    this.config = {...this.config, ...obj}
  },
  MODULE_STATUS: {
    PENDING: 0,
    LOADING: 1,
    COMPLETED: 2,
    ERROR: 3
  }
}