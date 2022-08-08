define([
    'widgets/brease/TableColumnWidget/TableColumnWidget',
    'brease/events/BreaseEvent',
    'brease/core/Types',
    'brease/enum/Enum'
], function (SuperClass, BreaseEvent, Types, Enum) {

    'use strict';

    /**
     * @class widgets.brease.AlarmListItem
     * @extends widgets.brease.TableColumnWidget
     *
     * @iatMeta category:Category
     * Data
     *
     * @iatMeta description:short
     * AlarmListItem, widget used to set the columns wanted to be shown in the Alarmlist
     * @iatMeta description:de
     * Das AlarmListItem-Widget stellt eine Spalte im AlarmList-Widget dar
     * @iatMeta description:en
     * AlarmListItem, widget used to set the columns wanted to be shown in the Alarmlist
     */

    /**
     * @property {WidgetList} parents=["widgets.brease.AlarmList"]
     * @inheritdoc  
     */

    /**
     * @cfg {brease.enum.AlarmListItemType} columnType='message'
     * @iatStudioExposed
     * @iatCategory Behavior
     * Type the Alarmlist column will display
     */

    var defaultSettings = {
            text: '',
            columnType: Enum.AlarmListItemType.mes
        },

        WidgetClass = SuperClass.extend(function AlarmListItem() {
            SuperClass.apply(this, arguments);
        }, defaultSettings),

        p = WidgetClass.prototype;

    p.init = function () {
        SuperClass.prototype.init.call(this);
        this.el.addClass('breaseAlarmListItem');
    };

    /**
    * @method setColumnType
    * Sets columnType
    * @param {brease.enum.AlarmListItemType} columnType
    */
    p.setColumnType = function (columnType) {
        this.settings.columnType = columnType;
        var event = new CustomEvent('ColumnTypeChanged', { detail: { columnType: Enum.AlarmListItemType.getKeyForValue(columnType) }, bubbles: true, cancelable: true });
        this.dispatchEvent(event);
    };

    /**
     * @method getColumnType 
     * Returns columnType.
     * @return {brease.enum.AlarmListItemType}
     */
    p.getColumnType = function () {
        return this.settings.columnType;
    };

    p.getShortColumnType = function () {
        if (this.settings.columnType !== Enum.AlarmListItemType.tim) {
            return { data: Enum.AlarmListItemType.getKeyForValue(this.settings.columnType) };
        } else {
            return {
                data: Enum.AlarmListItemType.getKeyForValue(this.settings.columnType),
                type: 'num',
                render: {
                    _: 'display',
                    sort: 'value'
                }
            };
        }
    };

    p.setData = function (telegram) {
        this.telegram = telegram;
    };

    return WidgetClass;
});
