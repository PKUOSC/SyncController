#!env node

config =  require('./config');
console.log(config);

require('./server')();