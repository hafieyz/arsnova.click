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

import {Session} from 'meteor/session';
import {Template} from 'meteor/templating';
import {MemberListCollection} from '/lib/member_list/collection.js';
import * as localData from '/lib/local_storage.js';
import {calculateHeaderSize, titelTracker} from '/client/layout/region_header/lib.js';
import {setLobbySound} from '/client/plugins/sound/scripts/lib.js';
import * as footerElements from "/client/layout/region_footer/scripts/lib.js";
import {calculateButtonCount} from './lib.js';

Template.memberlist.onRendered(function () {
	Session.set("learnerCountOverride", false);
	Session.set("allMembersCount", MemberListCollection.find().count());
	if (localData.containsHashtag(Router.current().params.quizName)) {
		Session.set("lobbySoundIsPlaying", "LobbySong1");
		setLobbySound("LobbySong1", Router.current().url.indexOf("localhost") === -1);
	}
	calculateHeaderSize();
	$(window).resize(calculateHeaderSize);
	this.autorun(function () {
		titelTracker.depend();
		calculateButtonCount(Session.get("allMembersCount"));
	}.bind(this));

	footerElements.removeFooterElements();
	if (localData.containsHashtag(Router.current().params.quizName)) {
		footerElements.addFooterElement((footerElements.footerElemEditQuiz));
		footerElements.addFooterElement(footerElements.footerElemHome);
		if ($(window).outerWidth() >= 1024) {
			footerElements.addFooterElement(footerElements.footerElemQRCode);
		}
		footerElements.addFooterElement(footerElements.footerElemSound);
		footerElements.addFooterElement(footerElements.footerElemReadingConfirmation);
		footerElements.addFooterElement(footerElements.footerElemNicknames);
		if (navigator.userAgent.match(/iPad/i) == null) {
			footerElements.addFooterElement(footerElements.footerElemFullscreen);
		}
		footerElements.addFooterElement(footerElements.footerElemTheme);
	}
	footerElements.calculateFooter();

	$('.navbar-footer-placeholder').hide();
	$('.navbar-footer').show();

	/* Auto-Open the QR-Code Window */
	setTimeout(function () {
		$('#qr-code').click();
	}, 100);

	$(document).on('keyup',function (event) {
		if (event.keyCode === 27) {
			$('.qr-code-container').hide();
		}
	});
});

Template.learner.onRendered(function () {
	//calculateButtonCount(MemberListCollection.find().count());
});
