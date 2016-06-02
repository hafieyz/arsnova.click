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
import {EventManagerCollection} from '/lib/eventmanager/collection.js';
import * as questionLib from '/client/layout/view_questions/scripts/lib.js';
import * as localData from '/lib/local_storage.js';
import * as lib from './lib.js';

var redirectTracker = null;

Template.questionList.onCreated(function () {
	Meteor.call("EventManagerCollection.setActiveQuestion", Router.current().params.quizName, 0);

	if (!Session.get("questionGroup")) {
		Session.set("questionGroup", localData.reenterSession(Router.current().params.quizName));
	}
	$('#theme-wrapper').removeClass().addClass(Session.get("questionGroup").getTheme());
});

Template.questionList.onDestroyed(function () {
	if (redirectTracker) {
		redirectTracker.stop();
	}
	delete sessionStorage.overrideValidQuestionRedirect;
});

Template.questionList.onRendered(function () {
	let handleRedirect = true;
	redirectTracker = Tracker.autorun(function () {
		if (!sessionStorage.getItem("overrideValidQuestionRedirect")) {
			handleRedirect = false;
			if (redirectTracker) {
				redirectTracker.stop();
			}
		} else {
			if (Session.get("questionGroup").isValid() && handleRedirect) {
				Meteor.call("MemberListCollection.removeFromSession", Router.current().params.quizName);
				Meteor.call("EventManagerCollection.setActiveQuestion", Router.current().params.quizName, 0);
				Meteor.call("EventManagerCollection.setSessionStatus", Router.current().params.quizName, 2);
				Meteor.call("QuestionGroupCollection.persist", Session.get("questionGroup").serialize());
				Router.go("/" + Router.current().params.quizName + "/memberlist");
			}
		}
		delete sessionStorage.overrideValidQuestionRedirect;
	});
});

Template.questionList.helpers({
	question: function () {
		return Session.get("questionGroup").getQuestionList();
	},
	getNormalizedIndex: function (index) {
		return index + 1;
	},
	isActiveIndex: function (index) {
		if (!EventManagerCollection.findOne()) {
			return;
		}
		return index === EventManagerCollection.findOne().questionIndex;
	},
	hasCompleteContent: function (index) {
		if (index >= Session.get("questionGroup").getQuestionList().length) {
			return;
		}
		return Session.get("questionGroup").getQuestionList()[index].isValid();
	}
});

Template.questionList.events({
	'click .questionIcon:not(.active)': function (event) {
		Meteor.call("EventManagerCollection.setActiveQuestion", Router.current().params.quizName, parseInt($(event.target).closest(".questionIcon").attr("id").replace("questionIcon_", "")), function () {
			questionLib.checkForMarkdown();
			questionLib.checkForValidQuestionText();
		});
	},
	'click .removeQuestion': function (event) {
		const id = parseInt($(event.target).closest(".questionIcon").attr("id").replace("questionIcon_", ""));
		const questionItem = Session.get("questionGroup");
		questionItem.removeQuestion(id);
		if (questionItem.getQuestionList().length === 0) {
			questionItem.addDefaultQuestion();
		}
		Session.set("questionGroup", questionItem);
		localData.addHashtag(questionItem);
		const nextId = id === 0 ? 0 : id - 1;
		Meteor.call("EventManagerCollection.setActiveQuestion", Router.current().params.quizName, nextId);
	},
	'click #addQuestion': function () {
		lib.addNewQuestion(questionLib.checkForMarkdown);
		questionLib.checkForValidQuestionText();
		setTimeout(()=> {
			let scrollPane = $(".questionScrollPane");
			scrollPane.scrollLeft(scrollPane.width());
		}, 200);
	}
});
