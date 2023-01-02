/**
 * PendingAzureProcessingTasks.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

 module.exports = {
    datastore: 'apimmysql',
    tableName: 'PendingAzureProcessingTasks',
    autoupdatedAt: true,
    autocreatedAt: true,
    primaryKey: 'id',
    attributes: {
      id: {
        type: 'string',
        columnName: 'Identifier',
        required: true
  
      },
      Type: {
        type: 'string'
        
    },
    Action: {
    type: 'string'
    
    },
    SecondaryIdentifier: {
      type: 'string'
      
    },
    Processing: {
      type: 'number'
      
    },
    Organization: {
      type: 'string'
      
    },
    },
  };