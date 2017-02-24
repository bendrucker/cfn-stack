# cfn-stack [![Build Status](https://travis-ci.org/bendrucker/cfn-stack.svg?branch=master)](https://travis-ci.org/bendrucker/cfn-stack)

> CLI for launching CloudFormation stacks using local parameter files

`cfn-stack` is a simple CLI designed to join templates with YAML files that specify the stack name, template, and input parameters.

It is designed to work with stack files organized into a logical folder structure. A simple application might use the following stack configuration:

```
.
├── development
│   ├── _defaults.yml
│   ├── api.yml
│   └── web.yml
└── production
    ├── _defaults.yml
    ├── api.yml
    └── web.yml
```

You'll point `cfn-stack` to an individual stack configuration (e.g. `production/api.yml`). A `_defaults.yml` sibling file can supply default parameters to every stack. 

Your stack file might look like this:

```yaml
Template: api.yml
Parameters:
  DnsName: api.web
```

The live stack that `cfn-stack` creates will be named based on the file path. `production/api.yml` is created as `production-api`. This allows you to store stack configurations outside of AWS, under version control, while still retaining a clear relationship between your source files and CloudFormation. 

## Install

To use the CLI:

```sh
npm install --global cfn-stack
```

Or to use the API:

```sh
npm install --save cfn-stack
```

## Usage

### CLI

```sh
cfn-stack stacks/production/api.yml
```

### API

```js
var cfnStack = require('cfn-stack')

var stack = {
  Name: 'my-stack',
  TemplateBody: fs.readFileSync('api.yml'),
  Parameters: {
    DnsName: 'api.web'
  }
}

cfnStack(stack, {region: 'us-east-1'}, callback)
```

## CLI

#### `cfn-stack <stack>`

Creates a live CloudFormation stack using the configuration specified in the `stack` YAML file. 

##### --load

Type: `string`

An expression that will be used to generate a shell command for loading/pre-processing the template. The token `$0` will be replaced with the template path.

```sh
cfn-stack stacks/production/api.yml --load 'my-cfn-preprocessor $0'
```

##### --template-directory

Type: `string`  
Default: `templates/`

Specifies the directory where template paths will be resolved.

##### --disable-rollback

Type: `boolean`  
Default: `false`

Prevents CloudFormation from rolling back and deleting resources when stack creation fails. Does not apply to stack updates.

##### --region

Type: `string`  
Default: `us-east-1`

The AWS region where the stack will be deployed.

## API

#### `cfnStack(stack, options, callback)` -> `output`

##### stack

*Required*  
Type: `object`

A stack object defining the stack name, parameters, and template.

###### Name

*Required*  
Type: `string`

The name that will be assigned to the stack.

###### Capabilities

Type: `array`  
Default: `[]`

An array of strings specifying [stack capabilities](http://docs.aws.amazon.com/AWSCloudFormation/latest/APIReference/API_CreateStack.html).

###### Template

*Required*  
Type: `string`

A JSON or YAML CloudFormation template string.

###### Parameters

Type: `object`  
Default: `undefined`

The stack parameters expressed as an object of strings/numbers.

##### options

###### region

*Required*  
Type: `string`

The AWS region where the stack will be launched.

###### disableRollback

Type: `boolean`  
Default: `false`

Disables rollback of stacks that cannot be created successfully.

###### update

Type: `boolean`  
Default: `false`

Specifies that the stack already exists and should be updated instead of created. By default, the library will first try to create a stack and then update an existing one if it already exists.


## License

MIT © [Ben Drucker](http://bendrucker.me)
