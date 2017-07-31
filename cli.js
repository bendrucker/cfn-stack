#!/usr/bin/env node

'use strict'

var meow = require('meow')
var assert = require('assert')
var path = require('path')
var stack = require('./stack')
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

var cwd = process.cwd()

var options = Object.assign({
  templateDirectory: path.resolve(cwd, 'templates'),
  disableRollback: false,
  region: 'us-east-1',
  cwd
}, cli.flags)

stack.load(cli.input[0], options, function (err, stack) {
  assert.ifError(err)

  sync(stack, options, function (err, data) {
    assert.ifError(err)
    console.log(JSON.stringify(data, null, 2))
  })
  .on('create', log.bind(null, 'create'))
  .on('updated', log.bind(null, 'create'))
})

function log (operation, data) {
  console.log(JSON.stringify({
    operation,
    id: data.StackId
  }))
}
