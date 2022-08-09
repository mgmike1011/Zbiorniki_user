define([
    'brease/core/Class',
    'brease/events/BreaseEvent'], 
function (SuperClass, BreaseEvent) {

    'use strict';

    /**
    * @class widgets.brease.OnlineChartHDA.libs.MsgOverlay
    * #Description
    * Class used to draw and update the chart
    */
    /**
    * @method constructor
    * @param {Object} parent
    */
    var MsgOverlay = SuperClass.extend(function MsgOverlay(parent) {
            SuperClass.call(this);
            this.parent = parent;
            this.parentReady = false;
            this.parent.elem.addEventListener(BreaseEvent.WIDGET_READY, this._onParentReady.bind(this));
        }, null),

        p = MsgOverlay.prototype;

    p.create = function (text, closeable) {
        if (!this.$overlay) {
            this.$overlay = $('<div />', { class: 'breaseOnlineChartHDAErrorOverlay' });
            this.$msgBox = $('<div />', { class: 'breaseOnlineChartHDAErrorOverlayMsg' });
            this.$msg = $('<span />');
            this.$overlay.hide();
            this.$msgBox.hide();
            this.$msgBox.append(this.$msg);
            if (closeable) {
                this.$closeBtn = $('<div class="breaseOnlineChartHDAOverlayCloseBtn">x</div>');
                this.$msgBox.prepend(this.$closeBtn);
            }
            this.parent.el.append([this.$overlay, this.$msgBox]);
        }
        this.$msg.html(text);
        if (this.parentReady) {
            this._show();
        }
    };

    p.clear = function () {
        if (this.$overlay) {
            if (this.$closeBtn) {
                this.$closeBtn.off();
                this.$closeBtn.remove();
                this.$closeBtn = null;
            }
            this.$overlay.remove();
            this.$msgBox.remove();
            this.$overlay = null;
            this.$msgBox = null;
        }
    };

    p._onParentReady = function () {
        if (this.$overlay) {
            this._show();
        }
        this.parentReady = true;
    };

    p._show = function () {
        this.$overlay.show();
        this.$msgBox.show();
        if (this.$closeBtn) {
            var that = this;
            this.$closeBtn.off().on(BreaseEvent.CLICK, function (ev) {
                ev.stopPropagation();
                that.clear();
            });
        }
    };

    p.dispose = function () {
        this.clear();
    };

    return MsgOverlay;
});
