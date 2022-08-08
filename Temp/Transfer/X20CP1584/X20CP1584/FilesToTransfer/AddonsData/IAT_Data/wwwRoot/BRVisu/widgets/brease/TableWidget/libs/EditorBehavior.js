define([
    'brease/core/Class',
    'widgets/brease/TableWidget/libs/EditorHandles'
], function (
    SuperClass, EditorHandles
) {

    'use strict';

    var defaultSettings = {},
    
        EditorBehaviorClass = SuperClass.extend(function Model(widget) {
            SuperClass.apply(this, arguments);
            this.widget = widget;
        }, defaultSettings),

        p = EditorBehaviorClass.prototype;

    p.initialize = function () {
        this.throttledFunc = _.throttle(this.reinitialize, 500);
        _initEditor(this);
    };

    p.reinitialize = function () {
        this.widget.renderer.rebuildView();
    };

    p.childrenInitializedEditor = function () {
        // console.log('%c Children in Editor initialized!', 'background: #222; color: #bada55');
    };

    p.childrenAdded = function (e) {
        this.throttledFunc();
    };

    p.childrenRemoved = function (e) {
        if (e.target === this.widget.elem) {
            var childrenWidgetId = e.detail.widgetId,
                index = this.widget.model.childrenIdList.indexOf(childrenWidgetId);
            if (index > -1) {
                this.widget.model.childrenList.splice(index, 1);
                this.widget.model.childrenIdList.splice(index, 1);
            }
        }
        this.reinitialize();
    };

    p.dispose = function () {
        // Do something
    };

    function _initEditor(that) {
        that.editMode = {};
        that.editMode.itemDefs = [];

        that.widget.el.find('[data-brease-widget]').each(function () {
            var d = $.Deferred();
            that.editMode.itemDefs.push(d);
        });

        $.when.apply($, that.editMode.itemDefs).done(function () {
            that.childrenInitializedEditor();
        });

        that.widget.el.addClass('iat-container-widget');

        var editorHandles = new EditorHandles(that.widget);
        that.widget.getHandles = function () {
            return editorHandles.getHandles();
        };
        that.widget.designer.getSelectionDecoratables = function () {
            return editorHandles.getSelectionDecoratables();
        };
    }

    return EditorBehaviorClass;
});
