define(['brease/core/Class'], function (SuperClass) {

    'use strict';

    /**
    * @class widgets.brease.OnlineChartHDA.libs.EjChartCache
    * #Description
    * Extendends snyfusion ejChart to cache data which synfusion would oderwise recalulate on each redraw
    */
    /**
    * @method constructor
    */
    var EjChartCache = SuperClass.extend(function EjChartCache() {
            SuperClass.call(this);
            this.textSizeCache = {};
        }, null),

        p = EjChartCache.prototype;

    p.cacheTextSize = function (text, font, bounds) {
        var textLen = text.toString().length;
        if (!this.textSizeCache[font.fontFamily]) {
            this.textSizeCache[font.fontFamily] = { fontFamily: font.fontFamily };
        }
        if (!this.textSizeCache[font.fontFamily][font.size]) {
            this.textSizeCache[font.fontFamily][font.size] = { fontSize: font.size };      
        }
        if (!this.textSizeCache[font.fontFamily][font.size][textLen]) {
            // reserver some additional space in width because the cache just uses the text length
            bounds.width = bounds.width * 1.2;
            // store the bounds with the text length as key. Keep in mind that this not strictly exact because different text content with the same length could result in different text bounds !
            this.textSizeCache[font.fontFamily][font.size][textLen] = { bounds: bounds };            
        }
    };

    p.getTextSize = function (text, font) {
        if (text == null) {
            return { width: 0, height: 0 };
        }
        var textLen = text.toString().length;
        if (this.textSizeCache[font.fontFamily] && 
            this.textSizeCache[font.fontFamily][font.size] && 
            this.textSizeCache[font.fontFamily][font.size][textLen]) {
            return this.textSizeCache[font.fontFamily][font.size][textLen].bounds;                                       
        }
    };

    p.dispose = function () {
    };

    return EjChartCache;
});
