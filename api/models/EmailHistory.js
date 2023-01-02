/**
 * EmailHistory.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
  datastore: 'apimmysql',
  tableName: 'EmailHistory',
  autoupdatedAt: false,
  primaryKey: 'subject',
  attributes: {
    subject: {
      type: 'string',
      required: true

    },
    toAddress: {
      type: 'string'

    }
  },
};