import {Meteor} from 'meteor/meteor';
import {TAPi18n} from 'meteor/tap:i18n';
import {QuestionGroupCollection} from '/lib/questions/collection.js';
import {ResponsesCollection} from '/lib/responses/collection.js';
import {SessionConfigurationCollection} from '/lib/session_configuration/collection.js';
import * as leaderboardLib from '/lib/leaderboard.js';
import {excelDefaultWorksheetOptions} from './excel_default_options.js';
import {DefaultQuestionGroup} from '/lib/questions/questiongroup_default.js';
import {distinctValuesFromCollection} from '/lib/global.js';

function formatSheet(ws, {responsesWithConfidenceValue, isCASRequired, columnsToFormat, questionGroup, leaderboardData, defaultStyles}) {
	ws.row(1).setHeight(20);
	ws.column(1).setWidth(30);
	ws.column(2).setWidth(isCASRequired ? 10 : 20);
	for (let i = 3; i <= columnsToFormat; i++) {
		ws.column(i).setWidth(20);
	}

	ws.cell(1, 1, 1, columnsToFormat).style(Object.assign({}, defaultStyles.quizNameRowStyle, {
		alignment: {
			vertical: "center"
		}
	}));
	ws.cell(1, columnsToFormat - 1).style({
		alignment: {
			horizontal: "left",
			vertical: "center"
		}
	});

	ws.cell(2, 1, 2, columnsToFormat).style(defaultStyles.exportedAtRowStyle);

	ws.cell(1, 1, 2, 1).style({
		alignment: {
			indent: 5
		}
	});

	ws.cell(4, 1, 7, columnsToFormat).style(defaultStyles.statisticsRowStyle);
	ws.cell(4, 3, 7, 3).style({
		alignment: {
			horizontal: "left"
		}
	});
	ws.cell(7, 3).style({
		numberFormat: '#,##0.00" ms"'
	});

	ws.cell(9, 1, 10, columnsToFormat).style(defaultStyles.attendeeHeaderGroupRowStyle);
	ws.cell(11, 1, 11, columnsToFormat).style(defaultStyles.attendeeHeaderRowStyle);
	ws.cell(11, 1).style({
		alignment: {
			horizontal: "left"
		}
	});

	ws.row(11).filter({
		firstRow: 11,
		firstColumn: 1,
		lastRow: 11,
		lastColumn: columnsToFormat
	});

	let nextStartRow = 17;
	let dataWithoutCompleteCorrectQuestions = 0;
	leaderboardData.forEach(function (leaderboardItem, indexInList) {
		let hasNotAllQuestionsCorrect = false;
		questionGroup.questionList.forEach(function (item, index) {
			if (item.type !== "SurveyQuestion" && leaderboardItem.correctQuestions.indexOf((index + 1)) === -1) {
				hasNotAllQuestionsCorrect = true;
			}
		});
		if (hasNotAllQuestionsCorrect) {
			dataWithoutCompleteCorrectQuestions++;
			return;
		}
		let nextColumnIndex = 3;
		nextStartRow++;
		const targetRow = indexInList + 12;
		if (responsesWithConfidenceValue.length > 0) {
			ws.cell(targetRow, nextColumnIndex++).style({
				alignment: {
					horizontal: "center"
				}
			});
		}
		ws.cell(targetRow, nextColumnIndex++).style({
			alignment: {
				horizontal: "center"
			},
			numberFormat: "#,##0;"
		});
		ws.cell(targetRow, nextColumnIndex++).style({
			alignment: {
				horizontal: "center"
			},
			numberFormat: "#,##0.00;"
		});
	});
	if (nextStartRow === 17) {
		ws.cell(12, 1, 12, columnsToFormat, true).style(Object.assign({}, defaultStyles.attendeeEntryRowStyle, {
			alignment: {
				horizontal: "center"
			}
		}));
		nextStartRow++;
	} else {
		ws.cell(12, 1, (leaderboardData.length + 11 - dataWithoutCompleteCorrectQuestions), columnsToFormat).style(defaultStyles.attendeeEntryRowStyle);
	}

	ws.cell(nextStartRow++, 1, nextStartRow++, columnsToFormat).style(defaultStyles.attendeeHeaderGroupRowStyle);

	ws.cell(nextStartRow, 1, nextStartRow, columnsToFormat).style(defaultStyles.attendeeHeaderRowStyle);
	ws.cell(nextStartRow, 1).style({
		alignment: {
			horizontal: "left"
		}
	});
	nextStartRow++;

	ws.cell(nextStartRow, 1, (leaderboardData.length + (nextStartRow - 1)), columnsToFormat).style(defaultStyles.attendeeEntryRowStyle);

	leaderboardData.forEach(function (leaderboardItem, indexInList) {
		let nextColumnIndex = 3;
		const targetRow = indexInList + nextStartRow;
		if (responsesWithConfidenceValue.length > 0) {
			ws.cell(targetRow, nextColumnIndex++).style({
				alignment: {
					horizontal: "center"
				}
			});
		}
		ws.cell(targetRow, nextColumnIndex++).style({
			alignment: {
				horizontal: "center"
			},
			numberFormat: "#,##0;"
		});
		ws.cell(targetRow, nextColumnIndex++).style({
			alignment: {
				horizontal: "center"
			},
			numberFormat: "#,##0.00;"
		});
	});
}

function setSheetData(ws, {responsesWithConfidenceValue, translation, isCASRequired, questionGroup, questionGroupObject, hashtag, columnsToFormat, leaderboardData, numberOfAttendees}) {
	const date = new Date();
	ws.cell(1, 1).string(TAPi18n.__('export.quiz_name', {lng: translation}) + ': ' + TAPi18n.__(questionGroupObject.getHashtag(), {lng: translation}));
	ws.cell(1, columnsToFormat - 1).string(TAPi18n.__('export.session_content', {lng: translation}));

	ws.cell(2, 1).string(
		TAPi18n.__('export.exported_at_date', {lng: translation}) +
		" " + (date.getDate() < 10 ? "0" + date.getDate() : date.getDate()) +
		"." + ((date.getMonth() + 1) < 10 ? "0" + (date.getMonth() + 1) : (date.getMonth() + 1)) +
		"." + date.getFullYear() +
		" " + TAPi18n.__('export.exported_at', {lng: translation}) +
		" " + (date.getHours() < 10 ? "0" + date.getHours() : date.getHours()) +
		":" + (date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes()) +
		" " + TAPi18n.__('export.exported_at_time', {lng: translation})
	);
	ws.cell(2, columnsToFormat - 1, 2, columnsToFormat, true).string(JSON.stringify(questionGroupObject.serialize()));

	ws.addImage({
		path: '../web.browser/app/images/arsnova_click_small.png',
		type: 'picture',
		position: {
			type: 'oneCellAnchor',
			from: {
				col: 1,
				colOff: "1.5mm",
				row: 1,
				rowOff: 0
			}
		}
	});

	ws.cell(4, 1).string(TAPi18n.__('export.number_attendees', {lng: translation}) + ":");
	ws.cell(4, 3).number(numberOfAttendees);

	ws.cell(5, 1).string(TAPi18n.__('export.average_correct_answered_questions', {lng: translation}) + ":");
	ws.cell(5, 3).number(leaderboardData.map((x)=> {return x.correctQuestions.length;}).reduce((a, b)=> {return a + b;}, 0) / numberOfAttendees);

	ws.cell(6, 1).string(TAPi18n.__('export.average_confidence', {lng: translation}) + ":");
	ws.cell(6, 3).string((leaderboardData.map((x)=> {return x.confidenceValue;}).reduce((a, b)=> {return a + b;}, 0) / numberOfAttendees).toFixed(2) + " %");

	ws.cell(7, 1).string(TAPi18n.__('export.average_response_time', {lng: translation}) + ":");
	ws.cell(7, 3).number(Number(((leaderboardData.map((x)=> {return x.responseTime;}).reduce((a, b)=> {return a + b;}, 0) / numberOfAttendees) / questionGroup.questionList.length).toFixed(2)));

	let nextColumnIndex = 1;
	ws.cell(9, nextColumnIndex).string(TAPi18n.__("export.attendee_complete_correct", {lng: translation}));
	ws.cell(11, nextColumnIndex++).string(TAPi18n.__("export.attendee", {lng: translation}));
	if (isCASRequired) {
		ws.cell(11, nextColumnIndex++).string(TAPi18n.__("export.cas_account_id", {lng: translation}));
		ws.cell(11, nextColumnIndex++).string(TAPi18n.__("export.cas_account_email", {lng: translation}));
	}
	ws.cell(11, nextColumnIndex++).string(TAPi18n.__("export.correct_questions", {lng: translation}));
	if (responsesWithConfidenceValue.length > 0) {
		ws.cell(11, nextColumnIndex++).string(TAPi18n.__("export.average_confidence", {lng: translation}));
	}
	ws.cell(11, nextColumnIndex++).string(TAPi18n.__("export.overall_response_time", {lng: translation}));
	ws.cell(11, nextColumnIndex++).string(TAPi18n.__("export.average_response_time", {lng: translation}));

	let nextStartRow = 17;
	leaderboardData.forEach(function (leaderboardItem, indexInList) {
		let hasNotAllQuestionsCorrect = false;
		questionGroup.questionList.forEach(function (item, index) {
			if (item.type !== "SurveyQuestion" && leaderboardItem.correctQuestions.indexOf((index + 1)) === -1) {
				hasNotAllQuestionsCorrect = true;
			}
		});
		if (hasNotAllQuestionsCorrect) {
			return;
		}
		nextColumnIndex = 1;
		nextStartRow++;
		const targetRow = indexInList + 12;
		ws.cell(targetRow, nextColumnIndex++).string(leaderboardItem.nick);
		if (isCASRequired) {
			const profile = Meteor.users.findOne({_id: ResponsesCollection.findOne({hashtag: hashtag, userNick: leaderboardItem.nick}).userRef}).profile;
			ws.cell(targetRow, nextColumnIndex++).string(profile.id);
			ws.cell(targetRow, nextColumnIndex++).string(profile.mail instanceof Array ? profile.mail.slice(-1)[0] : profile.mail);
		}
		ws.cell(targetRow, nextColumnIndex++).string(leaderboardItem.correctQuestions.join(", "));
		if (responsesWithConfidenceValue.length > 0) {
			ws.cell(targetRow, nextColumnIndex++).string(leaderboardItem.confidenceValue.toFixed(2) + " %");
		}
		ws.cell(targetRow, nextColumnIndex++).number(leaderboardItem.responseTime);
		ws.cell(targetRow, nextColumnIndex++).number(Number(parseFloat(leaderboardItem.responseTime / leaderboardItem.numberOfEntries).toFixed(2)));
	});
	if (nextStartRow === 17) {
		ws.cell(12, 1).string(TAPi18n.__("export.attendee_complete_correct_none_available", {lng: translation}));
		nextStartRow++;
	}

	nextColumnIndex = 1;
	ws.cell(nextStartRow, nextColumnIndex).string(TAPi18n.__("export.attendee_all_entries", {lng: translation}));
	nextStartRow += 2;

	ws.cell(nextStartRow, nextColumnIndex++).string(TAPi18n.__("export.attendee", {lng: translation}));
	if (isCASRequired) {
		ws.cell(nextStartRow, nextColumnIndex++).string(TAPi18n.__("export.cas_account_id", {lng: translation}));
		ws.cell(nextStartRow, nextColumnIndex++).string(TAPi18n.__("export.cas_account_email", {lng: translation}));
	}
	ws.cell(nextStartRow, nextColumnIndex++).string(TAPi18n.__("export.correct_questions", {lng: translation}));
	if (responsesWithConfidenceValue.length > 0) {
		ws.cell(nextStartRow, nextColumnIndex++).string(TAPi18n.__("export.average_confidence", {lng: translation}));
	}
	ws.cell(nextStartRow, nextColumnIndex++).string(TAPi18n.__("export.overall_response_time", {lng: translation}));
	ws.cell(nextStartRow++, nextColumnIndex++).string(TAPi18n.__("export.average_response_time", {lng: translation}));

	leaderboardData.forEach(function (leaderboardItem, indexInList) {
		nextColumnIndex = 1;
		const targetRow = indexInList + nextStartRow;
		ws.cell(targetRow, nextColumnIndex++).string(leaderboardItem.nick);
		if (isCASRequired) {
			const profile = Meteor.users.findOne({_id: ResponsesCollection.findOne({hashtag: hashtag, userNick: leaderboardItem.nick}).userRef}).profile;
			ws.cell(targetRow, nextColumnIndex++).string(profile.id);
			ws.cell(targetRow, nextColumnIndex++).string(profile.mail instanceof Array ? profile.mail.slice(-1)[0] : profile.mail);
		}
		ws.cell(targetRow, nextColumnIndex++).string(leaderboardItem.correctQuestions.join(", "));
		if (responsesWithConfidenceValue.length > 0) {
			ws.cell(targetRow, nextColumnIndex++).string(leaderboardItem.confidenceValue.toFixed(2) + " %");
		}
		ws.cell(targetRow, nextColumnIndex++).number(leaderboardItem.responseTime);
		ws.cell(targetRow, nextColumnIndex++).number(Number(parseFloat(leaderboardItem.responseTime / leaderboardItem.numberOfEntries).toFixed(2)));
	});
}

export function generateSheet(wb, {hashtag, translation, defaultStyles}) {
	leaderboardLib.init(hashtag);
	const questionGroup = QuestionGroupCollection.findOne({hashtag: hashtag});
	const questionGroupObject = new DefaultQuestionGroup(JSON.parse(JSON.stringify(questionGroup)));
	const ws = wb.addWorksheet(TAPi18n.__('export.summary', {lng: translation}), excelDefaultWorksheetOptions);
	const allResponses = ResponsesCollection.find({hashtag: hashtag});
	const responsesWithConfidenceValue = allResponses.fetch().filter((x)=> {return x.confidenceValue > -1;});
	const leaderboardData = _.sortBy(leaderboardLib.objectToArray(leaderboardLib.getAllLeaderboardItems(true)), function (o) { return o.responseTime; });
	const numberOfAttendees = distinctValuesFromCollection(ResponsesCollection, 'userNick', {hashtag: hashtag}).length;
	const isCASRequired = SessionConfigurationCollection.findOne({hashtag: hashtag}).nicks.restrictToCASLogin;
	let columnsToFormat = 4;
	if (responsesWithConfidenceValue.length > 0) {
		columnsToFormat++;
	}
	if (isCASRequired) {
		columnsToFormat += 2;
	}

	formatSheet(ws, {responsesWithConfidenceValue, isCASRequired, columnsToFormat, questionGroup, leaderboardData, defaultStyles});
	setSheetData(ws, {responsesWithConfidenceValue, translation, isCASRequired, questionGroup, questionGroupObject, hashtag, columnsToFormat, leaderboardData, numberOfAttendees});
}
