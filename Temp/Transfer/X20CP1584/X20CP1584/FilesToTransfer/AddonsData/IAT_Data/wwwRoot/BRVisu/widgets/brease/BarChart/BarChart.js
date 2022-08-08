define([
    'widgets/brease/DataHandlerWidget/DataHandlerWidget',
    'brease/events/BreaseEvent',
    'brease/enum/Enum',
    'brease/core/Utils',
    'brease/decorators/MeasurementSystemDependency',
    'brease/config/NumberFormat',
    'widgets/brease/BarChart/libs/Renderer',
    'widgets/brease/common/libs/wfUtils/UtilsObject',
    'brease/decorators/DragAndDropCapability',
    'widgets/brease/common/DragDropProperties/libs/DroppablePropertiesEvents'
], function (SuperClass, BreaseEvent, Enum, Utils, measurementSystemDependency, NumberFormat, Renderer, UtilsObject, dragAndDropCapability) {

    'use strict';

    /**
     * @class widgets.brease.BarChart
     * @extends widgets.brease.DataHandlerWidget
     * @iatMeta studio:license
     * licensed
     * @iatMeta studio:isContainer
     * true
     *
     * @mixins widgets.brease.common.DragDropProperties.libs.DroppablePropertiesEvents
     *
     * @iatMeta category:Category
     * Chart,Container
     *
     * @iatMeta description:short
     * Container für BarChartItems
     * @iatMeta description:de
     * Ein BarChart ist ein Chart welcher Daten mithilfe von Rechtecken, in Abhängigkeit ihres Wertes repräsentiert 
     * @iatMeta description:en
     * A BarChart is a chart which represents data with rectangular bars,
     * which lengths are propertional to the values they represent
     */

    /**
     * @cfg {Integer} barPadding=5
     * @iatStudioExposed
     * @iatCategory Appearance
     * space between 2 Bars 
     */

    /**
     * @cfg {Integer} xAxisHeight=40
     * @iatStudioExposed
     * @iatCategory Appearance
     * Height of the xAxis 
     */

    /**
     * @cfg {Integer} yAxisWidth=40
     * @iatStudioExposed
     * @iatCategory Appearance
     * Width of the yAxis
     */

    /**
     * @cfg {PixelValCollection} chartMargin='30px 30px 0px 0px'
     * @iatStudioExposed
     * @iatCategory Appearance
     * Defines margins between the chart area and the external border of the widget
     */

    /**
     * @cfg {Boolean} showValue=true
     * @iatStudioExposed
     * @iatCategory Behavior
     * When true BarChart is displaying the actual Value of each Bar  
     */

    /**
     * @cfg {brease.enum.Orientation} orientation=BottomToTop
     * @iatStudioExposed
     * @iatCategory Appearance
     * Orientation of the Widget
     * Currently supported orientations are only BottomToTop and LeftToRight. TopToBottom and RightToLeft are reserved for later usage
     */

    /**
     * @cfg {brease.config.MeasurementSystemUnit} unit=''
     * @iatStudioExposed
     * @bindable
     * @iatCategory Appearance
     * unit code for every measurement system
     */

    /**
     * @cfg {Boolean} showUnit=false
     * @iatStudioExposed
     * @iatCategory Behavior
     * When true the UnitSymbol for the selected unit is shown on the Y-Axis  
     */

    /**
     * @cfg {UInteger} transitionTime=0
     * @iatStudioExposed
     * @iatCategory Behavior
     * Defines the time (in ms) used for a transition when the value of a Bar changes.  
     */

    /**
     * @cfg {brease.config.MeasurementSystemFormat} format={'metric':{ 'decimalPlaces' : 0, 'minimumIntegerDigits' : 1 }, 'imperial' :{ 'decimalPlaces' : 0, 'minimumIntegerDigits' : 1 }, 'imperial-us' :{ 'decimalPlaces' : 0, 'minimumIntegerDigits' : 1 }}  
     * @iatStudioExposed
     * @iatCategory Appearance
     * @bindable
     * NumberFormat for every measurement system.
     */

    /**
     * @cfg {brease.enum.ChildPositioning} childPositioning='relative'
     * @iatStudioExposed
     * @iatCategory Behavior
     * Defines if the Children should be positioned relative or absolute 
     */

    /**
     * @cfg {PixelVal} barWidth='30px'
     * @iatStudioExposed
     * @iatCategory Appearance
     * Defines the BarWidth if childPositioning = 'absolute' 
     */

    /**
     * @cfg {Rotation} tickLabelXRotation='0deg'
     * @iatStudioExposed
     * @iatCategory Appearance
     * Defines the rotation of the Texts on XAxis.  
     */

    /**
     * @cfg {Rotation} tickLabelYRotation='0deg'
     * @iatStudioExposed
     * @iatCategory Appearance
     * Defines the rotation of the Texts on YAxis.  
     */

    /**
     * @property {WidgetList} children=["widgets.brease.BarChartItem", "widgets.brease.BarChartThreshold"]
     * @inheritdoc  
     */

    var defaultSettings = {
            barPadding: 5,
            showValue: true,
            orientation: Enum.Orientation.BTT,
            showUnit: false,
            maxValue: 100,
            minValue: 0,
            minValues: {},
            maxValues: {},
            transitionTime: 0,
            format: { default: { decimalPlaces: 0, minimumIntegerDigits: 1 } },
            yAxisWidth: 40,
            xAxisHeight: 40,
            chartMargin: '30px 30px 0px 0px',
            initRenderer: true,
            childPositioning: Enum.ChildPositioning.relative,
            barWidth: '30px',
            tickLabelXRotation: '0deg',
            tickLabelYRotation: '0deg'
        },

        WidgetClass = SuperClass.extend(function BarChart() {
            SuperClass.apply(this, arguments);
        }, defaultSettings),

        p = WidgetClass.prototype;

    p.init = function () {

        if (this.settings.omitClass !== true) {
            this.el.addClass('breaseBarChart');
            this.el.addClass('container');
        }

        var rendererSettings = {
            id: this.elem.id,
            maxValue: this.getMaxValue(),
            minValue: this.getMinValue(),
            barPadding: this.getBarPadding(),
            showValue: this.getShowValue(),
            orientation: this.getOrientation(),
            unitSymbol: this._unitHandlingEditor(),
            height: this.el.height(),
            width: this.el.width(),
            barIdList: [],
            lineIdList: [],
            transitionTime: this.getTransitionTime(),
            numberFormat: {},
            yAxisWidth: this.getYAxisWidth(),
            xAxisHeight: this.getXAxisHeight(),
            chartMargin: this.getChartMargin(),
            el: this.el,
            childPositioning: this.settings.childPositioning,
            barWidth: parseInt(this.settings.barWidth, 10),
            tickLabelXRotation: parseInt(this.settings.tickLabelXRotation, 10),
            tickLabelYRotation: parseInt(this.settings.tickLabelYRotation, 10)
        };

        var widget = this;
        this.el.on(BreaseEvent.WIDGET_READY, widget._bind('onWidgetReady'));
        this.createRenderer(rendererSettings);

        SuperClass.prototype.init.call(this);
        this.measurementSystemChangeHandler();
    };

    p.onWidgetReady = function (e) {
        if (e.target === this.elem) {
            this.setSizeOnParentReady();
        }
        if (brease.config.editMode) {
            // A&P 659110 BarChartItems used in combination with BarChartThreshold are sometimes not drawn inside the editor 
            // since it's only for editor we check here for editMode
            this.checkChildrenAdded();
        }
    };

    p.setSizeOnParentReady = function () {
        var widget = this,
            parentDeferred = $.Deferred(),
            parentWidget = widget.el.parents('[data-brease-widget]').first(),
            parentWidgetId,
            parentWidgetState;

        if (parentWidget.length !== 0) {
            parentWidgetId = parentWidget[0].id;
            if (parentWidgetId !== undefined) {
                parentWidgetState = brease.uiController.getWidgetState(parentWidgetId);
                if (parentWidgetState > Enum.WidgetState.INITIALIZED && parentWidgetState !== Enum.WidgetState.SUSPENDED) {
                    parentDeferred.resolve();
                } else {
                    parentWidget[0].addEventListener(BreaseEvent.WIDGET_READY, function (e) {
                        if (e.target.id === parentWidgetId) {
                            parentDeferred.resolve();
                        }
                    });
                }
            }
        } else {
            parentDeferred.resolve();
        }

        $.when(parentDeferred).done(function () {
            _setSize.apply(widget, arguments);
        });
    };

    p.checkChildrenAdded = function () {
        var widget = this;
        if (widget.settings.childrenIdList.length !== 0) {
            for (var i = 0; i < widget.settings.childrenIdList.length; i++) {
                var sender = {
                    target: widget.elem,
                    detail: {
                        widgetId: widget.settings.childrenIdList[i]
                    }
                };
                widget.childrenAdded(sender);
            }
        }
    };

    p._visibleHandler = function () {
        _setSize.apply(this, arguments);
    };

    p.setStyle = function (value) {
        SuperClass.prototype.setStyle.call(this, value);
        _setSize.apply(this, arguments);
    };

    p._unitHandlingEditor = function () {
        if (this.getShowUnit()) {
            if (brease.config.editMode) {
                return 'unit';
            } else {
                return this.settings.unitSymbol;
            }
        } else {
            return '';
        }
    };

    p.createRenderer = function (rendererSettings) {
        this.renderer = new Renderer(rendererSettings);
    };

    p.addClassNames = function (classNames) {
        var widget = this;
        classNames.forEach(function (id) {
            widget.el.addClass(id);
        });
        this.initialized = true;
    };

    //workaround to be able to resize the Widget in the propertyGrid
    p._setWidth = function (w) {
        SuperClass.prototype._setWidth.call(this, w);
        this.el.css('width', w);
        if (this.renderer !== undefined) {
            this.renderer.setSize(undefined, this.el.width());
        }
    };
    //workaround to be able to resize the Widget in the propertyGrid
    p._setHeight = function (h) {
        SuperClass.prototype._setHeight.call(this, h);
        this.el.css('height', h);
        if (this.renderer !== undefined) {
            this.renderer.setSize(this.el.height(), undefined);
        }
    };

    /**
     * @method setBarPadding
     * Sets barPadding
     * @param {Integer} barPadding
     */
    p.setBarPadding = function (barPadding) {
        this.settings.barPadding = barPadding;
        if (this.renderer !== undefined) {
            this.renderer.setBarPadding(barPadding);
        }
    };

    /**
     * @method getBarPadding 
     * Returns barPadding.
     * @return {Integer}
     */
    p.getBarPadding = function () {
        return this.settings.barPadding;
    };

    /**
     * @method setXAxisHeight
     * Sets xAxisHeight
     * @param {Integer} xAxisHeight
     */
    p.setXAxisHeight = function (xAxisHeight) {
        this.settings.xAxisHeight = xAxisHeight;
        if (this.renderer !== undefined) {
            this.renderer.setXAxisHeight(xAxisHeight);
        }
    };

    /**
     * @method getXAxisHeight 
     * Returns xAxisHeight.
     * @return {Integer}
     */
    p.getXAxisHeight = function () {
        return this.settings.xAxisHeight;
    };

    /**
     * @method setYAxisWidth
     * Sets yAxisWidth
     * @param {Integer} yAxisWidth
     */
    p.setYAxisWidth = function (yAxisWidth) {
        this.settings.yAxisWidth = yAxisWidth;
        if (this.renderer !== undefined) {
            this.renderer.setYAxisWidth(yAxisWidth);
        }
    };

    /**
     * @method getYAxisWidth 
     * Returns yAxisWidth.
     * @return {Integer}
     */
    p.getYAxisWidth = function () {
        return this.settings.yAxisWidth;
    };

    /**
     * @method setChartMargin
     * Sets chartMargin
     * @param {PixelValCollection} chartMargin
     */
    p.setChartMargin = function (chartMargin) {
        this.settings.chartMargin = (chartMargin.match(/[\d]*\.*[\d]+px/g)) ? chartMargin : '30px 30px 0px 0px';
        if (this.renderer !== undefined) {
            this.renderer.setChartMargin(this.settings.chartMargin);
        }
    };

    /**
     * @method getChartMargin 
     * Returns chartMargin.
     * @return {PixelValCollection}
     */
    p.getChartMargin = function () {
        return this.settings.chartMargin;
    };

    /**
     * @method setShowValue
     * Sets showValue
     * @param {Boolean} showValue
     */
    p.setShowValue = function (showValue) {
        this.settings.showValue = showValue;
        if (this.renderer !== undefined) {
            this.renderer.setShowValue(this.getShowValue());
        }
    };

    /**
     * @method getShowValue 
     * Returns showValue.
     * @return {Boolean}
     */
    p.getShowValue = function () {
        return this.settings.showValue;
    };

    /**
     * @method setOrientation
     * Sets orientation
     * @param {brease.enum.Orientation} orientation
     */
    p.setOrientation = function (orientation) {
        this.settings.orientation = orientation;
        if (this.renderer !== undefined) {
            this.renderer.setOrientation(this.getOrientation());
        }
    };

    /**
     * @method getOrientation 
     * Returns orientation.
     * @return {brease.enum.Orientation}
     */
    p.getOrientation = function () {
        return this.settings.orientation;
    };

    /**
     * @method setUnit
     * @iatStudioExposed
     * Sets unit
     * @param {brease.config.MeasurementSystemUnit} unit
     */
    p.setUnit = function (unit) {
        this.settings.unit = unit;
        this.measurementSystemChangeHandler();
        this.setChildUnit();
    };

    /**
     * @method getUnit 
     * Returns unit.
     * @return {brease.config.MeasurementSystemUnit}
     */
    p.getUnit = function () {
        return this.settings.unit;
    };

    /**
     * @method setShowUnit
     * Sets showUnit
     * @param {Boolean} showUnit
     */
    p.setShowUnit = function (showUnit) {
        this.settings.showUnit = showUnit;
        var unitText = this.getShowUnit() ? this.settings.unitSymbol : '';
        if (this.renderer !== undefined) {
            if (brease.config.editMode) {
                if (this.getShowUnit()) {
                    this.renderer.setUnitSymbol('unit');
                } else {
                    this.renderer.setUnitSymbol('');
                }
            } else {
                this.renderer.setUnitSymbol(unitText);
            }

        }
    };

    /**
     * @method getShowUnit 
     * Returns showUnit.
     * @return {Boolean}
     */
    p.getShowUnit = function () {
        return this.settings.showUnit;
    };

    /**
     * @method setTransitionTime
     * Sets transitionTime
     * @param {UInteger} transitionTime
     */
    p.setTransitionTime = function (transitionTime) {
        this.settings.transitionTime = transitionTime;
        this.renderer.setTransitionTime(transitionTime);
    };

    /**
     * @method getTransitionTime 
     * Returns transitionTime.
     * @return {UInteger}
     */
    p.getTransitionTime = function () {
        return this.settings.transitionTime;
    };

    /**
     * @method setFormat
     * Sets format
     * @param {brease.config.MeasurementSystemFormat} format
     */
    p.setFormat = function (format) {
        this.settings.format = format;
        _updateFormat(this);
    };

    /**
     * @method getFormat 
     * Returns format.
     * @return {brease.config.MeasurementSystemFormat}
     */
    p.getFormat = function () {
        return this.settings.format;
    };

    /**
     * @method setChildPositioning
     * Sets childPositioning
     * @param {brease.enum.ChildPositioning} childPositioning
     */
    p.setChildPositioning = function (childPositioning) {
        this.settings.childPositioning = childPositioning;
        this.renderer.setChildPositioning(childPositioning);
    };

    /**
     * @method getChildPositioning 
     * Returns childPositioning.
     * @return {brease.enum.ChildPositioning}
     */
    p.getChildPositioning = function () {
        return this.settings.childPositioning;
    };

    /**
     * @method setBarWidth
     * Sets barWidth
     * @param {PixelVal} barWidth
     */
    p.setBarWidth = function (barWidth) {
        this.settings.barWidth = barWidth;
        this.renderer.setBarWidth(parseInt(barWidth, 10));
    };

    /**
     * @method getBarWidth 
     * Returns barWidth.
     * @return {PixelVal}
     */
    p.getBarWidth = function () {
        return this.settings.barWidth;
    };

    /**
     * @method setTickLabelXRotation
     * Sets tickLabelXRotation
     * @param {Rotation} tickLabelXRotation
     */
    p.setTickLabelXRotation = function (tickLabelXRotation) {
        this.settings.tickLabelXRotation = tickLabelXRotation;
        this.renderer.setTickLabelXRotation(parseInt(tickLabelXRotation, 10));
    };

    /**
     * @method getTickLabelXRotation 
     * Returns tickLabelXRotation.
     * @return {Rotation}
     */
    p.getTickLabelXRotation = function () {
        return this.settings.tickLabelXRotation;
    };

    /**
     * @method setTickLabelYRotation
     * Sets tickLabelYRotation
     * @param {Rotation} tickLabelYRotation
     */
    p.setTickLabelYRotation = function (tickLabelYRotation) {
        this.settings.tickLabelYRotation = tickLabelYRotation;
        this.renderer.setTickLabelYRotation(parseInt(tickLabelYRotation, 10));
    };

    /**
     * @method getTickLabelYRotation 
     * Returns tickLabelYRotation.
     * @return {Rotation}
     */
    p.getTickLabelYRotation = function () {
        return this.settings.tickLabelYRotation;
    };

    p.setChildUnit = function () {
        var widget = this;
        this.settings.childrenList.forEach(function (currentWidget) {
            currentWidget.setUnit(widget.getUnit());
        });
    };

    p.updateData = function (objectReceive) {
        switch (objectReceive.type) {
            case 'BarChartItem':
                _updateBars(this, objectReceive);
                break;

            case 'BarChartThreshold':
                _updateLines(this, objectReceive);
                break;

        }

    };

    /**
     * @method
     * @param {Object} dataReceived
     * @param {String} dataReceived.id
     * @param {Integer} dataReceived.maxValue
     * @param {Integer} dataReceived.minValue
     * @param {String} dataReceived.text
     * @param {String} dataReceived.type
     * @param {Integer} dataReceived.value
     * @param {Boolean} dataReceived.visibility
     */
    p.setMinValue = function (dataReceived) {
        var oldValue = this.getMinValue();
        if (dataReceived.visibility || this.settings.childPositioning === Enum.ChildPositioning.absolute) {
            this.settings.minValues[dataReceived.id] = dataReceived.minValue;
        } else {
            delete this.settings.minValues[dataReceived.id];
        }
        this.settings.minValue = _calcMinValue(this.settings.minValues, oldValue);
    };

    p.getMinValue = function () {
        return this.settings.minValue;
    };

    /**
     * @method
     * @param {Object} dataReceived
     * @param {String} dataReceived.id
     * @param {Integer} dataReceived.maxValue
     * @param {Integer} dataReceived.minValue
     * @param {String} dataReceived.text
     * @param {String} dataReceived.type
     * @param {Integer} dataReceived.value
     * @param {Boolean} dataReceived.visibility
     */
    p.setMaxValue = function (dataReceived) {
        var oldValue = this.getMaxValue();
        if (dataReceived.visibility || this.settings.childPositioning === Enum.ChildPositioning.absolute) {
            this.settings.maxValues[dataReceived.id] = dataReceived.maxValue;
        } else {
            delete this.settings.maxValues[dataReceived.id];
        }
        this.settings.maxValue = _calcMaxValue(this.settings.maxValues, oldValue);
    };

    p.getMaxValue = function () {
        return this.settings.maxValue;
    };

    p.measurementSystemChangeHandler = function () {
        var widget = this;
        this.unitChange = $.Deferred();

        this.settings.mms = brease.measurementSystem.getCurrentMeasurementSystem();
        _updateFormat(this);

        $.when(
            this.unitChange.promise()
        ).then(function successHandler() {
            if (widget.renderer !== undefined) {
                if (Utils.isFunction(widget.renderer.setUnitSymbol)) {
                    var unitText = widget.getShowUnit() ? widget.settings.unitSymbol : '';
                    if (brease.config.editMode) { return; }
                    widget.renderer.setUnitSymbol(unitText);
                }
            }
        });

        var previousUnit = this.settings.currentUnit;
        if (this.settings.unit !== undefined) {
            this.settings.currentUnit = this.settings.unit[this.settings.mms];
        }
        if (this.settings.currentUnit !== previousUnit) {
            brease.language.pipeAsyncUnitSymbol(this.settings.currentUnit, this._bind(_setUnitSymbol));
        } else {
            this.unitChange.resolve();
        }
    };

    p.childrenInitializedHandler = function () {
        SuperClass.prototype.childrenInitializedHandler.call(this);

        if (this.renderer !== undefined) {
            this.renderer.setIdList(this.settings.childrenIdList.slice(0), this.settings.childrenList.slice(0));
            this.renderer._sortEntries();
            this.renderer.reposition();
        }

        this.setChildUnit();
    };

    p.childrenAdded = function (event) {
        if (!this.isChildrenAdded(event.detail.widgetId)) {
            SuperClass.prototype.childrenAdded.call(this, event);
            if (event.target === this.elem) {

                this.renderer.setIdList(this.settings.childrenIdList.slice(0), this.settings.childrenList.slice(0));
                brease.callWidget(event.detail.widgetId, 'setParentWidget', this);
                this.renderer.redraw();
            }
        }
    };

    p.isChildrenAdded = function (name) {
        for (var i = 0; i < this.renderer.data.bars.length; i++) {
            if (this.renderer.data.bars[i].id === name) {
                return true;
            }
        }
        for (var j = 0; j < this.renderer.data.lines.length; j++) {
            if (this.renderer.data.lines[j].id === name) {
                return true;
            }
        }
        return false;
    };

    p.childrenRemoved = function (event) {
        SuperClass.prototype.childrenRemoved.call(this, event);
        if (event.target === this.elem) {
            this.renderer.removeBar(event.detail.widgetId);
            this.renderer.removeLine(event.detail.widgetId);
            this.renderer.setIdList(this.settings.childrenIdList.slice(0), this.settings.childrenList.slice(0));
            this.renderer.redraw();
        }
    };

    //PRIVATE FUNCTIONS 

    /*
     * This method calculates the global minima of all barchartitems that are present
     * and visible.
     * @param {Object} minObj an object containing all visible items' minimum value
     * @param {Integer} oldValue the value of the previous minimum value
     */
    function _calcMinValue(minObj, oldValue) {
        var minValueVolatile = Number.MAX_SAFE_INTEGER;
        for (var key in minObj) {
            if (minObj[key] < minValueVolatile) {
                minValueVolatile = minObj[key];
            }
        }
        return (minValueVolatile < Number.MAX_SAFE_INTEGER) ? minValueVolatile : oldValue;
    }

    /*
     * This method calculates the global maxima of all barchartitems that are present
     * and visible.
     * @param {Object} maxObj an object containing all visible items' maximum value
     * @param {Integer} oldValue the value of the previous maximum value
     */
    function _calcMaxValue(maxObj, oldValue) {
        var maxValueVolatile = Number.MIN_SAFE_INTEGER;
        for (var key in maxObj) {
            if (maxObj[key] > maxValueVolatile) {
                maxValueVolatile = maxObj[key];
            }
        }
        return (maxValueVolatile > Number.MIN_SAFE_INTEGER) ? maxValueVolatile : oldValue;
    }

    function _setUnitSymbol(symbol) {
        this.settings.unitSymbol = symbol;
        this.unitChange.resolve();
    }

    // override method called in BaseWidget.init
    // additional behaviour in DataHandler _initEditor
    p._initEditor = function () {
        var widget = this;
        widget.el.addClass('iat-container-widget');

        require(['widgets/brease/BarChart/libs/EditorHandles'], function (EditorHandles) {
            var editorHandles = new EditorHandles(widget);
            widget.getHandles = function () {
                return editorHandles.getHandles();
            };
            widget.designer.getSelectionDecoratables = function () {
                return editorHandles.getSelectionDecoratables();
            };
            if (widget.renderer !== undefined) {
                widget.renderer.setTransitionTime(0);
            }
        });

    };

    function _setSize() {
        if (this.renderer !== undefined && this.isVisible()) {
            this.renderer.setSize(this.el.height(), this.el.width());
        }
    }

    function _failMessage(str, type) {
        return this.elem.id + ': ' + type + ' string "' + str + '" is invalid!';
    }

    function _updateFormat(widget) {
        if (brease.language.isKey(widget.settings.format)) {
            widget.setLangDependency(true);
        }
        var formatObject = UtilsObject.createFormatObject(widget.defaultSettings.format, widget.settings.format, _failMessage.call(widget, widget.settings.format, 'format')),
            numberFormat = NumberFormat.getFormat(formatObject, widget.settings.mms);

        if (widget.renderer !== undefined) {
            widget.renderer.setNumberFormat(numberFormat);
        }
    }

    function _updateLines(widget, objectReceive) {
        if (widget.renderer !== undefined) {
            if (Utils.isFunction(widget.renderer.setLine) && Utils.isFunction(widget.renderer.removeLine)) {
                if (objectReceive.visibility) {
                    widget.renderer.setLine({ value: objectReceive.value, id: objectReceive.id, window: objectReceive.window });
                } else {
                    widget.renderer.removeLine(objectReceive.id);
                }
            }
        }
    }

    /*
     * @param {Object} widget
     * @param {Object} objectReceive
     * @param {String} objectReceive.id
     * @param {Integer} objectReceive.maxValue
     * @param {Integer} objectReceive.minValue
     * @param {String} objectReceive.text
     * @param {String} objectReceive.type
     * @param {Integer} objectReceive.value
     * @param {Boolean} objectReceive.visibility
     */
    function _updateBars(widget, objectReceive) {
        var oldMinValue = widget.getMinValue(),
            oldMaxValue = widget.getMaxValue();

        widget.setMinValue(objectReceive);
        widget.setMaxValue(objectReceive);

        if (widget.renderer !== undefined) {
            if (Utils.isFunction(widget.renderer.setMinValue) && oldMinValue !== widget.getMinValue()) {
                widget.renderer.setMinValue(widget.getMinValue());
            }

            if (Utils.isFunction(widget.renderer.setMaxValue) && oldMaxValue !== widget.getMaxValue()) {
                widget.renderer.setMaxValue(widget.getMaxValue());
            }

            if (Utils.isFunction(widget.renderer.setBar) && Utils.isFunction(widget.renderer.removeBar)) {
                if (objectReceive.visibility || widget.settings.childPositioning === Enum.ChildPositioning.absolute) {
                    widget.renderer.setBar({ text: objectReceive.text, value: objectReceive.value, id: objectReceive.id });
                } else {
                    widget.renderer.removeBar(objectReceive.id);
                }
            }
        }
    }

    return dragAndDropCapability.decorate(measurementSystemDependency.decorate(WidgetClass, true), false);
});
