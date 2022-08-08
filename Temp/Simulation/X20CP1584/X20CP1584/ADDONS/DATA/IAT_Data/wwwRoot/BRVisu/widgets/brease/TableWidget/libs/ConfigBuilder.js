define(function () {
    'use strict';

    /**
     * @class widgets.brease.TableWidget.libs.ConfigBuilder
     * @extends core.javascript.Object
     * Class for converting a string recieved on the filter-, sorting- or styling configuration that is easily readable and understandable 
     * and converts this to a json object that the widget can use, and vice verse. 
     */

    function ConfigBuilder() {
    }

    var p = ConfigBuilder.prototype;

    /**
     * @method parse
     * external method to parse a json string into a functioning filter, sorting or styling for a TableWidget 
     * @param {String} type the type of json string. Valid arguments are Filter/filter, Sort/sort, or Style/style
     * @param {String} string string that is to be turned into a json object
     * @param {String} id the id of the widget that is calling this method
     * @returns {Object[]} Returns an array of all objects
     */
    p.parse = function (type, string, id) {
        var val;
        switch (type) {
            case 'filter':
            case 'Filter':
                val = this._parseFilter(string, id);
                break;
                
            case 'sort':
            case 'Sort':
                val = this._parseSort(string, id);
                break;
                
            case 'style':
            case 'Style':
                val = this._parseStyle(string, id);
                break;
            default:
                val = {};
                break;
        }
        return val;
    };

    /**
     * @method serialize
     * This method will take the json object passed and will turn it into a serialized string that can be sent to the backend.
     * @param {String} type the type of json object. Valid arguments are Filter/filter, Sort/sort, or Style/style
     * @param {Object[]} json the json object to be serialized, should be added to an array.
     * @returns {String} the serialized string that is returned
     */
    p.serialize = function (type, json) {
        var val = '';
        switch (type) {
            case 'filter':
            case 'Filter':
                val = this._serializeFilter(json);
                break;
                
            case 'sort':
            case 'Sort':
                val = this._serializeSort(json);
                break;
                
            case 'style':
            case 'Style':
                val = this._serializeStyle(json);
                break;
        }
        return val;
    };

    /**
     * @method _parseFilter
     * @private
     * This takes a filter parameter of predefined structure, the id of the widget and parses this into a json object
     * the widget itself can use to filter rows.
     * @param {String} filter 
     * @param {String} id
     */
    p._parseFilter = function (filter, id) {
        if (filter === undefined || filter === '' || filter === null) { return []; }
        var t = this._parseJSON(filter, 'filter', id);
        if (t === undefined || t.length === undefined || t.length === 0) { return []; }
        var jsonObj = {}, jsonList = [];
        
        var i;
        for (i = 0; i < t.length; i += 1) {
            jsonObj.opVal = this._convertOp(t[i].conditionType);
            jsonObj.data = t[i].columnType;
            jsonObj.comp = t[i].value;
            jsonObj.logVal = this._convertLogVal(t[i].logicalOperator);
            jsonObj.logical = t[i].logicalOperator;

            if (t[i].useAlarmState !== undefined) {
                jsonObj.ext = (t[i].useAlarmState === 'true' || t[i].useAlarmState === true);
                jsonObj.extCompVal = t[i].alarmState;
            }
            jsonList.push($.extend(true, {}, jsonObj));
        }
        jsonList[i - 1].logical = '';
        return jsonList;
    };

    /**
     * @method _serializeFilter
     * @private
     * This method takes a json object as defined by the widget and serializes this into a string the user can bind to a variable in the backend.
     * @param {Object} json
     */
    p._serializeFilter = function (json) {
        if (json === undefined || json === '') { return []; }
        var filter = {}, filterList = [];

        for (var i = 0; i < json.length; i += 1) {
            filter.logicalOperator = this._deconvertLogVal(json[i].logVal);
            filter.value = json[i].comp;
            filter.conditionType = this._deconvertOp(json[i].opVal);
            filter.columnType = json[i].data;

            if (json[i].ext !== undefined) {
                filter.useAlarmState = (json[i].ext);
                filter.alarmState = json[i].extCompVal;
            }
            filterList.push($.extend(true, {}, filter));
        }

        return JSON.stringify(filterList);
    };

    /**
     * @method _parseSort
     * @private
     * This takes a sort parameter of predefined structure, the id of the widget and parses this into a json object
     * the widget itself can use to sort rows.
     * @param {String} sort 
     * @param {String} id
     */
    p._parseSort = function (sort, id) {
        if (sort === undefined || sort === '' || sort === null) { return []; }
        var t = this._parseJSON(sort, 'sort', id);
        if (t === undefined || t.length === undefined || t.length === 0) { return []; }
        return t;
    };

    /**
     * @method _serializeSort
     * @private
     * This method takes a json object as defined by the widget and serializes this into a string the user can bind to a variable in the backend.
     * @param {Object} sort
     */
    p._serializeSort = function (sort) {
        if (sort === undefined || sort === '') { return []; }
        return JSON.stringify(sort);
    };

    /**
     * @method _parseStyle
     * @private
     * This takes a style parameter of predefined structure, the id of the widget and parses this into a json object
     * the widget itself can use to style rows.
     * @param {String} style 
     * @param {String} id
     */
    p._parseStyle = function (style, id) {
        if (style === undefined || style === '' || style === null) { return []; }
        var t = this._parseJSON(style, 'style', id);
        if (t === undefined || t.length === undefined || t.length === 0) { return []; }
        var jsonObj = {}, jsonList = [];

        for (var i = 0; i < t.length; i += 1) {
            if (t[i].alarmState !== undefined) {
                jsonObj.namePos = t[i].styleNbr;
                jsonObj.statePos = t[i].alarmState;
                jsonObj.sevTwoOp = this._convertLogVal(t[i].logicalOperator);
                jsonObj.sevOneUse = t[i].severity[0].useState;
                jsonObj.sevOne = t[i].severity[0].value;
                jsonObj.sevOnePos = this._convertOp(t[i].severity[0].conditionType);
                jsonObj.sevTwoUse = t[i].severity[1].useState;
                jsonObj.sevTwo = t[i].severity[1].value;
                jsonObj.sevTwoPos = this._convertOp(t[i].severity[1].conditionType);
            } else {
                jsonObj.namePos = t[i].styleNbr;
                jsonObj.statePos = t[i].type;
            }
            jsonList.push($.extend(true, {}, jsonObj));
        }

        return jsonList;
    };

    /**
     * @method _serializeStyle
     * @private
     * This method takes a json object as defined by the widget and serializes this into a string the user can bind to a variable in the backend.
     * @param {Object} json
     */
    p._serializeStyle = function (json) {
        if (json === undefined || json === '') { return []; }
        var style = {}, styleList = [], sev1 = {}, sev2 = {};
        for (var i = 0; i < json.length; i += 1) {
            if (json[i].sevOneUse !== undefined) {
                style.styleNbr = json[i].namePos;
                style.alarmState = json[i].statePos;
                style.logicalOperator = this._deconvertLogVal(json[i].sevTwoOp);
                style.severity = [];
                sev1.useState = json[i].sevOneUse;
                sev1.value = json[i].sevOne;
                sev1.conditionType = this._deconvertOp(json[i].sevOnePos);
                style.severity.push(sev1);

                sev2.useState = json[i].sevTwoUse;
                sev2.value = json[i].sevTwo;
                sev2.conditionType = this._deconvertOp(json[i].sevTwoPos);
                style.severity.push(sev2);

            } else {
                style.styleNbr = json[i].namePos;
                style.type = json[i].statePos;

            }
            styleList.push($.extend(true, {}, style));
        }
        return JSON.stringify(styleList);
    };

    /**
     * @method _parseJSON
     * @private
     * This method will try to parse a string into a json object. If it fails, a warning will be printed in the console regarding
     * which widget and method failed.
     * @param {String} json string that represents the json object
     * @param {String} type filter/style/sort used for displaying a warning in the console log
     * @param {String} id the id of the widget, used for displaying a warning in the console log 
     */
    p._parseJSON = function (json, type, id) {
        try {
            return JSON.parse(json);
        } catch (err) {
            console.warn('The json for the', type, 'configuration in the', id, 'is invalid');
        }
    };

    /**
     * @method _convertLogVal
     * @private
     * This method converts the words and/or into the respective values 0 / 1
     */
    p._convertLogVal = function (logicalOperator) {
        var retVal;
        switch (logicalOperator) {
            case 'and': 
                retVal = 0;
                break;
                
            case 'or': 
                retVal = 1;
                break;
        }
        return retVal;
    };

    /**
     * @method _deconvertLogVal
     * @private
     * This method converts the values 0 / 1 into the respective words and/or
     */
    p._deconvertLogVal = function (logicalOperator) {
        var retVal;
        switch (logicalOperator) {
            case 0: 
                retVal = 'and';
                break;
                
            case 1: 
                retVal = 'or';
                break;
        }
        return retVal;
    };

    /**
     * @method _convertOp
     * @private
     * This method converts the a string representing an operation into a value the algorithm can use. According to:
     * '<>':               0
     * '==':               1
     * '<':                2
     * '<=':               3
     * '>':                4
     * '>=':               5
     * 'Contains':         6
     * 'Does not contain': 7
     * @param {String} operator
     */
    p._convertOp = function (operator) {
        var retVal;
        switch (operator) {
            case '<>': retVal = 0; break; 
            case '==': retVal = 1; break;
            case '<': retVal = 2; break;
            case '<=': retVal = 3; break;
            case '>': retVal = 4; break;
            case '>=': retVal = 5; break;
            case 'Contains': retVal = 6; break;
            case 'Does not contain': retVal = 7; break;
        }
        return retVal;
    };

    /**
     * @method _deconvertOp
     * @private
     * This method deconverts a value into a string represeting an operator a user can understand.
     * For conversion see the method _convertOp.
     * @param {UInteger} operator
     */
    p._deconvertOp = function (operator) {
        var retVal;
        switch (operator) {
            case 0: retVal = '<>'; break;
            case 1: retVal = '=='; break;
            case 2: retVal = '<'; break;
            case 3: retVal = '<='; break;
            case 4: retVal = '>'; break;
            case 5: retVal = '>='; break;
            case 6: retVal = 'Contains'; break;
            case 7: retVal = 'Does not contain'; break;
        }
        return retVal;
    };

    return ConfigBuilder;
});
