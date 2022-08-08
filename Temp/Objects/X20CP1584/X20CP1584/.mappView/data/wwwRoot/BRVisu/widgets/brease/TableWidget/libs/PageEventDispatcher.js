define(['brease/core/Types'], function (Types) {

    'use strict';
    /** 
    * @class widgets.brease.TableWidget.libs.PageEventDispatcher
    * Helper class to fire pageEvents for the Table Classes
    * @extends Object
    */
    /**
    * @method constructor
    */
    var PageEventDispatcher = function () {
            this.currentPage = 0;
            this.lastPage = 0;
            this.maxPageNumber = 1;
        },
        eventTypes = ['FirstPageNumber', 'PreviousPageNumber', 'CurrentPageNumber', 'NextPageNumber', 'LastPageNumber'],
        p = PageEventDispatcher.prototype;

    /**
    * @method init
    * @param {Function} callback 
    */
    p.init = function (callback) {
        if (typeof callback === 'function') {
            this.callback = callback;
        }
    };
    /**
    * @method hasCallback
    * returns true if a callback has been set
    * @returns {Boolean} 
    */
    p.hasCallback = function () {
        return typeof this.callback === 'function';
    };
    /**
    * @method setCurrentPage
    * @param {Integer} currentPage
    */
    p.setCurrentPage = function (currentPage) {
        this.currentPage = Types.parseValue(currentPage, 'Integer', { min: 0, default: 0 });
    };
    /**
    * @method getCurrentPage
    * @returns {Integer}
    */
    p.getCurrentPage = function () {
        return this.currentPage;
    };
    /**
    * @method setLastPage
    * @param {Integer} lastPage
    */
    p.setLastPage = function (lastPage) {
        this.lastPage = Types.parseValue(lastPage, 'Integer', { min: 0, default: 0 });
        this.maxPageNumber = Types.parseValue(this.lastPage, 'Integer', { min: 1, default: 1 });
    };
    /**
    * @method getLastPage
    * @returns {Integer}
    */
    p.getLastPage = function () {
        return this.lastPage;
    };
    /**
    * @method getMaxPageNumber
    * @returns {Integer}
    */
    p.getMaxPageNumber = function () {
        return this.maxPageNumber;
    };
    /**
    * @method dispatchEvent
    * calls the callback with given parameters depending on 
    * the type and the currentPage / lastPage 
    * @param {String} type
    * type of the event to dispatch. for available types call getEventTypes()
    */
    p.dispatchEvent = function (type) {
        var data = this.createPageEvent(type);
        if (this.hasCallback() && data !== null) {
            this.callback(type, data);
        }
    };
    /**
    * @method createPageEvent
    * creates event data based on the event type
    * @param {String} type
    * type of the event to dispatch. for available types call getEventTypes()
    */
    p.createPageEvent = function (type) {
        return _getDataForEvent.call(this, type);
    };
    /**
    * @method getEventTypes
    * returns an array of supported event types
    * @param {Array} eventTypes
    * array of strings for the supported events
    */
    p.getEventTypes = function () {
        return eventTypes;
    };

    p.dispose = function () {
        this.callback = null;
    };

    function _getDataForEvent(type) {
        var data = {
            pageNumber: 1,
            pageText: '',
            show: false,
            select: 0
        };

        switch (type) {
            case 'FirstPageNumber':
                data.pageNumber = Types.parseValue(1, 'Integer', { min: 1, max: this.maxPageNumber, default: 1 });
                data.show = (this.currentPage !== 1);
                data.select = (this.currentPage === 1) | 0;
                break;
            case 'PreviousPageNumber':
                data.pageNumber = Types.parseValue(this.currentPage - 1, 'Integer', { min: 1, max: Math.max(this.maxPageNumber - 1, 1), default: 1 });
                data.show = (this.lastPage > 0);
                data.select = (this.currentPage === 1) | 0;
                break;
            case 'CurrentPageNumber':
                data.pageNumber = Types.parseValue(this.currentPage, 'Integer', { min: 1, max: this.maxPageNumber, default: 1 });
                data.show = (this.lastPage > 1);
                data.select = ((this.currentPage !== 1 && this.currentPage !== this.lastPage) || (this.currentPage !== 1 && this.lastPage < 3)) | 0;
                data.pageAlternativeNumber = (this.currentPage === this.lastPage && this.lastPage > 2) ? this.lastPage - 1 : (this.currentPage === 1) ? 2 : (this.currentPage === 2) ? 2 : this.currentPage;
                data.pageAlternativeText = data.pageAlternativeNumber.toString();
                break;
            case 'NextPageNumber':
                data.pageNumber = Types.parseValue(this.currentPage + 1, 'Integer', { min: 1, max: this.maxPageNumber, default: 1 });
                data.show = (this.lastPage > 2);
                data.select = (this.currentPage === this.lastPage) | 0;
                break;
            case 'LastPageNumber':
                data.pageNumber = this.maxPageNumber;
                data.show = (this.currentPage !== this.lastPage && this.lastPage > 1);
                data.select = (this.currentPage === this.lastPage) | 0;
                break;
            default:
                return null;
        }
        if (this.lastPage === 0) {
            data.pageNumber = 0;
        }
        data.pageText = data.pageNumber.toString();
        return data;
    }

    return PageEventDispatcher;
});
