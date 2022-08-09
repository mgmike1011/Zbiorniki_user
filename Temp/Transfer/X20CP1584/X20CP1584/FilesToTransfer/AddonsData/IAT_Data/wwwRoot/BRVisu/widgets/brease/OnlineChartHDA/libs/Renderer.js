define(['brease/core/Class', 'widgets/brease/common/libs/EjChart'], function (SuperClass, EjChart) {

    'use strict';

    /**
    * @class widgets.brease.OnlineChartHDA.libs.Renderer
    * #Description
    * Class used to draw and update the chart
    */
    /**
    * @method constructor
    * @param {UInteger} redrawTime
    */
    var Renderer = SuperClass.extend(function Renderer(redrawTime) {
            SuperClass.call(this);
            this.redrawTime = redrawTime;
            this.modelChangeObservers = [];
            this.preRedrawObservers = [];
            this.onRedraw = null;
            this.isLoaded = false;
            this.onChartLoaded = null;
            this.el = null;
            this.redrawInterval = null;
            this.throttledRedraw = _.throttle(this.redraw, 50, { leading: false });
            this.model = {
                series: [],
                axes: [],
                primaryYAxis: {
                    majorGridLines: {
                        visible: false
                    },
                    visible: false
                },
                zooming: {},
                chartArea: {
                    border: {
                        color: 'transparent',
                        opacity: 1
                    }
                },
                margin: {
                    right: 30
                },
                enableCanvasRendering: true,
                load: this._bind('_onChartLoad'),
                axesLabelRendering: this._bind('_yAxisLabelFormatter')
            };
        }, null),

        p = Renderer.prototype;

    /**
     * @method setTimeSpan
     * Sets visible timespan
     */
    p.setTimeSpan = function (timeSpan) {
        this.timeSpan = timeSpan;
    };

    p.subscribeModelChange = function (obs) {
        this.modelChangeObservers.push(obs);
    };

    p.unsubscribeModelChange = function (obs) {
        _.pull(this.modelChangeObservers, obs);
    };

    p.subscribePreRedraw = function (obs) {
        this.preRedrawObservers.push(obs);
    };

    p.unsubscribePreRedraw = function (obs) {
        _.pull(this.preRedrawObservers, obs);
    };

    p.removeFromModel = function (propName, index) {
        this.model[propName].splice(index, 1);
        this._notifyModelChangeObservers('remove', propName, index);
    };

    p.reorderModel = function (propName, oldIndex, newIndex) {
        var axis = this.model[propName][newIndex];
        this.model[propName][newIndex] = this.model[propName][oldIndex];
        this.model[propName][oldIndex] = axis;
        this._notifyModelChangeObservers('reorder', propName, oldIndex, newIndex);
    };

    /**
     * @method createChart
     * Initializes syncfusion chart 
     */
    p.createChart = function (el, range) {
        if (range) {
            this.model.primaryXAxis.range.min = range.min;
            this.model.primaryXAxis.range.max = range.max;
        } else if (!brease.config.editMode) {
            this.model.primaryXAxis.range.min = new Date(Date.now() - this.timeSpan);
            this.model.primaryXAxis.range.max = new Date(Date.now());
        }
        this._notifyPreRedrawObservers();
        this.el = el;
        this.canvasElemId = this.el.get(0).id + '_canvas';
        EjChart.init(this.el, this.model);
    };

    /**
     * @method _yAxisLabelFormatter
     * Draws yAxis labels with correct format and unit
     * #param {Object} args
     * #param {Object} args.data
     * #param {Object} args.data.label
     * #param {String} args.data.label.Text
     * #param {Object} args.data.axis
     * #param {Object} args.data.axis.custom
     * #param {brease.config.MeasurementSystemFormat} args.data.axis.custom.numberFormat
     */
    p._yAxisLabelFormatter = function (args) {
        if (args.data.axis.custom) {
            args.data.label.Text =
                brease.formatter.formatNumber(args.data.label.Text,
                    args.data.axis.custom.numberFormat,
                    undefined,
                    brease.user.getSeparators());
        }
    };

    /**
     * @method redraw
     * updates chart using syncfusion method 'redraw'
     */
    p.redraw = function redraw(range) {
        if (this.isLoaded) {
            if (range) {
                this.model.primaryXAxis.range.min = range.min;
                this.model.primaryXAxis.range.max = range.max;
                this._notifyPreRedrawObservers(false);
            } else if (this.redrawInterval) {
                this.model.primaryXAxis.range.min = new Date(Date.now() - this.timeSpan);
                this.model.primaryXAxis.range.max = new Date(Date.now());
                this._notifyPreRedrawObservers(true);
            }
            this.el.ejChart('redraw');
            if (this.onRedraw) {
                this.onRedraw();
            }
        }
    };

    /**
     * @method requestRedraw
     * Redraws the graph throttled or in next redraw interval.
     */
    p.requestRedraw = function (range) {
        if (this.isLoaded) {
            if (this.redrawInterval) {
                var timeToNextRedraw = this.redrawTime - (Date.now() - this.model.primaryXAxis.range.max.getTime());
                if (timeToNextRedraw > 200) {
                    this.redraw(range);
                }
            } else {
                this.throttledRedraw(range);
            }
        }
    };

    p._notifyModelChangeObservers = function (action, propName, index, data) {
        this.modelChangeObservers.forEach(function (obs) {
            obs(action, propName, index, data);
        });
    };

    p._notifyPreRedrawObservers = function (online) {
        var that = this;
        this.preRedrawObservers.forEach(function (obs) {
            if (online) {
                obs(that.model.primaryXAxis.range.min, that.model.primaryXAxis.range.max);
            } else {
                obs(new Date(0), that.model.primaryXAxis.range.max);
            }
        });
    };

    p.stop = function stop() {
        this.throttledRedraw.cancel();
        window.clearInterval(this.redrawInterval);
        this.redrawInterval = null;
    };

    p.start = function start() {
        var that = this;
        this.redrawInterval = setInterval(function () {
            that.redraw();
        }, this.redrawTime);
    };

    /**
     * @method _onChartLoad
     * Calls redraw with a given interval once the chart has been load for the first time
     */
    p._onChartLoad = function _onChartLoad(sender) {
        this.model = sender.model;
        this.isLoaded = true;
        if (!brease.config.editMode) {
            this.start();
        }
        if (this.onChartLoaded) this.onChartLoaded();
    };

    p.getChartIsLoaded = function () {
        return this.isLoaded;
    };

    p.dispose = function () {
        this.throttledRedraw.cancel();
        this.stop();
        this.el = null;
    };

    return Renderer;
});
