var chai = require("chai");
var expect = chai.expect;
var routeParser = require("../lib/parsers/route-parser");
var BaseDataRoute = require('../lib/base-data-route');

describe("BaseRoute", () => {
  var dataService = {
    getData: function(x){
      var {resolve} = x;
      resolve(x);
      return x;
    }
  }

  it("seperateEnumerables 1", () => {
    var parsed = routeParser.parse("id.['a', 'b'].w")
    var routes = BaseDataRoute.seperateEnumerables(parsed);
    expect(routes.length).equals(2);
    expect(routes[0].length).equals(3);
    expect(routes[1].length).equals(3);
    expect(routes[0][1].type).equals("id");
    expect(routes[1][1].type).equals("id");
    expect(routes[0][1].value).equals("a");
    expect(routes[1][1].value).equals("b");
  })

  it("seperateEnumerables 2", () => {
    var parsed = routeParser.parse("['a', 'b']")
    var routes = BaseDataRoute.seperateEnumerables(parsed);
    expect(routes.length).equals(2);
    expect(routes[0].length).equals(1);
    expect(routes[1].length).equals(1);
    expect(routes[0][0].type).equals("id");
    expect(routes[1][0].type).equals("id");
    expect(routes[0][0].value).equals("a");
    expect(routes[1][0].value).equals("b");
  })

  it("seperateEnumerables 3", () => {
    var parsed = routeParser.parse("id")
    var routes = BaseDataRoute.seperateEnumerables(parsed);
    expect(routes.length).equals(1);
    expect(routes[0].length).equals(1);
    expect(routes[0][0].type).equals("id");
    expect(routes[0][0].value).equals("id");
  })

  it("seperateEnumerables 4", () => {
    var parsed = routeParser.parse("id['a','b']['c', 'd']")
    var routes = BaseDataRoute.seperateEnumerables(parsed);
    expect(routes.length).equals(4);
    expect(routes[0].length).equals(3);
    expect(routes[0][1].type).equals("id");
    expect(routes[0][1].value).equals("a");
    expect(routes[0][2].type).equals("id");
    expect(routes[0][2].value).equals("c");
    expect(routes[3][1].type).equals("id");
    expect(routes[3][1].value).equals("b");
    expect(routes[3][2].type).equals("id");
    expect(routes[3][2].value).equals("d");
  })

  it("seperateEnumerables 5", () => {
    var parsed = routeParser.parse("id['a','b']['c', 'd'].k")
    var routes = BaseDataRoute.seperateEnumerables(parsed);
    expect(routes.length).equals(4);
    expect(routes[0].length).equals(4);
    expect(routes[0][1].type).equals("id");
    expect(routes[0][1].value).equals("a");
    expect(routes[0][2].type).equals("id");
    expect(routes[0][2].value).equals("c");
    expect(routes[3][1].type).equals("id");
    expect(routes[3][1].value).equals("b");
    expect(routes[3][2].type).equals("id");
    expect(routes[3][2].value).equals("d");
  })

  it("getDataRoute", () => {
    var falcorRoute = BaseDataRoute.getDataRoute({routeString:"this.is.a.route", dataString:"this.is.a", dataService});
    expect(falcorRoute.route).equals("this.is.a.route");
    expect(falcorRoute.get).not.null;
  })

  it("getDataRoute - get call 1", async () => {
    var falcorRoute = BaseDataRoute.getDataRoute({routeString:"this.is.a.route", dataString:"this.is.a", dataService, expires:-5});
    expect(falcorRoute.route).equals("this.is.a.route");
    var results = await falcorRoute.get({});
    expect(results.length).equals(1);
    expect(results[0].path).deep.equals(["this", "is", "a", "route"]);
    expect(results[0].value.value).deep.equals(["this", "is", "a"]);
  })

  it("getDataRoute - get call 2", async () => {
    var falcorRoute = BaseDataRoute.getDataRoute({routeString:"this.is.a['route', 'rawDataRoute']", dataString:"this.is.a", dataService, expires:-5});
    expect(falcorRoute.route).equals("this.is.a['route', 'rawDataRoute']");
    var results = await falcorRoute.get({});
    expect(results.length).equals(2);
    expect(results[0].path).deep.equals(["this", "is", "a", "route"]);
    expect(results[0].value.value).deep.equals(["this", "is", "a"]);
    expect(results[1].path).deep.equals(["this", "is", "a", "rawDataRoute"]);
    expect(results[1].value.value).deep.equals("this.is.a");
  })

  it("getDataRoute - get call 3", async () => {
    var falcorRoute = BaseDataRoute.getDataRoute({routeString:"this.is.a[{keys:key}]", dataString:"this.is.a", dataService, expires:-5});
    expect(falcorRoute.route).equals("this.is.a[{keys:key}]");
    var results = await falcorRoute.get({key:["route", "rawDataRoute"]});
    expect(results.length).equals(2);
    expect(results[0].path).deep.equals(["this", "is", "a", "route"]);
    expect(results[0].value.value).deep.equals(["this", "is", "a"]);
    expect(results[1].path).deep.equals(["this", "is", "a", "rawDataRoute"]);
    expect(results[1].value.value).deep.equals("this.is.a");
  })

  it("getDataRoute - get call 4", async () => {
    var falcorRoute = BaseDataRoute.getDataRoute({routeString:"this.is[{keys:key}].route", dataString:"this.is[{keys:key}]", dataService, expires:-5});
    expect(falcorRoute.route).equals("this.is[{keys:key}].route");
    var results = await falcorRoute.get({key:["route", "rawDataRoute"]});
    expect(results.length).equals(2);
    expect(results[0].path).deep.equals(["this", "is", "route", "route"]);
    expect(results[0].value.value).deep.equals(["this", "is", "route"]);
    expect(results[1].path).deep.equals(["this", "is", "rawDataRoute", "route"]);
    expect(results[1].value.value).deep.equals(["this", "is", "rawDataRoute"]);
  })

  it("getDataRoute - get call 5", async () => {
    var falcorRoute = BaseDataRoute.getDataRoute({routeString:"this.is[{keys:key}][{keys:between}][{keys:key2}]", dataString:"this.is[{keys:key}][{keys:between}]", dataService, expires:-5});
    expect(falcorRoute.route).equals("this.is[{keys:key}][{keys:between}][{keys:key2}]");
    var results = await falcorRoute.get({key:["route", "rawDataRoute"], between:[1], key2:["route", "rawDataRoute"]});
    expect(results.length).equals(4);
    expect(results[0].path).deep.equals(["this", "is", "route", "1", "route"]);
    expect(results[0].value.value).deep.equals(["this", "is", "route", 1]);
    expect(results[1].path).deep.equals(["this", "is", "route", "1", "rawDataRoute"]);
    expect(results[1].value.value).deep.equals("this.is[{keys:key}][{keys:between}]");
  })

  it("getDataRoute - get call 6", async () => {
    var falcorRoute = BaseDataRoute.getDataRoute({routeString:"this.is.a.bacon[{integers:idx}]", dataString:"this.is.a", dataService, expires:-5});
    expect(falcorRoute.route).equals("this.is.a.bacon[{integers:idx}]");
    var results = await falcorRoute.get({idx:[0]});
    expect(results.length).equals(1);
    expect(results[0].path).deep.equals(["this", "is", "a", "bacon", "0"]);
    expect(results[0].value.value).to.be.undefined;
  })

  it("getDataRoute - get call 6", async () => {
    try{
    var falcorRoute = BaseDataRoute.getDataRoute({routeString:"this.is.a.bacon[{integers:idx}]", dataString:"this.is.spam", dataService, expires:-5});
    } catch(err){
      return;
    }
    throw new Error("Not suppose to get here")

  })

})
