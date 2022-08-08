define(['widgets/brease/TableWidget/TableWidget',
    'widgets/brease/AlarmList/libs/Model',
    'widgets/brease/AlarmList/libs/Controller',
    'widgets/brease/AlarmList/libs/Config',
    'widgets/brease/AlarmList/libs/Renderer',
    'widgets/brease/common/MpLinkHandler/libs/MpLinkHandler',
    'brease/decorators/DragAndDropCapability',
    'widgets/brease/common/DragDropProperties/libs/DroppablePropertiesEvents'
], function (SuperClass, Model, Controller, AlarmConfig, Renderer, MpLinkHandler, dragAndDropCapability) {
    
    'use strict';
    
    /**
     * @class widgets.brease.AlarmList
     *
     * @mixins widgets.brease.common.DragDropProperties.libs.DroppablePropertiesEvents
     *
     * @breaseNote 
     * @extends widgets.brease.TableWidget
     * @requires widgets.brease.AlarmListStyle
     * @iatMeta studio:isContainer
     * true
     * 
     * @iatMeta category:Category
     * Data,Alarm
     *
     * @iatMeta description:short
     * AlarmList widget that connects to the mpAlarmXCore to display alarms set in that function block
     * @iatMeta description:de
     * Das AlarmList-Widget bietet die notwendige Schnittstelle zu mpAlarmXCore für die Auflistung der Systemalarme
     * @iatMeta description:en
     * AlarmList widget that connects to the mpAlarmXCore to display alarms set in that function block
     */

    /**
      * @event ItemClick
      * @iatStudioExposed
      * Fired when a row is clicked on.
      * @param {String} additionalInfo1
      * @param {String} additionalInfo2
      * @param {String} category
      * @param {Integer} code
      * @param {Integer} instanceID
      * @param {String} message
      * @param {String} name
      * @param {String} scope
      * @param {Integer} severity
      * @param {Integer} state
      * @param {String} timestamp
      * @param {String} horizontalPos horizontal position of click in pixel i.e '10px'
      * @param {String} verticalPos vertical position of click in pixel i.e '10px'
      */

    /**
      * @event ItemDoubleClick
      * @iatStudioExposed
      * Fired when a row is double clicked on.
      * @param {String} additionalInfo1
      * @param {String} additionalInfo2
      * @param {String} category
      * @param {Integer} code
      * @param {Integer} instanceID
      * @param {String} message
      * @param {String} name
      * @param {String} scope
      * @param {Integer} severity
      * @param {Integer} state
      * @param {String} timestamp
      * @param {String} horizontalPos horizontal position of click in pixel i.e '10px'
      * @param {String} verticalPos vertical position of click in pixel i.e '10px'
      */

    /**
     * @property {WidgetList} children=["widgets.brease.AlarmListItem"]
     * @inheritdoc  
     */

    var defaultSettings = AlarmConfig,

        WidgetClass = SuperClass.extend(function AlarmList() {
            SuperClass.apply(this, arguments);
        }, defaultSettings),

        p = WidgetClass.prototype;

    p.initModel = function () {
        this.model = new Model(this);
        this.model.initialize();
    };

    p.initController = function () {
        this.linkHandler = new MpLinkHandler(this);
        this.controller = new Controller(this);
        this.controller.initialize();
    };

    p.initRenderer = function () {
        this.renderer = new Renderer(this);
        this.renderer.initialize();
    };

    /**
     * @method setImagePrefix
     * Sets imagePrefix
     * @param {DirectoryPath} imagePrefix
     */
    p.setImagePrefix = function (imagePrefix) {
        this.settings.imagePrefix = imagePrefix;
        if (brease.config.editMode) {
            this.controller.updateData();
        }
    };

    /**
     * @method getImagePrefix
     * Returns imagePrefix
     * @return {DirectoryPath}
     */
    p.getImagePrefix = function () {
        return this.settings.imagePrefix;
    };

    /**
     * @method setImageSuffix
     * Sets imageSuffix
     * @param {ImageType} imageSuffix
     */
    p.setImageSuffix = function (imageSuffix) {
        this.settings.imageSuffix = imageSuffix;
        if (brease.config.editMode) {
            this.controller.updateData();
        }
    };

    /**
     * @method getImageSuffix
     * Returns imageSuffix
     * @return {ImageType}
     */
    p.getImageSuffix = function () {
        return this.settings.imageSuffix;
    };

    /**
     * @method setImageActive
     * Sets imageActive
     * @param {ImagePath} imageActive
     */
    p.setImageActive = function (imageActive) {
        this.settings.imageActive = imageActive;
        if (brease.config.editMode) {
            this.controller.updateData();
        }
    };

    /**
     * @method getImageActive
     * Returns imageActive
     * @return {ImagePath}
     */
    p.getImageActive = function () {
        return this.settings.imageActive;
    };

    /**
     * @method setImageActiveAcknowledged
     * Sets imageActiveAcknowledged
     * @param {ImagePath} imageActiveAcknowledged
     */
    p.setImageActiveAcknowledged = function (imageActiveAcknowledged) {
        this.settings.imageActiveAcknowledged = imageActiveAcknowledged;
        if (brease.config.editMode) {
            this.controller.updateData();
        }
    };

    /**
     * @method getImageActiveAcknowledged
     * Returns imageActiveAcknowledged
     * @return {ImagePath} imageActiveAcknowledged
     */
    p.getImageActiveAcknowledged = function () {
        return this.settings.imageActiveAcknowledged;
    };

    /**
     * @method setImageInactive
     * Sets imageInactive
     * @param {ImagePath} imageInactive
     */
    p.setImageInactive = function (imageInactive) {
        this.settings.imageInactive = imageInactive;
        if (brease.config.editMode) {
            this.controller.updateData();
        }
    };

    /**
     * @method getImageInactive
     * Returns imageInactive
     * @return {ImagePath}
     */
    p.getImageInactive = function () {
        return this.settings.imageInactive;
    };

    /**
     * @method setHeaderSorting
     * Sets headerSorting
     * @param {Boolean} headerSorting
     */
    p.setHeaderSorting = function (headerSorting) {
        this.settings.headerSorting = headerSorting;
    };

    /**
     * @method getHeaderSorting
     * Returns headerSorting
     * @return {Boolean}
     */
    p.getHeaderSorting = function () {
        return this.settings.headerSorting;
    };

    /**
     * @method setMpLink
     * Data is received from 
     * @param {MpComIdentType} telegram
     */
    p.setMpLink = function (telegram) {
        //We do not want to deal with data transfer in precaching mode
        if (brease.config.preLoadingState) return;
        this.linkHandler.incomingMessage(telegram);
    };

    /**
     * @method getMpLink
     * At initialization it is called, it may not be called later
     * @return {Object}
     */
    p.getMpLink = function () {
        return this.settings.mpLink;
    };

    p._updateData = function (message, telegram) {
        if (!message.includes('Error')) {
            this.model.setData(telegram);
        }
    };

    /* Actions */

    /**
      * @method acknowledge
      * @iatStudioExposed
      * Acknowledge currently selected alarm
      */
    p.acknowledge = function () {
        if (this.isDisabled) { return; }

        this.controller.acknowledge();
    };

    /**
      * @method acknowledgeAll
      * @iatStudioExposed
      * Acknowledges all alarms
      */
    p.acknowledgeAll = function () {
        if (this.isDisabled) { return; }
        
        this.controller.acknowledgeAll();
    };

    /**
      * @method selectAlarmById
      * @param {UInteger} instanceID
      * @iatStudioExposed
      * Goes to a page where the alarm is and selects this row, does not trigger an itemClick event.
      */
    p.selectAlarmById = function (instanceID) {
        this.renderer.displayRowInTable({ ins: instanceID });
    };

    p.dispose = function () {
        this.controller._contentDeactivatedHandler();
        SuperClass.prototype.dispose.apply(this, arguments);
    };

    p.wake = function () {
        this.controller._addClassSpecificEventListeners(this.controller);
        SuperClass.prototype.wake.apply(this, arguments);
    };

    p.suspend = function () {
        this.controller._contentDeactivatedHandler();
        this.linkHandler.reset();
        SuperClass.prototype.suspend.apply(this, arguments);
    };

    return dragAndDropCapability.decorate(WidgetClass, false);

});
