define([
    'brease/datatype/StructuredProperty',
    'brease/brease',
    'brease/core/Types',
    'brease/config/NumberFormat',
    'brease/enum/Enum',
    'brease/core/Utils',
    'widgets/brease/OnlineChartHDA/libs/StyleElemsUtils'
], function (SuperClass, brease, Types, NumberFormat, Enum, Utils, StyleElemsUtils) {
    'use strict';

    /**
    * @class widgets.brease.OnlineChartHDA.YAxis
    * Defines appearance and behaviour of a YAxis
    * @extends brease.datatype.StructuredProperty
    * @embeddedClass
    * @virtualNote
    */

    /**
    * @cfg {brease.enum.HorizontalAlign} position = 'left'
    * @iatStudioExposed
    * @iatCategory Appearance
    * Defines weather the axis is positioned left or right in the chart.
    */

    /**
     * @cfg {brease.config.MeasurementSystemUnit} unit=''
     * @iatStudioExposed
     * @bindable
     * @iatCategory Appearance
     * Unit code for every measurement system.
     */

    /**
     * @cfg {brease.enum.RangeMode} rangeMode='autoscale'
     * @iatStudioExposed
     * @iatCategory Behavior
     * Defines how the range is drawn. If rangeMode fromConfiguration is used the range is static and will not be converted!
     */

    /**
    * @cfg {Number} min=0
    * @iatStudioExposed
    * @bindable
    * @iatCategory Behavior
    * Defines the minimum range if rangeMode is set to fromConfiguration. This value has no unit and will not be converted!
    */

    /**
    * @cfg {Number} max=100
    * @iatStudioExposed
    * @bindable
    * @iatCategory Behavior
    * Defines the maximum range if rangeMode is set to fromConfiguration. This value has no unit and will not be converted!
    */

    /**
     * @cfg {brease.config.MeasurementSystemFormat} format= {'metric':{ 'decimalPlaces' : 1, 'minimumIntegerDigits' : 1 }, 'imperial' :{ 'decimalPlaces' : 1, 'minimumIntegerDigits' : 1 }, 'imperial-us' :{ 'decimalPlaces' : 1, 'minimumIntegerDigits' : 1 }} 
     * @iatStudioExposed
     * @bindable
     * @iatCategory Appearance
     * NumberFormat for every measurement system.
     * Defines the number format of the labels.
     */

    /**
     * @cfg {Boolean} showUnit = true
     * @iatStudioExposed
     * @iatCategory Appearance
     * Defines whether the unit should be displayed.
     */

    /**
     * @cfg {String} title = ''
     * @iatStudioExposed
     * @localizable
     * @iatCategory Appearance
     * Title of axis.
     */

    /**
    * @cfg {Boolean} visible = true
    * @iatStudioExposed
    * @iatCategory Behavior
    * @bindable
    * Defines the visibility of the graph. (Visible = true, invisible = false)
    */
    /**
    * @cfg {StyleReference} style = 'default'
    * @iatStudioExposed
    * @iatCategory Appearance
    * @bindable
    * @typeRefId widgets.brease.OnlineChartHDA.YAxis
    * Reference to a style that can be created by the user.
    */

    var defaultSettings = {
        position: Enum.HorizontalAlign.left,
        title: '',
        showUnit: true,
        rangeMode: Enum.RangeMode.autoscale,
        min: 0,
        max: 100,
        visible: true,
        enable: true,
        unit: {},
        format: {
            'metric': { decimalPlaces: 1, minimumIntegerDigits: 1 },
            'imperial': { decimalPlaces: 1, minimumIntegerDigits: 1 },
            'imperial-us': { 'decimalPlaces': 1, 'minimumIntegerDigits': 1 }
        },
        style: 'default'
    };

    var YAxis = SuperClass.extend(function YAxis(id, stylePrefix, options, renderer, msgOverlay, widgetId, propName) {
            SuperClass.call(this, id, options, widgetId, propName);
            this.renderer = renderer;
            this.elem = document.createElement('DIV');
            this.elem.id = id;
            this.msgOverlay = msgOverlay;
            this.internal = {
                previousUnitCode: '',
                sourceRanges: {},
                lastRange: null
            };
            this.stylePrefix = stylePrefix !== undefined ? stylePrefix : '';
            this._onUnitChangeHandlers = [];
        }, defaultSettings),

        p = YAxis.prototype;

    p.init = function () {
        this.index = this.renderer.model.axes.length;
        this.renderer.model.axes.push({
            name: this.name,
            orientation: 'vertical',
            custom: {},
            font: {},
            title: { font: {}, titleRotation: 'rotateminus90' },
            majorTickLines: {},
            majorGridLines: {},
            axisLine: {}
        });
        var that = this;
        this.renderer.subscribeModelChange(function (action, propName, index, data) {
            if (propName === 'axes') {
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
        StyleElemsUtils.createYAxisStyleElems(this);
        this.setStyle(this.settings.style);
        this.setPosition(this.settings.position);
        this.setUnit(this.settings.unit);
        this.setTitle(this.settings.title);
        this.setVisible(this.settings.visible);
        this.setRangeMode(this.settings.rangeMode);
    };

    p.dispose = function () {
        this.elem.remove();
        this.elem = null;
        this.renderer.removeFromModel('axes', this.index);
        SuperClass.prototype.dispose.apply(this, arguments);
    };

    p.setIndex = function (index) {
        if (index !== this.index) {
            this.renderer.reorderModel('axes', this.index, index);
        }
    };

    p.setId = function (id) {
        this.elem.id = id;
        SuperClass.prototype.setId.apply(this, arguments);
    };

    p.setStyle = function (value) {
        var style = this.stylePrefix + '_YAxis_style_' + this.settings.style;
        if (this.elem.classList.contains(style)) {
            this.elem.classList.remove(style);
        }
        style = this.stylePrefix + '_YAxis_style_' + value;
        this.settings.style = value;
        this.elem.classList.add(style);
        this.updateStyleProperties();
        this.setEnable(this.settings.enable);
        this.renderer.requestRedraw();
    };

    p.updateStyleProperties = function () {
        StyleElemsUtils.updateYAxisStyleElems(this, this.elem);

        this.renderer.model.axes[this.index].font.size = this.settings.fontSize;
        this.renderer.model.axes[this.index].font.fontFamily = this.settings.fontName;
        this.renderer.model.axes[this.index].title.font.color = this.settings.titleTextColor;
        this.renderer.model.axes[this.index].title.font.size = this.settings.titleFontSize;
        this.renderer.model.axes[this.index].title.font.fontFamily = this.settings.titleFontName;
        this.renderer.model.axes[this.index].majorTickLines.color = this.settings.color;
        this.renderer.model.axes[this.index].majorGridLines.color = this.settings.gridColor;
        this.renderer.model.axes[this.index].axisLine.color = this.settings.color;
        this.setEnable(this.settings.enable);
    };

    p.getStyle = function () {
        return this.settings.style;
    };

    /**
    * @method setEnable
    * Sets the state of property «enable»
    * @param {Boolean} value
    */
    p.setEnable = function (value) {
        this.settings.enable = Types.parseValue(value, 'Boolean');
        if (this.settings.enable) {
            this.renderer.model.axes[this.index].font.color = this.settings.textColor;
        } else {
            this.renderer.model.axes[this.index].font.color = this.settings.disabledTextColor;
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

    p.setVisible = function (value) {
        this.settings.visible = Types.parseValue(value, 'Boolean');
        this.renderer.model.axes[this.index].visible = this.settings.visible;
        this.renderer.model.axes[this.index].majorGridLines.visible = this.settings.visible;
        this.renderer.requestRedraw();
    };

    p.getVisible = function () {
        return this.settings.visible;
    };

    p.setPosition = function (value) {
        this.settings.position = value;
        this.renderer.model.axes[this.index].opposedPosition = this.settings.position !== Enum.HorizontalAlign.left;
    };

    p.getPosition = function () {
        return this.settings.position;
    };

    p.setRangeMode = function (value) {
        if (brease.config.editMode) {
            this.settings.rangeMode = Enum.RangeMode.autoscale;
            return;
        }
        this.settings.rangeMode = value;
        if (this.settings.rangeMode !== Enum.RangeMode.autoscale) {
            if (!Utils.isObject(this.renderer.model.axes[this.index].range)) {
                this.renderer.model.axes[this.index].range = {};
            }
            // if range mode is fromSource binding will update min/max later via graph.setNode
            this.setMin(this.settings.min);
            this.setMax(this.settings.max);
        }
    };

    p.getRangeMode = function () {
        return this.settings.rangeMode;
    };

    p.setMin = function (value, source) {
        if (source) {
            if (this.settings.rangeMode === Enum.RangeMode.fromSource) {
                if (value === null) {
                    return;
                }
                if (!Utils.isObject(this.internal.sourceRanges[source])) {
                    this.internal.sourceRanges[source] = {};
                }
                this.internal.sourceRanges[source].min = value;
                this.renderer.model.axes[this.index].range.min = value;
                for (var sourceId in this.internal.sourceRanges) {
                    var min = this.internal.sourceRanges[sourceId].min;
                    if (min < this.renderer.model.axes[this.index].range.min) {
                        this.renderer.model.axes[this.index].range.min = min;
                    }
                }
                this._handleMinGreaterOrEqualMax();
            }
        } else if (this.settings.rangeMode === Enum.RangeMode.fromConfiguration) {
            var isInit = this.renderer.model.axes[this.index].range.min === undefined;
            this.settings.min = value;
            this.renderer.model.axes[this.index].range.min = this.settings.min;
            this._handleMinGreaterOrEqualMax();
            if (!isInit) {
                this.renderer.requestRedraw();
            }
        }
    };

    p._handleMinGreaterOrEqualMax = function () {
        if (this.internal.lastRange !== null) {
            // again to wrong value
            if (this._gtEq(this.internal.lastRange.min, this.renderer.model.axes[this.index].range.max) ||
                this._gtEq(this.renderer.model.axes[this.index].range.min, this.internal.lastRange.max)) {
                this.renderer.model.axes[this.index].range.min = null;
                this.renderer.model.axes[this.index].range.max = null;
            // max was set => restore min and clear msg
            } else if (this.renderer.model.axes[this.index].range.min === null) {
                this.renderer.model.axes[this.index].range.min = this.internal.lastRange.min;
                this.internal.lastRange = null;
                this.msgOverlay.clear();
            // min was set => restore max and clear msg
            } else if (this.renderer.model.axes[this.index].range.max === null) {
                this.renderer.model.axes[this.index].range.max = this.internal.lastRange.max;
                this.internal.lastRange = null;
                this.msgOverlay.clear();
            }
        } else if (this._gtEq(this.renderer.model.axes[this.index].range.min,
            this.renderer.model.axes[this.index].range.max)) {
            this.internal.lastRange = Utils.deepCopy(this.renderer.model.axes[this.index].range);
            this.renderer.model.axes[this.index].range.min = null;
            this.renderer.model.axes[this.index].range.max = null;
            this.msgOverlay.create('Range min of axis "' + this.name + '" greater or equal than max (' + this.internal.lastRange.max + ')');
        }
    };

    p._gtEq = function (o1, o2) {
        return ((typeof o1 === typeof o2) && (o1 >= o2));
    };

    p.getMin = function () {
        return this.settings.min;
    };

    p.setMax = function (value, source) {
        if (source) {
            if (this.settings.rangeMode === Enum.RangeMode.fromSource) {
                if (value === null) {
                    return;
                }
                if (!Utils.isObject(this.internal.sourceRanges[source])) {
                    this.internal.sourceRanges[source] = {};
                }
                this.internal.sourceRanges[source].max = value;
                this.renderer.model.axes[this.index].range.max = value;
                for (var sourceId in this.internal.sourceRanges) {
                    var max = this.internal.sourceRanges[sourceId].max;
                    if (max > this.renderer.model.axes[this.index].range.max) {
                        this.renderer.model.axes[this.index].range.max = max;
                    }
                }
                this._handleMinGreaterOrEqualMax();
            }
        } else if (this.settings.rangeMode === Enum.RangeMode.fromConfiguration) {
            var isInit = this.renderer.model.axes[this.index].range.max === undefined;
            this.settings.max = value;
            this.renderer.model.axes[this.index].range.max = this.settings.max;
            this._handleMinGreaterOrEqualMax();
            if (!isInit) {
                this.renderer.requestRedraw();
            }
        }
    };

    p.getMax = function () {
        return this.settings.max;
    };

    p.setTitle = function (title) {
        this.settings.title = title;
        var labelUnit = '';
        if (this.settings.showUnit && this.hasUnit()) {
            if (brease.config.editMode) {
                labelUnit = 'unit';
            } else {
                labelUnit = this.internal.unitSymbol;
            }
        }
        this.renderer.model.axes[this.index].title.text = this.settings.title;
        if (brease.language.isKey(this.settings.title)) {
            var textKey = brease.language.parseKey(this.settings.title),
                text = brease.language.getTextByKey(textKey);
            if (text !== 'undefined key') {
                this.renderer.model.axes[this.index].title.text = text;
            } else {
                console.iatWarn(this.getId() + ': Format textKey not found: ' + this.settings.title);
            }
        }
        if (labelUnit !== '') {
            this.renderer.model.axes[this.index].title.text += ' [' + labelUnit + ']';
        }
    };

    p.getTitle = function () {
        return this.settings.title;
    };

    p.setUnit = function (unit) {
        if (typeof unit === 'string') {
            this.settings.unit = JSON.parse(unit.replace(/'/g, '"'));
        } else {
            this.settings.unit = unit;
        }
        this._updateUnit();
    };

    p.getUnit = function () {
        return this.settings.unit;
    };

    p.getCurrentUnit = function () {
        return this.settings.unit[this.internal.mms];
    };

    p.setFormat = function (format) {
        this.settings.format = format;
        this._updateFormat();
        this.renderer.requestRedraw();
    };

    p.getFormat = function () {
        return this.settings.format;
    };

    p.setShowUnit = function (showUnit) {
        this.settings.showUnit = showUnit;
    };

    p.getShowUnit = function () {
        return this.settings.showUnit;
    };

    p.hasUnit = function () {
        return !_.isEmpty(this.settings.unit);
    };

    p.measurementSystemChangeHandler = function () {
        this._updateUnit();
        this._updateFormat();
    };

    p.cultureChangeHandler = function () {
        this.setTitle(this.settings.title);
        this._updateFormat();
    };

    p._updateUnit = function () {
        this.internal.mms = brease.measurementSystem.getCurrentMeasurementSystem();
        if (!this.hasUnit()) {
            return;
        }
        // var subscriptions = brease.uiController.getSubscriptionsForElement(widget.elem.id),
        var actualUnit = this.getCurrentUnit();

        if (this.internal.previousUnitCode !== actualUnit) {
            var that = this;
            brease.language.pipeAsyncUnitSymbol(actualUnit, function (symbol) {
                that.internal.unitSymbol = symbol;
                that.setTitle(that.settings.title);
            });
            this._onUnitChangeHandlers.forEach(function (handler) {
                handler(actualUnit);
            });
        }
        this.internal.previousUnitCode = actualUnit;
    };

    /**
     * @method onUnitChange
     * Set handler for node change (nodeId)
    */
    p.onUnitChange = function (cb) {
        this._onUnitChangeHandlers.push(cb);
    };

    /**
     * @method toString
     * Creates readable string of structured property. (i.e yAxis[id1])
    */
    p.toString = function () {
        return 'yAxis' + '[' + this.name + ']';
    };
    /**
     * @method attributeToString
     * Creates readable string of attribute. (i.e yAxis[id1].node)
    */
    p.attributeToString = function (name) {
        return this.toString() + '.' + name;
    };

    p._updateFormat = function () {
        if (this.settings.format !== undefined) {
            var formatObject;
            if (Utils.isObject(this.settings.format)) {
                this.renderer.model.axes[this.index].custom.numberFormat =
                    NumberFormat.getFormat(this.settings.format, this.internal.mms);
            } else if (typeof (this.settings.format) === 'string') {
                if (brease.language.isKey(this.settings.format)) {
                    try {
                        //this.setLangDependency(true);
                        var textKey = brease.language.parseKey(this.settings.format);
                        formatObject = JSON.parse(brease.language.getTextByKey(textKey).replace(/'/g, '"'));
                        this.renderer.model.axes[this.index].custom.numberFormat =
                            NumberFormat.getFormat(formatObject, this.internal.mms);
                    } catch (error) {
                        console.iatWarn(this.getId() + ': Format String "' + this.settings.format + '" is invalid!');
                        this.renderer.model.axes[this.index].custom.numberFormat =
                            NumberFormat.getFormat({}, this.internal.mms);
                    }
                } else {
                    try {
                        formatObject = JSON.parse(this.settings.format.replace(/'/g, '"'));
                        this.renderer.model.axes[this.index].custom.numberFormat =
                            NumberFormat.getFormat(formatObject, this.internal.mms);
                    } catch (error) {
                        console.iatWarn(this.getId() + ': Format String "' + this.settings.format + '" is invalid!');
                        this.renderer.model.axes[this.index].custom.numberFormat =
                            NumberFormat.getFormat({}, this.internal.mms);
                    }
                }
            }
        } else {
            this.renderer.model.axes[this.index].custom.numberFormat = NumberFormat.getFormat({}, this.internal.mms);
        }
        this.renderer.model.axes[this.index].custom.separators = brease.user.getSeparators();
    };

    return YAxis;
});
