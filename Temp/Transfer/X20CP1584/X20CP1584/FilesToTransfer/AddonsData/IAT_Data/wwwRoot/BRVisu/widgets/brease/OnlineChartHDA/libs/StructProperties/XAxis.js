define([
    'brease/datatype/StructuredProperty',
    'brease/core/Types',
    'brease/enum/Enum',
    'widgets/brease/OnlineChartHDA/libs/StyleElemsUtils'
], function (SuperClass, Types, Enum, StyleElemsUtils) {
    'use strict';

    /**
    * @class widgets.brease.OnlineChartHDA.XAxis
    * Defines appearance and behaviour of a XAxis
    * @extends brease.datatype.StructuredProperty
    */

    /**
    * @cfg {Boolean} visible = true
    * @iatStudioExposed
    * @iatCategory Behavior
    * @bindable
    * Defines the visibility of the graph. (Visible = true, invisible = false)
    */

    /**
    * @cfg {brease.enum.VerticalAlign} position='bottom'
    * @iatStudioExposed
    * @iatCategory Appearance
    * Defines weather the axis is positioned at the bottom or at the top of the chart
    */

    /**
    * @cfg {UNumber} timeSpan= 60
    * @iatStudioExposed
    * @iatCategory Behavior
    * Defines the visible time window of the axis in seconds.
    * @bindable
    */

    /**
    * @cfg {UInteger} numberOfTicks= 5
    * Number of tick labels to be shown.
    * @iatStudioExposed
    * @iatCategory Behavior
    * @bindable
    */

    /**
    * @cfg {String} timeFormat='hh:mm:ss'
    * @localizable
    * @iatStudioExposed
    * @iatCategory Appearance
    * @bindable
    * Specifies the format of the time shown in the tick labels. This is either a format string (ee.g. "HH:mm") or a pattern ("F").
    * Read more about <a href="../FAQ/FormatDate.html">Date Formats</a>
    */

    /**
    * @cfg {StyleReference} style = 'default'
    * @iatStudioExposed
    * @iatCategory Appearance
    * @bindable
    * @typeRefId widgets.brease.OnlineChartHDA.XAxis
    * Reference to a style that can be created by the user.
    */

    var defaultSettings = {
        visible: true,
        enable: true,
        timeSpan: 60,
        numberOfTicks: 5,
        timeFormat: 'hh:mm:ss',
        position: 'bottom',
        style: 'default'
    };

    var XAxis = SuperClass.extend(function XAxis(id, stylePrefix, options, renderer, widgetId, propName) {       
            SuperClass.call(this, id, options, widgetId, propName);

            this.renderer = renderer;
            this.elem = document.createElement('DIV');
            this.elem.id = id;
            this.stylePrefix = stylePrefix !== undefined ? stylePrefix : '';
            this.internal = {
                timeSpan: this.settings.timeSpan * 1000
            };
        }, defaultSettings),

        p = XAxis.prototype;

    p.init = function () {
        this.renderer.model.primaryXAxis = {
            range: {},
            valueType: 'DateTime',
            intervalType: 'seconds',
            majorGridLines: {},
            majorTickLines: {},
            axisLine: {},
            font: {},
            crosshairLabel: {
                visible: true
            }
        };

        StyleElemsUtils.createXAxisStyleElems(this);
        this.setStyle(this.settings.style);
        this.setVisible(this.settings.visible);
        this.setPosition(this.settings.position);
        this.setTimeFormat(this.settings.timeFormat);
        this.setTimeSpan(this.settings.timeSpan);
        this.onTimeSpanChange(function () { });
        this.onTimeChange(function () {});
    };

    p.setId = function (id) {
        this.elem.id = id;
        SuperClass.prototype.setId.apply(this, arguments);
    };

    p.setStyle = function (value) {
        var style = this.stylePrefix + '_XAxis_style_' + this.settings.style;
        if (this.elem.classList.contains(style)) {
            this.elem.classList.remove(style);
        }
        style = this.stylePrefix + '_XAxis_style_' + value;
        this.settings.style = value;
        this.elem.classList.add(style);
        this.updateStyleProperties();
        this.renderer.requestRedraw();
    };

    p.updateStyleProperties = function () {
        StyleElemsUtils.updateXAxisStyleElems(this, this.elem);

        this.renderer.model.primaryXAxis.majorGridLines.color = this.settings.gridColor;
        this.renderer.model.primaryXAxis.majorTickLines.color = this.settings.color;
        this.renderer.model.primaryXAxis.axisLine.color = this.settings.color;

        this.renderer.model.primaryXAxis.font.size = this.settings.fontSize;
        this.renderer.model.primaryXAxis.font.fontFamily = this.settings.fontName;

        this.renderer.model.primaryXAxis.labelRotation = this.settings.tickLabelRotation;

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
            this.renderer.model.primaryXAxis.font.color = this.settings.textColor;
        } else {
            this.renderer.model.primaryXAxis.font.color = this.settings.disabledTextColor;
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
        this.renderer.model.primaryXAxis.visible = this.settings.visible;
        this.renderer.model.primaryXAxis.majorGridLines.visible = this.settings.visible;
        this.renderer.requestRedraw();
    };

    p.getVisible = function () {
        return this.settings.visible;
    };

    /**
    * @method setPosition
    * Defines weather the axis is positioned at the bottom or at the top of the chart
    * @param {brease.enum.VerticalAlign} position
    */
    p.setPosition = function (position) {
        this.settings.position = position;
        this.renderer.model.primaryXAxis.opposedPosition = this.settings.position === Enum.VerticalAlign.top;
    };

    /**
    * @method getPosition
    * @return {brease.enum.VerticalAlign} 
    */
    p.getPosition = function () {
        return this.settings.position;
    };

    /**
    * @method setTimeFormat
    * Defines on which format the time labels are shown
    * @param {String} timeFormat
    */
    p.setTimeFormat = function (timeFormat) {
        if (timeFormat !== undefined) {
            if (brease.language.isKey(timeFormat) === false) {
                this.settings.timeFormat = timeFormat;
                this.renderer.model.primaryXAxis.labelFormat = this.settings.timeFormat;
            } else {
                this.setTimeFormatKey(brease.language.parseKey(timeFormat));
            }
            this.renderer.requestRedraw();
        }
    };

    p.setTimeFormatKey = function (key) {
        if (key !== undefined) {
            this.internal.timeFormatKey = key;
            var format = brease.language.getTextByKey(this.internal.timeFormatKey);
            if (format !== 'undefined key') {
                this.setTimeFormat(format);
            } else {
                console.iatWarn(this.elem.id + ': Format textKey not found: ' + key);
            }
        } else {
            this.internal.timeFormatKey = undefined;
            console.iatInfo(this.elem.id + ': The text key is not valid : ' + key);
        }
    };

    /**
    * @method getTimeFormat
    * @return {String} 
    */
    p.getTimeFormat = function () {
        return this.settings.timeFormat;
    };

    /**
    * @method setNumberOfTicks
    * @param {UInteger} numberOfTicks
    */
    p.setNumberOfTicks = function (numberOfTicks, redraw) {
        redraw = redraw === undefined || redraw;
        this.settings.numberOfTicks = Math.max(0, parseInt(numberOfTicks, 10));
        this.updateRangeInterval(this.settings.timeSpan);
        if (redraw) {
            this.renderer.requestRedraw();
        }
    };

    p.updateRangeInterval = function (timeSpan) {
        this.renderer.model.primaryXAxis.range.interval = Math.trunc(timeSpan / this.settings.numberOfTicks);
        if (this.renderer.model.primaryXAxis.range.interval < 1) {
            this.renderer.model.primaryXAxis.range.interval = 1;
        } else if (this.renderer.model.primaryXAxis.range.interval === Infinity) {
            this.renderer.model.primaryXAxis.range.interval = this.settings.timeSpan + 1;
        }
    };

    /**
    * @method getNumberOfTicks
    * @return {UInteger}
    */
    p.getNumberOfTicks = function () {
        return this.settings.numberOfTicks;
    };

    /**
    * @method setTimeSpan
    * @iatStudioExposed
    * Sets the timeSpan, always with the latest value shown on the right side of the graph
    * @param {UNumber} timeSpan
    */
    p.setTimeSpan = function (timeSpan) {
        if (timeSpan < 1) {
            timeSpan = 1;
        }
        var changed = timeSpan !== this.settings.timeSpan,
            oldTimeSpan = this.settings.timeSpan;
        this.settings.timeSpan = timeSpan;
        this.internal.timeSpan = this.settings.timeSpan * 1000;
        this.setNumberOfTicks(this.settings.numberOfTicks, false);
        this.renderer.setTimeSpan(this.internal.timeSpan);
        if (changed) {
            var promise = this.onTimeSpanChangeHandler(timeSpan, oldTimeSpan);
            if (promise && promise.state() === 'pending') {
                var that = this;
                promise.fail(function () {
                    that.settings.timeSpan = oldTimeSpan;
                    that.internal.timeSpan = that.settings.timeSpan * 1000;
                    that.setNumberOfTicks(that.settings.numberOfTicks, false);
                    that.renderer.setTimeSpan(that.internal.timeSpan);
                });
            }
            return promise;
        }
    };

    /**
    * @method getTimeSpan
    * @return {UNumber}
    */
    p.getTimeSpan = function () {
        return this.settings.timeSpan;
    };

    /**
    * @method getTimeSpanMs
    * @return {UNumber}
    */
    p.getTimeSpanMs = function () {
        return this.internal.timeSpan;
    };

    /**
    * @method setTime
    * @iatStudioExposed
    * Sets start and end time of XAxis int UTC.
    * @param {DateTime} start
    * @param {DateTime} end
    */
    p.setTime = function (start, end) {
        this.settings.time = {
            start: start,
            end: end
        };
        this.updateRangeInterval((end.getTime() - start.getTime()) / 1000);
        return this.onTimeChangeHandler(this.settings.time);
    };

    p.getTime = function () {
        return this.settings.time;
    };

    p.onTimeSpanChange = function (handler) {
        this.onTimeSpanChangeHandler = handler;
    };

    p.onTimeChange = function (handler) {
        this.onTimeChangeHandler = handler;
    };

    p.cultureChangeHandler = function () {
        if (this.internal.timeFormatKey) {
            this.setTimeFormatKey(this.internal.timeFormatKey);
        }
    };

    /**
     * @method toString
     * Creates readable string of structured property. (i.e xAxis[id1])
    */
    p.toString = function () {
        return 'xAxis' + '[' + this.name + ']';
    };
    /**
     * @method attributeToString
     * Creates readable string of attribute. (i.e xAxis[id1].node)
    */
    p.attributeToString = function (name) {
        return this.toString() + '.' + name;
    };

    return XAxis;
});
