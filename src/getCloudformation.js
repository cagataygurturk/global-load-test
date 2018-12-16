const validUrl = require('valid-url');
const isIp = require('is-ip');
const urlLibrary = require('url');

const getSkeleton = () => {
    return {
        AWSTemplateFormatVersion: "2010-09-09",
        Parameters: {
            RequestInterval: {
                Type: "String"
            }
        },
        Resources: {},
        Outputs: {}
    };
};

const checkParameters = (flags) => {

    const {name, url} = flags;

    if (!name) {
        throw new Error('No name specified.');
    }

    if (!/^[a-zA-Z0-9-_]+$/.test(name)) {
        throw new Error('Only alphanumeric characters, dashes and underscores are allowed for name parameter.');

    }

    if (!url) {
        throw new Error('No url specified.');
    }

    if (!validUrl.isWebUri(url)) {
        throw new Error('URL given is not valid. Only HTTP(S) domains are supported.')
    }
};

const generateCloudformationByParameters = (stackName,flags) => {

    checkParameters(flags);
    const {name, url, level} = flags;

    const stackBody = getSkeleton();

    const stackParameters = {
        RequestInterval: 10,
    };

    let healthCheckPercentage;
    switch (level) {
        case 'light':
            healthCheckPercentage = 10;
            break;
        case 'medium':
            healthCheckPercentage = 50;
            break;
        case 'heavy':
            healthCheckPercentage = 100;
            break;
        default:
            const levelAsInteger = parseInt(level);
            if (!Number.isInteger(levelAsInteger) || level > 100) {
                throw new Error('level parameter can be light (10%), medium (50%), heavy (100%) or a percentage value between 1 and 100');
            }
            healthCheckPercentage = levelAsInteger;
    }

    const healthCheckCount = 199 * healthCheckPercentage / 100;

    const healthCheckConfig = {
        RequestInterval: 10
    };

    const parsedUrl = urlLibrary.parse(url, true);

    switch (parsedUrl.protocol) {
        case "http:":
            stackBody.Parameters.T = {Type: 'String'};
            stackParameters.T = 'HTTP';
            healthCheckConfig.Type = {Ref: 'T'};
            break;
        case "https:":
            stackBody.Parameters.T = {Type: 'String'};
            stackParameters.T = 'HTTPS';
            healthCheckConfig.Type = {Ref: 'T'};
            healthCheckConfig.EnableSNI = true;
            break;
        default:
            throw new Error('Invalid protocol. Only HTTP(S) domains are supported.');
    }

    if (!isIp(parsedUrl.hostname)) {
        stackBody.Parameters.D = {Type: 'String'};
        stackParameters.D = parsedUrl.hostname;
        healthCheckConfig.FullyQualifiedDomainName = {Ref: 'D'};
    } else {
        stackBody.Parameters.I = {Type: 'String'};
        stackParameters.I = parsedUrl.hostname;
        healthCheckConfig.IPAddress = {Ref: 'I'};
    }


    if (parsedUrl.port !== null) {
        stackBody.Parameters.PR = {Type: 'String'};
        stackParameters.PR = parsedUrl.port;
        healthCheckConfig.Port = {Ref: 'PR'};
    }

    stackBody.Parameters.P = {Type: 'String'};
    stackParameters.P = parsedUrl.pathname + (parsedUrl.search ? parsedUrl.search : "");
    healthCheckConfig.ResourcePath = {Ref: 'P'};

    for (let i = 1; i <= healthCheckCount; i++) {

        const config = Object.assign({}, healthCheckConfig);

        if (i === 1) {
            config.MeasureLatency = true
        }

        stackBody.Resources['HealthCheck' + i] = {
            Type: "AWS::Route53::HealthCheck",
            Properties: {
                HealthCheckConfig: config
            }
        };
    }


    stackBody.Resources['Dashboard'] =
        {
            "Type": "AWS::CloudWatch::Dashboard",
            "Properties": {
                "DashboardName": name,
                "DashboardBody": {
                    "Fn::Sub":
                        JSON.stringify({
                            "widgets": [
                                {
                                    "type": "metric",
                                    "x": 0,
                                    "y": 0,
                                    "width": 24,
                                    "height": 9,
                                    "properties": {
                                        "metrics": [
                                            ["AWS/Route53", "TimeToFirstByte", "HealthCheckId", "${HealthCheck1}", "Region", "us-west-1"],
                                            ["...", "sa-east-1"],
                                            ["...", "ap-southeast-1"],
                                            ["...", "ap-southeast-2"],
                                            ["...", "us-west-2"],
                                            ["...", "us-east-1"],
                                            ["...", "eu-west-1"],
                                            ["...", "ap-northeast-1"]
                                        ],
                                        "view": "timeSeries",
                                        "stacked": false,
                                        "region": "us-east-1",
                                        "period": 300
                                    }
                                }
                            ]
                        })
                },
            }

        };


    return {
        stackName,
        stackBody: JSON.stringify(stackBody),
        stackParameters
    }
};


module.exports = generateCloudformationByParameters;