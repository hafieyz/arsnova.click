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

import {Template} from 'meteor/templating';
import {TAPi18n} from 'meteor/tap:i18n';
import {HashtagsCollection} from '/lib/hashtags/collection.js';
import  * as localData from '/lib/local_storage.js';
import {Splashscreen} from '/client/plugins/splashscreen/scripts/lib.js';
import * as hashtagLib from '/client/layout/view_hashtag_management/scripts/lib.js';
import * as headerLib from '/client/layout/region_header/lib.js';
import * as footerElements from "/client/layout/region_footer/scripts/lib.js";
import {connectionStatus} from './lib.js';
import {startConnectionIndication, getRTT, forceFeedback} from '/client/layout/global/scripts/lib.js';

Template.home.onRendered(function () {
	HashtagsCollection.find().observeChanges({
		added: function (id, doc) {
			if (doc.hashtag === $("#hashtag-input-field").val()) {
				$("#addNewHashtag").attr("disabled", "disabled");
			}
		}
	});
	if (localData.getAllHashtags().length > 0) {
		hashtagLib.setHashtagSplashscreen(new Splashscreen({
			autostart: true,
			templateName: "showHashtagsSplashscreen",
			closeOnButton: ".splashscreen-container-close"
		}));
	}
	try {
		if (!localStorage.getItem("localStorageAvailable")) {
			new ErrorSplashscreen({
				autostart: true,
				errorMessage: "plugins.splashscreen.error.error_messages.private_browsing"
			});
			return;
		}
	} catch (err) {
		new ErrorSplashscreen({
			autostart: true,
			errorMessage: "plugins.splashscreen.error.error_messages.private_browsing"
		});
		return;
	}

	if ($(window).width() >= 992 && localData.getAllHashtags().length === 0) {
		$('#hashtag-input-field').focus();
	}
	footerElements.removeFooterElements();
	footerElements.addFooterElement(footerElements.footerElemAbout);
	footerElements.addFooterElement(footerElements.footerElemTranslation);
	footerElements.addFooterElement(footerElements.footerElemTheme);
	if (navigator.userAgent.match(/iPad/i) == null) {
		footerElements.addFooterElement(footerElements.footerElemFullscreen);
	}

	if (localData.getAllHashtags().length > 0) {
		footerElements.addFooterElement(footerElements.footerElemHashtagManagement);
	} else {
		footerElements.addFooterElement(footerElements.footerElemImport);
	}
	headerLib.calculateHeaderSize();
	headerLib.calculateTitelHeight();
	if (typeof window.callPhantom === 'function') {
		connectionStatus.webSocket = {connected: true};
		connectionStatus.dbConnection.totalCount = 5;
		connectionStatus.dbConnection.currentCount = 5;
		connectionStatus.dbConnection.serverRTT = 1;
		connectionStatus.dbConnection.serverRTTtotal = 1;
		connectionStatus.localStorage = true;
		connectionStatus.sessionStorage = true;
		Session.set("connectionStatus", connectionStatus);
		this.autorun(function () {
			headerLib.titelTracker.depend();
			footerElements.footerTracker.depend();
			const interval = window.setInterval(function () {
				if (document.readyState === "complete") {
					clearInterval(interval);
					window.callPhantom();
				}
			}, 2000);
		}.bind(this));
	}
});

Template.layout.onRendered(function () {
	startConnectionIndication();
	getRTT();
	$("body").on("click", "button", forceFeedback);
});
