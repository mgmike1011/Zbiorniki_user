define([
    'brease/core/Class', 'brease/core/Utils', 'brease/services/libs/ServerCode'],
function (SuperClass, Utils, ServerCode) {

    'use strict';

    const OPCUA_ERROR_CONVERSION = 2148139018;

    /**
    * @class widgets.brease.OnlineChartHDA.libs.DataAdapter
    * #Description
    * Class used to retrieve the data form the OPC UA server
    */
    /**
    * @method constructor
    * @param {Object} graphs
    * @param {Object} timespan
    * @param {Object} maxTimeDeviation
    * @param {Object} errorHandler
    * @param {Object} msgOverlay
    */
    var DataAdapter = SuperClass.extend(function DataAdapter(graphs, timespan, maxTimeDeviation, errorHandler, msgOverlay) {
            SuperClass.call(this);
            this.graphs = graphs;
            this.timespan = timespan;
            this.readLatestHandler = function () { };
            this.errorHandler = errorHandler;
            this.msgOverlay = msgOverlay;
            this.maxTimeDeviation = maxTimeDeviation;
            this.internal = {
                readDeferreds: [],
                nodeChangePromises: [],
                firstReadDone: false,
                deactivated: false
            };
            this.serverInfo = {};
        }, null),

        p = DataAdapter.prototype;

    /**
    * @method start
    */
    p.start = function (bindings, interval) {
        // this.startTime = null;
        if (bindings !== undefined) {
            this.internal.bindings = bindings;
            if (interval !== undefined) {
                this.internal.interval = interval;
            }
            if (this.internal.interval > 0) {
                this.internal.readInterval = window.setInterval(this.readLatest.bind(this), this.internal.interval);
            }
        } else {
            this.errorHandler.requiredBindingsMissing(this.errorHandler.widgetId);
        }
    };

    /**
    * @method stop
    */
    p.stop = function () {
        window.clearInterval(this.internal.readInterval);
        this.internal.readInterval = null;
        this.internal.bindings = null;
    };

    p.setTimespan = function (timespan, end) {
        var readDeferred = $.Deferred();
        if (typeof timespan === 'number') {
            var start = new Date(end.getTime() - timespan);
            if (timespan > this.timespan) {
                this._pushReadDeferred(readDeferred);
                this.readPast(Utils.fileTimeFromDate(start), readDeferred);
            } else {
                readDeferred.resolve();
            }
            this.timespan = timespan;
        } else {
            var timeSpan = {
                startTime: Utils.fileTimeFromDate(timespan.start),
                endTime: Utils.fileTimeFromDate(timespan.end)
            };
            this._pushReadDeferred(readDeferred);
            this.readHistory(timeSpan, this._handleReadHistory.bind(this), readDeferred);
        }
        return readDeferred.promise();
    };

    p._pushReadDeferred = function (deferred) {
        var readDeferredIndex = this.internal.readDeferreds.length; 
        this.internal.readDeferreds.push(deferred);
        var that = this;
        deferred.then(function () {
            that.internal.readDeferreds.splice(readDeferredIndex, 1);
        });
    };

    p.setMaxTimeDeviation = function (timeDeviation) {
        this.maxTimeDeviation = timeDeviation;
    };

    /**
    * @method setReadLatestHandler
    * Set a handler function which is called when there is new data in buffer
    */
    p.setReadLatestHandler = function (handler) {
        this.readLatestHandler = handler;
    };

    /**
    * @method resetReadLatestHandler
    * The handler function for new date is not called anymore
    */
    p.resetReadLatestHandler = function () {
        this.readLatestHandler = function () { };
    };

    /**
    * @method readPast
    * Read history from startTime until first data point we already have.
    * If the first data point is after startTime + timespan it will read startTime + timespan
    * If there is no datapoint it will read from start to current time 
    */
    p.readPast = function (startTime, readDeferred) {
        var timeSpan = {
            startTime: startTime,
            endTime: Utils.fileTimeFromDate(new Date(Date.now() + 10000))
        };
        // if we already have data read until first data point
        for (var graphId in this.graphs) {
            // ignore first point as this may be a point outside of the current view
            // it's no big deal if we maby read one point to much, this is only a optimization
            // (see _updateHistoricalPoints in Graph.js why we always keep one point)
            if (this.graphs[graphId].historicalData.length > 1) {
                var firstTimestamp = this.graphs[graphId].historicalData[1].time;
                timeSpan.endTime = Math.min(timeSpan.endTime, firstTimestamp);
            }
        }
        this.readHistory(timeSpan, this._handlePast.bind(this), readDeferred);
    };

    /**
    * @method readLatest
        * Read history from current time - timespan until current time
        */
    p.readLatest = function () {
        var readDeferred = $.Deferred(),
            endTime = Utils.fileTimeFromDate(new Date(Date.now() + 10000));
        this.readForward(endTime, readDeferred);
    };

    /**
    * @method readForward
    * Read history from latest datapoint to end time, if there is no datapoint it reads from 1970
    */
    p.readForward = function (endTime, readDeferred) {
        var timeSpans = {};
        // search in local historical data for last timestamp of each server and use this as start for request
        for (var graphId in this.graphs) {
            if (this.graphs[graphId].hasNodeId()) {
                var node = this.graphs[graphId].getNode();
                if (!timeSpans[node.serverAlias]) {
                    timeSpans[node.serverAlias] = {
                        startTime: Utils.fileTimeFromDate(new Date(Date.now() - this.timespan)),
                        endTime: endTime
                    };
                }
                if (this.graphs[graphId].isContinued && this.graphs[graphId].historicalData.length > 0) {
                    var lastTimestamp = _.last(this.graphs[graphId].historicalData).time;
                    timeSpans[node.serverAlias].startTime = Math.max(timeSpans[node.serverAlias].startTime, lastTimestamp);
                }
            }
        }
        this.readHistory(timeSpans, this._handleLatest.bind(this), readDeferred);
    };

    /**
        * @method readHistory
        */
    p.readHistory = function readHistory(timeSpan, handler, readDeferred) {
        var that = this,
            i = 0,
            requests = {},
            requestGraphs = {};
        if (isTimeSpan(timeSpan) && timeSpan.endTime <= timeSpan.startTime) {
            readDeferred.resolve([]);
            return;
        }
        for (var graphId in this.graphs) {
            if (this.graphs[graphId].hasNodeId()) {
                var node = this.graphs[graphId].getNode();
                if (!Array.isArray(requests[node.serverAlias])) {
                    requests[node.serverAlias] = [];
                }
                var request = {
                        nodeId: node.nodeId,
                        id: i
                    },
                    yAxis = this.graphs[graphId].yAxis;
                if (yAxis.hasUnit()) {
                    request.unit = yAxis.getCurrentUnit();
                }
                requests[node.serverAlias].push(request);
                requestGraphs[graphId] = this.graphs[graphId];
                i = i + 1;
            }
        }
        var promises = [];
        for (var serverAlias in requests) {
            this._updateServerInfo(serverAlias);
            var ts = isTimeSpan(timeSpan) ? timeSpan : timeSpan[serverAlias];
            promises.push(brease.services.opcua.readNodeHistory(requests[serverAlias], ts, serverAlias));
        }
        $.when.apply($, promises).then(function () {
            if (that.internal.deactivated) {
                // readDeferred.reject();
                return;
            }
            var ret;
            if (that.internal.nodeChangePromises.length === 0) {
                ret = handler(that._mergeResponses(requests, arguments), requestGraphs);
            }
            if (!that.internal.firstReadDone) {
                for (var graphId in that.graphs) {
                    that.graphs[graphId].onNodeChange(that._nodeChangeHandler.bind(that));
                }
            }
            that.internal.firstReadDone = true;
            readDeferred.resolve(ret);
        });
    };

    function isTimeSpan(timeSpan) {
        return timeSpan.startTime && typeof timeSpan.startTime === 'number';
    }

    p._updateServerInfo = function (serverAlias) {
        if (this._isServerInfoRequestPending(serverAlias) || this._isServerInfoIsGood(serverAlias)) {
            return;
        }
        this.serverInfo[serverAlias] = this.serverInfo[serverAlias] ? this.serverInfo[serverAlias] : {};
        var currentTimeNode = [{
            'nodeId': 'NS0|Numeric|2258',
            'attributeId': 13
        }];
        this.serverInfo[serverAlias].readPromise = brease.services.opcua.read(currentTimeNode, serverAlias).then(this._handleReadTimeResponse.bind(this, serverAlias));
    };

    p._isServerInfoIsGood = function (serverAlias) {
        return this.serverInfo[serverAlias] !== undefined && 
            this.serverInfo[serverAlias].status.code === ServerCode.SUCCESS &&
            !this.serverInfo[serverAlias].hasTimeMismatch;
    };

    p._isServerInfoRequestPending = function (serverAlias) {
        return this.serverInfo[serverAlias] && this.serverInfo[serverAlias].readPromise.state() === 'pending';
    };

    p._handleReadTimeResponse = function (serverAlias, response) {
        this.serverInfo[serverAlias].status = response.status;
        if (response.status.code === ServerCode.SUCCESS && response.results[0].status.code === ServerCode.SUCCESS) {
            var serverTime = new Date(response.results[0].value),
                clientTime = new Date();
            this.serverInfo[serverAlias].offset = Math.abs(serverTime - clientTime);
            this.serverInfo[serverAlias].hasTimeMismatch = false;
            if (Math.abs(this.serverInfo[serverAlias].offset) > this.maxTimeDeviation) {
                if (!this.serverInfo[serverAlias].timeMismatchReported) {
                    this._showTimeMismatchError(serverTime, clientTime, this.serverInfo[serverAlias].offset);
                    this.serverInfo[serverAlias].timeMismatchReported = true;
                }
                this.serverInfo[serverAlias].hasTimeMismatch = true;
            }
        }
        var noTimeMismatch = _.every(this.serverInfo, function (server) { return !server.hasTimeMismatch; });
        if (noTimeMismatch) {
            this.msgOverlay.clear();
        }
    };

    p._showTimeMismatchError = function (serverTime, clientTime, offset) {
        var txt = brease.language.getTextByKey('IAT/Widgets/OnlineChartHDA/MESSAGE_ERROR_UTC_TIME_MISMATCH');
        if (txt === brease.config.undefinedTextReturnValue) {
            txt = 'The server has a different UTC time than the client!' +
            '<br>Server time: {1}<br>Client time: {2}<br>Deviation: ~{3}s';
        }
        txt = txt.replace('{1}', serverTime.toISOString()).replace('{2}', clientTime.toISOString()).replace('{3}', Math.round(offset / 1000));
        this.msgOverlay.create(txt, true);
    };

    /**
        * @method _mergeResponses
        * merge the responses for each serverAlias
        */
    p._mergeResponses = function _mergeResponses(requests, responses) {
        var merged = {},
            j = 0;
        for (var serverAlias in requests) {
            this.serverInfo[serverAlias].status = responses[j].status;
            for (var k = 0; k < requests[serverAlias].length; k += 1) {
                if (!merged.history) {
                    merged.history = {};
                }
                if (responses[j].status.code === ServerCode.SUCCESS) {
                    merged.history[requests[serverAlias][k].id] = responses[j].history[k];
                } else {
                    merged.history[requests[serverAlias][k].id] = {};
                    merged.history[requests[serverAlias][k].id].status = responses[j].status;
                }
                
            }
            j += 1;
        }
        return merged;
    };

    /**
    * @method _handleReadHistory
    * Writes history directly over historicalData at write position
    */
    p._handleReadHistory = function (buffer, requestGraphs) {
        var j = 0,
            graphsDataStart = [];
        for (var graphId in requestGraphs) {
            var graph = this.graphs[graphId];
            if (!this.graphs[graphId].hasNodeId()) {
                graphsDataStart.push(null);
                continue;
            }
            var history = buffer.history[j];
            if (!graph.hasError && history.status.code === ServerCode.SUCCESS) {
                var dataStart = this._overwriteGraphData(graph, history);
                if (dataStart) {
                    graphsDataStart.push(dataStart);
                }
            } else {
                graphsDataStart.push(null);
            }
            j = j + 1;
        }
        return graphsDataStart;
    };

    p._overwriteGraphData = function (graph, history) {
        var dataStart;
        // search from start until we find a point which is after buffer start
        var jBuffer = 0;
        // if first is null we are before start of buffer
        if (history.value[0].value === null) {
            jBuffer = 1;
            // if we have found the start of historical buffer we can remove all points before
            this._removeDataBeforeTime(graph.historicalData, history.value[0].time);
            dataStart = Utils.fileTimeToDate(history.value[jBuffer].time);
        }
        var lastOfBuffer = _.last(history.value);
        if (lastOfBuffer.value === null) {
            history.value.pop();
            lastOfBuffer = _.last(history.value);
        } 
        var i = _.findIndex(graph.historicalData, function (data) {
                return data.time >= history.value[jBuffer].time;
            }),
            noHistory = i < 0;
        // now we know the start point we can write to the buffer
        // we overwrite all present points until we find a point which is after our buffer then insert or if its already the end push
        for (; jBuffer < history.value.length; i += 1, jBuffer += 1) {
            var point = {
                time: history.value[jBuffer].time,
                x: Utils.fileTimeToDate(history.value[jBuffer].time),
                y: history.value[jBuffer].value
            };
            // at end => push
            if (noHistory || !graph.historicalData[i]) {
                graph.historicalData.push(point);
            // overwrite
            } else if (graph.historicalData[i].time <= lastOfBuffer.time) {
                graph.historicalData[i] = point;
            // insert
            } else {
                graph.historicalData.splice(i, 0, point);
            }
        }
        return dataStart;
    };

    p._removeDataBeforeTime = function (historicalData, time) {
        var firstIndex = _.findIndex(historicalData, function (point) {
            return point.time >= time;
        });
        if (firstIndex > 0) {
            historicalData.splice(0, firstIndex);
        }
    };

    /**
        * @method _handleLatest
        * Gets data from buffer and converts it so it can be sent to syncfusion library
        */
    p._handleLatest = function (buffer, requestGraphs) {
        var j = 0;
        for (var graphId in requestGraphs) {
            if (this.graphs[graphId].hasNodeId()) {
                if (buffer && this._pushGraphData(this.graphs[graphId], buffer.history[j])) {
                    this.graphs[graphId].isContinued = true;
                }
                j = j + 1;
            }
        }
        this.readLatestHandler();
    };

    /**
    * @method _pushGraphData
    * Gets data from buffer and converts it so it can be sent to syncfusion library
    */
    p._pushGraphData = function (graph, history) {
        var newData = false;
        if (graph.hasError || !history) {
            return false;
        }
        if (history.status.code !== 0) {
            // ignore conversion error @ the moment (unit changed via list binding)
            if (history.status.code === OPCUA_ERROR_CONVERSION) {
                this._startConversionErrorTimeout(graph);
            }
        } else {
            this._resetConversionErrorTimeout(graph);
            var lastPresent = _.last(graph.historicalData);
            for (var i = 0; i < history.value.length; i += 1) {
                // ignores any boundary or point we already have
                if ((lastPresent && history.value[i].time <= lastPresent.time) || history.value[i].value === null) {
                    continue;
                }
                graph.historicalData.push({
                    time: history.value[i].time,
                    x: Utils.fileTimeToDate(history.value[i].time),
                    y: history.value[i].value
                });
            }
            newData = true;
        }
        return newData;
    };

    /**
    * @method _handlePast
    */
    p._handlePast = function (buffer, requestGraphs) {
        var j = 0,
            graphsDataStart = [];
        for (var graphId in requestGraphs) {
            var graph = this.graphs[graphId];
            if (!graph.hasNodeId()) {
                graphsDataStart.push(null);
                continue;
            }
            var history = buffer.history[j];
            if (!graph.hasError && history.status.code === 0) {
                var first = graph.historicalData[0];
                if (history.value[0].value === null) {
                    graphsDataStart.push(Utils.fileTimeToDate(history.value[1].time));
                }
                for (var i = history.value.length - 1; i >= 0; i -= 1) {
                    // ignores any boundary or point we already have
                    if ((first && history.value[i].time >= first.time) || history.value[i].value === null) {
                        continue;
                    }
                    graph.historicalData.unshift({
                        time: history.value[i].time,
                        x: Utils.fileTimeToDate(history.value[i].time),
                        y: history.value[i].value
                    });
                }
            } else {
                graphsDataStart.push(null);
            }
            j = j + 1;
        }
        return graphsDataStart;
    };

    p._nodeChangeHandler = function _nodeChangeHandler(graph) {
        if (!graph.hasNodeId()) {
            return;
        }
        this.stop();
        var node = graph.getNode(),
            request = {
                'nodeId': node.nodeId
            },
            timeSpan = {
                startTime: Utils.fileTimeFromDate(new Date(Date.now() - this.timespan)),
                endTime: Utils.fileTimeFromDate(new Date(Date.now() + 10000))
            },
            yAxis = graph.yAxis;
        // Adding unit to requests from buffer (if unit is set)
        if (yAxis.hasUnit()) {
            request.unit = yAxis.getCurrentUnit();
        }
        var that = this;
        this.internal.nodeChangePromises.push(brease.services.opcua.readNodeHistory([request], timeSpan, node.serverAlias).then(function (buffer) {
            if (that.internal.deactivated || buffer.status.code !== 0) {
                return;
            }
            // make sure graph is empty and ready for fresh data
            graph.historicalData = [];
            if (that._pushGraphData(graph, buffer.history[0])) {
                graph.isContinued = false;
            }
            that.internal.nodeChangePromises.shift();
            if (that.internal.nodeChangePromises.length === 0) {
                that.start(that.internal.bindings);
            }
        }));
    };

    p._startConversionErrorTimeout = function (graph) {
        var that = this;
        if (graph.conversionErrorTimeOut == null) {
            graph.conversionErrorTimeOut = window.setTimeout(function () {
                that.errorHandler.invalidPropertyValue(graph.attributeToString('node'));
            }, 5000);
        }
    };

    p._resetConversionErrorTimeout = function (graph) {
        window.clearTimeout(graph.conversionErrorTimeOut);
        graph.conversionErrorTimeOut = null;
    };

    p.wake = function () {
        this.internal.deactivated = false;
    };

    p.onBeforeSuspend = function () {
        this.internal.firstReadDone = false;
        this.stop();
        this.internal.deactivated = true;
        this._rejectDeferreds(this.internal.readDeferreds);
        this.internal.readDeferreds = [];
        this.serverInfo = {};
    };
    
    p._rejectDeferreds = function (deferreds) {
        var that = this;
        deferreds.forEach(function (elem) {
            if (Array.isArray(elem)) {
                that._rejectDeferreds(elem);
            } else {
                elem.reject();
            }
        });
    };

    p.dispose = function () {
        this._rejectDeferreds(this.internal.readDeferreds);
        this.internal.readDeferreds = [];
        this.stop();
        this.graphs = null;
        this.errorHandler = null;
        this.msgOverlay = null;
    };

    return DataAdapter;
});
