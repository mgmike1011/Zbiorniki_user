define([
    'widgets/brease/TableWidget/libs/Controller',
    'brease/events/BreaseEvent',
    'widgets/brease/AlarmList/libs/Dialogue'
], function (SuperClass, BreaseEvent, ConfigDialogue) {
    
    'use strict';
    /** 
     * @class widgets.brease.AlarmList.libs.Controller
     * Class for controlling user and widget input and directing this either to the model or the renderer directly.
     */
        
    var ControllerClass = SuperClass.extend(function Controller(widget) {
            SuperClass.call(this);
            this.widget = widget;
        }, null),

        p = ControllerClass.prototype;
    
    /**
     * @method _addClassSpecificEventListeners
     * @private
     * Adds the event listener for content activated handler to the document which will trigger when the content the AlarmList resides in get's
     * actived.
     * @param {Function} listener
     */
    p._addClassSpecificEventListeners = function (listener) {
        
        document.body.addEventListener(BreaseEvent.CONTENT_ACTIVATED, listener._bind('_contentActivatedHandler'));
    };
    
    /* Commands */
    /**
     * @method acknowledge
     * This method will get the which the currently selected row is and add it to a telegram and send it to backend, acknowledging this alarm
     * 
     */
    p.acknowledge = function () {
        if (this.widget.isDisabled) { return false; }
        // This message needs to be updated - Server returns a count but should return a get  
        if (this._getCurrentDataRow() === undefined) { return; }
        var message = {
            'request': 'Set', 
            'methodID': 'SetAcknowledge', 
            'parameter': {
                'ins': this._getCurrentDataRow().ins,
                'name': this.widget.elem.id
            }
        };
        this.selectedItem = undefined;
        this.widget.model.sendAckData(message);
    };

    /**
     * @method acknowledgeAll
     * this method will craft a telegram for the backend that acknowledges all alarms at once.
     */
    p.acknowledgeAll = function () {
        if (this.widget.isDisabled) { return false; }
        var message = {
            'request': 'Set', 
            'methodID': 'SetAcknowledgeAll'
        };
        this.widget.model.sendAckData(message, true);
    };

    /* Handler */
    /**
     * @method _contentActivatedHandler
     * @private
     * @param {Object} e
     * Removes the eventlistener for content activated, sets an error message if the binding to the mplink is missing,
     * finally subscribes to the method GetUpdateCount and retrieves the list of categories from the backend.
     */
    p._contentActivatedHandler = function (e) {
        if (e.detail.contentId === this.widget.settings.parentContentId && this) {
            document.body.removeEventListener(BreaseEvent.CONTENT_ACTIVATED, this._bind('_contentActivatedHandler'));
            if ((this.widget.bindings === undefined || this.widget.bindings['mpLink'] === undefined) && !brease.config.preLoadingState) {
                this._setMissingBindingErrorMsg();
            }
            this.widget.linkHandler.subscribeWithCallback('GetUpdateCount', this.widget._updateData);
            this.widget.model.getCategories();
        }    
    };

    /**
     * @method _contentDeactivatedHandler
     * @private
     * This method get's called when the content get's deactivated. It will unsubscribe from the server with the method
     * GetUpdateCount
     */
    p._contentDeactivatedHandler = function () {
        this.widget.linkHandler.unSubscribe('GetUpdateCount');
    };

    /**
     * @method languageChanged
     * This method will force the model to refetch the data from the backend, so the data is available in the correct
     * language.
     */
    p.languageChanged = function () {
        this.widget.model.sendData();
        this.widget.langChanged = true;
    };
        
    /* Public methods */

    /**
     * @method getEventItem
     * @param {UInteger} item
     * @returns {Object}
     * This method will retrieve the original data (unaltered by timestamps and images) for the given row index, and put it into an object with readable names
     * and return this.
     */
    p.getEventItem = function (item) {
        var data = this.widget.model.getRowFromCurrentData(item);

        var value = { 'additionalInfo1': data.ad1,
            'additionalInfo2': data.ad2,
            'category': data.cat,
            'code': data.cod,
            'instanceID': data.ins,
            'message': data.mes,
            'name': data.nam,
            'scope': data.sco,
            'severity': data.sev,
            'state': data.sta,
            'timestamp': data.tim.substring(0, 23) + 'Z'
        };
        return value;
    };

    /**
     * @method updateData
     * ONLY to be called in the editor
     * Set's mock data in the table and updates the renderer
     */
    p.updateData = function () {
        this.widget.model.setMockData();
        this.widget.renderer.updateData();
    };

    /**
     * @method openConf
     * This method instantiates a new configuration dialog and opens it with the type of configuration passed in the parameter
     * @param {String} type
     */
    p.openConf = function (type) {
        this.configDialogue = new ConfigDialogue(this.widget);
        this.configDialogue.open(type);
    };

    return ControllerClass;
});
