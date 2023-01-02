/**
 * Teams.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
  datastore: 'apimmysql',
  tableName: 'TeamMemberXRef',
  autocreatedAt: true,
  autoupdatedAt: true,
  primaryKey: 'teamID',
  attributes: {
    teamID: {
      type: 'string',
      required: true

    },
    developerProgram: {
      type: 'string'

    },
    teamName: {
      type: 'string'

    },
    teamEmail: {
      type: 'string'

    },
    memberEmail: {
      type: 'string'

    },
  },
};