/**
 * Audit.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
  datastore: 'apimmysql',
    tableName: 'Audit',
    autocreatedAt:false,
    autoupdatedAt:false, 
    primaryKey: 'id',
      attributes: {
          id: {
            type: 'string',
            columnName: 'GUID',
            required: true
          },
          Component: {
            type: 'string'
            
          },
          Summary: {
            type: 'string'
            
        },
        Owner: {
        type: 'string'
        
        },
        createdBy: {
          type: 'string'
          
        }
      },
  };