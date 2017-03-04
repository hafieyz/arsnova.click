import {TAPi18n} from 'meteor/tap:i18n';
import {QuestionGroupCollection} from '/lib/questions/collection.js';
import {AnswerOptionCollection} from '/lib/answeroptions/collection.js';
import {ResponsesCollection} from '/lib/responses/collection.js';
import * as leaderboardLib from '/lib/leaderboard.js';
import {excelDefaultWorksheetOptions} from './excel_default_options.js';
import {calculateNumberOfAnswers} from './excel_function_library.js';
import {DefaultQuestionGroup} from '/lib/questions/questiongroup_default.js';

export function generateSheet(wb, options, index) {
	const hashtag = options.hashtag;
	const translation = options.translation;
	const questionGroup = QuestionGroupCollection.findOne({hashtag: hashtag});
	const questionGroupObject = new DefaultQuestionGroup(JSON.parse(JSON.stringify(questionGroup)));
	const ws = wb.addWorksheet(TAPi18n.__('export.question', {lng: translation}) + ' ' + (index + 1), excelDefaultWorksheetOptions);
	const answerList = questionGroup.questionList[index].answerOptionList;
	const allResponses = ResponsesCollection.find({hashtag: hashtag, questionIndex: index});
	const responsesWithConfidenceValue = allResponses.map((x)=> {return x.confidenceValue > -1;});
	const columnsToFormat = answerList.length < 4 ? 4 : answerList.length + 1;
	ws.row(1).setHeight(20);
	ws.cell(1, 1, 1, columnsToFormat).style({
		font: {
			color: "FFFFFFFF"
		},
		fill: {
			type: "pattern",
			patternType: "solid",
			fgColor: "FF000000"
		}
	});
	ws.cell(1, 1).style({
		alignment: {
			vertical: "center"
		}
	}).string(TAPi18n.__('export.question_type', {lng: translation}) + ': ' + TAPi18n.__(questionGroupObject.getQuestionList()[index].translationReferrer(), {lng: translation}));
	ws.cell(2, 1, 2, columnsToFormat).style({
		font: {
			color: "FFFFFFFF"
		},
		fill: {
			type: "pattern",
			patternType: "solid",
			fgColor: "FF616161"
		}
	});
	ws.cell(6, 1, 7, columnsToFormat).style({
		font: {
			color: "FF000000"
		},
		fill: {
			type: "pattern",
			patternType: "solid",
			fgColor: "FFC5C5C5"
		}
	});
	ws.cell(9, 1, 9, columnsToFormat).style({
		font: {
			color: "FFFFFFFF"
		},
		fill: {
			type: "pattern",
			patternType: "solid",
			fgColor: "FF616161"
		}
	});
	ws.cell(2, 1).string(TAPi18n.__("export.question", {lng: translation}));
	ws.cell(6, 1).style({
		border: {
			bottom: {
				style: "thin",
				color: "black"
			}
		}
	}).string(TAPi18n.__("export.number_of_answers", {lng: translation}) + ":");
	if (responsesWithConfidenceValue.length > 0) {
		ws.cell(7, 1).style({
			border: {
				bottom: {
					style: "thin",
					color: "black"
				}
			}
		}).string(TAPi18n.__("export.percent_confidence", {lng: translation}) + ":");
		let confidenceSummary = 0;
		allResponses.forEach(function (item) {
			confidenceSummary += item.confidenceValue;
		});
		ws.cell(7, 2).style({
			alignment: {
				horizontal: "center"
			},
			border: {
				bottom: {
					style: "thin",
					color: "black"
				}
			}
		}).string((confidenceSummary / responsesWithConfidenceValue.length) + " %");
	}

	ws.column(1).setWidth(30);
	ws.column(2).setWidth(20);
	ws.column(3).setWidth(20);
	ws.column(4).setWidth(20);
	ws.cell(4, 1).style({
		alignment: {
			wrapText: true,
			vertical: "top"
		}
	}).string(questionGroup.questionList[index].questionText);
	for (let j = 0; j < answerList.length; j++) {
		ws.cell(2, (j + 2)).string(TAPi18n.__("export.answer", {lng: translation}) + " " + (j + 1));
		ws.column((j + 2)).setWidth(20);
		ws.cell(4, (j + 2)).style({
			alignment: {
				wrapText: true,
				vertical: "center"
			},
			font: {
				color: "FF000000"
			}
		}).string(answerList[j].answerText);
		ws.cell(6, (j + 2)).style({
			alignment: {
				horizontal: "center"
			},
			border: {
				bottom: {
					style: "thin",
					color: "black"
				}
			}
		}).number(calculateNumberOfAnswers(hashtag, index, j));
	}

	let nextColumnIndex = 1;
	ws.cell(9, nextColumnIndex++).string(TAPi18n.__("export.attendee", {lng: translation}));
	ws.cell(9, nextColumnIndex++).string(TAPi18n.__("export.answer", {lng: translation}));
	if (responsesWithConfidenceValue.length > 0) {
		ws.cell(9, nextColumnIndex++).string(TAPi18n.__("export.confidence_level", {lng: translation}));
	}
	ws.cell(9, nextColumnIndex++).string(TAPi18n.__("export.time", {lng: translation}));

	leaderboardLib.init(hashtag);
	allResponses.forEach(function (responseItem, indexInList) {
		let nextColumnIndex = 1;
		ws.cell(((indexInList) + 11), 1, ((indexInList) + 11), columnsToFormat).style({
			font: {
				color: "FF000000"
			},
			fill: {
				type: "pattern",
				patternType: "solid",
				fgColor: "FFC5C5C5"
			}
		});
		ws.cell(((indexInList) + 11), nextColumnIndex++).string(responseItem.userNick);
		const chosenAnswer = AnswerOptionCollection.find({
			hashtag: hashtag,
			questionIndex: index,
			answerOptionNumber: {
				$in: responseItem.answerOptionNumber
			}
		}).map((x) => {
			return x.answerText;
		});
		ws.cell(((indexInList) + 11), nextColumnIndex++).style({
			font: {
				color: "FF000000"
			}
		}).string(chosenAnswer.join(", "));
		if (responsesWithConfidenceValue.length > 0) {
			ws.cell(((indexInList) + 11), nextColumnIndex++).style({
				alignment: {
					horizontal: "center"
				}
			}).string(responseItem.confidenceValue + "%");
		}
		ws.cell(((indexInList) + 11), nextColumnIndex++).style({
			alignment: {
				horizontal: "center"
			}
		}).number(responseItem.responseTime);
	});
}
