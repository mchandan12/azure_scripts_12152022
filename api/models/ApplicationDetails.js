/**
 * ApplicationDetails.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
  datastore: 'apimmysql',
  tableName: 'ApplicationDetails',
  autocreatedAt: false,
  autoupdatedAt: false,
  primaryKey: 'id',
  attributes: {
    AppName: {
      type: 'string',

    },
    AppDisplayName: {
      type: 'string',

    },
    Organization: {
      type: 'string',

      required: true
    },
    Developer: {
      type: 'string',

      required: true
    },
    AzureRegistered: {
      type: 'number', defaultsTo: 0, columnType: 'INT',

    },
    id: {
      type: 'string',
      columnName: 'AppId',
      required: true
    },
    IAP: {
      type: 'number', defaultsTo: 0, columnType: 'INT',

    },
    AzureRegisteredAppName: {
      type: 'string',

      required: true
    },
    AzureRegisteredAppId: {
      type: 'string',

    },
    ClientSecretChange: {
      type: 'number', defaultsTo: 0, columnType: 'INT',

    },
    ClientSecretExpired: {
      type: 'number', defaultsTo: 0, columnType: 'INT',

    },
    AppSoftDeleted: {
      type: 'integer',
      
    },
    updatedAt: {
      type: 'string', columnType: 'datetime',

    },
    createdAt: {
      type: 'string', columnType: 'datetime',

    },
  },


};


