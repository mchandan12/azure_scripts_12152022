/**
 * ClientSecretValidity.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

    datastore: 'apimmysql',
    tableName: 'ClientSecretExpiryDetails',
    autocreatedAt: true,
    autoupdatedAt: true,
    primaryKey: 'id',
    attributes: {
        ApigeeAppName: {
            type: 'string',
        },
        AzureObjectId: {
            type: 'string',

        },
        AzureSecretKeyId: {
            type: 'string',

        },
        AzureSecretExpire: {
            type: 'string',
            columnType: 'DATETIME'

        },
        Organization: {
            type: 'string',

        },
        EmailAlertFlag: {
            type: 'number',

        },
        Developer: {
            type: 'string',

        },
        id: {
            type: 'string',
            columnName: 'AppId',
            required: true
        },
        AppSoftDeleted: {
            type: 'integer',
            
          }
    }
}
