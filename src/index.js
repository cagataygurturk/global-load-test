const chalk = require('chalk');
const log = console.log;
const AWS = require('aws-sdk');
const getCloudformation = require('./getCloudformation');
const {start, stop} = require('./actions');


AWS.config.update({region: 'us-east-1'});
const cloudformation = new AWS.CloudFormation();

const main = (cli) => {


    const command = cli.input[0];

    try {
        const {stackName, stackBody, stackParameters} = getCloudformation(cli.flags);

        switch (command) {
            case 'start':
                start(cloudformation, stackName, stackBody, stackParameters, cli.flags.name);
                break;
            case 'stop':
                stop(cloudformation, stackName);
                break;
            default:
                throw new Error(`Not supported action: ${command} || (null)`);
        }

    } catch (error) {
        log(`${chalk.red(error)}`);
        log(cli.help);
        process.exit();
    }
};


module.exports = main;