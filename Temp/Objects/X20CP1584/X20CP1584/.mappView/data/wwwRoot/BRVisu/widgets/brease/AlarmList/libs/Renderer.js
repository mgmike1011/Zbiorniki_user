define([
    'widgets/brease/TableWidget/libs/Renderer'
], function (SuperClass) {

    'use strict';
    /** 
     * @class widgets.brease.AlarmList.libs.Renderer
     * Class for rendering the widget.
     */

    var RendererClass = SuperClass.extend(function Renderer(widget) {
            SuperClass.call(this);
            this.widget = widget;
        }, null),

        p = RendererClass.prototype;

    /**
     * @method setFilter
     * This method will pop the global jquery parameter for filters and apply the filtering algorithm for this specific TableWidget. 
     * As it would be impossible to keep track of which filter belongs to which TableWidget, especially when widgets are being disposed of etc, 
     * it is easier to call this method and set the filter right before filtering of data. So this method should be called before every redraw 
     * of the table. That way we can guarantee that the filter being applied to the TableWidget is the right one. THe only way to apply a filter 
     * though is by pushing a value to the the global jquery variable $.fn.dataTable.ext.search array. 
     * See: https://datatables.net/manual/plug-ins/search
     */
    p.setFilter = function () {
        var self = this;
        // if ($.fn.dataTable.ext.search.length !== 0) {
        if (!this.internal.filterSet) {
            //The function for filtering WILL ONLY BE CALLED IF THERE IS DATA IN THE TABLE!!!!
            $.fn.dataTable.ext.search.push(
                function (settings, data, dataIndex, row) {
                    var elem = $(settings.nTable).closest('[data-brease-widget="widgets/brease/AlarmList"]')[0];
                    if (!elem || elem.id !== self.widget.elem.id || self.widget.model.getPreparedData().length === 0) return true;
    
                    var accVal = (self.widget.settings.config.filter.length === 0), accAnd = true;
                    for (var i = 0; i < self.widget.settings.config.filter.length; i += 1) {
                        var fil = self.widget.settings.config.filter[i];
    
                        var vals = self._getComparativeAndOriginalValue(fil, self.widget.model.currentData[dataIndex]), origVal = vals[1], compVal = vals[0];
                        var val = self._getFilterStatement(origVal, fil.opVal, compVal);
                        
                        //Filter out if nested and is to be applied
                        if (fil.ext) {
                            val = (val & self._getNestedFilterStatement(fil.extCompVal, origVal, self._getStatus(row['sta'])));
                        }
            
                        //Split between whether we are in an 'OR' or 'AND' filter
                        if (fil.logVal === 1 || fil.logical === '') {
                            accVal = accVal || (accAnd && val);
                            accAnd = true;
                        } else if (fil.logVal === 0) {
                            accAnd = accAnd && val;
                        }
                        
                    }
                    return accVal;
                });
            this.internal.filterSet = true;
            this.internal.filterPos = $.fn.dataTable.ext.search.length - 1;
        }

    };

    /**
     * @method _getComparativeAndOriginalValue
     * @param {Object} fil
     * @param {String} fil.data
     * @param {Date|Integer|String} fil.comp
     * @param {Object} row
     * @returns {String[]}
     * This method will retrieve the comparative and original value from the row and filter given by the parameters and return in an array
     */
    p._getComparativeAndOriginalValue = function (fil, row) {
        var compVal, origVal;
        //Check if we are looking at time
        if (fil.data === 'tim') {
            compVal = this._fixTimestamp(fil.comp.split('Z')[0]).getTime();
            origVal = this._fixTimestamp(row.tim).getTime();
        } else if (fil.data === 'sta') {
            compVal = fil.comp;
            origVal = this._getStatus(row[fil.data]);
        } else if (fil.data === 'cat') {
            compVal = (this.widget.model && this.widget.model.categories) ? this.widget.model.categories[fil.comp] : undefined;
            origVal = row[fil.data];
        } else {
            compVal = fil.comp;
            origVal = row[fil.data];
        }

        return [compVal, origVal];
    };

    /**
     * @method _getStatus
     * @param {String|UInteger} sta
     * @returns {UInteger}
     * Will retrieve the status from a string and return it. Useful if an image tag is passed instead of a number.
     */
    p._getStatus = function (sta) {
        if (typeof (sta) === 'string') {
            var s = sta.match(/>\d</);
            return parseInt(sta[s.index + 1], 10);
        }

        return sta;
    };

    /**
     * @method _getNestedFilterStatement
     * @param {UInteger} active
     * @param {ANY} val not used
     * @param {UInteger} sta
     * @returns {Boolean}
     */
    p._getNestedFilterStatement = function (active, val, sta) {
        if (active === 0 && (sta === 1 || sta === 2)) {
            return true;
        } else if (active === 1 && (sta === 3 || sta === 4)) {
            return true;
        }

        return false;
    };
    
    /**
     * @method _rowEligibility
     * Helper method for the _colorMeBlue function 
     * @private
     * @param {Integer} currState
     * @param {Integer} currSev
     * @param {Object} style
     * @param {Integer} style.statePos
     * @param {Boolean} style.sevOneUse
     * @param {Integer} style.sevOne
     * @param {Integer} style.sevOnePos
     * @param {Boolean} style.sevTwoUse
     * @param {Integer} style.sevTwo
     * @param {Integer} style.sevTwoPos
     * @param {Integer} style.sevTwo
     * @returns {Boolean}
     */
    p._rowEligibility = function (currState, currSev, style) {
        //First check state (act, act ack, inact)
        if (currState === style.statePos || style.statePos === 5) {
            if (style.sevOneUse && style.sevTwoUse && style.sevTwoOp === 0) {
                return this._getFilterStatement(currSev, style.sevOnePos, style.sevOne) && this._getFilterStatement(currSev, style.sevTwoPos, style.sevTwo);
            } else if (style.sevOneUse && style.sevTwoUse && style.sevTwoOp === 1) {
                return this._getFilterStatement(currSev, style.sevOnePos, style.sevOne) || this._getFilterStatement(currSev, style.sevTwoPos, style.sevTwo);
            } else if (style.sevOneUse && !style.sevTwoUse) {
                return this._getFilterStatement(currSev, style.sevOnePos, style.sevOne);
            } else {
                return true;
            }
        } else {
            return false;
        }

    };

    /**
     * @method _centerImages
     * @private
     * This method will centralise the images in a table data cell. (For Status and Category columns)
     */
    p._centerImages = function () {
        if (this.widget.el) {
            var margin = 'calc(50% - ' + parseInt(this.widget.el.find('td > img').width()).toString() + ')';
            this.widget.el.find('td > img').css('margin-left', margin);
        }
    };

    /**
     * @method _colorMeBlue
     * Colloquialism: color me blue - make me feel sad. Used in Blues music.
     * This method will iterate over the currently displayed data set in the data table and if a row fits the criteria selected in the styling dialog,
     * it will be given the style class that corresponds to this rule.
     * @private
     */
    p._colorMeBlue = function () {

        if (this.widget.model.currentData === undefined) { return; }
        if (this.widget.model.currentData.length === 0) { return; }

        for (var j = 0; j < this.widget.el.find('tbody').children().length; j += 1) {
            for (var i = 0; i < this.widget.settings.config.style.length; i += 1) {

                var currRow = this._colorMeBlueHelp(j);
                if (currRow === undefined) {
                    continue;
                }
                var data = this.widget.model.currentData[currRow], rowEligible;
                if (data) {
                    rowEligible = this._rowEligibility(data.sta, data.sev, this.widget.settings.config.style[i]);
                }

                if (rowEligible) {
                    this.widget.el.find('tbody').children('tr:eq(' + j + ')').addClass('widgets_brease_AlarmListStyle_style_style' + this.widget.settings.config.style[i].namePos);
                }

            }
        }
    };

    /**
     * @method _colorMeBlueHelp
     * @param {UInteger} j
     * Helper function for the _colorMeBlue function, mostly developed to make unit tests easier.
     */
    p._colorMeBlueHelp = function (j) {
        if (this.dt.exists()) {
            var offset = (this.dt.getFilteredPage() * this.widget.settings.itemsPerPage) + j;
            return this.dt.getFilteredOffset(offset);
        } else {
            return undefined;
        }
    };
    
    return RendererClass;
});
