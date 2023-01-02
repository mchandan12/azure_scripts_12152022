/**
 * PendingEmails.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
  datastore: 'apimmysql',
  tableName: 'PendingEmails',
  autocreatedAt: false,
  autoupdatedAt: false,
  primaryKey: 'guid',
  attributes: {
    guid: {
      type: 'string',
      required: true

    },
    teamEmail: {
      type: 'string'

    },
    subject: {
      type: 'string'

    },
    body: {
      type: 'string'

    }
  },
};