'use strict'

var EventEmitter = require('events')
var CloudFormation = require('aws-sdk/clients/cloudformation')

module.exports = sync

function sync (stack, options, callback) {
  if (typeof options === 'function') {
    callback = options
    options = {}
  }

  var cfn = new CloudFormation({region: options.region})

  var params = {
    StackName: stack.Name,
    Capabilities: stack.Capabilities,
    DisableRollback: options.disableRollback,
    TemplateBody: stack.Template,
    Parameters: createParameters(stack.Parameters)
  }

  var events = new EventEmitter()
  var operation = options.update ? 'update' : 'create'

  cfn[operation + 'Stack'](params, function (err, data) {
    if (err) {
      if (err.code === 'AlreadyExistsException') {
        return sync(stack, Object.assign({update: true}, options), callback)
      }

      return callback(err)
    }

    events.emit(operation, data)

    var wait = ['stack', options.update ? 'Update' : 'Create', 'Complete'].join('')
    cfn.waitFor(wait, {StackName: data.StackId}, function (err, data) {
      if (err) return callback(err)
      data = data.Stacks[0]
      events.emit(operation + 'd', data)
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
