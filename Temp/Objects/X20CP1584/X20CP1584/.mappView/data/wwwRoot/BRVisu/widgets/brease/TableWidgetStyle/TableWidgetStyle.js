define([
    'brease/core/BaseWidget'
], function (
    SuperClass
) {
   
    'use strict';

    /**
     * @class widgets.brease.TableWidgetStyle
     * #Description
     * TableWidgetStyle - abstract widget to set styles in the AlarmListStyle/AlarmHistoryStyle/AuditListStyle.  
     * Text can be language dependent.  
     * @breaseNote 
     * @extends brease.core.BaseWidget
     * @iatMeta studio:visible
     * false
     * @abstract
     */

    var WidgetClass = SuperClass.extend(function TableWidgetStyle() {
        SuperClass.apply(this, arguments);
    }, false);

    return WidgetClass;

});
