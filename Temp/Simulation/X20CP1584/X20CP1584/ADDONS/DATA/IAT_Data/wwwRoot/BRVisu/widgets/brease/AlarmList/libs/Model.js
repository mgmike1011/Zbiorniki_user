define([
    'widgets/brease/TableWidget/libs/Model'
], function (SuperClass) {

    'use strict';
    /** 
     * @class widgets.brease.AlarmList.libs.Model
     * Class for storing data and manipulating this data
     */

    var defaultSettings = {},
    
        ModelClass = SuperClass.extend(function Model(widget) {
            SuperClass.apply(this, arguments);
            this.widget = widget;
            this.categories = [];
            this.firstConnection = true;
        }, defaultSettings),

        p = ModelClass.prototype;

    /**
     * @method initialize
     * This method calls the superclass' initialize method and sets the error mode to false
     */
    p.initialize = function () {
        this.errorMode = false;
        SuperClass.prototype.initialize.call(this);
    };

    /**
     * @method updateTable
     * @private
     * @param {Object[]} data An array of data as defined by the /docs/MpAlarmHistory_WidgetConnection.docx
     * This method will store the retrieved data in the right position, and either append or prepend the data to already existing data, it will also create
     * a second variable to store the original state of the data, this is useful for when the filtering is to take place and there is data that isn't tampered
     * with.
     */
    p.updateTable = function (data) {

        if (data === undefined) { return; }
        this.currentData = $.extend(true, {}, data); //Store data to calculate
        this.data = data;

        //Add Alarm pictures to the alarm list and fix timestamp at the same time
        for (var itr = 0; itr < data.length; itr += 1) {
            data[itr].sta = this._addSVGToRow(data[itr].sta);
            data[itr].cat = this._fixCategory(data[itr].cat);
            data[itr].tim = this._fixTimestamp(data[itr].tim);
        } 

        this.widget.renderer.updateData(data);

    };

    /**
     * @method setMockData
     * Only to be called in the editor. Will grab some mock data to display in the editor.
     */
    p.setMockData = function () {
        if (!brease.config.editMode) { return false; }
        this.fetchData(_mockEditorData());
    };

    /**
     * @method getInstanceId
     * @param {Integer} selectedIndex
     * @returns {String}
     * This method will return the instance Id of the index passed to the function
     */
    p.getInstanceId = function (selectedIndex) {
        return this.currentData[selectedIndex].ins;
    };
    
    /**
     * @method setData
     * @param {Object} telegram
     * intermediary function to handle the telegram in the correct place.
     */
    p.setData = function (telegram) {
        switch (telegram.methodID) {
            case 'GetCategoryList':
                this.setCategories(telegram);
                break;
            default:
                this.fetchData(telegram);
                break;
        }
    };

    /**
     * @method setCategories
     * @param {Object} telegram data telegram from backend
     * This method retrieves a telegram with data about the available categories in the backend, it removes duplicates and
     * stores these in a parameter so that when the filter dialog is opened these values will be available.
     */
    p.setCategories = function (telegram) {
        this.categories = $.extend(true, [], _.uniq(telegram.data));
    };

    /**
     * @method fetchData
     * @private
     * @param {Object} telegram
     * The fetchData is the brain behind the AlarmList. It will decided where data should go, if more should be retrieved.
     * The AlarmList can however only retrieve the entire list at once, so if anything changes it will get the entire
     * alarmlist anew. If the methodId is of the type GetAlarmList this method will update the table with the new data
     */
    p.fetchData = function (telegram) {
        if (telegram === null) { return; }
        var sendData = false;
        this.telegram = $.extend(true, {}, telegram);

        if (this.telegram.methodID === 'GetUpdateCount') {
            this.widget._showBusyIndicator();
            if (this.widget.settings.counter !== this.telegram.data) {
                sendData = true;
                this.widget.settings.counter = this.telegram.data;
            } 

            if (this.widget.langChanged) {
                this.widget.langChanged = false;
                this.widget.settings.counter = 0;
                sendData = true;
            }
            
        } else if (this.telegram.methodID === 'GetAlarmList') {
            this.updateTable(this.telegram.data);
        
        } else if (this.telegram.methodID === 'SetAcknowledge') {
            if (this.telegram.response === 'OK') {
                sendData = true;
            }
        }

        if (sendData) {
            this.sendData();
        } else {
            this.widget._hideBusyIndicator();
        }
    };

    /**
     * @method getCategories
     * This method will request a list of categories from the backend.
     */
    p.getCategories = function () {
        this.widget.linkHandler.sendRequestAndProvideCallback('GetCategoryList', this.widget._updateData);
    };

    /**
     * @method sendAckData
     * @param {Object} telegram
     * @param {Boolean} ackAllFlag
     * This method will send the data to the backend about which alarm/alarms should be acknowledged by the backend.
     * If the method AckAll has been called, a flag is set so that when data is retrieved from the backend the right
     * action can be taken when redrawing the table.
     */
    p.sendAckData = function (telegram, ackAllFlag) {
        this.ackAllFlag = (ackAllFlag !== undefined) ? ackAllFlag : false;
        this.widget.linkHandler.sendDataAndProvideCallback(telegram.methodID, this.widget._updateData, telegram.data, telegram.parameter);
    };

    /**
     * @method sendData
     * This method will send a request to the backend to get the alarmlist again by sending the method id GetAlarmList.
     */
    p.sendData = function () {
        this.widget.linkHandler.sendRequestAndProvideCallback('GetAlarmList', this.widget._updateData);    
    };

    /**
     * @method _addSVGToRow
     * @private
     * @param {Integer|String} sta status per row
     * @returns {String}
     * This method will exchange the number passed to the corresponding status:
     *  - 1: Active
     *  - 2: Active but Acknowledged
     *  - 3: Inactive but not acknowledged
     * These images have to be specified in the property grid or the default value will be used.
     */
    p._addSVGToRow = function (sta) {

        if (isNaN(sta)) {
            //get nested number if anything else is sent in
            sta = parseInt(sta.match(/>[0-9]</)[0].match(/[0-9]/)[0]);
        }

        var img = '';
        if (sta === 1) {
            img = (this.widget.settings.imageActive === '') ? 'widgets/brease/AlarmList/assets/act_nack.svg' : this.widget.settings.imageActive;
        } else if (sta === 2) {
            img = (this.widget.settings.imageActiveAcknowledged === '') ? 'widgets/brease/AlarmList/assets/act_ack.svg' : this.widget.settings.imageActiveAcknowledged;
        } else if (sta === 3) {
            img = (this.widget.settings.imageInactive === '') ? 'widgets/brease/AlarmList/assets/nact_nack.svg' : this.widget.settings.imageInactive;
        } 

        return '<img src="' + img + '" /><div class="stateIdent">' + sta + '</div>';
    };

    /**
     * @method _fixCategory
     * @private
     * @param {String} cat the category per row
     * @returns {String}
     * This method will convert, or rather add the necessary pre- and suffix to complete the path to the image, as specifed by the settings
     * imagePrefix and imageSuffix.
     */
    p._fixCategory = function (cat) {
        var img = '';
        if (brease.config.editMode) {
            img = '<img src="widgets/brease/AlarmList/assets/' + cat + '.svg" /><div class="catIdent">' + cat + '</div>';
        } else if (cat.length > 0 && this.widget.settings.imagePrefix.length > 0) {
            img = '<img src="' + this.widget.settings.imagePrefix + cat + this.widget.settings.imageSuffix + '" /><div class="catIdent">' + cat + '</div>';
        } else if (cat.length > 0) {
            img = '<img src="" /><div class="catIdent">' + cat + '</div>';
        }
        return img;
    };

    /**
     * @method _mockEditorData
     * @private
     * @returns {Object} telegram for editor, not to be used in runtime
     */
    function _mockEditorData() {
        var mockData = { 'data': [
            { 'ad1': '', 'ad2': '', 'cat': 'cat0', 'cod': 10, 'ins': 0, 'mes': 'All these alarms are mocked and are in no way real', 'nam': 'Mocked Alarm', 'sco': '', 'sev': 1, 'sta': 1, 'tim': '1970-01-01T00:00:01.000+00:00' }, 
            { 'ad1': '', 'ad2': '', 'cat': 'cat1', 'cod': 2000, 'ins': 5, 'mes': 'Mocked:  Temperature level is critical ', 'nam': 'Mocked:  TemperatureCritical', 'sco': '', 'sev': 1, 'sta': 3, 'tim': '1970-01-01T11:33:15.141+00:00' }, 
            { 'ad1': '', 'ad2': '', 'cat': 'cat1', 'cod': 2001, 'ins': 4, 'mes': 'Mocked:  Temperature level is high', 'nam': 'Mocked:  TemperatureHigh', 'sco': '', 'sev': 2, 'sta': 1, 'tim': '1970-01-01T11:33:15.141+00:00' }, 
            { 'ad1': '', 'ad2': '', 'cat': 'cat2', 'cod': 0, 'ins': 3, 'mes': 'Mocked:  Initialization failed,  temperature error', 'nam': 'Mocked:  InitializationError', 'sco': 'gAxisBasic', 'sev': 2, 'sta': 2, 'tim': '1970-01-01T11:31:56.541+00:00' }, 
            { 'ad1': '', 'ad2': '', 'cat': 'cat2', 'cod': 0, 'ins': 2, 'mes': 'Mocked:  General axis error', 'nam': 'Mocked:  GeneralDriveError', 'sco': 'gAxisBasic', 'sev': 1, 'sta': 3, 'tim': '1970-01-01T11:31:56.341+00:00' }, 
            { 'ad1': '', 'ad2': '', 'cat': 'cat0', 'cod': 0, 'ins': 1, 'mes': 'Mocked:  Sequence import failed', 'nam': 'Mocked:  ImportFailed', 'sco': 'gSequencer', 'sev': 1, 'sta': 3, 'tim': '1970-01-01T11:31:55.741+00:00' }, 
            { 'ad1': '', 'ad2': '', 'cat': 'cat0', 'cod': 0, 'ins': 6, 'mes': 'Mocked:  Sequence import failed', 'nam': 'Mocked:  ImportFailed', 'sco': 'gSequencer', 'sev': 1, 'sta': 2, 'tim': '1970-01-01T11:31:55.865+00:00' }
        ], 
        'methodID': 'GetAlarmList', 
        'response': 'OK'
        };

        return mockData;
    }

    return ModelClass;

});
