/**
 * AzureLogs.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
    datastore: 'apimmysql',
    tableName: 'AzureLogs',
    primaryKey: 'id',
    attributes: {
        id: {
            type: 'string',
            columnName: 'Guid',
            required: true

        },
        Type: {
            type: 'string'

        },
        Action: {
            type: 'string'

        },
        Identifier: {
            type: 'string'

        },
        SecondaryIdentifier: {
            type: 'string'

        },

        Organization: {
            type: 'string'

        },
        LogLevel: {
            type: 'string'

        },
        Summary: {
            type: 'string'

        },
        createdAt: {
            type: 'ref',
            columnType: 'datetime',
            autoCreatedAt: true
        },
        updatedAt: {
            type: 'ref',
            columnType: 'datetime',
            autoUpdatedAt: true
        },
    },
};