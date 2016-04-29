/*
 * This file is part of ARSnova Click.
 * Copyright (C) 2016 The ARSnova Team
 *
 * ARSnova Click is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * ARSnova Click is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with ARSnova Click.  If not, see <http://www.gnu.org/licenses/>.*/

import {Blaze} from 'meteor/blaze';
import {Template} from 'meteor/templating';
import {TAPi18n} from 'meteor/tap:i18n';

/**
 * This class will construct an empty splashscreen which can be modified via JQuery.
 *
 * Since ES6 does not support destructors you'll need to manually call the destroy() method on the splashscreen if you
 * registered any root-level event listeners. You can pass the event removing calls to the onDestroyed option.
 *
 * Valid construction parameters are:
 * - autostart	  -> True, if the splashscreen should show as soon as it has been rendered
 * - templateName   -> The Meteor Template which is used to display the splashscreen
 * - instanceId	 -> If you define and display multiple splashscreens of the same template on one page you'll need to give each of them unique id's
 * - closeOnButton  -> A valid jQuery selector which shall trigger the close event. A click on the modal or the splashscreen itself will not trigger the close event if this option is set.
 * - onCreated	  -> Callback function which is called with the current instance as argument when the splashscreen is created
 * - onRendered	 -> Callback function which is called with the current instance as argument when the splashscreen template is rendered
 * - onDestroyed	-> Callback function which is called with the current instance as argument when the splashscreen template is destroyed
 *
 * Read-Only members are:
 * - templateInstance   -> The Blaze template object
 * - templateSelector   -> The jQuery object of the current splashscreen template
 * - isCreated		  -> True, if the Splashscreen object has been created
 * - isRendered		 -> True, if the Splashscreen template has been rendered
 */
export class Splashscreen {
	/**
	 * Constructs and returns a new instance of Splashscreen
	 *
	 * @param options Must be an object with optional parameters
	 */
	constructor (options) {
		this.options = {
			autostart: options.autostart || false,
			templateName: options.templateName || "splashscreen",
			instanceId: options.instanceId || 0,
			closeOnButton: options.closeOnButton || false,
			onCreated: options.onCreated || undefined,
			onDestroyed: options.onDestroyed || undefined,
			onRendered: options.onRendered || undefined
		};
		this.templateInstance = null;
		this.templateSelector = null;
		this.created();
		this.isCreated = true;
		this.rendered();
		this.isRendered = true;
	}

	/**
	 * This method will be called after the options have been parsed by the constructor
	 * If a callback to options.onCreated has been specified this method will run the callback
	 */
	created () {
		if (typeof this.options.onCreated === "function") {
			this.options.onCreated(this);
		}
	}

	/**
	 * This method will be called after the created method
	 * If a callback to options.onRendered has been specified this method will run the callback
	 */
	rendered () {
		let template = Template[this.options.templateName];
		if (template) {
			this.templateInstance = Blaze.render(Template[this.options.templateName], document.body);
			$(this.templateInstance.firstNode()).addClass(this.options.templateName).attr("id", this.options.templateName + "_" + this.options.instanceId);
		} else {
			throw new Error('Invalid template name');
		}
		this.templateSelector = $('#' + this.options.templateName + "_" + this.options.instanceId);

		this.isOpen = this.options.autostart;
		if (this.isOpen) {
			this.open();
		} else {
			this.close();
		}

		if (typeof this.options.onRendered === "function") {
			this.options.onRendered(this);
		}
	}

	/**
	 * This method must be called manually
	 * If a callback to options.onDestroyed has been specified this method will run the callback
	 */
	destroy () {
		if (!this.templateInstance) {
			return;
		}
		Blaze.remove(this.templateInstance);
		this.templateSelector.remove();
		$('.modal-backdrop').remove();
		this.templateInstance = null;
		if (typeof this.options.onDestroyed === "function") {
			this.options.onDestroyed(this);
		}
	}

	/**
	 * A call of this method will close (hide) the splashscreen
	 */
	close () {
		if (this.options.closeOnButton) {
			this.templateSelector.off('hide.bs.modal').off('click', this.options.closeOnButton);
		}
		this.templateSelector.modal("hide");
		this.isOpen = false;
		this.destroy();
	}

	/**
	 * A call of this method will show (display) the splashscreen
	 */
	open () {
		let self = this;
		if (this.options.closeOnButton) {
			let hasClickedOnCloseButton = false;
			this.templateSelector.on('hide.bs.modal', function (event) {
				if (!hasClickedOnCloseButton) {
					event.stopPropagation();
					event.preventDefault();
				}
			}).on('click', this.options.closeOnButton, function () {
				hasClickedOnCloseButton = true;
				self.close();
			});
		} else {
			this.templateSelector.on('hide.bs.modal', function () {
				self.destroy();
			});
		}

		this.templateSelector.modal("show");
		this.isOpen = true;
	}
}


class ErrorSplashscreen extends Splashscreen {
	constructor (options) {
		super(options);
	}

	setErrorText (text) {
		if (this.isRendered) {
			$(this.templateSelector).find(".modal-body").text(text);
		} else {
			throw new Error(TAPi18n.__("plugins.splashscreen.error.set_text_error"));
		}
	}
}

export let splashscreenError = null;

export function setErrorSplashscreen() {
	splashscreenError = new ErrorSplashscreen({
		autostart: false,
		templateName: "errorSplashscreen",
		closeOnButton: "#js-btn-hideErrorMessageModal"
	});
}