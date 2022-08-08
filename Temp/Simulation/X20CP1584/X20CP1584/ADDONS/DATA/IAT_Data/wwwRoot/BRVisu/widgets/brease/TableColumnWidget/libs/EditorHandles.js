define([
    'brease/core/Class'
], function (
    SuperClass
) {

    'use strict';

    var ModuleClass = SuperClass.extend(function EditorHandles(widget) {
            SuperClass.call(this);
            this.widget = widget;
        }, null),

        p = ModuleClass.prototype;

    p.getHandles = function () {

        var self = this;
        return {
            moveHandles: [],
            pointHandles: [],
            resizeHandles: [{

                start: function () {
                },

                update: function (newBox, direction) {

                    var updatedBox = {
                        size: newBox.width,
                        top: newBox.top,
                        left: newBox.left
                    };

                    switch (direction) {

                        case 'n':
                        case 's':
                        case 'w':
                            updatedBox.size = newBox.width;
                            // updatedBox.top = newBox.top + (self.widget.settings.width - updatedBox.size) / 2;
                            // updatedBox.left = newBox.left;
                            break;
                        case 'e':
                            updatedBox.size = newBox.width;
                            // updatedBox.top = newBox.top + (self.widget.settings.width - updatedBox.size) / 2;
                            // updatedBox.left = newBox.left;
                            break;

                        case 'nw':
                        case 'ne':
                        case 'sw':
                        case 'se':
                            break;

                        default:
                            console.iatWarn('Direction ' + direction + ' not valid');
                    }

                    self.widget.settings.width = updatedBox.size;

                    _redrawWidget(self);
                },
                finish: function () {
                    var returnBox = {
                        top: self.widget.settings.top,
                        left: self.widget.settings.left,
                        height: self.widget.settings.height,
                        width: self.widget.settings.width
                    };
                    return returnBox;
                },
                handle: function () {
                    return self.widget.elem;
                }
            }]
        };
    };

    p.getSelectionDecoratables = function () {
        return [this.widget.elem];
    };

    function _redrawWidget(self) {
        self.widget.el.css('width', self.widget.settings.width);
        self.widget.widthUpdate(self.widget.settings.width);
    }

    return ModuleClass;
});
