var routeParser = require("./parsers/route-parser");

class BaseDataRoute {
    constructor({
        routeString,
        dataString,
        dataService,
        expires
    }) {
        this.dataString = dataString;
        this.dataService = dataService;
        this.expires = expires || undefined;
        this.route = routeString;
        this.pluckString = routeString.replace(dataString, "");
        if (this.dataString + this.pluckString !== routeString) {
            throw new Error("DataString must be a substring of the routeString: " + routeString);
        }
        if (this.pluckString[0] === ".") {
            this.pluckString = this.pluckString.substr(1, this.pluckString.length);
        }
        this.parsedDataString = routeParser.parse(dataString);
        this.parsedPluckString = routeParser.parse(this.pluckString);
    }

    async get(pathSet) {
        var paramsList = this.getAllVariableCombinations(pathSet, this.parsedDataString);
        var unenumeratedDataRoute = BaseDataRoute.seperateEnumerables(this.parsedDataString);
        var dataPromises = [];
        for (var route of unenumeratedDataRoute) {
            for (let params of paramsList) {
                let resolve = null;
                let reject = null;

                let routeArr = route.map((keySegment) => {
                  if(keySegment.type === "id"){
                    return keySegment.value;
                  } else {
                    return params[keySegment.variable];
                  }
                })

                var promise = new Promise((res, rej) => {
                    resolve = res;
                    reject = rej;
                }).then((data) => {
                  return {route:routeArr, params, data};
                })

                this.dataService.getData({
                    rawDataRoute: this.dataString,
                    route:routeArr,
                    params,
                    resolve,
                    reject
                });
                dataPromises.push(promise);
            }
        }

        var datas = await Promise.all(dataPromises);
        var pluckParamsList = this.getAllVariableCombinations(pathSet, this.parsedPluckString);
        var unenumeratedPluckRoutes = BaseDataRoute.seperateEnumerables(this.parsedPluckString);
        var collectResults = [];
        for (var data of datas) {
            for (var pluckParams of pluckParamsList) {
                for (var pluckRoute of unenumeratedPluckRoutes) {
                    var pluckArr = pluckRoute.map((keySegement) => {
                        if (keySegement.type === "id") {
                            return keySegement.value;
                        } else {
                            return pluckParams[keySegement.variable];
                        }
                    });

                    var plucked = BaseDataRoute.pluck(data.data, pluckArr);
                    var fullPath = data.route.concat(pluckArr).map((seg) => {
                      return seg.toString();
                    });

                    collectResults.push({path:fullPath, value:{$type:"atom", value:plucked, $expires:this.expires}})
                }
            }
        }

        return collectResults;
    }

    generateFalcorRoute(){
      var self = this;
      return {
        route: this.route,
        get: function(pathSet){
          return self.get(pathSet);
        }
      }
    }

    getAllVariableCombinations(pathSet, parsedRoute) {
        var variableNames = BaseDataRoute.getVariableNames(parsedRoute);
        return this._getAllVariableCombinations(pathSet, variableNames, [{}]);
    }


    _getAllVariableCombinations(pathSet, varList, paramsList) {
        if (varList.length === 0) {
            return paramsList;
        }
        var vari = varList.pop();
        var listOfParamLists = [];
        for (var vars of pathSet[vari]) {
            var clones = paramsList.map((param) => {
                var clone = {};
                for (var p in param) {
                    clone[p] = param[p];
                }
                clone[vari] = vars;

                return clone;
            });
            listOfParamLists.push(clones)
        }
        var newParamsList = flatten(listOfParamLists);

        return this._getAllVariableCombinations(pathSet, varList, newParamsList);
    }

    static pluck(jsonObject, pluckArr) {

        var returnVal = jsonObject;
        var idx = 0;
        while (idx < pluckArr.length && returnVal !== undefined && returnVal !== null) {
            returnVal = returnVal[pluckArr[idx]];
            idx++;
        }
        if (idx === pluckArr.length) {
            return returnVal;
        }
        return undefined;
    }

    static getVariableNames(parsedRoute) {
        var variableNames = [];
        for (var i = 0; i < parsedRoute.length; i++) {
            if (parsedRoute[i].type === "variable") {
                variableNames.push(parsedRoute[i].variable);
            }
        }
        return variableNames;
    }

    static seperateEnumerables(parsedRoute, idx) {
        var route = [];

        var idx = idx || 0;
        for (var i = idx; i < parsedRoute.length; i++) {
            if (parsedRoute[i].type === "enum") {
                return flatten(parsedRoute[i].enums.map((enume) => {
                    var r = route.concat([{
                        type: "id",
                        value: enume
                    }]);
                    var forwards = BaseDataRoute.seperateEnumerables(parsedRoute, i + 1);
                    if (forwards.length === 1 && forwards[0].length === 0) {
                        return [r];
                    }
                    return forwards.map((fRoute) => {
                        return r.concat(fRoute)
                    });
                }));
            } else {
                route.push(parsedRoute[i])
            }
        }

        return [route];
    }

    static getDataRoute({
        routeString,
        dataString,
        dataService,
        expires
    }) {
      return new BaseDataRoute({
          routeString,
          dataString,
          dataService,
          expires
      }).generateFalcorRoute();
    }
}


function flatten(arrArr) {
    var newArr = [];
    for (var i of arrArr) {
        for (var j of i) {
            newArr.push(j);
        }
    }

    return newArr;
}

module.exports = BaseDataRoute;
