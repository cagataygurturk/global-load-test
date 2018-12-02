const ora = require('ora');

const getStackParametersFromObject = (object) => {
    const parameters = [];
    Object.keys(object).forEach(key => {
        const value = object[key];
        parameters.push({
            ParameterKey: key,
            ParameterValue: value.toString()
        })
    });
    return parameters;
};

const start = (cloudformation, stackName, stackBody, stackParameters, testName) => {

    /*
    console.log(stackBody);
    console.log(stackParameters);
    */

    const createStackParams = {
        StackName: stackName,
        TemplateBody: stackBody,
        Parameters: getStackParametersFromObject(stackParameters)
    };

    const spinner = ora('Creating load test', {color: 'yellow'}).start();

    cloudformation
        .createStack(createStackParams)
        .promise()
        .then(data => {
            spinner.text = 'Waiting until test starts';
            cloudformation
                .waitFor('stackCreateComplete', {
                    StackName: stackName
                })
                .promise()
                .then(data => {
                    spinner.succeed(`Test started. You can visit https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=${testName} to check latency results.`);
                });
        })
        .catch(error => {
            let errorMessage;
            switch (error.code) {
                case 'AlreadyExistsException':

                    spinner.text = 'A test with same name is already running. Updating the test with new values, if necessary. To stop the test, run global-load-test stop --name TEST_NAME';

                    cloudformation
                        .updateStack(createStackParams)
                        .promise()
                        .then(data => {
                            spinner.succeed('Test updated with new values.');
                        })
                        .catch(error => {
                            if (error.message === 'No updates are to be performed.') {
                                return spinner.succeed('Test updated with new values.');
                            }
                            if (error.code === 'ValidationError') {
                                return spinner.fail(`Your test is already being updated. Two updates can't be performed at the same time. Please wait a bit and retry later.`);
                            }
                            spinner.fail(`Test update failed: ${error.code} ${error.errorMessage}`)
                        });

                    return;

                default:
                    errorMessage = error.message;
                    break;
            }
            spinner.fail(`Test creation failed: ${errorMessage}`)
        });
};

module.exports = start;