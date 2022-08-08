
define([
    'widgets/brease/TableWidgetStyle/TableWidgetStyle'
], function (SuperClass) {
    
    'use strict';

    /**
     * @class widgets.brease.AlarmListStyle
     * #Description
     * AlarmListStyle - abstract widget to set styles in the AlarmList  
     * Text can be language dependent.  
     * @breaseNote 
     * @extends widgets.brease.TableWidgetStyle
     * @iatMeta studio:visible
     * false
     * @abstract
     */

    var WidgetClass = SuperClass.extend(function AlarmListStyle() {
        SuperClass.apply(this, arguments);
    }, false);

    return WidgetClass;

});
