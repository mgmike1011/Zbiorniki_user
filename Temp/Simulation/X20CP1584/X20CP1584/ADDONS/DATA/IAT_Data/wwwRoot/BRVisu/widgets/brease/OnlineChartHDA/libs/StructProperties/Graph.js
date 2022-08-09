define([
    'brease/datatype/StructuredProperty',
    'brease/core/Types',
    'brease/core/Utils',
    'widgets/brease/OnlineChartHDA/libs/StyleElemsUtils'
],
function (SuperClass, Types, Utils, StyleElemsUtils) {
    'use strict';

    /**
    * @class widgets.brease.OnlineChartHDA.Graph
    * Defines appearance and behaviour of a Graph
    * @extends brease.datatype.StructuredProperty
    * @embeddedClass
    * @virtualNote
    */

    /**
    * @cfg {Boolean} visible=true
    * @bindable
    * @iatStudioExposed
    * @iatCategory Behavior 
    * Defines the visibility of the graph. (Visible = true, invisible = false)
    */

    /**
    * @cfg {PropertyCollectionReference} yAxisReference (required)
    * @iatStudioExposed
    * @iatCategory Behavior
    * @typeRefId yAxis
    * Specifies the id of the yAxis that has to be associated with this graph.
    * The yAxis defines the display unit and scales with the graph when autoscaling.
    */

    /**
     * @cfg {Number} value=0
     * @bindable
     * @not_projectable
     * @iatStudioExposed
     * @iatCategory Data
     * @nodeRefId node
     * @nodeOnly
     */

    /**
     * @cfg {brease.datatype.Node} node=''
     * @bindable
     * @not_projectable
     * @iatStudioExposed
     * @iatCategory Data
     * Defines the data source of the graph.
     */

    /**
     * @cfg {Number} cursorValue=0
     * @bindable
     * @not_projectable
     * @iatStudioExposed
     * @iatCategory Data
     * @nodeRefId cursorNode
     * Current value at which the cursor intersects the graph.
     * If there is no data point before the cursor or the cursor is not active, the property will be set to null.
     */

    /**
     * @cfg {brease.datatype.Node} cursorNode=''
     * @bindable
     * @not_projectable
     * @iatStudioExposed
     * @iatCategory Data
     * Current value with unit at which the cursor intersects the graph.
     * If there is no data point before the cursor or the cursor is not active, the property will be set to null.
     */

    /**
     * @cfg {brease.enum.GraphType} type='stepLine'
     * @iatStudioExposed
     * @iatCategory Behavior
     * Defines the visual representation of the data.
     */

    /**
    * @cfg {StyleReference} style = 'default'
    * @iatStudioExposed
    * @iatCategory Appearance
    * @bindable
    * @typeRefId widgets.brease.OnlineChartHDA.Graph
    * Reference to a style that can be created by the user.
    */

    var defaultSettings = {
        visible: true,
        enable: true,
        type: 'stepLine',
        style: 'default'
    };

    var Graph = SuperClass.extend(function Graph(id, stylePrefix, options, renderer, widgetId, propName) {
            SuperClass.call(this, id, options, widgetId, propName);
            this.renderer = renderer;
            this.elem = document.createElement('DIV');
            this.elem.id = id;
            this.stylePrefix = stylePrefix !== undefined ? stylePrefix : '';
            this.hasError = false;
            this.isContinued = false;
            this.historicalData = [];
            this.onlineData = [];
            this.onlineFreezeData = [];
            this.yAxis = null;
            this._onNodeChangeHandlers = [];
            this.isFreezed = false;
            this._onNodeUnitChangeHandler = function () { };
        }, defaultSettings),

        p = Graph.prototype;

    p.init = function (yAxes) {
        this.index = this.renderer.model.series.length;
        this.renderer.model.series.push({
            yAxisName: this.settings.yAxisReference,
            visibleOnLegend: 'hidden',
            points: []
        });
        this._updatePointsHandler = this.updatePoints.bind(this);
        this.renderer.subscribePreRedraw(this._updatePointsHandler);
        var that = this;
        this.renderer.subscribeModelChange(function (action, propName, index, data) {
            if (propName === 'series') {
                if (action === 'remove' && index < that.index) {
                    that.index -= 1;
                }
                if (action === 'reorder') {
                    if (index === that.index) {
                        that.index = data;
                    } else if (data === that.index) {
                        that.index = index;
                    }
                }
            }
        });
        StyleElemsUtils.createGraphStyleElems(this);
        this.setStyle(this.settings.style);
        this.setVisible(this.settings.visible);
        this.setType(this.settings.type);

        for (var id in yAxes) {
            if (yAxes[id].name === this.settings.yAxisReference) {
                this.yAxis = yAxes[id];
                break;
            }
        }
        if (this.yAxis === null) {
            this.hasError = true;
            throw new Error(this.attributeToString('yAxisReference'));
        }
        this.yAxis.onUnitChange(this._axisUnitChangeHandler.bind(this));
    };

    p.dispose = function () {
        this.elem.remove();
        this.elem = null;
        this.renderer.removeFromModel('series', this.index);
        this.renderer.unsubscribePreRedraw(this._updatePointsHandler);
        SuperClass.prototype.dispose.apply(this, arguments);
    };

    p.setIndex = function (index) {
        if (index !== this.index) {
            this.renderer.reorderModel('series', this.index, index);
        }
    };

    p.setId = function (id) {
        this.elem.id = id;
        SuperClass.prototype.setId.apply(this, arguments);
    };

    p.setYAxisReference = function (value) {
        this.settings.yAxisReference = value;
    };

    p.getYAxisReference = function () {
        return this.settings.yAxisReference;
    };

    p.setType = function (value) {
        this.settings.type = value;
        this.renderer.model.series[this.index].type = value;
    };

    p.getType = function () {
        return this.settings.type;
    };

    p.setStyle = function (value) {
        var style = this.stylePrefix + '_Graph_style_' + this.settings.style;
        if (this.elem.classList.contains(style)) {
            this.elem.classList.remove(style);
        }
        style = this.stylePrefix + '_Graph_style_' + value;
        this.settings.style = value;
        this.elem.classList.add(style);
        this.updateStyleProperties();
        this.renderer.requestRedraw();
    };

    p.updateStyleProperties = function () {
        StyleElemsUtils.updateGraphStyleElems(this, this.elem);
        this.renderer.model.series[this.index].width = parseInt(this.settings.lineWidth, 10);
        this.setEnable(this.settings.enable);
    };

    p.getStyle = function () {
        return this.settings.style;
    };

    /**
     * @method setNode
     * @param {brease.datatype.Node} node The node to be set
     */
    p.setNode = function (node) {
        if (Utils.isObject(node)) {
            var previousNode = this.getNode();
            this.settings.node = node;
            if (previousNode.nodeId !== node.nodeId) {
                this.historicalData = [];
                this.onlineData = [];
                var that = this;
                that._onNodeChangeHandlers.forEach(function (handler) {
                    handler(that);
                });
            }
            if (this.settings.node.value !== null) {
                if (previousNode.minValue !== node.minValue) {
                    this.yAxis.setMin(this.settings.node.minValue, this.getId());
                }
                if (previousNode.maxValue !== node.maxValue) {
                    this.yAxis.setMax(this.settings.node.maxValue, this.getId());
                }
                if ((!this.yAxis.hasUnit() || node.unit === this.yAxis.getCurrentUnit()) && node.time > 0) {
                    this._pushOnlineData();
                }
            } else {
                this.historicalData.length = 0;
                this.onlineData.length = 0;
                this.onlineFreezeData.length = 0;
                this.renderer.model.series[this.index].points.length = 0;
            }
        }
    };

    p._pushOnlineData = function () {   
        var data = {
            time: this.settings.node.time,
            x: Utils.fileTimeToDate(this.settings.node.time),
            y: this.settings.node.value
        };
        if (!this.isFreezed) {
            this.onlineData.push(data);
        } else {
            this.onlineFreezeData.push(data);
        }
    };

    /**
     * @method getNode 
     * @return {brease.datatype.Node} The current node of the widget
    */
    p.getNode = function () {
        if (!this.settings.node) {
            this.settings.node = {
                value: null,
                minValue: null,
                maxValue: null,
                unit: this.yAxis.getCurrentUnit() ? this.yAxis.getCurrentUnit() : null
            };
        }
        return this.settings.node;
    };

    /**
     * @method hasNodeId 
     * @return {Boolean} Check if the node is available and it has a node id.
    */
    p.hasNodeId = function () {
        return typeof this.settings.node === 'object' && typeof this.settings.node.nodeId === 'string';
    };

    /**
     * @method setCursorValue
     * @param {Number} value 
     */
    p.setCursorValue = function (value) {
    };

    /**
     * @method getCursorValue
     */
    p.getCursorValue = function () {
        return null;
    };

    /**
     * @method setCursorNode
     * @param {brease.datatype.Node} node
     */
    p.setCursorNode = function (node) {
    };

    /**
     * @method getCursorNode
     */
    p.getCursorNode = function () {
        return {
            value: null,
            minValue: null,
            maxValue: null,
            unit: this.yAxis.getCurrentUnit() ? this.yAxis.getCurrentUnit() : null
        };
    };

    /**
    * @method setEnable
    * Sets the state of property «enable»
    * @param {Boolean} value
    */
    p.setEnable = function (value) {
        this.settings.enable = Types.parseValue(value, 'Boolean');
        if (this.settings.enable) {
            this.renderer.model.series[this.index].fill = this.settings.lineColor;
        } else {
            this.renderer.model.series[this.index].fill = this.settings.disabledLineColor;
        }
    };

    /**
    * @method getEnable
    * Returns the state of property «enable»
    * @return {Boolean}
    */
    p.getEnable = function () {
        return this.settings.enable;

    };

    /**
    * @method setVisible
    * @iatStudioExposed
    * Sets the state of property «visible»
    * @param {Boolean} value
    */
    p.setVisible = function (value) {
        this.settings.visible = Types.parseValue(value, 'Boolean');
        if (this.settings.visible) {
            this.renderer.model.series[this.index].visibility = 'visible';
        } else {
            this.renderer.model.series[this.index].visibility = 'hidden';
        }
        this.renderer.requestRedraw();
    };

    /**
    * @method getVisible
    * Returns the state of property «visible»
    * @return {Boolean}
    */
    p.getVisible = function () {
        return this.settings.visible;
    };

    /**
    * @method updatePoints
    * Updates model series points with historical and online data. Removes data in buffer which is not in view.
    * @return {Boolean}
    */
    p.updatePoints = function (minRange, maxRange) {
        if (!this.hasError) {
            var minRangeFileTime = Utils.fileTimeFromDate(minRange);
            this._updateHistoricalPoints(minRangeFileTime);
            this._updateOnlinePoints(minRangeFileTime);
            this.renderer.model.series[this.index].points = this.historicalData.concat(this.onlineData);
            var lastPoint = _.last(this.renderer.model.series[this.index].points);
            // always append a point at maxRange so line never ends if we do not have newer values
            if (lastPoint && lastPoint.x.getTime() < maxRange.getTime()) {
                this.renderer.model.series[this.index].points.push({
                    time: Utils.fileTimeFromDate(maxRange),
                    x: maxRange,
                    y: lastPoint.y
                });
            }
        }
    };

    p._updateHistoricalPoints = function (minRangeFileTime) {
        var firstVisibleHdaIndex = _.findIndex(this.historicalData, function (point) {
            return point.time >= minRangeFileTime;
        });
        if (firstVisibleHdaIndex >= 0) {
            this.historicalData.splice(0, firstVisibleHdaIndex - 1);
        } else {
            // always keep one point so we can draw a line.
            if (this.historicalData.length > 0) {
                this.historicalData = [_.last(this.historicalData)];
            }
        }
    };

    p._updateOnlinePoints = function (minRangeFileTime) {
        var lastTimestamp = minRangeFileTime;
        if (this.historicalData.length > 0) {
            lastTimestamp = _.last(this.historicalData).time;
        }
        var firstVisibleOnlIndex = _.findIndex(this.onlineData, function (point) {
            return point.time > lastTimestamp;
        });
        if (firstVisibleOnlIndex >= 0) {
            // make sure line is always drawn beyond left border
            if (this.historicalData.length === 0) {
                firstVisibleOnlIndex -= 1;
            }
            this.onlineData.splice(0, firstVisibleOnlIndex);
        } else {
            // always keep one point so we can draw a line.
            if (this.historicalData.length === 0 && this.onlineData.length > 0) {
                this.onlineData = [_.last(this.onlineData)];
            } else {
                this.onlineData = [];
            }
        }
    };

    p.setPointsRange = function (range) {
        // keep bounds (+-1)
        var firstIndex = _.findIndex(this.historicalData, function (point) {
            return point.x >= range.start;
        }) - 1;
        var lastIndex = _.findLastIndex(this.historicalData, function (point) {
            return point.x <= range.end;
        });
        if (lastIndex >= 0) {
            firstIndex = firstIndex < 0 ? 0 : firstIndex;
            this.historicalData = this.historicalData.slice(firstIndex, lastIndex + 2);
        } else {
            this.historicalData.length = 0;
        }
    };

    /**
     * @method onNodeChange
     * Set handler for node change (nodeId)
    */
    p.onNodeChange = function (cb) {
        this._onNodeChangeHandlers.push(cb);
    };

    /**
     * @method onNodeUnitChange
     * Set handler for node unit change
    */
    p.onNodeUnitChange = function (cb) {
        this._onNodeUnitChangeHandler = cb;
    };

    /**
     * @method toString
     * Creates readable string of structured property. (i.e graph[id1])
    */
    p.toString = function () {
        return 'graph' + '[' + this.name + ']';
    };
    /**
     * @method attributeToString
     * Creates readable string of attribute. (i.e graph[id1].node)
    */
    p.attributeToString = function (name) {
        return this.toString() + '.' + name;
    };

    p._axisUnitChangeHandler = function (unit) {
        this.historicalData = [];
        this.onlineData = [];
        this.settings.node.unit = unit;
        this._onNodeUnitChangeHandler(this);
        var that = this;
        this._onNodeChangeHandlers.forEach(function (handler) {
            handler(that);
        });
    };

    p.freeze = function () {
        this.renderer.model.series[this.index].type = defaultSettings.type;
        this.isFreezed = true;   
    };

    p.unfreeze = function () {
        this.renderer.model.series[this.index].type = this.settings.type;
        this.isFreezed = false;
        this.onlineData = this.onlineData.concat(this.onlineFreezeData);
        this.onlineFreezeData = [];
    };

    return Graph;
});
