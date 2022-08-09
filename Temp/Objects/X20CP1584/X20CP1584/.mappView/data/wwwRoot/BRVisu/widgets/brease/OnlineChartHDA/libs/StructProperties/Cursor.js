define([
    'brease/datatype/StructuredProperty',
    'brease/core/Types',
    'brease/core/Utils'
], function (SuperClass, Types, Utils) {
    'use strict';

    /**
    * @class widgets.brease.OnlineChartHDA.Cursor
    * Defines appearance and behaviour of a Cursor
    * @extends brease.datatype.StructuredProperty
    */

    /**
    * @cfg {Boolean} visible = true
    * @iatStudioExposed
    * @bindable
    * @iatCategory Behavior
    * Defines the visibility of the cursor. (Visible = true, invisible = false)
    */

    /**
    * @cfg {StyleReference} style = 'default'
    * @iatStudioExposed
    * @iatCategory Appearance
    * @bindable
    * @typeRefId widgets.brease.OnlineChartHDA.Cursor
    * Reference to a style that can be created by the user.
    */

    var defaultSettings = {
        visible: true,
        style: 'default'
    };

    var Cursor = SuperClass.extend(function Cursor(id, stylePrefix, options, renderer, widgetId, propName) {
            SuperClass.call(this, id, options, widgetId, propName);
            this.renderer = renderer;
            this.elem = document.createElement('DIV');
            this.elem.style.display = 'none';
            this.elem.id = id;
            this.onTrackballChangeHandler = null;
            this.stylePrefix = stylePrefix !== undefined ? stylePrefix : '';
            this.internal = {
                trackballs: [],
                labelHeight: null,
                show: false,
                scaleFactor: 1,
                isResized: true,
                labelOffset: 13,
                radius: 8
            };
        }, defaultSettings),

        p = Cursor.prototype;

    p.init = function () {
        this.renderer.model.crosshair = {};
        this._createElems();
        this.setStyle(this.settings.style);
        if (brease.config.editMode) {
            this.renderer.onRedraw = this._bind('_createEditor');
        }
    };

    p._createElems = function () {
        for (var i = 0; i < this.renderer.model.series.length; i++) {
            this.internal.trackballs.push({
                $trackball: $('<div class="trackball" />').appendTo(this.elem),
                $label: $('<span class="trackballLabel" />').appendTo(this.elem),
                point: null
            });
        }
    };

    p._createEditor = function () {
        if (this.settings.visible) {
            if (this.internal.trackballs.length !== this.renderer.model.series.length) {
                while (this.elem.firstChild) {
                    this.elem.removeChild(this.elem.firstChild);
                }
                this.internal.trackballs = [];
                this._createElems();
            }
            var mouseX = (this.renderer.model.primaryXAxis.Location.X1 +
                this.renderer.model.primaryXAxis.Location.X2) / 3,
                args = this._createTrackAxisToolTipArg(mouseX);
            this._handleTrackAxisToolTip(args);
        } else {
            this.elem.style.display = 'none';
        }
    };

    p._createTrackAxisToolTipArg = function (mouseX) {
        return {
            model: this.renderer.model,
            data: {
                location: {
                    x: mouseX
                }
            }
        };
    };

    p.dispose = function () {
        window.removeEventListener('resize', this._bind('_resizeHandler'));
        this.elem.remove();
        this.elem = null;
        SuperClass.prototype.dispose.apply(this, arguments);
    };

    p.setId = function (id) {
        this.elem.id = id;
        SuperClass.prototype.setId.apply(this, arguments);
    };

    p.onTrackballChange = function (handler) {
        this.onTrackballChangeHandler = handler;
    };

    p.setStyle = function (value) {
        var oldStyle = this.stylePrefix + '_Cursor_style_' + this.settings.style,
            newStyle = this.stylePrefix + '_Cursor_style_' + value;
        this.settings.style = value;
        if (this.elem.classList.contains(oldStyle)) {
            this.elem.classList.remove(oldStyle);
        }
        this.elem.classList.add(newStyle);
        this.renderer.requestRedraw();
    };

    p.getStyle = function () {
        return this.settings.style;
    };

    p.setVisible = function (value) {
        this.settings.visible = Types.parseValue(value, 'Boolean');
        if (this.settings.visible) {
            if (this.internal.show) {
                this._show();
                this.renderer.requestRedraw();
            }
        } else {
            if (this.renderer.model.crosshair.visible) {
                this._hide();
                this.renderer.requestRedraw();
            }
        }
    };

    p._show = function () {
        this.internal.scaleFactor = Utils.getScaleFactor(this.elem.parentNode);
        window.addEventListener('resize', this._bind('_resizeHandler'));
        this.renderer.model.preRender = this._bind('_handlePreRender');
        this.renderer.model.trackAxisToolTip = this._bind('_handleTrackAxisToolTip');
        this.renderer.model.chartMouseMove = this._bind('_handleChartMouseMove');
        this.renderer.model.crosshair.visible = true;
    };

    p._resizeHandler = function () {
        this.internal.isResized = true;
    };

    p._hide = function () {
        window.removeEventListener('resize', this._bind('_resizeHandler'));
        this.renderer.model.trackAxisToolTip = null;
        this.renderer.model.chartMouseMove = null;
        this.renderer.model.preRender = null;
        this.renderer.model.crosshair.visible = false;
        this._notifyTrackballsHide();
        this.elem.style.display = 'none';
    };

    p.getVisible = function () {
        return this.settings.visible;
    };

    /**
     * @method toString
     * Creates readable string of structured property. (i.e cursor[id1])
    */
    p.toString = function () {
        return 'cursor' + '[' + this.name + ']';
    };
    /**
     * @method attributeToString
     * Creates readable string of attribute. (i.e cursor[id1].node)
    */
    p.attributeToString = function (name) {
        return this.toString() + '.' + name;
    };

    p.show = function () {
        if (this.settings.visible) {
            this._show();
            this.internal.show = true;
        }
    };

    p.hide = function () {
        if (this.settings.visible) {
            this._hide();
            this.internal.show = false;
        }
    };

    p._notifyTrackballsHide = function () {
        if (this.onTrackballChangeHandler) {
            for (var i = 0; i < this.renderer.model.series.length; i++) {
                this._changeTrackballPoint(i, null);
            }
        }
    };

    p._changeTrackballPoint = function (seriesIndex, point) {
        if (this.internal.trackballs[seriesIndex].point !== point) {
            this.internal.trackballs[seriesIndex].point = point;
            if (this.onTrackballChangeHandler) {
                this.onTrackballChangeHandler(seriesIndex, point);
            }
        }
    };

    /*
     * zoom, scroll.. make it invisible
     */
    p._handlePreRender = function () {
        this.elem.style.display = 'none';
    };

    p._handleChartMouseMove = function (args) {
        var scaleFactor = this._getScaleFactor(),
            location = {
                x: args.data.location.x / scaleFactor,
                y: args.data.location.y / scaleFactor
            };
        if (!this._isMouseInSeriesArea(location)) {
            this.elem.style.display = 'none';
            this._notifyTrackballsHide();
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

    p._isMouseInSeriesArea = function (location) {
        return location.x >= this.renderer.model.primaryXAxis.Location.X1 &&
            location.x <= this.renderer.model.primaryXAxis.Location.X2 &&
            location.y >= this.renderer.model.primaryYAxis.Location.Y2 &&
            location.y <= this.renderer.model.primaryYAxis.Location.Y1;
    };

    p._handleTrackAxisToolTip = function (args) {
        // syncfusion creates crosshair on demand, trackball must be on top of that element
        if (this.elem.parentNode.lastChild !== this.elem) {
            this.elem.parentNode.appendChild(this.elem);
        }
        var mouseX = args.data.location.x / this._getScaleFactor(),
            cursorX = mouseX - args.model.primaryXAxis.Location.X1;
        for (var i = 0; i < args.model.series.length; i++) {
            var series = args.model.series[i];
            if (series.visibility === 'hidden') {
                this._hideTrackball(i);
                continue;
            }
            var pointBefore = this._findPointBeforeX(series, cursorX);
            if (!this._isPointInSeriesArea(pointBefore)) {
                this._hideTrackball(i);
                continue;
            }
            this.internal.trackballs[i].$trackball.css({
                'border-color': series.fill,
                'left': mouseX - this.internal.radius,
                'top': pointBefore.location.Y + args.model.primaryYAxis.Location.Y2 - this.internal.radius
            }).show();
            var labelCss = {
                'background-color': series.fill,
                'left': mouseX + this.internal.labelOffset,
                'top': pointBefore.location.Y + args.model.primaryYAxis.Location.Y2 - this.internal.radius
            };
            this.internal.trackballs[i].$label.text(pointBefore.y.toFixed(2)).css(labelCss).show();
            this.internal.trackballs[i].$label.top = labelCss.top;
            this.internal.trackballs[i].$label.left = labelCss.left;
            this.elem.style.display = 'block';
            this._changeTrackballPoint(i, pointBefore);
        }
        this._layoutLabels();
        this._renderLabels();
    };

    p._findPointBeforeX = function (series, x) {
        // start from left until we find a point which is after the cursor or directly on cursor
        // further optimization: start from last point and search left or right depending if cursor x direction
        for (var j = 0; j < series._visiblePoints.length; j++) {
            var dataPoint = series._visiblePoints[j];
            if (dataPoint.location.X > x) {
                return series._visiblePoints[j - 1];
            } else if (dataPoint.location.X === x) {
                return series._visiblePoints[j];
            }
        }
        return undefined;
    };

    p._isPointInSeriesArea = function (point) {
        var chartHeight = this.renderer.model.primaryYAxis.Location.Y1 - this.renderer.model.primaryYAxis.Location.Y2;
        return point && point.location.Y >= 0 && point.location.Y <= chartHeight;
    };

    p._hideTrackball = function (i) {
        this.internal.trackballs[i].$trackball.hide();
        this.internal.trackballs[i].$label.hide();
        this._changeTrackballPoint(i, null);
    };

    /*
     * layout so there a no labels which are overlapping
     */
    p._layoutLabels = function () {
        this.internal.labelHeight = _.first(this.internal.trackballs).$label.height();
        this._fixVerticalEdgeCollisions();
        var fixes = 0,
            collisions = [];
        while (fixes < 10) {
            // further optimization: use collisions of first iteration
            collisions = this._getCollisions(collisions);
            if (collisions.length > 0) {
                this._fixCollisions(collisions);
                fixes++;
            } else {
                break;
            }
        }
        this._fixHorizontalEdgeCollisions();
    };

    /*
     * Check each label if its colliding with time axis (time label) and correct its position
     */
    p._fixVerticalEdgeCollisions = function () {
        for (var i = 0; i < this.internal.trackballs.length; i++) {
            var end = this.internal.trackballs[i].$label.top + this.internal.labelHeight,
                correction = this._getEdgeCollisionCorrection(this.internal.trackballs[i].$label.top, end);
            if (correction) {
                this.internal.trackballs[i].$label.top += correction;
                this.internal.trackballs[i].$label.needsRedraw = true;
            }
        }
    };

    /*
     * Get correction in pixels to not collide with top or bottom edge, returns undefined if its not colliding
     */
    p._getEdgeCollisionCorrection = function (start, end) {
        if (start <= this.renderer.model.primaryYAxis.Location.Y2) {
            return (this.renderer.model.primaryYAxis.Location.Y2 - start);
        }
        if (end >= this.renderer.model.primaryYAxis.Location.Y1) {
            return (this.renderer.model.primaryYAxis.Location.Y1 - end);
        }
    };

    /*
     * Flips all labels left of trackball if any label would collide with right edge.
     */
    p._fixHorizontalEdgeCollisions = function () {
        var maxLabelWidth = this.internal.trackballs.reduce(function (maxLabelWidth, tb) {
                return Math.max(maxLabelWidth, tb.$label.width());
            }, 0),
            end = _.first(this.internal.trackballs).$label.left + maxLabelWidth;
        if (end >= this.renderer.model.primaryXAxis.Location.X2) {
            for (var i = 0; i < this.internal.trackballs.length; i++) {
                this.internal.trackballs[i].$label.left -= maxLabelWidth + this.internal.radius + this.internal.labelOffset * 2;
                this.internal.trackballs[i].$label.needsRedraw = true;
            }
        }
    };

    /*
     * get collision groups in form: [[l1,l2],[l3,l4,l5]]
     */
    p._getCollisions = function () {
        var collisions = [];
        // check first vs second and third..; check second vs third...; ...
        for (var i = 0; i < this.internal.trackballs.length; i++) {
            for (var j = i + 1; j < this.internal.trackballs.length; j++) {
                if (this._checkCollision(this.internal.trackballs[i].$label, this.internal.trackballs[j].$label)) {
                    var that = this;
                    // check if labels already in any collision group
                    var index = _.findIndex(collisions, function (group) {
                        return (group.indexOf(that.internal.trackballs[i].$label) !== -1) ||
                            (group.indexOf(that.internal.trackballs[j].$label) !== -1);
                    });
                    // labels already in collision group, add it if not already added
                    if (index >= 0) {
                        if (collisions[index].indexOf(this.internal.trackballs[j].$label) === -1) {
                            collisions[index].push(this.internal.trackballs[j].$label);
                        }
                        // create new collision group
                    } else {
                        collisions.push([this.internal.trackballs[i].$label, this.internal.trackballs[j].$label]);
                    }
                }
            }
        }
        return collisions;
    };

    p._checkCollision = function ($a, $b) {
        return (this.internal.labelHeight - Math.abs($a.top - $b.top)) >= 0;
    };

    /*
     * Calc middle and layout labels around by setting new top position, but not yet in css!
     */
    p._fixCollisions = function (collisions) {
        for (var i = 0; i < collisions.length; i++) {
            var group = _.sortBy(collisions[i], [function ($el) {
                return $el.top;
            }]);
            // mid = (max - min + height) / 2 + min
            var midPoint = (_.last(group).top - _.first(group).top + this.internal.labelHeight) / 2 + _.first(group).top,
                spacing = 2,
                requiredHeight = group.length * (this.internal.labelHeight + spacing) - spacing,
                start = midPoint - requiredHeight / 2,
                end = start + requiredHeight,
                correction = this._getEdgeCollisionCorrection(start, end);
            if (correction) {
                start += correction;
            }
            for (var j = 0; j < group.length; j++) {
                group[j].top = start + (this.internal.labelHeight * j + spacing * j);
                group[j].needsRedraw = true;
            }
        }
    };

    /*
     * Set new fixed top positions in css
     */
    p._renderLabels = function () {
        for (var i = 0; i < this.internal.trackballs.length; i++) {
            if (this.internal.trackballs[i].$label.needsRedraw) {
                this.internal.trackballs[i].$label.css({ 
                    'top': this.internal.trackballs[i].$label.top, 
                    'left': this.internal.trackballs[i].$label.left });
                this.internal.trackballs[i].$label.needsRedraw = false;
            }
        }
    };

    return Cursor;
});
