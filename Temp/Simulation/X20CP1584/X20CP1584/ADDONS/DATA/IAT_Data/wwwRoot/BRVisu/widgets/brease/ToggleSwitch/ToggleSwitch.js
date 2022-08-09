define([
    'widgets/brease/ToggleButton/ToggleButton',
    'brease/enum/Enum',
    'brease/core/Utils',
    'brease/events/BreaseEvent',
    'widgets/brease/common/libs/wfUtils/UtilsImage',
    'brease/core/Types'
], function (
    SuperClass, Enum, Utils, BreaseEvent, UtilsImage, Types
) {

    'use strict';

    /**
        * @class widgets.brease.ToggleSwitch
        * #Description
        * Switch, which toggles between two values
        * @extends widgets.brease.ToggleButton
        * @iatMeta studio:license
        * licensed
        * @iatMeta category:Category
        * Buttons
        * @iatMeta description:short
        * Schiebeschalter
        * @iatMeta description:de
        * Schaltet einen Wert zwischen true und false über Touch-Gesten des Benutzers
        * @iatMeta description:en
        * Toggles a value between true and false with touch gestures by the user
        */

    var defaultSettings = {
            height: 30,
            width: 100,
            text: '',
            mouseDownText: '',
            image: '',
            mouseDownImage: ''
        },

        WidgetClass = SuperClass.extend(function ToggleSwitch() {
            SuperClass.apply(this, arguments);
        }, defaultSettings),

        p = WidgetClass.prototype;

    /**
        * @property {Object} values
        * Possible values for property "value".  
        * @property {Boolean} values.checked=true
        * @property {Boolean} values.unchecked=false
        * @static
        * @readonly
        */
    WidgetClass.values = {
        checked: true,
        unchecked: false
    };

    p.init = function () {
        if (this.settings.omitClass === true) {
            this.elem.classList.remove('breaseToggleSwitch');
        }
        this.slider = this.el.find('.breaseToggleSwitch_toggle');
        if (this.slider.length) {
            // used to retrieve the configured sliderHeight when height = auto 
            this.sliderClone = this.slider.get(0).cloneNode(true);
            this.sliderClone.classList.add('remove');
            this.elem.appendChild(this.sliderClone);
        }
        _appendWrapper(this);
        _appendText(this);
        this.setClasses();
        SuperClass.prototype.init.call(this);
        if (this.settings.height === 'auto' && Utils.isPercentageValue(_getSliderHeight.call(this))) {
            this.slider.css({ height: 'auto', 'align-self': 'stretch' });
        }
        if (brease.config.editMode !== true && this.sliderClone) {
            this.elem.removeChild(this.sliderClone);
            this.sliderClone = null;
        }
    };
    p._initEditor = function () {
        var widget = this;
        this.elem.addEventListener(BreaseEvent.WIDGET_STYLE_PROPERTIES_CHANGED, function () {
            if (widget.settings.height === 'auto' && Utils.isPercentageValue(_getSliderHeight.call(widget))) {
                widget.slider.css({ height: 'auto', 'align-self': 'stretch' });
            } else {
                widget.slider.css({ height: '', 'align-self': '' });
            }
        });
        this.dispatchEvent(new CustomEvent(BreaseEvent.WIDGET_EDITOR_IF_READY, { bubbles: true }));
    };

    /**
        * @method setText
        * @iatStudioExposed
        * Sets the visible text. This method can remove an optional textkey.
        * @param {String} text
        * @param {Boolean} [keepKey=false] Set true, if textkey should not be removed
        */
    p.setText = function (text, keepKey) {
        this.settings.text = text;

        if (keepKey !== true) {
            this.removeTextKey();
        }

        if (brease.config.editMode !== true) {
            if (brease.language.isKey(this.settings.text) === true) {
                this.setTextKey(brease.language.parseKey(this.settings.text), false);
                this.langChangeHandler();
                return;
            }
        }

        if (this.textEl !== undefined) {
            _textUpdate(this);
        }
    };

    /**
        * @method getText
        * Returns the visible text.
        * @return {String}
        */
    p.getText = function () {
        return this.settings.text;
    };

    /**
        * @method setMouseDownText
        * @iatStudioExposed
        * Sets the visible text for checked state. This method can remove an optional textkey.
        * @param {String} text
        * @param {Boolean} [keepKey=false] Set true, if textkey should not be removed
        */
    p.setMouseDownText = function (text, keepKey) {
        this.settings.mouseDownText = text;

        if (keepKey !== true) {
            this.removeMouseDownTextKey();
        }

        if (brease.config.editMode !== true) {
            if (brease.language.isKey(this.settings.mouseDownText) === true) {
                this.setMouseDownTextKey(brease.language.parseKey(this.settings.mouseDownText), false);
                this.langChangeHandler();
                return;
            }
        }

        if (this.checkedTextEl !== undefined) {
            _textUpdate(this);
        }
    };

    /**
        * @method getMouseDownText
        * Returns the visible text for checked state.
        * @return {String}
        */
    p.getMouseDownText = function () {
        return this.settings.mouseDownText;
    };

    /**
        * @method setImageAlign
        * Sets the value for image align.
        * @param {brease.enum.ImageAlign} imageAlign
        */
    p.setImageAlign = function (imageAlign) {
        this.settings.imageAlign = imageAlign;
        this.setClasses();
        if (this.textEl && (this.settings.imageAlign === Enum.ImageAlign.left || this.settings.imageAlign === Enum.ImageAlign.top)) {
            this.wrapperAfter.prepend(this.imgEl);
            this.wrapperAfter.prepend(this.svgEl);
            this.wrapperBefore.prepend(this.checkedImgEl);
            this.wrapperBefore.prepend(this.checkedSvgEl);
        } else {
            this.wrapperAfter.append(this.imgEl);
            this.wrapperAfter.append(this.svgEl);
            this.wrapperBefore.append(this.checkedImgEl);
            this.wrapperBefore.append(this.checkedSvgEl);
        }
    };

    /**
        * @method setImage
        * @iatStudioExposed
        * Sets an image.
        * @param {ImagePath} image
        */
    p.setImage = function (image) {
        var widget = this;
        image = Types.parseValue(image, 'String', { default: '' });
        this.settings.image = image;
        _rejectIfPending(this.imageDeferred);
        if (image.length > 0) {
            if (UtilsImage.isStylable(image) && widget.settings.useSVGStyling) {
                widget.imgEl.hide();
                this.imageDeferred = UtilsImage.getInlineSvg(image);
                this.imageDeferred.then(function (svgElement) {
                    widget.svgEl.replaceWith(svgElement);
                    widget.svgEl = svgElement;
                    widget.svgEl.show();
                });
            } else {
                widget.imgEl.attr('src', image).show();
                widget.svgEl.hide();
            }
        } else {
            widget.imgEl.hide();
            widget.svgEl.hide();
        }

    };

    p.setStyle = function (style) {
        SuperClass.prototype.setStyle.call(this, style);
    };

    /**
        * @method setMouseDownImage
        * @iatStudioExposed
        * Sets the image when mouse down
        * @param {ImagePath} mouseDownImage
        */
    p.setMouseDownImage = function (mouseDownImage) {
        var widget = this;
        mouseDownImage = Types.parseValue(mouseDownImage, 'String', { default: '' });
        this.settings.mouseDownImage = mouseDownImage;
        _rejectIfPending(this.mouseDownImageDeferred);
        if (mouseDownImage.length > 0) {
            if (UtilsImage.isStylable(mouseDownImage) && widget.settings.useSVGStyling) {
                widget.checkedImgEl.hide();
                this.mouseDownImageDeferred = UtilsImage.getInlineSvg(mouseDownImage);
                this.mouseDownImageDeferred.then(function (svgElement) {
                    widget.checkedSvgEl.replaceWith(svgElement);
                    widget.checkedSvgEl = svgElement;
                    widget.checkedSvgEl.show();
                });
            } else {
                widget.checkedImgEl.attr('src', mouseDownImage).show();
                widget.checkedSvgEl.hide();
            }
        } else {
            widget.checkedImgEl.hide();
            widget.checkedSvgEl.hide();
        }
    };

    p.toggle = function (status, omitSubmit) {
        var sendChange = false;

        status = toggleStatus.call(this, status);

        if (status === WidgetClass.values.checked) {
            if (this.settings.value === WidgetClass.values.unchecked) {
                sendChange = true;
            }
            this.settings.value = WidgetClass.values.checked;
        } else {
            if (this.settings.value === WidgetClass.values.checked) {
                sendChange = true;
            }
            this.settings.value = WidgetClass.values.unchecked;
        }
        _setToggleStatusStyle(this, this.settings.value);

        if (sendChange === true && omitSubmit !== true) {
            /**
                * @event ValueChanged
                * @iatStudioExposed
                * Fired when the status of the widget is changed by user interaction
                * @param {Integer} newValue
                * @param {Boolean} newValueBool
                * @param {Integer} newValueInteger
                */
            var ev = this.createEvent('ValueChanged', {
                newValue: this.getValue(),
                newValueBool: this.getValueBool(),
                newValueInteger: this.getValueInteger()
            });
            ev.dispatch();
            this.submitChange();
        }
        this.dispatchEvent(new CustomEvent(BreaseEvent.CHANGE, {
            bubbles: true,
            cancelable: true,
            detail: {
                checked: this.isChecked()
            }
        }));
    };

    p._downHandler = function (e) {
        SuperClass.prototype._downHandler.apply(this, arguments);
        if (this.isActive) {
            this.currentTargetClicked = e.currentTarget;
        }
    };

    p._upHandler = function (e) {
        SuperClass.prototype._upHandler.apply(this, arguments);
        if (this.isDisabled || brease.config.editMode || Utils.getPointerId(e) !== this.pointerId) {
            return;
        }
        if (this.currentTargetClicked === e.currentTarget) {
            _setToggleStatusStyle(this, !this.settings.value);
        }
    };

    p.setClasses = function () {
        var imgClass;
        if ((this.imgEl !== undefined || this.checkedImgEl !== undefined) && this.textEl !== undefined && this.settings.text !== '') {

            switch (this.settings.imageAlign) {
                case Enum.ImageAlign.left:
                    imgClass = 'image-left';
                    break;

                case Enum.ImageAlign.right:
                    imgClass = 'image-right';
                    break;

                case Enum.ImageAlign.top:
                    imgClass = 'image-top';
                    break;

                case Enum.ImageAlign.bottom:
                    imgClass = 'image-bottom';
                    break;

            }
            this.elem.classList.remove('image-left', 'image-right', 'image-top', 'image-bottom');
            this.elem.classList.add(imgClass);
        } else {
            this.elem.classList.remove('image-left', 'image-right', 'image-top', 'image-bottom');
        }
    };

    p.dispose = function () {
        _rejectIfPending(this.imageDeferred);
        _rejectIfPending(this.mouseDownImageDeferred);
        SuperClass.prototype.dispose.apply(this, arguments);
    };
    /*PRIVATE
        **FUNCTIONS*/

    function _appendWrapper(widget) {

        widget.wrapperBefore = widget.el.find('.wrapper:first-child');
        widget.wrapperAfter = widget.el.find('.wrapper:last-child');

        widget.imgEl = widget.wrapperAfter.find('img');
        widget.checkedImgEl = widget.wrapperBefore.find('img');
        widget.svgEl = widget.wrapperAfter.find('svg');
        widget.checkedSvgEl = widget.wrapperBefore.find('svg');

        widget.setImage(widget.settings.image);
        widget.setMouseDownImage(widget.settings.mouseDownImage);

        widget.wrapperBefore.prepend(widget.imgEl, widget.svgEl);
        widget.wrapperAfter.prepend(widget.checkedImgEl, widget.checkedSvgEl);
    }

    function _appendText(widget) {

        widget.textEl = widget.wrapperAfter.find('span');
        widget.checkedTextEl = widget.wrapperBefore.find('span');

        _textUpdate(widget);
    }

    function _textUpdate(widget) {
        widget.textEl.text(brease.language.unescapeText(widget.settings.text));
        widget.checkedTextEl.text(brease.language.unescapeText(widget.settings.mouseDownText));
    }

    function _setToggleStatusStyle(widget, value) {
        if (value) {
            widget.elem.classList.add('checked');
        } else {
            widget.elem.classList.remove('checked');
        }
    }

    function toggleStatus(status) {
        if (status === undefined) {
            status = (this.settings.value === WidgetClass.values.unchecked) ? WidgetClass.values.checked : WidgetClass.values.unchecked;
        }
        return status;
    }

    function _rejectIfPending(def) {
        if (def && def.state() === 'pending') {
            def.reject();
        }
    }

    function _getSliderHeight() {
        return this.sliderClone ? window.getComputedStyle(this.sliderClone).getPropertyValue('height') : '';
    }

    return WidgetClass;

});
