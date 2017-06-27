# falcor-data-route-builder

## Description
Most falcor routes can be broken up into 2 pieces, a data fetching piece and a document traversal piece.  This module is to help make those routes configuration driven by supplying the data portion of the route and a dataService which will satisfy the data fetching.  The remainder of the route string is used as a document traversal piece.

## Usage
```js
var DataRouteBuilder = require("falcor-data-route-builder");
var dataService = {
  getData:function({rawDataRoute, route, params, requestContext, resolve, reject}){
    if(params["user"] === "me")
      resolve({my:{ message:"Hello World"}}) //return the document associated with the data route here
    else {
      resolve({my:{ message:"Go away"}})
    }
  }
}

var falcorRoute = DataRouteBuilder.getDataRoute({routeString:"message.to[{keys:user}].my.message",  dataString:"message.to[{keys:user}]", dataRequestFactory:dataRequestFactory, expires:-10000});

/*The falcor route will have 2 keys (route and get) these are usable by the standard falcor router
if the route is invoked with "me" as the user key then the message "Hello World" is returned from the route

*/

```

## BaseDataRoute.getDataRoute({String::routeString, String::dataString, DataService::dataService, NegativeInteger::expires }) => FalcorRoute
Returns a data route usable by falcor


## DataService.getData({String::rawDataRoute, String[]::route, Map::params, Object requestContext, PromiseResolve::resolve, PromiseReject::reject}) => undefined
getData should invoke the resolve with a json object or reject if error, requestContext is pulled from the Router's this.requestContext property
