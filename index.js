'use strict'

var EventEmitter = require('events')
var CloudFormation = require('aws-sdk/clients/cloudformation')
var array = require('cast-array')

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

  if (operation === 'update') {
    delete params.DisableRollback
  }

  cfn[operation + 'Stack'](params, function (err, data) {
    if (err) {
      if (err.code === 'AlreadyExistsException') {
        return sync(stack, Object.assign({update: true}, options), callback)
      }

      return callback(err)
    }

    events.emit(operation, data)
    callback()
  })

  return events
}

function createParameters (parameters) {
  if (!parameters) return

  return Object.keys(parameters).map(function (key) {
    return {
      ParameterKey: key,
      ParameterValue: stringify(parameters[key])
    }
  })
}

function stringify (value) {
  return array(value).map(String).join(',')
}
