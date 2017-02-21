'use strict'

var EventEmitter = require('events')
var CloudFormation = require('aws-sdk/clients/cloudformation')

module.exports = sync

function sync (stack, options, callback) {
  options = options || {}

  var cfn = new CloudFormation({region: options.region})

  var params = {
    StackName: stack.Name,
    Capabilities: stack.Capabilities,
    DisableRollback: options.disableRollback,
    TemplateBody: stack.Template,
    Parameters: createParameters(stack.Parameters)
  }

  var events = new EventEmitter()

  cfn.createStack(params, function (err, data) {
    if (err) return callback(err)
    events.emit('create', data)

    cfn.waitFor('stackCreateComplete', {StackName: data.StackId}, function (err, data) {
      if (err) return callback(err)
      data = data.Stacks[0]
      events.emit('created', data)
      callback(null, data)
    })
  })

  return events
}

function createParameters (parameters) {
  return Object.keys(parameters).map(function (key) {
    return {
      ParameterKey: key,
      ParameterValue: parameters[key]
    }
  })
}
