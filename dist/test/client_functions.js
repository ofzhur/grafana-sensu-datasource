'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getClientsURIs = exports.convertClientSummaryMetricsToJSON = exports.convertClientHistoryToDataPoints = exports.convertClientsToJSON = exports.convertClientsToDataPoints = undefined;

var _common = require('./common');

function getClientsURIs(checkNames, clientNames) {
  var URIs = [];
  var dimensionURI = '/clients';
  // look for clientName in dimensions
  if (clientNames.length) {
    for (var i = 0; i < clientNames.length; i++) {
      var aClientName = clientNames[i];
      dimensionURI = '/clients/' + aClientName;
      URIs.push(dimensionURI);
    }
  }
  if (URIs.length === 0) {
    URIs.push(dimensionURI);
  }
  URIs.push('/events');
  URIs.push('/results');

  return URIs;
}

/**
 * [convertClientsToDataPoints description]
 * @param  {[type]} response [description]
 * @return {[type]}          [description]
 */
/*

 */
function convertClientsToDataPoints(aTarget, responses) {
  var response = (0, _common.getResponseForTarget)(aTarget, responses);

  // the result has no "datapoints", need to create it based on the check data
  // when we have a checkname and an clientName, the response is different, the
  // data is not an array, but contains the same information, recreate and push
  if (response.data.length === undefined) {
    var singleData = response.data;
    response.data = [];
    response.data.push(singleData);
  }
  switch (aTarget.clientQueryMode) {
    case 'list':
      /*jshint -W087 */
      //debugger;
      var filterData = [];
      var arrClientNames = [];
      if (aTarget.filters !== undefined && aTarget.filters.length > 0) {
        arrClientNames = (0, _common.getClientsWithFilter)(aTarget, response);
        // iterate over the data and store the matching clients in the new filteredData
        for (var i = 0; i < response.data.length; i++) {
          // push matching client names
          if (arrClientNames.indexOf(response.data[i].name) >= 0) {
            filterData.push(response.data[i]);
          }
        }
        // now replace data with filtered data
        response.data = filterData;
      }
      for (var _i = 0; _i < response.data.length; _i++) {
        var data = response.data[_i];
        var datapoints = [];
        if (data.timestamp !== undefined) {
          datapoints[0] = [1, data.timestamp * 1000];
        }
        data.datapoints = datapoints;
        // set the target
        data.target = data.name;
      }
      break;
    case 'count':
      if (response.data.length > 0) {
        var _data = response.data[0];
        var _datapoints = [];
        var clientCount = 0;
        var _arrClientNames = [];
        if (aTarget.filters !== undefined && aTarget.filters.length > 0) {
          _arrClientNames = (0, _common.getClientsWithFilter)(aTarget, response);
          clientCount = _arrClientNames.length;
        } else {
          clientCount = response.data.length;
        }
        if (_data.timestamp !== undefined) {
          _datapoints[0] = [clientCount, _data.timestamp * 1000];
        }
        _data.datapoints = _datapoints;
        // set the target
        _data.address = undefined;
        _data.name = undefined;
        _data.socket = undefined;
        _data.subscriptions = undefined;
        _data.version = undefined;
        _data.target = 'ClientCount';
        if (aTarget.aliasReplaced) {
          _data.target = aTarget.aliasReplaced;
        }
        response.data = [_data];
      }
      break;
  }
  return response;
}

/**
 * [convertClientsToJSON description]
 * @param  {[type]} response [description]
 * @param  {[type]} aTarget  [description]
 * @return {[type]}          [description]
 */
function convertClientsToJSON(aTarget, responses) {
  var response = (0, _common.getResponseForTarget)(aTarget, responses);

  if (response.data.length === undefined) {
    var data = response.data;
    response.data = [];
    response.data.push(data);
  }
  // start with an empty list
  var newData = [];
  for (var i = 0; i < response.data.length; i++) {
    // default to adding the items, filters will set this to false as needed
    var pushItem = true;
    // clone it
    var item = JSON.parse(JSON.stringify(response.data[i]));
    // empty datapoints
    item.datapoints = [];
    // set the type to docs
    item.type = 'docs';
    //item.value = 0;
    // if there's no address, it is a JIT client
    var address = item.address;
    if (item.address === 'unknown') {
      item.address = 'JIT Client';
    }
    // check filters
    if (aTarget.filters !== undefined) {
      if (aTarget.filters.length !== undefined) {
        for (var j = 0; j < aTarget.filters.length; j++) {
          var aFilter = aTarget.filters[j];
          /*jshint -W087 */
          //debugger;
          switch (aFilter.filterType) {
            case 'regex':
              // make sure the regex is valid
              try {
                var flags = aFilter.filterRegexFlags;
                var re = new RegExp(aFilter.filterRegex, flags);
                if (re.test(item.name)) {
                  // push this one
                  //console.log("matched regex");
                  aFilter.filterMessage = 'OK';
                } else {
                  pushItem = false;
                }
              } catch (err) {
                aFilter.filterMessage = 'Invalid Regular Expression';
                //console.log('Invalid Regex Detected!');
                break;
              }
              break;
            case 'field':
              if (item.hasOwnProperty(aFilter.filterFieldName)) {
                var fieldVal = item[aFilter.filterFieldName];
                if (fieldVal !== aFilter.filterFieldValueReplaced) {
                  pushItem = false;
                }
              } else {
                // no field, no push
                pushItem = false;
              }
              break;
          }
        }
      }
    }
    // push into the datapoints
    if (pushItem) {
      //itemData.datapoints.push(itemData);
      var entry = {
        type: 'docs',
        datapoints: [item]
      };
      newData.push(entry);
    }
  }
  response.data = newData;
  return response;
}

/**
 * [convertClientHistoryToDataPoints description]
 * @param  {[type]} response [description]
 * @return {[type]}        [description]
 */
function convertClientHistoryToDataPoints(aTarget, responses) {
  var response = (0, _common.getResponseForTarget)(aTarget, responses);

  // the result has no "datapoints", need to create it based on the check data
  // when we have a checkname and an clientName, the response is different, the
  // data is not an array, but contains the same information, recreate and push
  //if (response.data.length === undefined) {
  //  var singleData = response.data;
  //  response.data = [];
  //  response.data.push(singleData);
  //}
  for (var i = 0; i < response.data.length; i++) {
    var anEvent = response.data[i];
    var datapoints = [];
    var startingTimestamp = 0;
    if (anEvent.last_execution !== undefined) {
      startingTimestamp = anEvent.last_execution - 60 * anEvent.history.length;
    }
    // time needs to be in MS, we get EPOCH from Sensu
    if (anEvent.history !== undefined) {
      for (var y = 0; y < anEvent.history.length; y++) {
        datapoints[y] = [anEvent.history[y], (startingTimestamp + 60 * y) * 1000];
      }
    }
    anEvent.datapoints = datapoints;
    // set the target to be the check name
    anEvent.target = 'unknown';
    if (anEvent.name !== undefined) {
      anEvent.target = anEvent.name;
    }
    if (anEvent.check !== undefined) {
      anEvent.target = anEvent.check;
    }
  }
  return response;
}

/**
 * Returns JSON with the following:
 *    #Checks
 *    #Checks silenced
 *    #Checks OK
 *    #Checks warning
 *    #Checks Critical
 *    #Clients
 *    #Clients silenced
 *    #Clients OK
 *    #Clients warning
 *    #Clients Critical
 * @param  {[type]} responses [description]
 * @return {[type]}           [description]
 */
function convertClientSummaryMetricsToJSON(aTarget, responses) {
  var response = (0, _common.getResponseForTarget)(aTarget, responses);
}

exports.convertClientsToDataPoints = convertClientsToDataPoints;
exports.convertClientsToJSON = convertClientsToJSON;
exports.convertClientHistoryToDataPoints = convertClientHistoryToDataPoints;
exports.convertClientSummaryMetricsToJSON = convertClientSummaryMetricsToJSON;
exports.getClientsURIs = getClientsURIs;
//# sourceMappingURL=client_functions.js.map
