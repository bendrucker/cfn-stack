'use strict'

var test = require('tape')
var path = require('path')
var stack = require('./stack')

test('simple', function (t) {
  t.plan(3)

  var options = {
    cwd: path.resolve(__dirname, 'fixture'),
    templateDirectory: path.resolve(__dirname, 'fixture', 'templates')
  }

  stack.load('./stacks/simple/app.yml', options, function (err, stack) {
    if (err) return t.end(err)
    t.equal(stack.Name, 'app-simple')
    t.ok(stack.Template.indexOf('Resources') >= 0, 'has full template string')
    t.deepEqual(stack.Parameters, {Key: 'value'}, 'has parameters')
  })
})

test('defaults', function (t) {
  t.plan(3)

  var options = {
    cwd: path.resolve(__dirname, 'fixture'),
    templateDirectory: path.resolve(__dirname, 'fixture', 'templates')
  }

  stack.load('./stacks/defaults/app.yml', options, function (err, stack) {
    if (err) return t.end(err)
    t.equal(stack.Name, 'app-defaults')
    t.ok(stack.Template.indexOf('Resources') >= 0, 'has full template string')
    t.deepEqual(stack.Parameters, {Default: 'default-value'}, 'has parameters')
  })
})

test('custom loader', function (t) {
  t.plan(3)

  var options = {
    cwd: path.resolve(__dirname, 'fixture'),
    templateDirectory: path.resolve(__dirname, 'fixture', 'templates'),
    load: 'cat $0'
  }

  stack.load('./stacks/defaults/app.yml', options, function (err, stack) {
    if (err) return t.end(err)
    t.equal(stack.Name, 'app-defaults')
    t.ok(stack.Template.indexOf('Resources') >= 0, 'has full template string')
    t.deepEqual(stack.Parameters, {Default: 'default-value'}, 'has parameters')
  })
})
