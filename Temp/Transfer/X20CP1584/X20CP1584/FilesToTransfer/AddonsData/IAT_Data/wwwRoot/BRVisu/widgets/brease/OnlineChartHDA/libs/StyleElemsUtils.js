define([], function () {

    'use strict';

    var StyleElemsUtils = {};

    StyleElemsUtils.createStyleElements = function (widget) {
        widget.dummyElems = {};
        widget.dummyElems._chartColor = document.createElement('div');
        widget.dummyElems._chartColor.className = 'chartColor';
        widget.dummyElems._disabledChartColor = document.createElement('div');
        widget.dummyElems._disabledChartColor.className = 'disabledChartColor';
        
        for (var elem in widget.dummyElems) {
            widget.elem.appendChild(widget.dummyElems[elem]);
        }
    };

    StyleElemsUtils.updateStyleProperties = function (styleProps, elem) {
        styleProps.chartBackColor = getComputedStyle(elem.getElementsByClassName('chartColor')[0]).getPropertyValue('background-color');
        styleProps.chartColor = getComputedStyle(elem.getElementsByClassName('chartColor')[0]).color;
        styleProps.disabledChartColor = getComputedStyle(elem.getElementsByClassName('disabledChartColor')[0]).color;
        return styleProps;
    };

    StyleElemsUtils.createXAxisStyleElems = function (widget) {
        widget.dummyElems = {};
        widget.dummyElems._gridXAxisColor = document.createElement('div');
        widget.dummyElems._gridXAxisColor.className = 'gridXAxisColor';
        widget.dummyElems._xAxisTextColor = document.createElement('div');
        widget.dummyElems._xAxisTextColor.className = 'xAxisTextColor';
        widget.dummyElems._disabledxAxisTextColor = document.createElement('div');
        widget.dummyElems._disabledxAxisTextColor.className = 'disabledxAxisTextColor';
        widget.dummyElems._xAxisTickColor = document.createElement('div');
        widget.dummyElems._xAxisTickColor.className = 'xAxisTickColor';
        widget.dummyElems._xAxisFontName = document.createElement('div');
        widget.dummyElems._xAxisFontName.className = 'xAxisFontName';
        widget.dummyElems._xAxisFontSize = document.createElement('div');
        widget.dummyElems._xAxisFontSize.className = 'xAxisFontSize';
        widget.dummyElems._xAxisTickLabelRotation = document.createElement('div');
        widget.dummyElems._xAxisTickLabelRotation.className = 'xAxisTickLabelRotation';

        for (var elem in widget.dummyElems) {
            widget.elem.appendChild(widget.dummyElems[elem]);
        }
    };

    StyleElemsUtils.updateXAxisStyleElems = function (axis, elem) {
        axis.settings.gridColor = getComputedStyle(elem.getElementsByClassName('gridXAxisColor')[0]).color;
        axis.settings.textColor = getComputedStyle(elem.getElementsByClassName('xAxisTextColor')[0]).color;
        axis.settings.disabledTextColor = getComputedStyle(elem.getElementsByClassName('disabledxAxisTextColor')[0]).color;
        axis.settings.color = getComputedStyle(elem.getElementsByClassName('xAxisTickColor')[0]).color;
        axis.settings.fontName = getComputedStyle(elem.getElementsByClassName('xAxisFontName')[0]).fontFamily;
        axis.settings.fontSize = getComputedStyle(elem.getElementsByClassName('xAxisFontSize')[0]).fontSize;

        axis.settings.tickLabelRotation = this.getElemRotation(elem.getElementsByClassName('xAxisTickLabelRotation')[0]);
    };

    StyleElemsUtils.getElemRotation = function (elem) {
        var style = getComputedStyle(elem, null),
            transform = style.getPropertyValue('-webkit-transform') ||
                style.getPropertyValue('-moz-transform') ||
                style.getPropertyValue('-ms-transform') ||
                style.getPropertyValue('-o-transform') ||
                style.getPropertyValue('transform') ||
                'FAIL';
        if (transform === 'none') {
            return 0;
        }
        var values = transform.split('(')[1].split(')')[0].split(',');
        return Math.round(Math.atan2(values[1], values[0]) * (180 / Math.PI));
    };

    StyleElemsUtils.createYAxisStyleElems = function (axis) {
        axis.dummyElems = {};
        axis.dummyElems._textColor = document.createElement('div');
        axis.dummyElems._textColor.className = 'yAxisTextColor';
        axis.dummyElems._disabledTextColor = document.createElement('div');
        axis.dummyElems._disabledTextColor.className = 'disabledyAxisTextColor';
        axis.dummyElems._fontSize = document.createElement('div');
        axis.dummyElems._fontSize.className = 'yAxisFontSize';
        axis.dummyElems._fontName = document.createElement('div');
        axis.dummyElems._fontName.className = 'yAxisFontName';
        axis.dummyElems._yAxisColor = document.createElement('div');
        axis.dummyElems._yAxisColor.className = 'yAxisColor';
        axis.dummyElems._gridYAxisColor = document.createElement('div');
        axis.dummyElems._gridYAxisColor.className = 'gridYAxisColor';
        axis.dummyElems._titleTextColor = document.createElement('div');
        axis.dummyElems._titleTextColor.className = 'titleTextColor';
        axis.dummyElems._titleFontSize = document.createElement('div');
        axis.dummyElems._titleFontSize.className = 'titleFontSize';
        axis.dummyElems._titleFontName = document.createElement('div');
        axis.dummyElems._titleFontName.className = 'titleFontName';
        
        for (var elem in axis.dummyElems) {
            axis.elem.appendChild(axis.dummyElems[elem]);
        }
    };

    StyleElemsUtils.updateYAxisStyleElems = function (axis, elem) {
        axis.settings.textColor = getComputedStyle(elem.getElementsByClassName('yAxisTextColor')[0]).color;
        axis.settings.disabledTextColor = getComputedStyle(elem.getElementsByClassName('disabledyAxisTextColor')[0]).color;
        axis.settings.fontSize = getComputedStyle(elem.getElementsByClassName('yAxisFontSize')[0]).fontSize;
        axis.settings.fontName = getComputedStyle(elem.getElementsByClassName('yAxisFontName')[0]).fontFamily;
        axis.settings.color = getComputedStyle(elem.getElementsByClassName('yAxisColor')[0]).color;
        axis.settings.gridColor = getComputedStyle(elem.getElementsByClassName('gridYAxisColor')[0]).color;
        axis.settings.titleTextColor = getComputedStyle(elem.getElementsByClassName('titleTextColor')[0]).color;
        axis.settings.titleFontName = getComputedStyle(elem.getElementsByClassName('titleFontName')[0]).fontFamily;
        axis.settings.titleFontSize = getComputedStyle(elem.getElementsByClassName('titleFontSize')[0]).fontSize;
    };

    StyleElemsUtils.createGraphStyleElems = function (graph) {
        graph.dummyElems = {};
        graph.dummyElems._lineColor = document.createElement('div');
        graph.dummyElems._lineColor.className = 'lineColor';
        graph.dummyElems._disabledLineColor = document.createElement('div');
        graph.dummyElems._disabledLineColor.className = 'disabledLineColor';
        graph.dummyElems._lineWidth = document.createElement('div');
        graph.dummyElems._lineWidth.className = 'lineWidth';
        
        for (var elem in graph.dummyElems) {
            graph.elem.appendChild(graph.dummyElems[elem]);
        }
    };
    StyleElemsUtils.updateGraphStyleElems = function (graph, elem) {
        graph.settings.lineColor = getComputedStyle(elem.getElementsByClassName('lineColor')[0]).color;
        graph.settings.disabledLineColor = getComputedStyle(elem.getElementsByClassName('disabledLineColor')[0]).color;
        graph.settings.lineWidth = getComputedStyle(elem.getElementsByClassName('lineWidth')[0]).width;
    };

    return StyleElemsUtils;
});
