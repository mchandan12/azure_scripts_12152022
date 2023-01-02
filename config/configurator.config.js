/* eslint-disable camelcase */
const configurator = require('@intc/configurator');

require('dotenv').config();


/*
  // If you need secure parameters (logins etc) copy the below section into a file /config/local.js
  // The local.js should NOT be uploaded to github and is ignored by git per the .gitignore file.

  if (/local/.exec(process.env.NODE_ENV)) {  // if not running locally disregard this file
    require('configurator-defaults').setLocalVcapServices({
      sessionSecret: '8e7ce7911a378c4cd123ae900fecfc05', // replace for your session encryption
      dbPassword: 'SECRET_HERE',
      dbUrl: 'SECRET_HERE'
    });
  }

  // for non-local development, when using cloud foundry you should use user-provided services.
  // essentially, take the data from your local.js file and run:
  // CREATE:
  // > cf cups <ups-name> -p "your data in json format"
  // or UPDATE:
  // > cf uups <ups-name> -p "your data in json format"
  // then BIND SERVICE TO APP:
  // > cf bind-service <app-name> <ups-name>
*/

/*try { // if a local.js file exists run it to update the environment variables
  require('./local'); // eslint-disable-line global-require,import/no-unresolved
}
catch (e) {
  console.log('skipping local.js load'); // eslint-disable-line no-console
}
require('configurator-defaults')('VCAP_SERVICES');*/

const databaseDevConfig = JSON.parse(process.env.DATABASE_DEV_CONFIG);
const databaseTestConfig = JSON.parse(process.env.DATABASE_TEST_CONFIG);
const databaseProdConfig = JSON.parse(process.env.DATABASE_PROD_CONFIG);

configurator.register({
  sails_environment: 'development', // default configuration

  //useCookieDomain: true,
  sessionSecret: '8e7ce7911a378c4cd123ae900fecfc05',

  mysql:{
    adapter: 'sails-mysql',
    port: databaseDevConfig.databasePort,
    host: databaseDevConfig.databaseHost,
    user: databaseDevConfig.databaseUser,
    password: databaseDevConfig.databasePassword,
    database: databaseDevConfig.databaseName,
    ssl: {
      rejectUnauthorized: false
    }
  }


  /* MARIADB - Uncomment and fill in the relevant values*/


});

// configs for local
configurator.register({
  NODE_ENV: ['local', 'localhost'], // one must set the environment variable NODE_ENV to use this configuration
  sails_port: process.env.PORT || 1337,
  sails_environment: 'development',
  //useCookieDomain: true,
});

// configs for development
configurator.register({
  NODE_ENV: 'development', // one must set the environment variable NODE_ENV to use this configuration
  environment: 'development',
  sails_port: process.env.PORT || 1337,
  sails_environment: 'development',

  mysql:{
    adapter: 'sails-mysql',
    port: databaseDevConfig.databasePort,
    host: databaseDevConfig.databaseHost,
    user: databaseDevConfig.databaseUser,
    password: databaseDevConfig.databasePassword,
    database: databaseDevConfig.databaseName,
    ssl: {
      rejectUnauthorized: false
    }
  }

});

// configs for staging
configurator.register({
  NODE_ENV: 'test', // one must set the environment variable NODE_ENV to use this configuration
  environment: 'test',
  // use 'production' mode of sails when not under active development
  sails_environment: 'production',
  //useCookieDomain: true,

  mysql:{
    adapter: 'sails-mysql',
    port: databaseTestConfig.databasePort,
    host: databaseTestConfig.databaseHost,
    user: databaseTestConfig.databaseUser,
    password: databaseTestConfig.databasePassword,
    database: databaseTestConfig.databaseName,
    ssl: {
      rejectUnauthorized: false
    }
  }



  // use 'production' mode of sails when not under active development
});

// configs for production
configurator.register({
  NODE_ENV: 'production', // one must set the environment variable NODE_ENV to use this configuration
  environment: 'production',
  sails_environment: 'production',
  //useCookieDomain: true,

  /*earaMongo: {
    adapter: 'sails-mongo',
    url: local.mongoPreProd,
  },*/

  mysql:{
    adapter: 'sails-mysql',
    port: databaseProdConfig.databasePort,
    host: databaseProdConfig.databaseHost,
    user: databaseProdConfig.databaseUser,
    password: databaseProdConfig.databasePassword,
    database: databaseProdConfig.databaseName,
    ssl  : {
      rejectUnauthorized: false
    }
  }


});

module.exports = configurator.config;
