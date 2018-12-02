# Global Load Test

Global Load Test is a command line tool that allows its users to load test HTTP(S) endpoints from seven geographical different regions leveraging [AWS Route53 Health Checks](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/dns-failover.html) against the endpoint and reports the latency from these regions. 

## When to use global-load-test

Global Load Test is just a wrapper around AWS Route53 Health Checks and it does not send requests from your local computer. From this point of view, it is different than tools like ` ab` or `JMeter` and it does not offer so rich feature set like these tools. On the other hand, Global Load Test is useful when, 

- You need to know how your endpoint performs for users from different parts of the world
- You need to test your geoproximity routing system to check if your requests are properly routed between different datacenters
- You need to have long-running tests even when your workstation is offline

You may find this tool useful.

This tool is open source and free but note that you need to have an AWS Account and health checks created in your account will cost you up to 950$/month depending on how long you run tests and if you are testing HTTP or HTTPS endpoints. See [Pricing](https://aws.amazon.com/route53/pricing/#Health_Checks) page for details. As of December 2018, one health check created incurs 4,75$/month of cost and under heavy mode, this tool creates up to 200 of them. Please be aware of costs before you use the tool.

## Installation

You can install the tool with using `npm`:

```
npm install -g global-load-test
```

## Usage

### Set up your AWS Account

Although you can use any regular AWS user or role with full account access, it is recommended to create a IAM user with following policy: (This is the minimum required permissions the tool needs)

```
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "global-load-test",
            "Effect": "Allow",
            "Action": [
                "route53:CreateHealthCheck",
                "route53:DeleteHealthCheck",
                "cloudwatch:PutDashboard",
                "cloudwatch:DeleteDashboards",
                "cloudwatch:GetDashboard",
                "cloudformation:CreateStack",
                "cloudwatch:ListDashboards",
                "cloudformation:DeleteStack",
                "cloudformation:UpdateStack",
                "cloudformation:DescribeStacks"
            ],
            "Resource": "*"
        }
    ]
}
```

Tool picks up AWS credentials in [AWS Node.JS SDK's default order](https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/setting-credentials-node.html). For those working on a local developer machine, the most convenient way is to load credentials from `~/.aws/credentials` file. If you have multiple profiles, you can specify your preferred profile's name by `AWS_PROFILE` environment variable. Alternatively you can provide credentials via `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` environment variables. Please refer to AWS Node.JS SDK for all options.

### Start a test

To start a test it is sufficient to run following format, `level` parameter being optional.

```
global-load-test start --name my-global-load-test --url https://www.google.com --level light
```

`name` parameter should be unique to AWS account used.
`url` parameter should be an HTTP(S) URL. Port syntax is supported (e.g.) https://example.com:8080
`level` parameter indicates the number of health checks to be created. This parameter accepts an integer percentage value between 1 and 100. 100% means 199 health checks created and 1 is 1. (199 number is coming from the number of health checks an AWS account can have by default. 1 resource is reserved because this tool also creates a Cloudwatch Dashboard to view latencies.)

`level` parameter also has three presets. RPS values for these levels are like below:

| Level  	| Health Check Created 	| RPS (~) 	|
|--------	|----------------------	|---------	|
| light  	| 19                   	| 30      	|
| medium 	| 99                   	| 150     	|
| heavy  	| 199                  	| 315     	|

### Monitor latency values

This tool creates one Dashboard on Cloudwatch to show latencies reported by Route53 from different regions. Dashboard URL is shown when test is first created or can be manually accessed on Cloudwatch console.

### Stop a test

To stop a test and clean up all health checks creates, use the following command:

```
global-load-test stop --name my-global-load-test
```

## Authors

* **Cagatay Gurturk** - [cagataygurturk](https://github.com/cagataygurturk)

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details