#!/usr/bin/env node

'use strict'

var meow = require('meow')
var child = require('child_process')
var fs = require('fs')
var path = require('path')
var waterfall = require('run-waterfall')
var yaml = require('js-yaml')
var readUp = require('read-up')
var sync = require('./')

var cli = meow(`
  Usage
    $ cfn-stack stacks/production/api.yml
  Options
    --load An expression that will be used to generate a shell command for loading the template
    --template-directory The directory that cfn-stack will use to load templates (default: templates/)
    --disable-rollback Disables rollback of stacks that fail to create or update
    --region CloudFormation region (default: us-east-1)
  Example
    $ cfn-test stacks/production/api.yml --load 'cat $0' (noop)
    # $0 is replaced with the template path specified in api.yml
`)

var options = Object.assign({
  templateDirectory: path.resolve(process.cwd(), 'templates'),
  disableRollback: false,
  region: 'us-east-1'
}, cli.flags)

waterfall([
  loadStack.bind(null, cli.input[0]),
  (stack, callback) => setTemplate(stack, options, callback),
  function (stack, callback) {
    sync(stack, options, callback)
      .on('create', (stack) => console.log(`Created: ${stack.StackId}`))
      .on('created', (stack) => console.log(`Create complete: ${stack.StackId}`))
      .on('update', (stack) => console.log(`Update: ${stack.StackId}`))
      .on('updated', (stack) => console.log(`Update complete: ${stack.StackId}`))
  }
], console.log)

function loadStack (stackPath, callback) {
  readUp('_defaults.yml', {cwd: path.dirname(stackPath), end: process.cwd()}, function (err, results) {
    if (err) return callback(err)

    var defaults = results.map(String).reverse().reduce(function (acc, data) {
      return Object.assign(acc, yaml.safeLoad(data))
    }, {})

    fs.readFile(stackPath, function (err, data) {
      if (err) return callback(err)
      var stack = yaml.safeLoad(data)

      if (!stack.Parameters) stack.Parameters = {}

      Object.assign(stack.Parameters, defaults)
      Object.assign(stack, {Name: stackName(stackPath)})
      callback(null, stack)
    })
  })
}

function setTemplate (stack, options, callback) {
  var templatePath = path.resolve(options.templateDirectory, stack.Template)
  var load = options.load

  if (!load) return fs.readFile(templatePath, onTemplate)
  child.exec(load.replace(/\$0/g, templatePath), onTemplate)

  function onTemplate (err, template, stderr) {
    if (err) {
      console.error(stderr)
      return callback(err)
    }

    callback(null, Object.assign(stack, {
      Template: template
    }))
  }
}

function stackName (stackPath) {
  return stackPath
    .replace(/^\.*\//, '')
    .replace(/\.[A-Za-z0-9]+$/, '')
    .replace(/[\._]/g, '-')
    .split('/')
    .slice(1)
    .reverse()
    .join('-')
}
