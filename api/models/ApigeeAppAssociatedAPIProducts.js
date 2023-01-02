/**
 * ApigeeAppAssociatedAPIProducts.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
    datastore: 'apimmysql',
    tableName: 'AppAssociatedAPIProducts',
    autocreatedAt: false,
    autoupdatedAt: false,
    primaryKey: 'id',
    attributes: {
        id: {
            type: 'string',
            columnName: 'AppId',
            required: true
        },
        APIProductName: {
            type: 'string',
            
        },
        ScopeAdditionInAzure: {
            type: 'number'
        },
        RolesToBeRemoved: {
            type: 'string'
            
        },
        approvalStatus: {
            type: 'string'
        },
        AppSoftDeleted: {
            type: 'integer',
            
        }
    },
};