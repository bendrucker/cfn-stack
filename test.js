'use strict'

var test = require('tape')
var series = require('run-series')
var cuid = require('cuid')
var CloudFormation = require('aws-sdk/clients/cloudformation')
var cfnStack = require('./')

var cfn = new CloudFormation({region: 'us-east-1'})

var template = JSON.stringify({
  AWSTemplateFormatVersion: '2010-09-09',
  Description: 'Test template for cfn-stack',
  Parameters: {
    BucketPrefix: {
      Description: 'Prefix for bucket',
      Type: 'String'
    },
    BucketSuffix: {
      Description: 'Suffix for bucket',
      Type: 'String',
      Default: 'bucket'
    }
  },
  Resources: {
    Bucket: {
      Type: 'AWS::S3::Bucket',
      Properties: {
        BucketName: {
          'Fn::Sub': '${BucketPrefix}-${AWS::StackName}-${BucketSuffix}'
        }
      }
    }
  },
  Outputs: {
    BucketName: {
      Value: {
        Ref: 'Bucket'
      },
      Description: 'Bucket name'
    }
  }
})

test('create', function (t) {
  var name = 'cfn-stack-' + cuid()

  series([
    create,
    wait,
    validate,
    destroy
  ], t.end)

  function create (callback) {
    var options = {region: 'us-east-1'}

    cfnStack({
      Name: name,
      Template: template,
      Parameters: {
        BucketPrefix: 'test'
      }
    }, options, callback)
  }

  function wait (callback) {
    cfn.waitFor('stackCreateComplete', {StackName: name}, callback)
  }

  function validate (callback) {
    var params = {
      StackName: name
    }

    cfn.describeStacks(params, function (err, data) {
      if (err) return callback(err)

      var stacks = data.Stacks

      t.equal(stacks.length, 1)
      var stack = stacks[0]
      t.equal(stack.Outputs.length, 1)
      t.equal(stack.Outputs[0].OutputValue, 'test-' + name + '-bucket')
      callback()
    })
  }

  function destroy (callback) {
    cfn.deleteStack({StackName: name}, callback)
  }
})

test('update', function (t) {
  var name = 'cfn-stack-' + cuid()

  series([
    create,
    awaitCreate,
    update,
    awaitUpdate,
    validate,
    destroy
  ], t.end)

  function create (callback) {
    var options = {region: 'us-east-1'}

    cfnStack({
      Name: name,
      Template: template,
      Parameters: {
        BucketPrefix: 'test'
      }
    }, options, callback)
  }

  function awaitCreate (callback) {
    cfn.waitFor('stackCreateComplete', {StackName: name}, callback)
  }

  function update (callback) {
    var options = {region: 'us-east-1'}

    cfnStack({
      Name: name,
      Template: template,
      Parameters: {
        BucketPrefix: 'test',
        BucketSuffix: 'newfix'
      }
    }, options, callback)
  }

  function awaitUpdate (callback) {
    cfn.waitFor('stackUpdateComplete', {StackName: name}, callback)
  }

  function validate (callback) {
    var params = {
      StackName: name
    }

    cfn.describeStacks(params, function (err, data) {
      if (err) return callback(err)

      var stacks = data.Stacks

      t.equal(stacks.length, 1)
      var stack = stacks[0]
      t.equal(stack.Outputs.length, 1)
      t.equal(stack.Outputs[0].OutputValue, 'test-' + name + '-newfix')
      callback()
    })
  }

  function destroy (callback) {
    cfn.deleteStack({StackName: name}, callback)
  }
})
