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

import {Meteor} from 'meteor/meteor';
import {Session} from 'meteor/session';
import {Template} from 'meteor/templating';
import {Tracker} from 'meteor/tracker';
import {SessionConfigurationCollection} from '/lib/session_configuration/collection.js';
import * as localData from '/lib/local_storage.js';
import {buzzsound1} from '/client/plugins/sound/scripts/lib.js';
import {TAPi18n} from 'meteor/tap:i18n';
import {Splashscreen} from "/client/plugins/splashscreen/scripts/lib";
import * as lib from './lib.js';

Template.header.helpers({
	getCurrentResetRoute: function () {
		return Router.current().params.quizName ? Router.current().params.quizName + "/resetToHome" : "";
	},
	isInHomePath: function () {
		return Router.current().route.path() === '/';
	},
	isTHMStyleSelectedAndGreaterThan999Pixels: function () {
		return localStorage.getItem("theme") === "theme-thm" && $(window).width() > 999;
	},
	getCurrentTitle: function () {
		switch (Router.current().route.path()) {
			case "/about":
				return TAPi18n.__("region.footer.about.title");
			case "/imprint":
				return TAPi18n.__("region.footer.imprint.title");
			case "/dataprivacy":
				return TAPi18n.__("region.footer.data_privacy.title");
			case "/agb":
				return TAPi18n.__("region.footer.tos.title");
			case "/theme":
				return TAPi18n.__("view.theme_switcher.set_theme");
			case "/translate":
				return TAPi18n.__("view.translation.translations");
			case "/hashtagmanagement":
				return TAPi18n.__("view.hashtag_management.session_management");
			default:
				let currentPath = Router.current().route.getName().replace(":quizName.", "");
				switch (currentPath) {
					case "question":
						return TAPi18n.__("view.questions.title");
					case "answeroptions":
						return TAPi18n.__("view.answeroptions.title");
					case "nicknameCategories":
						return TAPi18n.__("view.nickname_categories.title");
					case "settimer":
						return TAPi18n.__("view.timer.title");
					case "quizSummary":
						return TAPi18n.__("view.quiz_summary.title");
					case "memberlist":
						return Router.current().params.quizName;
					case "results":
						return TAPi18n.__("view.liveResults.title");
					case "onpolling":
						return TAPi18n.__("view.voting.title");
					case "statistics":
						return TAPi18n.__("view.leaderboard.header");
					case "globalLeaderBoard":
						return TAPi18n.__("view.leaderboard.global_header");
					case "nick":
						return TAPi18n.__("view.choose_nickname.enter_nickname");
					default:
						return "arsnova.click";
				}
		}
	},
	isEditingQuestion: lib.isEditingQuestion,
	isInLobby: function () {
		return Router.current().route.getName() === ":quizName.memberlist";
	},
	isSoundEnabled: function () {
		const configDoc = SessionConfigurationCollection.findOne({hashtag: Router.current().params.quizName});
		if (configDoc) {
			return configDoc.music.isEnabled;
		}
	}
});

Template.qrCodeDisplay.helpers({
	getCurrentSessionName: function () {
		if (!Router.current().params.quizName) {
			return;
		}
		return window.location.host + "/" + Router.current().params.quizName.replace(/ /g,"+");
	}
});

Template.header.events({
	'click .arsnova-logo': function () {
		if (localData.containsHashtag(Router.current().params.quizName)) {
			if (Session.get("soundIsPlaying")) {
				buzzsound1.stop();
			}

			new Splashscreen({
				autostart: true,
				templateName: "resetSessionSplashscreen",
				closeOnButton: '#closeDialogButton, #resetSessionButton',
				onRendered: function (instance) {
					instance.templateSelector.find('#resetSessionButton').on('click', function () {
						Meteor.call("Main.killAll", Router.current().params.quizName);
						Router.go("/" + Router.current().params.quizName + "/resetToHome");
					});
				}
			});
		} else {
			Session.set("questionGroup", undefined);
			delete Session.keys.questionGroup;

			delete localStorage[Router.current().params.quizName + "nick"];
			delete localStorage.slider;
			delete localStorage.lastPage;

			delete sessionStorage.overrideValidQuestionRedirect;

			Router.go("/");
		}
	}
});

let headerThemeTracker = null;

Template.header.onRendered(function () {
	headerThemeTracker = Tracker.autorun(function () {
		const configDoc = SessionConfigurationCollection.findOne({hashtag: Router.current().params.quizName});
		if (configDoc) {
			Session.set("theme", configDoc.theme);
		}
	});
	if (!Session.get("questionGroup") && Router.current().params.quizName && localData.containsHashtag(Router.current().params.quizName)) {
		Session.set("questionGroup", localData.reenterSession(Router.current().params.quizName));
	}
	$(window).resize(function () {
		if ($(window).width() > 999) {
			$(".thm-logo-background").show();
		} else {
			$(".thm-logo-background").hide();
		}
	});
});

Template.header.onDestroyed(function () {
	if (headerThemeTracker) {
		headerThemeTracker.stop();
	}
});
