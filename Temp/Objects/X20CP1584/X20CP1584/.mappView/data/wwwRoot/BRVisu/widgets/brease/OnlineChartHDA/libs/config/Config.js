define([], function () {

    'use strict';

    /**
     * @class widgets.brease.OnlineChartHDA.libs.config.Config
     * @extends core.javascript.Object
     * @override widgets.brease.OnlineChartHDA
     */

    /**
     * @cfg {UInteger} updateBufferTime = 2000
     * Interval in ms in which the historical data is updated.
     * If set to 0 historical data will be used only once (initial).
     * After that only online data will be used.
     * @iatStudioExposed
     * @iatCategory Behavior
     */

    /**
     * @cfg {UInteger} updateChartTime = 200
     * Interval in ms in which the chart is redrawn.
     * @iatStudioExposed
     * @iatCategory Behavior
     */

    /**
     * @cfg {UInteger} maxTimeDeviation = 10
     * Maximal time deviation in seconds between server and client before error message is displayed in chart.
     * @iatStudioExposed
     * @iatCategory Behavior
     */

    /**
     * @cfg {brease.enum.ChartZoomType} zoomType = 'xy'
     * Defines for which axes zooming should be possible.
     * @iatStudioExposed
     * @iatCategory Behavior
     * @bindable
     */

    /**
    * @cfg {widgets.brease.OnlineChartHDA.Graph} graph={}
    * @iatStudioExposed
    * @iatCategory Collections
    * Defines appearance and behaviour of the graph instances
    * @iatMeta StructuredProperty:true
    * @iatMeta minSize:1
    * @iatMeta maxSize:8
    */

    /**
    * @cfg {widgets.brease.OnlineChartHDA.XAxis} xAxis={}
    * @iatStudioExposed
    * @iatCategory Collections
    * Defines appearance and behaviour of the xAxis instances
    * @iatMeta StructuredProperty:true
    * @iatMeta minSize:1
    * @iatMeta maxSize:1
    */

    /**
    * @cfg {widgets.brease.OnlineChartHDA.YAxis} yAxis={}
    * @iatStudioExposed
    * @iatCategory Collections
    * Defines appearance and behaviour of the yAxis instances
    * @iatMeta StructuredProperty:true
    * @iatMeta minSize:1
    * @iatMeta maxSize:5
    */

    /**
    * @cfg {widgets.brease.OnlineChartHDA.Cursor} cursor={}
    * @iatStudioExposed
    * @iatCategory Collections
    * Defines appearance and behaviour of the cursor for data analysis
    * @iatMeta StructuredProperty:true
    * @iatMeta minSize:1
    * @iatMeta maxSize:1
    */

    return {
        updateBufferTime: 2000,
        updateChartTime: 200,
        maxTimeDeviation: 10,
        zoomType: 'xy',
        visible: true
    };

});
