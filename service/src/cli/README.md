# Archaeologist CLI

### Overview
The CLI provides the archaeologist service a way to quickly interact with the contracts.

### Setup
> npm run cli:prepare

### Examples
> cli help

> cli help register

> cli register --digging-fee 100 --rewrap-interval 10000 --free-bond 200

> cli register --view

# Development

### Create a new CLI command
The CLI uses packages: [command-line-args](https://github.com/75lb/command-line-args) and [command-line-commands](https://github.com/75lb/command-line-commands)

1. If your command will use options, setup a new options config array in the `config/options-config.ts` file. These are the options which can be passed to your new command.
####
2. Create a new command in the `commands` folder. See the `command` interface and other commands for examples of how to setup the new command. If necessary, you will use the options array from step 1 in the new command.
####
3. Register the new command in the `cli.ts` constructor using `this.addCommand`
4. Optionally, you can implement a `validateArgs` method in the command for arg validations.

###
#### Notes:
The `type` field can be a function which is called on the value provided via the command line args. For example, `parseEther` is being called on a few values in the `register` command.