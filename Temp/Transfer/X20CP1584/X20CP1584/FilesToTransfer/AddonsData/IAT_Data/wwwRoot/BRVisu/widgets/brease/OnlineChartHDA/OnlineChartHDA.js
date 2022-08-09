define(['brease/core/BaseWidget',
    'brease/core/Utils',
    'brease/enum/Enum',
    'brease/events/BreaseEvent',
    'widgets/brease/common/ErrorHandling/libs/CommissioningErrorHandler',
    'widgets/brease/OnlineChartHDA/libs/config/Config',
    'widgets/brease/OnlineChartHDA/libs/StructProperties/XAxis',
    'widgets/brease/OnlineChartHDA/libs/StructProperties/YAxis',
    'widgets/brease/OnlineChartHDA/libs/StructProperties/Graph',
    'widgets/brease/OnlineChartHDA/libs/StructProperties/Cursor',
    'widgets/brease/OnlineChartHDA/libs/MsgOverlay',
    'widgets/brease/OnlineChartHDA/libs/Renderer',
    'widgets/brease/OnlineChartHDA/libs/DataAdapter',
    'widgets/brease/OnlineChartHDA/libs/StyleElemsUtils',
    'brease/decorators/DragAndDropCapability',
    'brease/decorators/MeasurementSystemDependency',
    'brease/decorators/CultureDependency',
    'widgets/brease/common/DragDropProperties/libs/DroppablePropertiesEvents'
], function (
    SuperClass,
    Utils,
    Enum,
    BreaseEvent,
    ErrorHandler,
    Config,
    XAxis,
    YAxis,
    Graph,
    Cursor,
    MsgOverlay,
    Renderer,
    DataAdapter,
    StyleElemsUtils,
    dragAndDropCapability,
    MeasurementSystemDependency,
    CultureDependency) {

    'use strict';

    /**
        * @class widgets.brease.OnlineChartHDA
        * #Description
        * Widget to display historical and online data as a series of data points.
        *
        * @breaseNote 
        * @extends brease.core.BaseWidget
        * @requires widgets.brease.BusyIndicator
        * @mixins widgets.brease.common.DragDropProperties.libs.DroppablePropertiesEvents
        * 
        * @iatMeta studio:license
        * licensed
        * @iatMeta category:Category
        * Chart
        *
        * @iatMeta description:short
        * Display historical + online data.
        * @iatMeta description:de
        * Widget zur Anzeige von historischen und online Daten in einem Diagramm.
        * @iatMeta description:en
        * Widget to display historical and online data in a chart.
    */

    var WidgetClass = SuperClass.extend(function OnlineChartHDA() {
            SuperClass.apply(this, arguments);
        }, Config),
        p = WidgetClass.prototype;

    p.init = function init() {
        this.renderer = new Renderer(this.settings.updateChartTime);
        this.errorHandler = new ErrorHandler(this);
        this.msgOverlay = new MsgOverlay({ elem: this.elem, el: this.el });
        if (this.settings.omitClass !== true) {
            this.addInitialClass('breaseOnlineChartHDA');
        }
        SuperClass.prototype.init.call(this, true);

        this.internal = {
            isFrozen: false,
            // time when the freeze mode was activated
            freezeTime: null,
            // if this is true during wake we have to reread the css
            themeChangedWhileSuspended: false,
            styleProperties: {},
            zoomType: this.settings.zoomType === 'xy' ? 'x,y' : this.settings.zoomType,
            // html id of the busy indicator
            busyId: Utils.uniqueID(this.elem.id + '_BusyIndi'),
            // property gets true if the window was resized, false if resize is handled
            isResized: true,
            // data preload time calulates with timespan / preLoadDivisor, i.e setTime will load 25% more data at start end end
            preLoadDivisor: 4
        };
        this.busyWrapper = $('<div class="breaseBusyWrapper visible" />');
        this.el.append(this.busyWrapper);
        this._createBusyIndicator();
        this._initStructuredProperties();
        StyleElemsUtils.createStyleElements(this);
        
        this.unfreeze();
        this._updateStyleProperties();
        window.document.body.addEventListener(BreaseEvent.THEME_CHANGED, this._bind('_themeChangedHandler'));

        if (!brease.config.editMode) {
            this._initRuntime();
        } else {
            this._createChartEditor();
            this._hideBusyWrapper();
            this._onStylePropertiesChanged();
            this.elem.addEventListener(BreaseEvent.WIDGET_STYLE_PROPERTIES_CHANGED, this._bind('_onStylePropertiesChanged'));
        }
    };

    p._createBusyIndicator = function () {
        this.elem.addEventListener(BreaseEvent.WIDGET_READY, this._bind('_onWidgetReady'));
        brease.uiController.createWidgets(this.busyWrapper.get(0), [
            {
                className: 'widgets.brease.BusyIndicator',
                id: this.internal.busyId,
                options: {}
            }
        ], true, this.settings.parentContentId);
    };

    p._onWidgetReady = function (e) {
        if (this.internal.busyId === e.target.id) {
            this.elem.removeEventListener(BreaseEvent.WIDGET_READY, this._bind('_onWidgetReady'));
            this._dispatchReady();
        }
    };

    p._initStructuredProperties = function () {
        this._initXAxis();
        // todo: only set culture dependency when textkey is used
        this.setCultureDependency(true);
        this.yAxis = {};
        for (var yAxisId in this.settings.yAxis) {
            this._addYAxis(yAxisId, this.settings.yAxis[yAxisId]);
        }
        this.graph = {};
        for (var graphId in this.settings.graph) {
            this._addGraph(graphId, this.settings.graph[graphId]);
        }
        this._initCursor();
    };

    p._initXAxis = function () {
        var xAxisId = Object.keys(this.settings.xAxis)[0];
        this.xAxis = new XAxis(xAxisId, this.settings.stylePrefix, this.settings.xAxis[xAxisId], this.renderer, this.elem.id, 'xAxis');
        this.elem.appendChild(this.xAxis.elem);
        this.xAxis.init();
        this.xAxis.onTimeSpanChange(this._timeSpanChangeHandler.bind(this));
        this.xAxis.onTimeChange(this._timeChangeHandler.bind(this));
    };

    p._initCursor = function () {
        var cursorId = Object.keys(this.settings.cursor)[0];
        this.cursor = new Cursor(cursorId, this.settings.stylePrefix, this.settings.cursor[cursorId], this.renderer, this.elem.id, 'cursor');
        this.elem.appendChild(this.cursor.elem);
        this.cursor.init();
        this.cursor.onTrackballChange(this._bind('_cursorTrackballChangeHandler'));
    };

    p._cursorTrackballChangeHandler = function (seriesIndex, point) {
        var graph = _.find(this.graph, ['index', seriesIndex]),
            node = graph.getCursorNode();
        node.value = point !== null ? point.y : null;
        var data = {};
        data[graph.attributeToString('cursorNode')] = node;
        data[graph.attributeToString('cursorValue')] = node.value;
        this.sendValueChange(data);
    };

    p._graphUnitChangedHandler = function (graph) {
        this.sendNodeChange({ attribute: graph.attributeToString('node'), nodeAttribute: 'unit', value: graph.getNode().unit });
    };

    p._themeChangedHandler = function () {
        if (this.state === Enum.WidgetState.INITIALIZED || this.state === Enum.WidgetState.READY) {
            this._updateAllStyleProperties();
            this.renderer.requestRedraw();
            this.internal.themeChangedWhileSuspended = false;
        } else {
            this.internal.themeChangedWhileSuspended = true;
        }

    };

    p._onStylePropertiesChanged = function () {
        this._updateAllStyleProperties();
        this.renderer.redraw();
    };

    /**
        * @method _createChartEditor
        * Creates chart for editor mode with a static graph 
        */
    p._createChartEditor = function _createChartEditor() {
        var range = {
            min: new Date(Date.now() - this.xAxis.getTimeSpanMs()),
            max: new Date()
        };
        var i = 0;
        for (var graphId in this.graph) {
            this.graph[graphId].historicalData =
                this._createChartEditorPoints(range.min, this.xAxis.getTimeSpanMs(), i);
            i += 1;
        }
        this.renderer.createChart(this.el, range);
    };

    /**
        * @method _createChartEditorPoints
        * Creates chart for editor points with sinus function
        */
    p._createChartEditorPoints = function (start, timespan, graphNr) {
        var points = [],
            steps = 50;
        for (var i = 0; i < steps; ++i) {
            var t = (timespan / steps) * i,
                tAbs = new Date(start.getTime() + t);
            points.push({
                x: tAbs,
                time: Utils.fileTimeFromDate(tAbs),
                y: Math.sin(i * 0.1 + graphNr) * (graphNr + 1)
            });
        }
        return points;
    };

    /**
        * @method _initRuntime
        * Initialize chart for runtime mode
        */
    p._initRuntime = function () {
        var widget = this;
        if (!this.dataAdapter) {
            this.dataAdapter = new DataAdapter(this.graph, this.xAxis.getTimeSpanMs(), this.settings.maxTimeDeviation * 1000, this.errorHandler, this.msgOverlay);
        }
        if (brease.config.preLoadingState) {
            this.settings.initRuntimeAfterPreCache = true;
        } else {
            this._bindUXEvents();
            this.measurementSystemChangeHandler();
            this.dataAdapter.setReadLatestHandler(function () {
                widget.renderer.createChart(widget.el);
                widget._hideBusyWrapper();
                widget.dataAdapter.resetReadLatestHandler();
            });
            if (this.settings.initRuntimeAfterPreCache) {
                // timespan could change in prechache so start with setTimespan on first load.
                this.dataAdapter.setTimespan(this.xAxis.getTimeSpanMs(), new Date(Date.now() + 2000));
            } else {
                this._readHistoryOnGraphNodeInit();
            }
            this.dataAdapter.start(this.bindings, this.settings.updateBufferTime);
            this.settings.initRuntimeAfterPreCache = false;
        }
    };
    
    p._bindUXEvents = function () {
        this.el.on('touchstart', this._bind('_onTouchStart'));
        this.el.on('mousedown', this._bind('_onMouseDown'));
        this.el.on('mousewheel DOMMouseScroll', this._bind('_onMouseWheel'));
        window.addEventListener('resize', this._bind('_resizeHandler'));
    };

    p._resizeHandler = function () {
        this.internal.isResized = true;
    };

    p._initialValueHandling = function () {
        SuperClass.prototype._initialValueHandling.apply(this, arguments);
        if (this.bindings) {
            var i = 0, nodes = [];
            for (var attributes in this.bindings) {
                if (attributes.indexOf('.node') !== -1) {
                    nodes[i] = attributes;
                    i = i + 1;
                }
            }
            if (nodes.length === 0) {
                this.errorHandler.requiredBindingNodesMissing();
            } else if (nodes.length !== Object.values(this.settings.graph).length) {
                console.log('node(s) are missing for the graph(s)');
            }
        } else {
            this.errorHandler.requiredBindingsMissing();
        }
    };
   
    p._readHistoryOnGraphNodeInit = function () {
        var that = this,
            pendingGraphs = Object.keys(this.graph);
        for (var graphId in this.graph) {
            this.graph[graphId].onNodeChange(function (graph) {
                _.pull(pendingGraphs, graph.getId());
                if (pendingGraphs.length === 0) {
                    that.dataAdapter.readLatest();
                }
            });
        }
    };

    p._timeSpanChangeHandler = function (timeSpan, oldTimeSpan) {
        if (brease.config.preLoadingState) {
            return;
        }
        if (brease.config.editMode) {
            // redraw graphs based on new range
            this._createChartEditor();
        } else {
            var timespanMs = timeSpan * 1000,
                end = this.internal.isFrozen ? this.internal.freezeTime : Date.now();
            var promise = this.dataAdapter.setTimespan(timespanMs, new Date(end));

            if (promise.state() === 'pending') {
                var that = this;
                var busyIndicatorTimeOut = window.setTimeout(this._showBusyWrapper.bind(this), 200);
                promise
                    .done(function () {
                        that._redrawNewRange();
                        clearTimeout(busyIndicatorTimeOut);
                        that._hideBusyWrapper();
                    })
                    .fail(function () {
                        that._hideBusyWrapper();
                        clearTimeout(busyIndicatorTimeOut);
                        that.dataAdapter.setTimespan(oldTimeSpan * 1000, new Date(end));
                    });
            } else {
                // new timespan < act timespan just redraw with new range
                this._redrawNewRange();
            }
            return promise;
        }
    };

    p._redrawNewRange = function () {
        if (this.internal.isFrozen) {
            var freezeRange = {
                min: new Date(this.internal.freezeTime - this.xAxis.getTimeSpanMs()),
                max: new Date(this.internal.freezeTime)
            };
            this.renderer.requestRedraw(freezeRange);
        } else {
            this.renderer.requestRedraw();
        }
    };

    p._showBusyWrapper = function () {
        this.busyWrapper.addClass('visible');
    };

    p._hideBusyWrapper = function () {
        this.busyWrapper.removeClass('visible');
    };

    p._timeChangeHandler = function (time) {
        if (brease.config.preLoadingState) {
            return;
        }
        var setTimespanPromise = this.dataAdapter.setTimespan(this._extendTimeSpan(time)),
            promise = $.Deferred(),
            range = {
                min: time.start,
                max: time.end
            },
            that = this;
        var busyIndicatorTimeOut = window.setTimeout(this._showBusyWrapper.bind(this), 200);
        setTimespanPromise
            .done(function (graphsDataStart) {
                var startBeforeFirstDatapoint = false;
                if (graphsDataStart.length === Object.keys(that.graph).length) {
                    _.compact(graphsDataStart);
                    var min = _.min(graphsDataStart);
                    if (min > range.min) {
                        range.min = min;
                        startBeforeFirstDatapoint = true;
                    }
                }
                that.zoomReset();
                that.xAxis.updateRangeInterval((range.max - range.min) / 1000);
                that.renderer.requestRedraw(range);
                clearTimeout(busyIndicatorTimeOut);
                that._hideBusyWrapper();
                promise.resolve(startBeforeFirstDatapoint, range);
            })
            .fail(function () {
                clearTimeout(busyIndicatorTimeOut);
                that._hideBusyWrapper();
                promise.reject();
            });
        return promise;
    };

    /** 
     * @method _extendTimeSpan
     * Extend timespan to preload data at start and end
     * @param {Object} timeSpan
     * @param {Date} timeSpan.start
     * @param {Date} timeSpan.end
     */
    p._extendTimeSpan = function (timeSpan) {
        var timeDif = this.renderer.model.primaryXAxis.range.max.getTime() - this.renderer.model.primaryXAxis.range.min.getTime();
        var preLoadTime = (timeDif) / this.internal.preLoadDivisor,
            timeSpanExtended = {
                start: new Date(timeSpan.start.getTime() - preLoadTime),
                end: new Date(timeSpan.end.getTime() + preLoadTime)
            };
        this.internal.dataTimeSpanExtended = timeSpanExtended;
        return timeSpanExtended;
    };

    // ------------ Structured Properties Set/Get/Add/Delete/Rename ------------

    /**
        * @method setGraph
        * Set property value of single graph
        */
    p.setGraph = function (path, attribute, value) {
        if (!this.graph[path]) {
            this.reportPropertyNotExist(path);
            return;
        }
        this.graph[path][Utils.setter(attribute)](value);
    };

    /**
        * @method getGraph
        * Get property value of single graph
        */
    p.getGraph = function (path, attribute) {
        if (!this.graph[path]) {
            this.reportPropertyNotExist(path);
            return null;
        }
        return this.graph[path][Utils.getter(attribute)]();
    };

    p.reportPropertyNotExist = function (path) {
        var propName = path.split('_').pop();
        this.errorHandler.invalidPropertyValue(propName);
        this.msgOverlay.create('Binded property ' + propName + ' does not exist');
    };

    /**
        * @method addGraph
        * Add a new graph and recreate demo chart
        */
    p.addGraph = function (id, options) {
        this._addGraph(id, options);
        this._createChartEditor();
    };

    p._addGraph = function (id, options) {
        if (!this.settings.graph[id]) {
            this.settings.graph[id] = options;
        }
        this.graph[id] = new Graph(id, this.settings.stylePrefix, this.settings.graph[id], this.renderer, this.elem.id, 'graph');
        this.elem.appendChild(this.graph[id].elem);
        try {
            this.graph[id].init(this.yAxis);
        } catch (e) {
            this.errorHandler.invalidPropertyValue(e.message);
        }
        this.graph[id].onNodeUnitChange(this._graphUnitChangedHandler.bind(this, this.graph[id]));
    };

    p.renameGraph = function (id, newId) {
        this._renameStructProp('graph', id, newId);
    };

    p._renameStructProp = function (prop, id, newId) {
        this[prop][id].setId(newId);
        this[prop][newId] = this[prop][id];
        delete this[prop][id];
        this.settings[prop][newId] = this.settings[prop][id];
        delete this.settings[prop][id];
    };

    /**
    * @method deleteGraph
    * Delete graph and redraw chart
    */
    p.deleteGraph = function (id) {
        this._deleteStructProp('graph', id);
    };

    p._deleteStructProp = function (prop, id) {
        this[prop][id].dispose();
        delete this[prop][id];
        delete this.settings[prop][id];
        this.renderer.redraw();
    };

    p.orderGraph = function (graphs) {
        this._orderStructProp('graph', graphs);
    };

    p._orderStructProp = function (prop, structProps) {
        for (var i = 0; i < structProps.length; ++i) {
            var id = structProps[i];
            this[prop][id].setIndex(i);
        }
        this.renderer.redraw();
    };

    /**
        * @method setYAxis
        * Set property value of single yAxis
        */
    p.setYAxis = function (path, attribute, value) {
        if (!this.yAxis[path]) {
            this.reportPropertyNotExist(path);
            return;
        }
        this.yAxis[path][Utils.setter(attribute)](value);
    };

    /**
        * @method getYAxis
        * Get property value of single yAxis
        */
    p.getYAxis = function (path, attribute) {
        if (!this.yAxis[path]) {
            this.reportPropertyNotExist(path);
            return null;
        }
        return this.yAxis[path][Utils.getter(attribute)]();
    };

    /**
        * @method addYAxis
        * Add a new yAxis and redraw chart
        */
    p.addYAxis = function (id, options) {
        this._addYAxis(id, options);
        this.renderer.redraw();
    };

    p._addYAxis = function (id, options) {
        if (!this.settings.yAxis[id]) {
            this.settings.yAxis[id] = options;
        }
        this.yAxis[id] = new YAxis(id, this.settings.stylePrefix, this.settings.yAxis[id], this.renderer, this.msgOverlay, this.elem.id, 'yAxis');
        this.elem.appendChild(this.yAxis[id].elem);
        this.yAxis[id].init();
    };

    p.renameYAxis = function (id, newId) {
        this._renameStructProp('yAxis', id, newId);
    };

    /**
    * @method deleteYAxis
    * Delete yAxis and redraw chart
    */
    p.deleteYAxis = function (id) {
        this._deleteStructProp('yAxis', id);
    };

    p.orderYAxis = function (axes) {
        this._orderStructProp('yAxis', axes);
    };

    p.setXAxis = function (path, attribute, value) {
        this.xAxis[Utils.setter(attribute)](value);
    };

    p.getXAxis = function (path, attribute) {
        return this.xAxis[Utils.getter(attribute)]();
    };

    p.renameXAxis = function (id, newId) {
        this.xAxis.setId(newId);
        this.settings.xAxis[newId] = this.settings.xAxis[id];
        delete this.settings.xAxis[id];
    };

    p.setCursor = function (path, attribute, value) {
        this.cursor[Utils.setter(attribute)](value);
    };

    p.getCursor = function (path, attribute) {
        return this.cursor[Utils.getter(attribute)]();
    };

    p.renameCursor = function (id, newId) {
        this.cursor.setId(newId);
        this.settings.cursor[newId] = this.settings.cursor[id];
        delete this.settings.cursor[id];
    };

    // ------------ Setters ------------

    /**
        * @method setUpdateBufferTime
        * @param {UInteger} updateBufferTime
        */
    p.setUpdateBufferTime = function setUpdateBufferTime(updateBufferTime) {
        this.settings.updateBufferTime = updateBufferTime;
    };

    /**
        * @method setUpdateChartTime
        * @param {UInteger} updateChartTime
        */
    p.setUpdateChartTime = function setUpdateChartTime(updateChartTime) {
        this.settings.updateChartTime = updateChartTime;
    };

    /**
    * @method setMaxTimeDeviation
    * @param {UInteger} maxTimeDeviation
    */
    p.setMaxTimeDeviation = function setMaxTimeDeviation(maxTimeDeviation) {
        this.settings.maxTimeDeviation = maxTimeDeviation * 1000;
        if (this.dataAdapter) {
            this.dataAdapter.setMaxTimeDeviation(this.settings.maxTimeDeviation);
        }
    };

    /**
    * @method setZoomType
    * @iatStudioExposed
    * Defines on which Axis zomming is enabled
    * @param {brease.enum.ChartZoomType} zoomType
    */
    p.setZoomType = function setZoomType(zoomType) {
        this.settings.zoomType = zoomType;
        if (zoomType === 'xy' || zoomType === 'none' || zoomType === 'x' || zoomType === 'y') {
            if (zoomType === 'xy') {
                this.internal.zoomType = 'x,y';
            } else {
                this.internal.zoomType = zoomType;
            }
            if (this.internal.isFrozen) {
                this.renderer.model.zooming.enable = true;
                if (this.settings.zoomType === 'none') {
                    this.zoomReset();
                    this.renderer.model.zooming.enable = false;
                }
            }
            this.renderer.model.zooming.type = this.settings.zoomType;
        }
    };

    // called by the BaseWidget when the enable state changes due to 
    // changed permissions or the enable property
    p._enableHandler = function (value) {
        SuperClass.prototype._enableHandler.apply(this, arguments);
        for (var graphId in this.graph) {
            this.graph[graphId].setEnable(value);
        }
        for (var yAxisId in this.yAxis) {
            this.yAxis[yAxisId].setEnable(value);
        }
        this.xAxis.setEnable(value);
        if (value) {
            this.renderer.model.chartArea.background = this.internal.styleProperties.chartColor;
            if (this.internal.isFrozen) {
                this._enableChartInteraction();
            }
        } else {
            this.renderer.model.chartArea.background = this.internal.styleProperties.disabledChartColor;
            this._disableChartInteraction();
        }
        this.renderer.requestRedraw();
    };

    p._visibleHandler = function () {
        // transform style property only returns correct value if widget gets visible (after init)
        if (this.el.is(':visible') && this.internal) {
            this._updateAllStyleProperties();
        }
    };

    /**
        * @method _setWidth
        * @param {Number} w  
        */
    p._setWidth = function _setWidth(w) {
        SuperClass.prototype._setWidth.call(this, w);

        if (brease.config.editMode) {
            this._createChartEditor();
        }
    };

    /**
        * @method _setHeight
        * @param {Number} w  
        */
    p._setHeight = function _setHeight(h) {
        SuperClass.prototype._setHeight.call(this, h);

        if (brease.config.editMode) {
            this._createChartEditor();
        }

    };

    /**
        * @method setStyle
        * Sets new style to the widget.
        * @iatStudioExposed
        * @param {StyleReference} value
        */
    p.setStyle = function (style) {
        SuperClass.prototype.setStyle.apply(this, arguments);
        this._updateStyleProperties();
        this.renderer.requestRedraw();
    };
    // ------------ Getters ------------

    /**
        * @method getUpdateBufferTime 
        * @return {UInteger} 
        */
    p.getUpdateBufferTime = function getUpdateBufferTime() {
        return this.settings.updateBufferTime;
    };

    /**
        * @method getUpdateChartTime 
        * @return {UInteger} 
        */
    p.getUpdateChartTime = function getUpdateChartTime() {
        return this.settings.updateChartTime;
    };

    /**
    * @method getMaxTimeDeviation
    */
    p.getMaxTimeDeviation = function getMaxTimeDeviation() {
        return this.settings.maxTimeDeviation;
    };

    /**
        * @method getZoomType
        * @return {brease.enum.ChartZoomType}
        * Gets the zoomType, which affects the zomming behavior of the axes
        */
    p.getZoomType = function getZoomType() {
        return this.settings.zoomType;
    };

    /**
        * @method getTrackballTooltipMode
        * @return {String}
        */
    p.getTrackballTooltipMode = function getTrackballTooltipMode() {
        return this.settings.trackballTooltipMode;
    };

    /**
        * @method getStatus
        *  Returns true if the graph is not in freeze mode.
        * @iatStudioExposed
        * @return {Boolean}
        */
    p.getStatus = function getStatus() {
        if (this.internal.isFrozen) {
            return false;
        } else {
            return true;
        }
    };

    // ------------ Methods ------------

    /**
        * @method cultureChangeHandler
        */
    p.cultureChangeHandler = function (e) {
        if (e !== undefined) {
            this.xAxis.cultureChangeHandler();
            for (var yAxis in this.settings.yAxis) {
                this.yAxis[yAxis].cultureChangeHandler();
            }
            this.renderer.requestRedraw();
        }
    };

    /**
        * @method measurementSystemChangeHandler
        * Sets unit for every y axis
        */
    p.measurementSystemChangeHandler = function () {
        for (var yAxis in this.settings.yAxis) {
            this.yAxis[yAxis].measurementSystemChangeHandler(this);
        }
    };

    /**
        * @method _updateStyleProperties
        * Updates styleable properties of the widget
        */
    p._updateStyleProperties = function () {
        this.internal.styleProperties = StyleElemsUtils.updateStyleProperties(this.internal.styleProperties, this.elem);
        this.renderer.model.chartArea.background = this.internal.styleProperties.chartColor;
        this.renderer.model.background = this.internal.styleProperties.chartBackColor;
        this._enableHandler(!this.isDisabled);
    };

    /**
        * @method _updateAllStyleProperties
        * Updates all styleable properties of the widget and structured properties
        */
    p._updateAllStyleProperties = function () {
        this._updateStyleProperties();
        this.xAxis.updateStyleProperties();
        for (var yAxis in this.yAxis) {
            this.yAxis[yAxis].updateStyleProperties();
        }
        for (var graphId in this.graph) {
            this.graph[graphId].updateStyleProperties();
        }
    };

    /**
        * @method freeze
        * @iatStudioExposed
        * Stops the update of the chart data and allows to use zoom and scrolling functions.
        */
    p.freeze = function () {
        if (!this.internal.isFrozen) {
            this.renderer.onChartLoaded = null;
            if (!this.renderer.getChartIsLoaded()) {
                this.renderer.onChartLoaded = this.freeze.bind(this);
                return;
            }
            this.dataAdapter.stop();
            this.renderer.stop();
            this.internal.freezeTime = Date.now();
            var that = this,
                timespan = {
                    start: new Date(this.internal.freezeTime - this.xAxis.getTimeSpanMs()),
                    end: new Date(this.internal.freezeTime)
                };
            this.dataAdapter.setTimespan(this._extendTimeSpan(timespan)).done(function () {
                that.internal.isFrozen = that.getStatus();
                that._enableChartInteraction();
                for (var graphId in that.graph) {
                    that.graph[graphId].freeze();
                }
                that.el.removeClass('unfreeze');
                that.renderer.redraw({ min: timespan.start, max: timespan.end });
            });
        }
    };

    p._enableChartInteraction = function () {
        this.renderer.model.zooming.enable = this.settings.zoomType !== 'none' && this.isEnabled();
        this.renderer.model.zooming.enablePinching = this.isEnabled();
        this.renderer.model.zooming.enableMouseWheel = this.isEnabled();
        if (this.isEnabled()) {
            this.cursor.show();
            this.renderer.model.zooming.toolbarItems = ['reset', 'pan', 'zoom'];
            this.renderer.model.zooming.enableDeferredZoom = false;
        }
    };

    /**
        * @method unfreeze
        * @iatStudioExposed
        * Restarts the update of the chart data and prevents to use zoom and scrolling functions.
        */
    p.unfreeze = function () {
        this._disableChartInteraction();
        this.zoomReset();
        this.el.addClass('unfreeze');

        if (this.internal.isFrozen && this.renderer.getChartIsLoaded()) {
            this.internal.isFrozen = this.getStatus();
            for (var graphId in this.graph) {
                this.graph[graphId].unfreeze();
            }
            this.xAxis.setNumberOfTicks(this.xAxis.settings.numberOfTicks, false);
            this.dataAdapter.readLatest();
            this.dataAdapter.start(this.bindings);
            this.renderer.start();
        }
    };

    p._disableChartInteraction = function () {
        // due to synfusion bug toolbar buttons will not be removed so we have to manually remove them here
        this._removeToolbar();
        this.renderer.model.zooming.enable = false;
        this.renderer.model.zooming.toolbarItems = [''];
        this.renderer.model.zooming.enableMouseWheel = false;
        this.renderer.model.zooming.enablePinching = false;
        this.cursor.hide();
    };

    /**
     * @method
     * Remove toolbar buttons from dom
     */
    p._removeToolbar = function () {
        this._removeToolbarItem('ZoomBtn');
        this._removeToolbarItem('PanBtn');
        this._removeToolbarItem('ResetZoom');
    };

    /**
     * @method 
     * Remove toolbaritem from dom
     * @param {String} id toolbar item id (ZoomBtn, PanBtn, ResetZoom...) 
     */
    p._removeToolbarItem = function (id) {
        var elem = document.getElementById(this.elem.id + '_canvas_' + id);
        if (elem) {
            elem.parentNode.removeChild(elem);
        }
    };

    /**
        * @method zoomIn
        * @iatStudioExposed
        * Zooms in 20%
        */
    p.zoomIn = function () {
        //primaryYAxis is used to calculate zoomFactor and zoomPosition for all yAxis
        if (this.internal.isFrozen) {
            var previousXFactor = this.renderer.model.primaryXAxis.zoomFactor,
                previousYFactor = this.renderer.model.primaryYAxis.zoomFactor,
                zoomXPos = this.renderer.model.primaryXAxis.zoomPosition,
                zoomYPos = this.renderer.model.primaryYAxis.zoomPosition,
                factor = 0.8,
                zoomLimitation = 0.002;

            if (this.internal.eventZoomed !== true && this.internal.zoomType !== 'none') {
                //zooms in the middle if action has been called thru event/action system
                var previousX = zoomXPos + previousXFactor * 0.5,
                    previousY = zoomYPos + previousYFactor * 0.5;
                this._positionZoomCalculate(previousX, previousY, 0.5, 0.5, factor);
            }
            this.internal.eventZoomed = false;

            switch (this.internal.zoomType) {
                case 'x,y':
                    this.renderer.model.primaryXAxis.zoomFactor = previousXFactor * factor;
                    this.renderer.model.primaryYAxis.zoomFactor = previousYFactor * factor;
                    this._calculateZoomFactorYAxis(this.renderer.model.primaryYAxis.zoomFactor);
                    break;

                case 'x':
                    this.renderer.model.primaryXAxis.zoomFactor = previousXFactor * factor;
                    break;

                case 'y':
                    this.renderer.model.primaryYAxis.zoomFactor = previousYFactor * factor;
                    this._calculateZoomFactorYAxis(this.renderer.model.primaryYAxis.zoomFactor);
                    break;
            }

            if (this.renderer.model.primaryXAxis.zoomFactor < zoomLimitation) {
                this.renderer.model.primaryXAxis.zoomFactor = zoomLimitation;
            }

            if (this.renderer.model.primaryYAxis.zoomFactor < zoomLimitation) {
                this.renderer.model.primaryYAxis.zoomFactor = zoomLimitation;
                this._calculateZoomFactorYAxis(zoomLimitation);
            }

            this.renderer.redraw();
        }
    };

    /**
        * @method zoomOut
        * @iatStudioExposed
        * Zooms out 20% (only in freeze mode)
        */
    p.zoomOut = function () {
        if (this.internal.isFrozen) {
            var previousXFactor = this.renderer.model.primaryXAxis.zoomFactor,
                previousYFactor = this.renderer.model.primaryYAxis.zoomFactor,
                zoomXPos = this.renderer.model.primaryXAxis.zoomPosition,
                zoomYPos = this.renderer.model.primaryYAxis.zoomPosition,
                factor = 1.2;

            if (this.internal.eventZoomed !== true && this.internal.zoomType !== 'none') {
                //zooms in the middle if action has been called thru event/action system
                var previousX = zoomXPos + previousXFactor * 0.5,
                    previousY = zoomYPos + previousYFactor * 0.5;
                this._positionZoomCalculate(previousX, previousY, 0.5, 0.5, factor);
            }
            this.internal.eventZoomed = false;

            switch (this.internal.zoomType) {
                case 'x,y':
                    this.renderer.model.primaryXAxis.zoomFactor = this.renderer.model.primaryXAxis.zoomFactor * factor;
                    this.renderer.model.primaryYAxis.zoomFactor = this.renderer.model.primaryYAxis.zoomFactor * factor;
                    this._calculateZoomFactorYAxis(this.renderer.model.primaryYAxis.zoomFactor);
                    break;

                case 'x':
                    this.renderer.model.primaryXAxis.zoomFactor = this.renderer.model.primaryXAxis.zoomFactor * factor;
                    break;

                case 'y':
                    this.renderer.model.primaryYAxis.zoomFactor = this.renderer.model.primaryYAxis.zoomFactor * factor;
                    this._calculateZoomFactorYAxis(this.renderer.model.primaryYAxis.zoomFactor);
                    break;
            }

            if (this.renderer.model.primaryXAxis.zoomFactor > 1) {
                this.renderer.model.primaryXAxis.zoomFactor = 1;
            }

            if (this.renderer.model.primaryYAxis.zoomFactor > 1) {
                this.renderer.model.primaryYAxis.zoomFactor = 1;
                this._calculateZoomFactorYAxis(1);
            }

            if (this.renderer.model.primaryYAxis.zoomFactor === 1 && this.renderer.model.primaryXAxis.zoomFactor === 1) {
                this.zoomReset();
            }

            this.renderer.redraw();
        }
    };

    /**
        * @method zoomReset
        * @iatStudioExposed
        * Resets zoom to 0% (only in freeze mode)
        */
    p.zoomReset = function () {
        //dispatch event on internal 'zoomReset' hidden button
        var resetBtn = document.getElementById(this.elem.id + '_canvas_ResetZoom');
        if (resetBtn) {
            var event = new Event('click');
            resetBtn.dispatchEvent(event);
        } else if (this.isZoomed()) {
            this.renderer.model.primaryXAxis.zoomFactor = 1;
            this.renderer.model.primaryYAxis.zoomFactor = 1;
            this.renderer.model.primaryXAxis.zoomPosition = 0;
            this.renderer.model.primaryYAxis.zoomPosition = 0;
            this._calculateZoomFactorYAxis(1);
            this._calculateZoomPositionYAxis(0);
            if (this.internal.isFrozen) {
                this.renderer.redraw();
            }
        }
    };

    p.isZoomed = function () {
        return this.renderer.model.primaryXAxis.zoomFactor !== 1 || this.renderer.model.primaryYAxis.zoomFactor !== 1;
    };

    /**
        * @method scrollRight
        * @iatStudioExposed
        * Scrolls right 25% (only in freeze mode)
        */
    p.scrollRight = function () {
        var factor = 0.25;
        if (this.internal.isFrozen && this.renderer.model.primaryXAxis.visibleRange.max < this.renderer.model.primaryXAxis.actualRange.max) {
            this.renderer.model.primaryXAxis.zoomPosition = this.renderer.model.primaryXAxis.zoomPosition + factor * this.renderer.model.primaryXAxis.zoomFactor;
            this.renderer.requestRedraw();
        }
    };

    /**
        * @method scrollLeft
        * @iatStudioExposed
        * Scrolls left 25% (only in freeze mode)
        */
    p.scrollLeft = function () {
        var factor = 0.25;
        if (this.internal.isFrozen && this.renderer.model.primaryXAxis.visibleRange.min > this.renderer.model.primaryXAxis.actualRange.min) {
            this.renderer.model.primaryXAxis.zoomPosition = this.renderer.model.primaryXAxis.zoomPosition - factor * this.renderer.model.primaryXAxis.zoomFactor;
            this.renderer.requestRedraw();
        }
    };

    /**
        * @method scrollUp
        * @iatStudioExposed
        * Scrolls up 25% (only in freeze mode)
        */
    p.scrollUp = function () {
        var factor = 0.25;
        if (this.internal.isFrozen && this.renderer.model.primaryYAxis.visibleRange.max < this.renderer.model.primaryYAxis.actualRange.max) {
            this.renderer.model.primaryYAxis.zoomPosition = this.renderer.model.primaryYAxis.zoomPosition + factor * this.renderer.model.primaryYAxis.zoomFactor;
            this._calculateZoomPositionYAxis(this.renderer.model.primaryYAxis.zoomPosition);
            this.renderer.requestRedraw();
        }
    };

    /**
        * @method scrollDown
        * @iatStudioExposed
        * Scrolls down 25% (only in freeze mode)
        */
    p.scrollDown = function () {
        var factor = 0.25;
        if (this.internal.isFrozen && this.renderer.model.primaryYAxis.visibleRange.min > this.renderer.model.primaryYAxis.actualRange.min) {
            this.renderer.model.primaryYAxis.zoomPosition = this.renderer.model.primaryYAxis.zoomPosition - factor * this.renderer.model.primaryYAxis.zoomFactor;
            this._calculateZoomPositionYAxis(this.renderer.model.primaryYAxis.zoomPosition);
            this.renderer.requestRedraw();
        }
    };

    //-------Structured Property Actions------//

    /**
        * @method setGraphVisible
        * @iatStudioExposed
        * Sets visibility of graph
        * @param {PropertyCollectionReference} graphId
        * @param {Boolean} value
        * @paramMeta graphId:typeRefId=graph
        */
    p.setGraphVisible = function (graphId, value) {
        var graph = _.find(this.graph, ['name', graphId]);
        if (graph) {
            this._changeStructProp(graph, 'visible', value);
        } else {
            return null;
        }
    };

    /**
    * @method _changeStructProp
    * Change struct prop attribute and dispatch changes. 
    */
    p._changeStructProp = function (structProp, attribute, value) {
        var promise = structProp[Utils.setter(attribute)](value);
        var data = {};
        data[structProp.attributeToString(attribute)] = structProp[Utils.getter(attribute)]();
        this.sendValueChange(data);
        return promise;
    };

    /**
        * @method setGraphStyle
        * @iatStudioExposed
        * Sets style of graph
        * @param {PropertyCollectionReference} graphId
        * @param {StyleReference} value
        * @paramMeta graphId:typeRefId=graph
        * @paramMeta value:typeRefId=widgets.brease.OnlineChartHDA.Graph
        */
    p.setGraphStyle = function (graphId, value) {
        var graph = _.find(this.graph, ['name', graphId]);
        if (graph) {
            this._changeStructProp(graph, 'style', value);
        } else {
            return null;
        }
    };

    /**
        * @method setYAxisVisible
        * @iatStudioExposed
        * Sets visibility of yAxis
        * @param {PropertyCollectionReference} yAxisId
        * @param {Boolean} value
        * @paramMeta yAxisId:typeRefId=yAxis
        */
    p.setYAxisVisible = function (yAxisId, value) {
        var yAxis = _.find(this.yAxis, ['name', yAxisId]);
        if (yAxis) {
            this._changeStructProp(yAxis, 'visible', value);
        } else {
            return null;
        }
    };

    /**
        * @method setYAxisStyle
        * @iatStudioExposed
        * Sets style of yAxis
        * @param {PropertyCollectionReference} yAxisId
        * @param {StyleReference} value
        * @paramMeta yAxisId:typeRefId=yAxis
        * @paramMeta value:typeRefId=widgets.brease.OnlineChartHDA.YAxis
        */
    p.setYAxisStyle = function (yAxisId, value) {
        var yAxis = _.find(this.yAxis, ['name', yAxisId]);
        if (yAxis) {
            this._changeStructProp(yAxis, 'style', value);
        } else {
            return null;
        }
    };

    /**
        * @method setXAxisVisible
        * @iatStudioExposed
        * Sets visibility of xAxis
        * @param {PropertyCollectionReference} xAxisId
        * @param {Boolean} value
        * @paramMeta xAxisId:typeRefId=xAxis
        */
    p.setXAxisVisible = function (xAxisId, value) {
        if (this.xAxis.name === xAxisId) {
            this._changeStructProp(this.xAxis, 'visible', value);
        } else {
            return null;
        }
    };

    /**
        * @method setXAxisStyle
        * @iatStudioExposed
        * Sets style of xAxis
        * @param {PropertyCollectionReference} xAxisId
        * @param {StyleReference} value
        * @paramMeta xAxisId:typeRefId=xAxis
        * @paramMeta value:typeRefId=widgets.brease.OnlineChartHDA.XAxis
        */
    p.setXAxisStyle = function (xAxisId, value) {
        if (this.xAxis.name === xAxisId) {
            this._changeStructProp(this.xAxis, 'style', value);
        } else {
            return null;
        }
    };

    /**
    * @method setXAxisTimeSpan
    * @iatStudioExposed
    * Sets timeSpan of XAxis
    * @param {PropertyCollectionReference} xAxisId
    * @param {UNumber} timeSpan
    * @paramMeta xAxisId:typeRefId=xAxis
    */
    p.setXAxisTimeSpan = function (xAxisId, value) {
        if (this.xAxis.name === xAxisId) {
            var promise = this._changeStructProp(this.xAxis, 'timeSpan', value);
            if (promise) {
                return this._createActionPromise(promise);
            }
        } else {
            return null;
        }
    };

    p._createActionPromise = function (promise, resultHandler) {
        var deferred = $.Deferred();
        promise
            .done(function () {
                if (resultHandler) {
                    deferred.resolve(true, resultHandler.apply(null, arguments));
                } else {
                    deferred.resolve(true);
                }
            })
            .fail(function () {
                deferred.resolve(false);
            });
        return deferred.promise();
    };

    /**
    * @method setXAxisTime
    * @iatStudioExposed
    * Sets start and end time of XAxis in freeze mode. Time is in UTC. Prevents setting times beyond limits by setting range automatically (start: first datapoint timestamp, end: freeze time).
    * @param {PropertyCollectionReference} xAxisId
    * @param {DateTime} start
    * @param {DateTime} end
    * @paramMeta xAxisId:typeRefId=xAxis
    * @return {Number} status 1 = start is before first data point timestamp, 2 = end time is after freeze time, 3 = 1+2, -1 = end is before start
    */
    p.setXAxisTime = function (xAxisId, start, end) {
        start = new Date(start);
        end = new Date(end);
        var result = 0;
        if (this.xAxis.name === xAxisId && this.internal.isFrozen) {
            if (this.internal.freezeTime < end.getTime()) {
                end = new Date(this.internal.freezeTime);
                result = 2;
            }
            if (start < end) {
                var promise = this.xAxis.setTime(start, end);
                if (promise) {
                    return this._createSetTimeActionPromise(promise, result);
                }
            } else {
                return -1;
            }
        }
        return null;
    };

    p._createSetTimeActionPromise = function (promise, result) {
        return this._createActionPromise(promise, function (startBeforeFirstDatapoint) {
            if (startBeforeFirstDatapoint) {
                result += 1;
            }
            return result;
        });
    };

    /**
    * @method scrollXAxis
    * @iatStudioExposed
    * Scroll xAxis in any directon in seconds. Use negative number to scroll back in history. Prevents scrolling beyond limits (start: first datapoint timestamp, end: freeze time))
    * @param {PropertyCollectionReference} xAxisId
    * @param {Number} offset
    * @paramMeta xAxisId:typeRefId=xAxis
    * @return {Number} status 1 = start is before first data point timestamp, 2 = end time is after freeze time
    */
    p.scrollXAxis = function (xAxisId, offset) {
        if (this.xAxis.name === xAxisId && this.internal.isFrozen) {
            var start = new Date(this.renderer.model.primaryXAxis.range.min.getTime() + offset * 1000),
                end = new Date(this.renderer.model.primaryXAxis.range.max.getTime() + offset * 1000);
            if (this.internal.freezeTime < end.getTime()) {
                return 2;
            }
            var promise = this.xAxis.setTime(start, end),
                that = this;
            if (promise) {
                return this._createActionPromise(promise, function (startBeforeFirstDatapoint, revisedRange) {
                    if (startBeforeFirstDatapoint) {
                        // SetTime action sets XAxis start to first datapoint timestamp, ajust end so we keep timespan
                        var startOffset = revisedRange.min.getTime() - start.getTime();
                        revisedRange.max = new Date(revisedRange.max.getTime() + startOffset);
                        if (revisedRange.max.getTime() > that.internal.freezeTime) {
                            revisedRange.max = new Date(that.internal.freezeTime);
                        }
                        that.xAxis.updateRangeInterval((revisedRange.max - revisedRange.min) / 1000);
                        that.renderer.requestRedraw(revisedRange);
                        return 1;
                    }
                    return 0;
                });
            }
        }
        return null;
    };

    /**
    * @method setCursorStyle
    * @iatStudioExposed
    * Sets style of cursor
    * @param {PropertyCollectionReference} cursorId
    * @param {StyleReference} value
    * @paramMeta cursorId:typeRefId=cursor
    * @paramMeta value:typeRefId=widgets.brease.OnlineChartHDA.Cursor
    */
    p.setCursorStyle = function (cursorId, value) {
        if (this.cursor.name === cursorId) {
            this._changeStructProp(this.cursor, 'style', value);
        } else {
            return null;
        }
    };

    //-------Zooming Actions------//

    /**
        * @method wheelZoom
        * Zooming for wheel event
        */
    p.wheelZoom = function (e) {
        e.preventDefault();

        if (this.renderer !== undefined && this.internal.isFrozen && this.internal.zoomType !== 'none') {
            var zoom = this._zoomProperties(e);

            if (e.layerX > zoom.width + zoom.x || e.layerX < zoom.x || e.layerY > zoom.height + zoom.y || e.layerY < zoom.y) {
                return;
            }

            this.internal.eventZoomed = true;
            if (e.deltaY > 0) {
                this._positionZoomCalculate(zoom.previousXPosition, zoom.previousYPosition, zoom.mouseXPosition, zoom.mouseYPosition, 1.2);
                this.zoomOut();
            } else {
                this._positionZoomCalculate(zoom.previousXPosition, zoom.previousYPosition, zoom.mouseXPosition, zoom.mouseYPosition, 0.8);
                this.zoomIn();

            }
        }
    };

    /**
        * @method dblClickZoom
        * Zooming for double click event
        */
    p.dblClickZoom = function (e) {
        if (this.renderer !== undefined && this.internal.isFrozen && this.internal.zoomType !== 'none') {
            var zoom = this._zoomProperties(e);

            if (e.layerX > zoom.width + zoom.x || e.layerX < zoom.x || e.layerY > zoom.height + zoom.y || e.layerY < zoom.y) {
                return;
            }
            this.internal.eventZoomed = true;
            this._positionZoomCalculate(zoom.previousXPosition, zoom.previousYPosition, zoom.mouseXPosition, zoom.mouseYPosition, 0.8);
            this.zoomIn();
        }
    };

    //-----PseudoPrivate functions-----//

    /**
        * @method _calculateZoomFactorYAxis
        * Calculates zoom factor for all y axis
        */
    p._calculateZoomFactorYAxis = function (value) {
        for (var i = 0; i < this.renderer.model.axes.length; i = i + 1) {
            this.renderer.model.axes[i].zoomFactor = value;
        }
    };

    /**
        * @method _calculateZoomPositionYAxis
        * Calculates zoom position for all y axis
        */
    p._calculateZoomPositionYAxis = function (value) {
        for (var i = 0; i < this.renderer.model.axes.length; i = i + 1) {
            this.renderer.model.axes[i].zoomPosition = value;
        }
    };

    /**
        * @method _zoomProperties
        * Calculates correct zoomPosition when double click or wheel is used
        */
    p._zoomProperties = function (e) {
        //method used to 
        var object = {
            width: this.renderer.model.m_AreaBounds.Width,
            height: this.renderer.model.m_AreaBounds.Height,
            x: this.renderer.model.m_AreaBounds.X,
            y: this.renderer.model.m_AreaBounds.Y
        };
        object.mouseXPosition = (e.layerX - object.x) / object.width;
        object.mouseYPosition = 1 - (e.layerY - object.y) / object.height;
        object.previousXPosition = this.renderer.model.primaryXAxis.zoomPosition + this.renderer.model.primaryXAxis.zoomFactor * object.mouseXPosition;
        object.previousYPosition = this.renderer.model.primaryYAxis.zoomPosition + this.renderer.model.primaryYAxis.zoomFactor * object.mouseYPosition;

        return object;
    };

    /**
        * @method _positionZoomCalculate
        * Calculates zoom position depending on the position of the mouse
        */
    p._positionZoomCalculate = function (previousX, previousY, mouseX, mouseY, factor) {
        var zoomLimitation = 0.002;

        if (this.internal.zoomType === 'x,y' || this.internal.zoomType === 'x') {
            if (this.renderer.model.primaryXAxis.zoomFactor * factor > zoomLimitation) {
                this.renderer.model.primaryXAxis.zoomPosition = previousX - this.renderer.model.primaryXAxis.zoomFactor * factor * mouseX;
            } else {
                this.renderer.model.primaryXAxis.zoomPosition = previousX - zoomLimitation * mouseX;
            }
        }

        if (this.internal.zoomType === 'x,y' || this.internal.zoomType === 'y') {
            if (this.renderer.model.primaryYAxis.zoomFactor * factor > zoomLimitation) {
                this.renderer.model.primaryYAxis.zoomPosition = previousY - this.renderer.model.primaryYAxis.zoomFactor * factor * mouseY;
                this._calculateZoomPositionYAxis(this.renderer.model.primaryYAxis.zoomPosition);
            } else {
                this.renderer.model.primaryYAxis.zoomPosition = previousY - zoomLimitation * mouseY;
                this._calculateZoomPositionYAxis(this.renderer.model.primaryYAxis.zoomPosition);
            }
        }

        if (this.renderer.model.primaryXAxis.zoomPosition < 0) {
            this.renderer.model.primaryXAxis.zoomPosition = 0;
        }
        if (this.renderer.model.primaryYAxis.zoomPosition < 0) {
            this.renderer.model.primaryYAxis.zoomPosition = 0;
            this._calculateZoomPositionYAxis(this.renderer.model.primaryYAxis.zoomPosition);
        }
    };

    p._onMouseDown = function (e) {
        if (this.renderer.model.zooming.enable) {
            var pos = this._clientPosToChartPos(e);
            if (this._isChartPosOnChartArea(pos)) {
                // stop scrolling in zoom mode
                e.stopPropagation();
            }
        }
    };

    p._clientPosToChartPos = function (pos) {
        var rect = document.getElementById(this.renderer.canvasElemId).getBoundingClientRect(),
            scaleFactor = this._getScaleFactor(this.elem);
        return {
            x: (pos.clientX - rect.x) / scaleFactor,
            y: (pos.clientY - rect.y) / scaleFactor
        };
    };
    
    p._isChartPosOnChartArea = function (pos) {
        var vertical = pos.x < this.renderer.model.m_AreaBounds.Width + this.renderer.model.m_AreaBounds.X && pos.x > this.renderer.model.m_AreaBounds.X,
            horizontal = pos.y < this.renderer.model.m_AreaBounds.Height + this.renderer.model.m_AreaBounds.Y && pos.y > this.renderer.model.m_AreaBounds.Y;
        return vertical && horizontal;
    };

    p._onMouseWheel = function (e) {
        if (this.renderer.model.zooming.enable) {
            // stop scrolling in zoom mode
            e.stopPropagation();
        }
    };

    p._getScaleFactor = function () {
        if (this.internal.isResized) {
            this.internal.scaleFactor = Utils.getScaleFactor(this.elem.parentNode);
            if (this.internal.scaleFactor === 0) {
                this.internal.scaleFactor = 1;
            }
            this.internal.isResized = false;
        }
        return this.internal.scaleFactor;
    };

    /**
    * @method _onTouchStart
    * 
    */
    p._onTouchStart = function (e) {
        if (this.internal.isFrozen && this.isEnabled()) {
            var position = this._clientPosToChartPos(e.originalEvent.touches[0]);
            if (this._isChartPosOnChartArea(position)) {
                // stop scrolling if in scroll content
                e.stopPropagation();
            }
            if (!this._isChartPosOnXAxis(position) || e.originalEvent.touches.length !== 1 || this.isZoomed()) {
                return;
            }
            e.stopPropagation();
            this.elem.addEventListener('touchmove', this._bind('_onTouchMove'));
            this.elem.addEventListener('touchend', this._bind('_onTouchEnd'));
            this.internal.lastTouchX = position.x - this.renderer.model.m_AreaBounds.X;
        }
    };

    p._isChartPosOnXAxis = function (pos) {
        var vertical = pos.x < this.renderer.model.m_AreaBounds.Width + this.renderer.model.m_AreaBounds.X && 
            pos.x > this.renderer.model.m_AreaBounds.X;
        var horizontal = pos.y > this.renderer.model.m_AreaBounds.Height + this.renderer.model.m_AreaBounds.Y &&
            pos.y < this.renderer.model.svgHeight;
        if (this.renderer.model.primaryXAxis.opposedPosition) {
            horizontal = pos.y < this.renderer.model.m_AreaBounds.Y;
        }
        return vertical && horizontal;
    };

    /**
        * @method _onTouchMove
        * 
        */
    p._onTouchMove = function (e) {
        if (e.touches.length !== 1) {
            return;
        }
        var pos = this._clientPosToChartPos(e.touches[0]);
        if (!this._isChartPosOnXAxis(pos)) {
            return;
        }
        var touchX = pos.x - this.renderer.model.m_AreaBounds.X,
            offset = this.internal.lastTouchX - touchX,
            percentMoved = offset / this.renderer.model.m_AreaBounds.Width,
            timespan = this.renderer.model.primaryXAxis.range.max.getTime() - this.renderer.model.primaryXAxis.range.min.getTime(),
            moveTime = timespan * percentMoved,
            minMs = this.renderer.model.primaryXAxis.range.min.getTime() + moveTime,
            maxMs = this.renderer.model.primaryXAxis.range.max.getTime() + moveTime,
            range = {
                min: new Date(minMs),
                max: new Date(maxMs)
            },
            preLoadTime = timespan / this.internal.preLoadDivisor;
        if (this.internal.freezeTime >= range.max.getTime()) {
            if (minMs - this.internal.dataTimeSpanExtended.start.getTime() < preLoadTime) {
                var preLoadStart = new Date(this.internal.dataTimeSpanExtended.start.getTime() - preLoadTime); 
                this.internal.preLoadPromise = this.dataAdapter.setTimespan({
                    start: preLoadStart,
                    end: this.internal.dataTimeSpanExtended.start
                });
                this.internal.dataTimeSpanExtended.start = preLoadStart;
                this.internal.dataTimeSpanExtended.end = new Date(maxMs + preLoadTime);
                this._setGraphsPointRange(this.internal.dataTimeSpanExtended);
            } else if (this.internal.dataTimeSpanExtended.end.getTime() - maxMs < preLoadTime) {
                var preLoadEnd = new Date(this.internal.dataTimeSpanExtended.end.getTime() + preLoadTime); 
                this.internal.preLoadPromise = this.dataAdapter.setTimespan({
                    start: this.internal.dataTimeSpanExtended.end,
                    end: preLoadEnd
                });
                this.internal.dataTimeSpanExtended.end = preLoadEnd;
                this.internal.dataTimeSpanExtended.start = new Date(minMs - preLoadTime);
                this._setGraphsPointRange(this.internal.dataTimeSpanExtended);
            }
            this.renderer.redraw(range);
        }
        this.internal.lastTouchX = touchX;
    };

    /** @method _setGraphsPointRange
     *  Removes points which are not in range.
     */
    p._setGraphsPointRange = function (timeSpan) {
        for (var graphId in this.graph) {
            this.graph[graphId].setPointsRange(timeSpan);
        }
    };

    /**
        * @method _onTouchEnd
        * 
        */
    p._onTouchEnd = function (e) {
        this.elem.removeEventListener('touchmove', this._bind('_onTouchMove'));
        this.elem.removeEventListener('touchend', this._bind('_onTouchEnd'));
        if (this.internal.preLoadPromise) {
            var that = this;
            this.internal.preLoadPromise.done(function () {
                that.renderer.redraw(that.renderer.model.primaryXAxis.range);
            });
        }
    };

    p.dispose = function () {
        window.document.body.removeEventListener(BreaseEvent.THEME_CHANGED, this._bind('_themeChangedHandler'));
        this.elem.removeEventListener(BreaseEvent.WIDGET_STYLE_PROPERTIES_CHANGED, this._bind('_onStylePropertiesChanged'));
        window.removeEventListener('resize', this._bind('_resizeHandler'));
        if (this.dataAdapter) {
            this.dataAdapter.dispose();
            this.dataAdapter = null;
        }
        this.renderer.dispose();
        this.renderer = null;
        this.errorHandler.dispose();
        this.errorHandler = null;
        this.msgOverlay.dispose();
        this.msgOverlay = null;
        this.busyWrapper = null;
        this.elem.removeEventListener(BreaseEvent.WIDGET_READY, this._bind('_onWidgetReady'));
        SuperClass.prototype.dispose.apply(this, arguments);
    };

    p.onBeforeSuspend = function () {
        if (!brease.config.editMode) {
            this.renderer.stop();
            this.dataAdapter.onBeforeSuspend();
        }
        SuperClass.prototype.onBeforeSuspend.apply(this, arguments);
    };

    p.suspend = function () {
        SuperClass.prototype.suspend.apply(this, arguments);
    };

    p.wake = function () {
        this.dataAdapter.wake();
        if (this.internal.themeChangedWhileSuspended) {
            this._themeChangedHandler();
        }
        if (this.settings.initRuntimeAfterPreCache) {
            this._initRuntime();
        } else {
            if (!this.internal.isFrozen) {
                this.dataAdapter.start(this.bindings);
                if (this.renderer !== undefined) {
                    this.renderer.start();
                }
            }
        }
        SuperClass.prototype.wake.apply(this, arguments);
    };

    return dragAndDropCapability.decorate(MeasurementSystemDependency.decorate(CultureDependency.decorate(WidgetClass, true), true), false);
});
