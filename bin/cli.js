#!/usr/bin/env node
const meow = require('meow');
const main = require('../src');

const cli = meow(`
	Usage
	  $ global-load-test [start|stop]

	Options
	  --name, -n  Name of the test
	  --url, -u  URL to be tested
	  --level, -l Load test level (minimum | light | medium | heavy)

	Examples
	  $ global-load-test start --name my-load-test --url https://www.google.com --level light

`, {
    flags: {
        name: {
            type: 'string',
            alias: 'n'
        },
        url: {
            type: 'string',
            alias: 'u'
        },
        level: {
            type: 'string',
            alias: 'l',
            default: 'light'
        }
    }
});


main(cli);