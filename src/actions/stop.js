const ora = require('ora');

const stop = (cloudformation, stackName) => {

    const params = {
        StackName: stackName
    };

    const spinner = ora('Stopping load test', {color: 'yellow'}).start();
    cloudformation
        .deleteStack(params)
        .promise()
        .then(data => {
            spinner.text = 'Waiting until test is stopped.';
            cloudformation.waitFor('stackDeleteComplete', params).promise()
                .then(data => {
                    spinner.succeed('Test stopped');
                })
                .catch(error => {
                    spinner.fail(`Test could not be stopped: ${error.message}`)
                });

        })
        .catch(error => {
            spinner.fail(`Test could not be stopped: ${error.message}`)
        });
};


module.exports = stop;