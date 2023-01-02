module.exports.routes = {

  /***************************************************************************
  *                                                                          *
  * Make the view located at `views/homepage.ejs` your home page.            *
  *                                                                          *
  * (Alternatively, remove this and add an `index.html` file in your         *
  * `assets` directory)                                                      *
  *                                                                          *
  ***************************************************************************/

  //'/': { view: 'pages/homepage' },


  /***************************************************************************
  *                                                                          *
  * More custom routes here...                                               *
  * (See https://sailsjs.com/config/routes for examples.)                    *
  *                                                                          *
  * If a request to a URL doesn't match any of the routes in this file, it   *
  * is matched against "shadow routes" (e.g. blueprint routes).  If it does  *
  * not match any of those, it is matched against static assets.             *
  *                                                                          *
  ***************************************************************************/

  //ApplicationDetails
  'post /apim/v1/organizations/:org/apps/:appId/:action?': {
    'controller': 'ApplicationController',
    'action': 'azureAppCreationAndUpdationOfApimApp'
  },

  'post /apim/v1/organizations/:org/apps/:appId/scopes/:action?': {
    'controller': 'ApplicationController',
    'action': 'azureAppCreationAndScopeAddition'
  },

  'post /apim/v1/organizations/:org/apps/:appId/scope-additions': {
    'controller': 'ApplicationController',
    'action': 'azureAppScopeAddition'
  },

  'post /apim/v1/organizations/:org/apps/:appId/scope-removals': {
    'controller': 'ApplicationController',
    'action': 'azureAppScopeRemoval'
  },

  'post /apim/v1/organizations/:org/apps/:appId/resource-scopes/:action?': {
    'controller': 'ApplicationController',
    'action': 'azureAppCreationAndResourceScopeAddition'
  },

  'post /apim/v1/organizations/:org/apps/:appId/resource-scope-additions': {
    'controller': 'ApplicationController',
    'action': 'azureAppResourceScopeAndRoleAddition'
  },

  'post /apim/v1/organizations/:org/apps/:appId/resource-scope-removals': {
    'controller': 'ApplicationController',
    'action': 'azureAppResourceScopeAndRoleRemoval'
  },

  'post /apim/v1/organizations/:org/apps/:appId/resource-role-removals': {
    'controller': 'ApplicationController',
    'action': 'azureAppResourceRoleRemoval'
  },

  

  




};
