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
import {EventManager} from '/lib/eventmanager.js';
import {AnswerOptions} from '/lib/answeroptions.js';
import {startCountdown, deleteCountdown} from './lib.js';

Template.votingview.onCreated(function () {
	Session.set("sessionClosed", undefined);
	deleteCountdown();

	this.subscribe("EventManager.join", Session.get("hashtag"));
	this.subscribe('QuestionGroup.questionList', Session.get("hashtag"), function () {
		Session.set("questionGroupSubscriptionReady", true);
		if (!Session.get("sessionClosed")) {
			startCountdown(EventManager.findOne().questionIndex);
		}
	});

	this.subscribe('AnswerOptions.public', Session.get("hashtag"), function () {
		var answerOptionCount = AnswerOptions.find({questionIndex: EventManager.findOne().questionIndex}).count();
		var responseArr = [];
		for (var i = 0; i < answerOptionCount; i++) {
			responseArr[i] = false;
		}
		Session.set("responses", JSON.stringify(responseArr));
	});
});