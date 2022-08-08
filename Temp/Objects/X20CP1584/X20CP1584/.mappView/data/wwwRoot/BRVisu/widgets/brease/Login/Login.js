define(['brease/core/BaseWidget',
    'brease/enum/Enum',
    'brease/events/BreaseEvent',
    'brease/decorators/LanguageDependency',
    'brease/decorators/UserDependency',
    'brease/core/Types',
    'brease/decorators/DragAndDropCapability',
    'widgets/brease/common/DragDropProperties/libs/DroppablePropertiesEvents'
], function (SuperClass, Enum, BreaseEvent, languageDependency, userDependency, Types, dragAndDropCapability) {

    'use strict';

    /**
     * @class widgets.brease.Login
     * #Description
     * widget provides an interface to login a user
     *
     * @mixins widgets.brease.common.DragDropProperties.libs.DroppablePropertiesEvents
     *
     * @breaseNote 
     * @extends brease.core.BaseWidget
     * @requires widgets.brease.TextInput
     * @requires widgets.brease.Label
     * @requires widgets.brease.Password
     * @requires widgets.brease.Button
     * @requires widgets.brease.BusyIndicator
     *
     * @iatMeta category:Category
     * Login,System
     * @iatMeta description:short
     * Benutzeranmeldung
     * @iatMeta description:de
     * Widget bietet Möglichkeit zum Login eines Benutzers
     * @iatMeta description:en
     * Widget provides an interface to login a user
     */

    /**
     * @cfg {String} userLabel='Username'
     * @localizable
     * @iatStudioExposed
     * @iatCategory Appearance
     * Label for username
     */

    /**
     * @cfg {String} passwordLabel='Password'
     * @localizable
     * @iatStudioExposed
     * @iatCategory Appearance
     * Label for password
     */

    /**
     * @cfg {String} buttonLabel='Login'
     * @localizable
     * @iatStudioExposed
     * @iatCategory Appearance
     * Label for button
     */

    /**
     * @cfg {String} userName=''
     * @iatStudioExposed
     * @iatCategory Appearance
     * user name
     */

    /**
     * @cfg {StyleReference} buttonStyle='default'
     * @iatStudioExposed
     * @iatCategory Appearance
     * @typeRefId widgets.brease.Button
     * assignment of style for the login Button
     * the style needs to be available for the widget brease.Button
     */

    /**
     * @cfg {StyleReference} userInputStyle='default'
     * @iatStudioExposed
     * @iatCategory Appearance
     * @typeRefId widgets.brease.TextInput
     * assignment of style for the user input
     * the style needs to be available for the widget brease.TextInput
     */

    /**
     * @cfg {StyleReference} passwordInputStyle='default'
     * @iatStudioExposed
     * @iatCategory Appearance
     * @typeRefId widgets.brease.Password
     * assignment of style for the password input
     * the style needs to be available for the widget brease.Password
     */

    /**
     * @cfg {StyleReference} labelStyle='default'
     * @iatStudioExposed
     * @iatCategory Appearance
     * @typeRefId widgets.brease.Label
     * assignment of style for the labels for username and password input
     * the style needs to be available for the widget brease.Label
     */

    /**
     * @cfg {StyleReference} messageStyle='default'
     * @iatStudioExposed
     * @iatCategory Appearance
     * @typeRefId widgets.brease.Label
     * assignment of style for the status message label
     * the style needs to be available for the widget brease.Label
     */

    /**
     * @cfg {Boolean} enableUserInput=true
     * @iatStudioExposed
     * @iatCategory Behavior
     * Enables or disables the input of the Username
     */

    /**
     * @cfg {String} userChangedMessage='User changed to: '
     * @localizable
     * @iatStudioExposed
     * @iatCategory Appearance
     * Message which appears if user changes + username
     */

    /**
     * @cfg {String} autFailMessage='Authorisation failed'
     * @localizable
     * @iatStudioExposed
     * @iatCategory Appearance
     * Message which appears if authorisation fails
     */

    /**
     * @cfg {String} setUserFailMessage='Set User failed'
     * @localizable
     * @iatStudioExposed
     * @iatCategory Appearance
     * Message which appears if login of the user fails
     */

    /**
     * @cfg {String} setUserSuccessMessage='Login successful'
     * @localizable
     * @iatStudioExposed
     * @iatCategory Appearance
     * Message which appears if login is successful
     */

    /**
     * @cfg {Boolean} keyboard=true
     * @iatStudioExposed
     * @iatCategory Behavior
     * Determines if internal soft keyboard should open
     */

    /**
     * @cfg {Integer} tabIndex=0
     * @iatStudioExposed
     * @iatCategory Behavior 
     * sets if a widget should have autofocus enabled (0), the order of the focus (>0),
     * or if autofocus should be disabled (-1)
     */

    /**
    * @cfg {Boolean} focusable=false
    * The widget will not be added to the focus chain if this option is set to false.
    * It should be used if a widget has child widgets which derive the tabIndex from its parent but the parent widget itselfe should not be focusable. (i.e Login)
    * The difference to tabIndex=-1 is that the user can still set a tabIndex and the widget can forward the tabIndex to its child widgets.
    */

    var brease = window.brease,
        defaultSettings = {
            userLabel: 'Username',
            passwordLabel: 'Password',
            buttonLabel: 'Login',
            userName: '',
            enableUserInput: true,
            buttonStyle: 'default',
            userInputStyle: 'default',
            passwordInputStyle: 'default',
            labelStyle: 'default',
            messageStyle: 'default',
            userChangedMessage: 'User changed to: ',
            autFailMessage: 'Authorisation failed',
            setUserFailMessage: 'Set User failed',
            setUserSuccessMessage: 'Login successful',
            keyboard: true,
            tabIndex: 0,
            focusable: false
        },

        WidgetClass = SuperClass.extend(function Login() {
            SuperClass.apply(this, arguments);
        }, defaultSettings),

        p = WidgetClass.prototype;

    p.init = function () {
        if (this.settings.omitClass !== true) {
            this.addInitialClass('breaseLogin');
        }
        this.buttonId = this.elem.id + '_liButton';
        this.userNameId = this.elem.id + '_liUser';
        this.userLabelId = this.elem.id + '_liUserLabel';
        this.passwordId = this.elem.id + '_liPassword';
        this.passwordLabelId = this.elem.id + '_liPasswordLabel';
        this.messageLabelId = this.elem.id + '_liMessageLabel';
        this.busyId = this.elem.id + '_liBusyIndi';

        _setChildWidgetsProperties.call(this);
        _setUserChangedMessageText(this);

        this.busyWrapper = this.el.find('.breaseLoginBusyWrapper');

        this.notReadyChildWidgets = new Set([this.buttonId, this.userNameId, this.userLabelId, this.passwordId, this.passwordLabelId, this.messageLabelId, this.busyId]);
        this.notReadyChildWidgets.forEach(function (id) {
            if (brease.uiController.callWidget(id, 'widget') !== null) {
                this.notReadyChildWidgets.delete(id);
            }
        }, this);

        var omitReadyEvent = this.notReadyChildWidgets.size > 0; 
        if (omitReadyEvent) {
            this.elem.addEventListener(BreaseEvent.WIDGET_READY, this._bind('_onWidgetReady'));
        } else {
            this._getChildWidgetReferences();
        }
        if (brease.config.isKeyboardOperationEnabled()) {
            this.elem.addEventListener('focusin', this._bind('_onFocusIn'));
            this.elem.addEventListener('focusout', this._bind('_onFocusOut'));
        }
        SuperClass.prototype.init.call(this, omitReadyEvent);
    };

    p._getChildWidgetReferences = function () {
        this.userLabelWidget = brease.callWidget(this.userLabelId, 'widget');
        this.textInputWidget = brease.callWidget(this.userNameId, 'widget');
        this.passwordLabelWidget = brease.callWidget(this.passwordLabelId, 'widget');
        this.passwordWidget = brease.callWidget(this.passwordId, 'widget');
        this.buttonWidget = brease.callWidget(this.buttonId, 'widget');
        this.messageLabelWidget = brease.callWidget(this.messageLabelId, 'widget');
        
        this.buttonWidget.el.on(BreaseEvent.CLICK, this._bind('_onButtonClick'));
    };

    p._onWidgetReady = function (e) {
        this.notReadyChildWidgets.delete(e.target.id);
        if (this.notReadyChildWidgets.size === 0) {
            this._getChildWidgetReferences();
            this.elem.removeEventListener(BreaseEvent.WIDGET_READY, this._bind('_onWidgetReady'));
            this._dispatchReady();
        }
    };

    p._clickHandler = function (e) {
        SuperClass.prototype._clickHandler.call(this, e, { origin: this.elem.id });
    };

    p.langChangeHandler = function () {
        _setUserChangedMessageText(this);
        if (this.settings.status === 3) {
            this._setMessage(this.settings.userChangedMessageText + this.settings.currentUser);
        }
    };

    p.enable = function () {
        SuperClass.prototype.enable.call(this);
        if (this.state === Enum.WidgetState.READY) {
            this.userLabelWidget.setEnable(true);
            this.textInputWidget.setEnable(this.getEnableUserInput());
            this.passwordLabelWidget.setEnable(true);
            this.passwordWidget.setEnable(true);
            this.buttonWidget.setEnable(true);
            this.messageLabelWidget.setEnable(true);
        }
    };

    p.disable = function () {
        SuperClass.prototype.disable.call(this);
        if (this.state === Enum.WidgetState.READY) {
            this.userLabelWidget.setEnable(false);
            this.textInputWidget.setEnable(false);
            this.passwordLabelWidget.setEnable(false);
            this.passwordWidget.setEnable(false);
            this.buttonWidget.setEnable(false);
            this.messageLabelWidget.setEnable(false);
        }
    };

    /**
     * @method setTabIndex
     * Sets the state of property «tabIndex»
     * @param {Number} value
     */
    p.setTabIndex = function (value) {
        SuperClass.prototype.setTabIndex.call(this, value);
        if (this.state === Enum.WidgetState.READY) {
            this.textInputWidget.setTabIndex(value);
            this.passwordWidget.setTabIndex(value);
            this.buttonWidget.setTabIndex(value);
        }
    };

    /**
    * @method focus
    * @iatStudioExposed
    * Sets focus on user input, if it can be focused and keyboardOperation=true (if focus is not already inside the widget); overrides the BaseWidget method
    */
    p.focus = function () {
        if (!this.elem.contains(document.activeElement)) {
            return this.textInputWidget.focus();
        }
    };

    /**
     * @method setUserLabel
     * Sets userLabel
     * @param {String} userLabel
     */
    p.setUserLabel = function (userLabel) {
        this.settings.userLabel = userLabel;
        this.userLabelWidget.setText(userLabel);
    };

    /**
     * @method getUserLabel 
     * Returns userLabel.
     * @return {String}
     */
    p.getUserLabel = function () {
        return this.settings.userLabel;
    };

    /**
     * @method setPasswordLabel
     * Sets passwordLabel
     * @param {String} passwordLabel
     */
    p.setPasswordLabel = function (passwordLabel) {
        this.settings.passwordLabel = passwordLabel;
        this.passwordLabelWidget.setText(passwordLabel);
    };

    /**
     * @method getPasswordLabel 
     * Returns passwordLabel.
     * @return {String}
     */
    p.getPasswordLabel = function () {
        return this.settings.passwordLabel;
    };

    /**
     * @method setButtonLabel
     * Sets buttonLabel
     * @param {String} buttonLabel
     */
    p.setButtonLabel = function (buttonLabel) {
        this.settings.buttonLabel = buttonLabel;
        this.buttonWidget.setText(buttonLabel);
    };

    /**
     * @method getButtonLabel 
     * Returns buttonLabel.
     * @return {String}
     */
    p.getButtonLabel = function () {
        return this.settings.buttonLabel;
    };

    /**
     * @method setEnableUserInput
     * Sets enableUserInput
     * @param {Boolean} enableUserInput
     */
    p.setEnableUserInput = function (enableUserInput) {
        this.settings.enableUserInput = enableUserInput;
        this.textInputWidget.setEnable(enableUserInput);
    };

    /**
     * @method getEnableUserInput 
     * Returns enableUserInput
     * @return {Boolean}
     */
    p.getEnableUserInput = function () {
        return this.settings.enableUserInput;
    };

    /**
     * @method setUserName
     * Sets userName
     * @param {String} userName
     */
    p.setUserName = function (userName) {
        this.settings.userName = userName;
        this.textInputWidget.setValue(userName);
    };

    /**
     * @method getUserName
     * Returns userName.
     * @return {String}
     */
    p.getUserName = function () {
        return this.settings.userName;
    };

    /**
     * @method setAutFailMessage
     * Sets autFailMessage
     * @param {String} autFailMessage
     */
    p.setAutFailMessage = function (autFailMessage) {
        this.settings.autFailMessage = autFailMessage;
    };

    /**
     * @method getAutFailMessage 
     * Returns autFailMessage.
     * @return {String}
     */
    p.getAutFailMessage = function () {
        return this.settings.autFailMessage;
    };

    /**
     * @method setSetUserFailMessage
     * Sets setUserFailMessage
     * @param {String} setUserFailMessage
     */
    p.setSetUserFailMessage = function (setUserFailMessage) {
        this.settings.setUserFailMessage = setUserFailMessage;
    };

    /**
     * @method getSetUserFailMessage 
     * Returns setUserFailMessage.
     * @return {String}
     */
    p.getSetUserFailMessage = function () {
        return this.settings.setUserFailMessage;
    };

    /**
     * @method setSetUserSuccessMessage
     * Sets setUserSuccessMessage
     * @param {String} setUserSuccessMessage
     */
    p.setSetUserSuccessMessage = function (setUserSuccessMessage) {
        this.settings.setUserSuccessMessage = setUserSuccessMessage;
    };

    /**
     * @method getSetUserSuccessMessage 
     * Returns setUserSuccessMessage.
     * @return {String}
     */
    p.getSetUserSuccessMessage = function () {
        return this.settings.setUserSuccessMessage;
    };

    /**
     * @method setUserChangedMessage
     * Sets userChangedMessage
     * @param {String} userChangedMessage
     */
    p.setUserChangedMessage = function (userChangedMessage) {
        this.settings.userChangedMessage = userChangedMessage;
    };

    /**
     * @method getUserChangedMessage 
     * Returns userChangedMessage.
     * @return {String}
     */
    p.getUserChangedMessage = function () {
        return this.settings.userChangedMessage;
    };

    /**
     * @method setButtonStyle
     * Sets buttonStyle
     * @param {StyleReference} buttonStyle
     */
    p.setButtonStyle = function (buttonStyle) {
        this.settings.buttonStyle = buttonStyle;
        this.buttonWidget.setStyle(buttonStyle);
    };

    /**
     * @method getButtonStyle 
     * Returns buttonStyle.
     * @return {StyleReference}
     */
    p.getButtonStyle = function () {
        return this.settings.buttonStyle;
    };

    /**
     * @method setLabelStyle
     * Sets labelStyle
     * @param {StyleReference} labelStyle
     */
    p.setLabelStyle = function (labelStyle) {
        this.settings.labelStyle = labelStyle;
        this.userLabelWidget.setStyle(labelStyle);
        this.passwordLabelWidget.setStyle(labelStyle);
    };

    /**
     * @method getLabelStyle 
     * Returns labelStyle.
     * @return {StyleReference}
     */
    p.getLabelStyle = function () {
        return this.settings.labelStyle;
    };

    /**
     * @method setMessageStyle
     * Sets messageStyle
     * @param {StyleReference} messageStyle
     */
    p.setMessageStyle = function (messageStyle) {
        this.settings.messageStyle = messageStyle;
        this.messageLabelWidget.setStyle(messageStyle);
    };

    /**
     * @method getMessageStyle 
     * Returns messageStyle.
     * @return {StyleReference}
     */
    p.getMessageStyle = function () {
        return this.settings.messageStyle;
    };

    /**
     * @method setPasswordInputStyle
     * Sets passwordInputStyle
     * @param {StyleReference} passwordInputStyle
     */
    p.setPasswordInputStyle = function (passwordInputStyle) {
        this.settings.passwordInputStyle = passwordInputStyle;
        this.passwordWidget.setStyle(passwordInputStyle);
    };

    /**
     * @method getPasswordInputStyle 
     * Returns passwordInputStyle.
     * @return {StyleReference}
     */
    p.getPasswordInputStyle = function () {
        return this.settings.passwordInputStyle;
    };

    /**
     * @method setUserInputStyle
     * Sets userInputStyle
     * @param {StyleReference} userInputStyle
     */
    p.setUserInputStyle = function (userInputStyle) {
        this.settings.userInputStyle = userInputStyle;
        this.textInputWidget.setStyle(userInputStyle);
    };

    /**
     * @method getUserInputStyle 
     * Returns userInputStyle.
     * @return {StyleReference}
     */
    p.getUserInputStyle = function () {
        return this.settings.userInputStyle;
    };

    /**
     * @method setKeyboard
     * Sets keyboard
     * @param {Boolean} keyboard
     */
    p.setKeyboard = function (keyboard) {
        this.settings.keyboard = keyboard;
    };

    /**
     * @method getKeyboard 
     * Returns keyboard.
     * @return {Boolean}
     */
    p.getKeyboard = function () {
        return this.settings.keyboard;
    };

    p.userChangeHandler = function (e) {
        var widget = this;
        widget.settings.status = 3;
        widget.settings.currentUser = e.detail.userID;
        setTimeout(function () {
            // check if disposed meanwhile
            if (widget.busyWrapper) {
                widget._setMessage(widget.settings.userChangedMessageText + widget.settings.currentUser);
            }
        }, 200);
    };

    p.dispose = function () {
        this.elem.removeEventListener(BreaseEvent.WIDGET_READY, this._bind('_onWidgetReady'));
        this.elem.removeEventListener('focusin', this._bind('_onFocusIn'));
        this.elem.removeEventListener('focusout', this._bind('_onFocusOut'));

        var widget = this;
        brease.uiController.dispose(this.busyWrapper, false, function () {
            widget.busyWrapper.remove();
            widget.busyWrapper = null;
            SuperClass.prototype.dispose.apply(widget, arguments);
        });
    };

    /* Private */
    p._onFocusIn = function (e) {
        if (!this.elem.contains(e.relatedTarget)) {
            /**
            * @event FocusIn
            * Fired when the widgets gets focus
            * @iatStudioExposed 
            * @eventComment
            */
            this.createEvent(BreaseEvent.FOCUS_IN).dispatch();
        }
        
    };

    p._onFocusOut = function (e) {
        if (!this.elem.contains(e.relatedTarget)) {
            /**
            * @event FocusOut
            * Fired when the widgets lost focus
            * @iatStudioExposed 
            * @eventComment
            */
            this.createEvent(BreaseEvent.FOCUS_OUT).dispatch();
        }
    };

    p._onButtonClick = function (e) {
        if (!this.isDisabled) {
            if (brease.config.isKeyboardOperationEnabled()) {
                // A&P 733875: Login button is not focused at T50.
                // preventDefault() is needed to prevent the default behavior (focus) after the touchend event.
                e.preventDefault();
                // focus has is set active. 
                this.buttonWidget.focus();
            }
            var username = this.textInputWidget.getValue(),
                password = this.passwordWidget.getValue();

            if (username !== null && password !== null) {
                this._showBusyIndicator();
                brease.user.authenticateUser(username, password).then(
                    this._bind('_authSuccessHandler'),
                    this._bind('_authFailHandler')
                );
            }
        }

    };

    p._authSuccessHandler = function (user) {
        brease.user.setCurrentUser(user).then(
            this._bind('_setUserSuccessHandler'),
            this._bind('_setUserFailHandler')
        );
    };

    p._authFailHandler = function () {
        this._hideBusyIndicator();
        this._setMessage(this.settings.autFailMessage, 'fail');
        this.settings.status = 0;
        this.clearPassword();

        /**
         * @event LoginFailed
         * @iatStudioExposed
         * Fired when login failed.
         */
        var ev = this.createEvent('LoginFailed');
        ev.dispatch();
    };

    p._setUserSuccessHandler = function () {
        this._setMessage(this.settings.setUserSuccessMessage, 'success');
        this.settings.status = 1;
        this._hideBusyIndicator();
        this.clearPassword();

        /**
         * @event LoginSuccess
         * @iatStudioExposed
         * Fired when login was successfull.
         */
        var ev = this.createEvent('LoginSuccess');
        ev.dispatch();

    };

    p._setUserFailHandler = function () {
        this._setMessage(this.settings.setUserFailMessage, 'fail');
        this.settings.status = 2;
        this._hideBusyIndicator();
        this.clearPassword();

    };

    p._showBusyIndicator = function () {
        brease.appView.append(this.busyWrapper);
        this.busyWrapper.addClass('visible');
        this.busyWrapper.show();
    };

    p._hideBusyIndicator = function () {
        this.busyWrapper.removeClass('visible');
        this.busyWrapper.hide();

    };

    p._setMessage = function (text, level) {
        this.messageLabelWidget.setVisible(true);

        this.messageLabelWidget.elem.classList.remove('fail');
        this.messageLabelWidget.elem.classList.remove('success');

        if (level === 'success') {
            this.messageLabelWidget.elem.classList.add('success');
        } else if (level === 'fail') {
            this.messageLabelWidget.elem.classList.add('fail');
        }
        this.messageLabelWidget.setText(text);
    };

    p.clearPassword = function () {
        this.passwordWidget.setValue('');
    };

    function _setChildWidgetsProperties() {
        _setChildWidgetProperties(this.userLabelId, {
            enable: this.settings.enable,
            text: this.settings.userLabel,
            style: this.settings.labelStyle,
            parentCoWiId: this.settings.parentCoWiId,
            droppable: false,
            omitDisabledClick: true
        });

        _setChildWidgetProperties(this.userNameId, {
            enable: this.settings.enableUserInput && this.settings.enable,
            value: this.settings.userName,
            style: this.settings.userInputStyle,
            keyboard: this.settings.keyboard,
            tabIndex: this.settings.tabIndex,
            parentCoWiId: this.settings.parentCoWiId,
            droppable: false,
            omitDisabledClick: true
        });

        _setChildWidgetProperties(this.passwordLabelId, {
            enable: this.settings.enable,
            text: this.settings.passwordLabel,
            style: this.settings.labelStyle,
            parentCoWiId: this.settings.parentCoWiId,
            droppable: false,
            omitDisabledClick: true
        });

        _setChildWidgetProperties(this.passwordId, {
            enable: this.settings.enable,
            value: '',
            style: this.settings.passwordInputStyle,
            keyboard: this.settings.keyboard,
            tabIndex: this.settings.tabIndex,
            parentCoWiId: this.settings.parentCoWiId,
            droppable: false,
            omitDisabledClick: true
        });

        _setChildWidgetProperties(this.buttonId, {
            enable: this.settings.enable,
            text: this.settings.buttonLabel,
            style: this.settings.buttonStyle,
            tabIndex: this.settings.tabIndex,
            parentCoWiId: this.settings.parentCoWiId,
            droppable: false,
            omitDisabledClick: true
        });

        _setChildWidgetProperties(this.messageLabelId, {
            enable: this.settings.enable,
            style: this.settings.messageStyle,
            parentCoWiId: this.settings.parentCoWiId,
            droppable: false,
            omitDisabledClick: true
        });

        _setChildWidgetProperties(this.busyId, {
            parentCoWiId: this.settings.parentCoWiId
        });
    }

    function _setChildWidgetProperties(id, props) {
        for (var name in props) {
            brease.uiController.setWidgetPropertyIndependentOfState(id, name, props[name]);
        }
    }

    function _setUserChangedMessageText(widget) {
        if (widget.settings.userChangedMessage !== undefined) {
            if (brease.language.isKey(widget.settings.userChangedMessage) === false) {
                widget.settings.userChangedMessageText = Types.parseValue(widget.settings.userChangedMessage, 'String');
                widget.setLangDependency(false);
            } else {
                widget.settings.userChangedMessageText = brease.language.getTextByKey(brease.language.parseKey(widget.settings.userChangedMessage));
                widget.setLangDependency(true);
            }
        }
    }

    return dragAndDropCapability.decorate(userDependency.decorate(languageDependency.decorate(WidgetClass, false), true), false);

});
