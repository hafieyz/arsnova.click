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
import {Tracker} from 'meteor/tracker';
import {Router} from 'meteor/iron:router';
import {TAPi18n} from 'meteor/tap:i18n';
import {EventManagerCollection} from '/lib/eventmanager/collection.js';
import {AnswerOptionCollection} from '/lib/answeroptions/collection.js';
import {MemberListCollection} from '/lib/member_list/collection.js';
import {QuestionGroupCollection} from '/lib/questions/collection.js';
import {RangedQuestion} from "/lib/questions/question_ranged.js";
import {FreeTextQuestion} from "/lib/questions/question_freetext.js";
import * as localData from '/lib/local_storage.js';
import * as footerElements from "/client/layout/region_footer/scripts/lib.js";
import {mathjaxMarkdown} from '/client/lib/mathjax_markdown.js';
import {Splashscreen} from '/client/plugins/splashscreen/scripts/lib.js';
import {buzzsound1, finishSound, setFinishSoundTitle, setBuzzsound1} from '/client/plugins/sound/scripts/lib.js';
import {SessionConfigurationCollection} from '/lib/session_configuration/collection.js';
import * as headerLib from "/client/layout/region_header/lib.js";

export let countdown = null;
export let routeToLeaderboardTimer = null;
export let questionDialog = null;

export const liveResultsTracker = new Tracker.Dependency();

export function deleteCountdown() {
	if (countdown) {
		countdown.stop();
	}
	countdown = null;
}

export function setQuestionDialog(instance) {
	if (questionDialog instanceof Splashscreen) {
		questionDialog.close();
	}
	questionDialog = instance;
}

export function getQuestionDialog() {
	return questionDialog;
}

export function isCountdownZero(index) {
	let eventDoc = EventManagerCollection.findOne();
	if (!eventDoc || Session.get("isQueringServerForTimeStamp")) {
		return false;
	}
	if (!countdown || countdown.get() === 0 || Session.get("sessionClosed") || !Session.get("countdownInitialized") || eventDoc.questionIndex !== index) {
		return true;
	} else {
		var timer = Math.round(countdown.get());
		return timer <= 0;
	}
}

export function displayQuestionAndAnswerDialog(questionIndex) {
	mathjaxMarkdown.initializeMarkdownAndLatex();
	const questionElement = Session.get("questionGroup").getQuestionList()[questionIndex];
	let answerContent = "";

	if (questionElement.typeName() === "RangedQuestion") {
		if (!isCountdownZero(questionIndex)) {
			$('#answerOptionsHeader').hide();
		} else {
			answerContent += TAPi18n.__("view.answeroptions.ranged_question.min_range") + ": " + questionElement.getMinRange() + "<br/>";
			answerContent += TAPi18n.__("view.answeroptions.ranged_question.max_range") + ": " + questionElement.getMaxRange() + "<br/><br/>";
			answerContent += TAPi18n.__("view.answeroptions.ranged_question.correct_value") + ": " + questionElement.getCorrectValue() + "<br/>";
		}
	} else if (questionElement.typeName() === "FreeTextQuestion") {
		if (!isCountdownZero(questionIndex)) {
			$('#answerOptionsHeader').hide();
		} else {
			answerContent += TAPi18n.__("view.liveResults.correct_answer") + ":<br/>";
		}
	} else {
		questionElement.getAnswerOptionList().forEach(function (answerOption) {
			if (!answerOption.getAnswerText()) {
				answerOption.setAnswerText("");
			}
			answerContent += "<strong>" + String.fromCharCode((answerOption.getAnswerOptionNumber() + 65)) + "</strong>" + "<br/>";
			answerContent += mathjaxMarkdown.getContent(answerOption.getAnswerText());
		});
	}

	setQuestionDialog(new Splashscreen({
		autostart: true,
		templateName: 'questionAndAnswerSplashscreen',
		closeOnButton: '#js-btn-hideQuestionModal, .splashscreen-container-close',
		instanceId: "questionAndAnswers_" + questionIndex,
		onRendered: function (instance) {
			instance.templateSelector.find('#questionContent').html(mathjaxMarkdown.getContent(questionElement.getQuestionText()));
			mathjaxMarkdown.addSyntaxHighlightLineNumbers(instance.templateSelector.find('#questionContent'));
			instance.templateSelector.find('#answerContent').html(answerContent);
			mathjaxMarkdown.addSyntaxHighlightLineNumbers(instance.templateSelector.find('#answerContent'));
		}
	}));
}

/**
 * @source http://stackoverflow.com/a/17267684
 */
export function hslColPerc(percent, start, end) {
	var a = percent / 100, b = end * a, c = b + start;
	return 'hsl(' + c + ',100%,25%)';
}

export function getPercentRead(index) {
	var sumRead = 0;
	var count = 0;
	MemberListCollection.find().map(function (member) {
		count++;
		if (member.readConfirmed[index]) {
			sumRead += member.readConfirmed[index];
		}
	});
	return count ? Math.floor(sumRead / count * 100) : 0;
}

export function getCurrentRead(index) {
	var sumRead = 0;
	MemberListCollection.find().map(function (member) {
		if (member.readConfirmed[index]) {
			sumRead += member.readConfirmed[index];
		}
	});
	return sumRead;
}

export function getProgressbarCSSClass(index, cssClass) {
	if (isCountdownZero(index)) {
		return cssClass;
	} else {
		return "progress-default";
	}
}

export function checkIfIsCorrect(isCorrect) {
	return isCorrect > 0 ? 'progress-success' : isCorrect < 0 ? 'progress-default' : 'progress-failure';
}

export function countdownFinish() {
	setQuestionDialog(null);
	Session.set("countdownInitialized", false);
	deleteCountdown();
	$('.disableOnActiveCountdown').removeAttr("disabled");
	if (!localData.containsHashtag(Router.current().params.quizName)) {
		return;
	}
	const questionIndex = EventManagerCollection.findOne().questionIndex;
	$('.navbar-footer').show();
	if (Session.get("soundIsPlaying")) {
		buzzsound1.stop();
		var configDoc = SessionConfigurationCollection.findOne({hashtag: Router.current().params.quizName});

		if (configDoc.music.finishSoundTitle !== "Silence") {
			setFinishSoundTitle(configDoc.music.finishSoundTitle);
			finishSound.play();
		}


		Session.set("soundIsPlaying", false);
	}
	headerLib.calculateTitelHeight();
	if (questionIndex + 1 >= QuestionGroupCollection.findOne().questionList.length) {
		Session.set("sessionClosed", true);
		if (localData.containsHashtag(Router.current().params.quizName) && AnswerOptionCollection.find({isCorrect: true}).count() > 0) {
			routeToLeaderboardTimer = setTimeout(() => {
				Router.go("/" + Router.current().params.quizName + "/leaderBoard/all");
			}, 7000);
		}
		footerElements.removeFooterElement(footerElements.footerElemReadingConfirmation);
	} else {
		footerElements.addFooterElement(footerElements.footerElemReadingConfirmation, 2);
	}
}

/**
 * @see http://stackoverflow.com/a/7228322
 * @param min Minimum range
 * @param max Maximum range
 * @returns {number} A random integer between min and max
 */
export function randomIntFromInterval(min,max)
{
	return Math.floor(Math.random() * (max - min + 1) + min);
}

export function startDebugVoting() {
	const debugMembers = MemberListCollection.find({isDummyUser: true}).fetch();
	const countdownValue = countdown.get();
	const questionIndex = EventManagerCollection.findOne().questionIndex;
	debugMembers.forEach(function (member) {
		const replyTimer = randomIntFromInterval(0, countdownValue - 1);
		if (replyTimer >= countdownValue) {
			return;
		}
		const question = Session.get("questionGroup").getQuestionList()[questionIndex];
		setTimeout(function () {
			const configObj = {
				hashtag: Router.current().params.quizName,
				questionIndex: questionIndex,
				userNick: member.nick
			};
			if (question instanceof RangedQuestion) {
				configObj.rangedInputValue = Math.random() > 0.6 ? Session.get("questionGroup").getQuestionList()[questionIndex].getCorrectValue() : Session.get("questionGroup").getQuestionList()[questionIndex].getMaxRange() + 10;
			} else if (question instanceof FreeTextQuestion) {
				configObj.freeTextInputValue = Math.random() > 0.75 ? Session.get("questionGroup").getQuestionList()[questionIndex].getAnswerOptionList()[0].getAnswerText() : Session.get("questionGroup").getQuestionList()[questionIndex].getAnswerOptionList()[0].getAnswerText().split("").reverse().join("");
				configObj.answerOptionNumber = [0];
			} else {
				const randomChance = Math.random();
				configObj.answerOptionNumber = [];
				const answerList = Session.get("questionGroup").getQuestionList()[questionIndex].getAnswerOptionList();
				if (Session.get("questionGroup").getQuestionList()[questionIndex].typeName() === "SingleChoiceQuestion") {
					if (randomChance > 0.75) {
						answerList.forEach(function (answerItem) {
							if (answerItem.getIsCorrect()) {
								configObj.answerOptionNumber.push(answerItem.getAnswerOptionNumber());
							}
						});
					} else if (randomChance > 0.25 && randomChance <= 0.75) {
						configObj.answerOptionNumber.push(randomIntFromInterval(0, answerList.length - 1));
					} else {
						configObj.answerOptionNumber = [];
						answerList.forEach(function (answerItem) {
							if (!answerItem.getIsCorrect() && configObj.answerOptionNumber.length === 0) {
								configObj.answerOptionNumber.push(answerItem.getAnswerOptionNumber());
							}
						});
					}
				} else {
					if (randomChance > 0.75) {
						answerList.forEach(function (answerItem) {
							if (answerItem.getIsCorrect()) {
								configObj.answerOptionNumber.push(answerItem.getAnswerOptionNumber());
							}
						});
					} else if (randomChance > 0.25 && randomChance <= 0.75) {
						for (let i = 0; i < randomIntFromInterval(0, answerList.length - 1); i++) {
							const random = Math.random();
							if (random > 0.5 && answerList[i].getIsCorrect()) {
								configObj.answerOptionNumber.push(answerList[i].getAnswerOptionNumber());
							} else if (random <= 0.5) {
								configObj.answerOptionNumber.push(answerList[i].getAnswerOptionNumber());
							}
						}
					} else {
						configObj.answerOptionNumber = [];
						answerList.forEach(function (answerItem) {
							if (!answerItem.getIsCorrect() && configObj.answerOptionNumber.length === 0) {
								configObj.answerOptionNumber.push(answerItem.getAnswerOptionNumber());
							}
						});
					}
				}
			}
			Meteor.call('ResponsesCollection.addResponse', configObj);
		}, replyTimer * 1000);
	});
}

export function startCountdown(index) {
	if (Session.get("countdownInitialized") || Session.get("sessionClosed")) {
		Session.set("isQueringServerForTimeStamp", false);
		return;
	}
	Session.set("showingReadingConfirmation", undefined);
	Session.set("isQueringServerForTimeStamp", true);

	const isOwner = localData.containsHashtag(Session.get("questionGroup").getHashtag());
	if (isOwner) {
		const musicSettings = Session.get("questionGroup").getConfiguration().getMusicSettings();
		if (musicSettings.isEnabled()) {
			var songTitle = musicSettings.getTitle();

			if (songTitle === "Random") {
				if (index === 0 || index % 3 === 0) {
					songTitle = "Song3";
				} else if (index % 2 === 0) {
					songTitle = "Song2";
				} else {
					songTitle = "Song1";
				}
			}
			setBuzzsound1(songTitle);

			buzzsound1.setVolume(musicSettings.getVolume());
			buzzsound1.play();
			Session.set("soundIsPlaying", true);
		}
	}
	Meteor.call("Main.calculateRemainingCountdown", Session.get("questionGroup").getHashtag(), index, function (error, response) {
		if (response <= 0) {
			Session.set("isQueringServerForTimeStamp", false);
			return;
		}
		if (isOwner) {
			Meteor.call("EventManagerCollection.setActiveQuestion", Session.get("questionGroup").getHashtag(), index);
		}

		countdown = new ReactiveCountdown(response);
		countdown.start(function () {
			if (countdown && countdown.get() === 0) {
				countdownFinish();
			}
		});
		$('.navbar-footer').hide();
		Session.set("isQueringServerForTimeStamp", false);
		Session.set("countdownInitialized", true);

		if (isOwner) {
			startDebugVoting();
		}
	});
}

/**
 * TODO remove this function with the Meteor 1.3 update and replace with an import from the memberList!
 */
export function calculateButtonCount() {
	/*
	 This session variable determines if the user has clicked on the show-more-button. The button count must not
	 be calculated then. It is set in the event handler of the button and is reset if the user reenters the page
	 */
	if (Session.get("LearnerCountOverride")) {
		return;
	}

	/*
	 To calculate the maximum output of attendee button rows we need to:
	 - get the contentPosition height (the content wrapper for all elements)
	 - subtract the confirmationCounter height (the progress bar)
	 - subtract the attendee-in-quiz-wrapper height (the session information for the attendees)
	 - subtract the margin to the top (the title or the show more button)
	 */
	var viewport = $(".contentPosition"), learnerListMargin = $('.learner-list').length > 0 ? parseInt($('.learner-list').first().css('margin-top').replace("px", "")) : 0;

	var viewPortHeight = viewport.outerHeight() - $('.question-title').outerHeight(true) - $('.readingConfirmationProgressRow').outerHeight(true) - $('.btn-more-learners').outerHeight(true) - learnerListMargin;

	/* The height of the learner button must be set manually if the html elements are not yet generated */
	var btnLearnerHeight = $('.btn-learner').first().parent().outerHeight() ? $('.btn-learner').first().parent().outerHeight() : 54;

	/* Calculate how much buttons we can place in the viewport until we need to scroll */
	var queryLimiter = Math.floor(viewPortHeight / btnLearnerHeight);

	/*
	 Multiply the displayed elements by 3 if on widescreen and reduce the max output of buttons by 1 row for the display
	 more button if necessary. Also make sure there is at least one row of buttons shown even if the user has to scroll
	 */
	var allMembers = [];
	MemberListCollection.find().forEach(function (doc) {
		if (doc.readConfirmed[EventManagerCollection.findOne().readingConfirmationIndex]) {
			allMembers.push(doc);
		}
	});
	var limitModifier = (viewport.outerWidth() >= 992) ? 3 : (viewport.outerWidth() >= 768 && viewport.outerWidth() < 992) ? 2 : 1;

	queryLimiter *= limitModifier;
	if (queryLimiter <= 0) {
		queryLimiter = limitModifier;
	} else if (allMembers > queryLimiter) {
		/*
		 Use Math.ceil() as a session owner because the member buttons position may conflict with the back/forward buttons position.
		 As a session attendee we do not have these buttons, so we can use Math.floor() to display a extra row
		 */
		if ($(".fixed-bottom").length > 0) {
			queryLimiter -= Math.ceil($('.more-learners-row').first().outerHeight() / btnLearnerHeight) * limitModifier;
		} else {
			queryLimiter -= Math.floor($('.more-learners-row').first().outerHeight() / btnLearnerHeight) * limitModifier;
		}
	}

	/*
	 This session variable holds the amount of shown buttons and is used in the scripts function
	 Template.memberlist.scripts.learners which gets the attendees from the mongo db
	 */
	Session.set("LearnerCount", queryLimiter);
}
