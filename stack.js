'use strict'

var assert = require('assert')
var parallel = require('run-parallel')
var yaml = require('js-yaml')
var partial = require('ap').partial
var readUp = require('read-up')
var fs = require('fs')
var path = require('path')
var child = require('child_process')
var fromString = require('from2-string')
var cfnTemplate = require('cfn-template-stream')
var pick = require('object.pick')

module.exports = { load }

function load (stackPath, options, callback) {
  assert(stackPath, 'stack path is required')
  assert(options.cwd, 'cwd is required')

  stackPath = path.resolve(options.cwd, stackPath)

  parallel({
    defaults: partial(readDefaults, stackPath, options),
    stack: partial(readStack, stackPath, options)
  }, function (err, results) {
    if (err) return callback(err)

    readTemplate(results.stack, options, function (err, template) {
      if (err) return callback(err)
      callback(null, setData(results.stack, results.defaults, template))
    })
  })
}

function readDefaults (stackPath, options, callback) {
  var cwd = path.dirname(stackPath)
  var end = options.cwd

  readUp('_defaults.yml', { cwd, end }, function (err, results) {
    if (err) return callback(err)
    callback(null, parseDefaults(results))
  })
}

function parseDefaults (results) {
  return results.map(String).reverse().reduce(function (acc, data) {
    return Object.assign(acc, yaml.load(data))
  }, {})
}

function readStack (stackPath, options, callback) {
  fs.readFile(stackPath, function (err, data) {
    if (err) return callback(err)

    var stack = yaml.load(data)

    callback(null, Object.assign({ Parameters: {} }, stack, {
      Name: options.stackName || stackName(path.relative(options.cwd, stackPath))
    }))
  })
}

function stackName (stackPath) {
  return stackPath
    .replace(/^\.*\//, '')
    .replace(/\.[A-Za-z0-9]+$/, '')
    .replace(/[._]/g, '-')
    .split('/')
    .slice(1)
    .reverse()
    .join('-')
}

function readTemplate (stack, options, callback) {
  assert(options.templateDirectory, 'template directory is required')

  var templatePath = path.resolve(options.templateDirectory, stack.Template)
  var exec = options.load

  var extname = path.extname(templatePath)

  if (!exec) return fs.readFile(templatePath, onData)

  child.exec(exec.replace(/\$0/g, templatePath), function (err, stdout, stderr) {
    if (err) return callback(Object.assign(err, { stderr }))
    onData(null, stdout)
  })

  function onData (err, template) {
    if (err) return callback(err)

    fromString(template.toString())
      .pipe(cfnTemplate.Parse(extname))
      .once('data', (data) => callback(null, {
        data,
        string: template
      }))
  }
}

function setData (stack, defaults, template) {
  defaults = pick(defaults, Object.keys(template.data.Parameters || {}))

  return Object.assign({}, stack, {
    Template: template.string,
    Parameters: Object.assign(defaults, stack.Parameters)
  })
}
