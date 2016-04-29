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
import {Splashscreen} from '/client/plugins/splashscreen/scripts/lib.js';
import {markdownAlreadyExistsAndAutoRemove, insertInQuestionText} from './lib.js';

Template.markdownBar.events({
	"click #infoMarkdownButton": function () {
		new Splashscreen({
			autostart: true,
			instanceId: "infoMarkdown",
			onRendered: function (instance) {
				instance.templateSelector.find(".modal-body").html(TAPi18n.__("plugins.markdown_bar.info_content"));
			}
		});
	},
	"click #boldMarkdownButton": function () {
		if (!markdownAlreadyExistsAndAutoRemove('**', '**')) {
			insertInQuestionText('**', '**');
		}
	},
	"click #headerMarkdownButton": function () {
		if (!markdownAlreadyExistsAndAutoRemove('###', '###')) {
			if (markdownAlreadyExistsAndAutoRemove('##', '##')) {
				insertInQuestionText('###', '###');
			} else {
				if (markdownAlreadyExistsAndAutoRemove('#', '#')) {
					insertInQuestionText('##', '##');
				} else {
					insertInQuestionText('#', '#');
				}
			}
		}
	},
	"click #hyperlinkMarkdownButton": function () {
		new Splashscreen({
			autostart: true,
			templateName: "hyperlinkInsertSplashscreen",
			closeOnButton: "#js-btn-closeHyperlink, #js-btn-saveHyperlink",
			onRendered: function (instance) {
				var textarea = document.getElementById('questionText');
				if (textarea.selectionStart != textarea.selectionEnd) {
					var strPosBegin = textarea.selectionStart;
					var strPosEnd = textarea.selectionEnd;
					var frontText = (textarea.value).substring(0, strPosBegin);
					var middleText = (textarea.value).substring(strPosBegin, strPosEnd);
					var backText = (textarea.value).substring(strPosEnd, textarea.value.length);

					instance.templateSelector.find('#hyperlinkText').val(middleText);
					textarea.value = frontText + backText;
				}
				$('#js-btn-saveHyperlink').on('click', function () {
					var linkText = document.getElementById('hyperlinkText').value;
					var linkDestination = document.getElementById('hyperlinkDestination').value;
					insertInQuestionText('[' + linkText + '](' + linkDestination + ')');
				});
			}
		});
	},
	"click #unsortedListMarkdownButton": function () {
		if (!markdownAlreadyExistsAndAutoRemove('- ')) {
			insertInQuestionText('- ');
		}
	},
	"click #sortedListMarkdownButton": function () {
		if (!markdownAlreadyExistsAndAutoRemove('1. ')) {
			insertInQuestionText('1. ');
		}
	},
	"click #latexMarkdownButton": function () {
		if (!markdownAlreadyExistsAndAutoRemove('\\(', '\\)')) {
			if (!markdownAlreadyExistsAndAutoRemove('$$', '$$')) {
				insertInQuestionText('\\(', '\\)');
			}
		} else {
			insertInQuestionText('$$', '$$');
		}
	},
	"click #codeMarkdownButton": function () {
		if (!markdownAlreadyExistsAndAutoRemove('<hlcode>', '</hlcode>')) {
			insertInQuestionText('<hlcode>', '</hlcode>');
		}
	},
	"click #commentMarkdownButton": function () {
		if (!markdownAlreadyExistsAndAutoRemove('>')) {
			insertInQuestionText('>');
		}
	},
	"click #pictureMarkdownButton": function () {
		new Splashscreen({
			autostart: true,
			templateName: "pictureInsertSplashscreen",
			closeOnButton: "#js-btn-closePicture, #js-btn-savePicture",
			onRendered: function (instance) {
				var textarea = document.getElementById('questionText');
				if (textarea.selectionStart != textarea.selectionEnd) {
					var strPosBegin = textarea.selectionStart;
					var strPosEnd = textarea.selectionEnd;
					var frontText = (textarea.value).substring(0, strPosBegin);
					var middleText = (textarea.value).substring(strPosBegin, strPosEnd);
					var backText = (textarea.value).substring(strPosEnd, textarea.value.length);

					instance.templateSelector.find('#hyperlinkText').val(middleText);
					textarea.value = frontText + backText;
				}
				$('#js-btn-savePicture').on('click', function () {
					var linkText = document.getElementById('pictureText').value;
					var linkDestination = document.getElementById('pictureDestination').value;
					insertInQuestionText('![' + linkText + '](' + linkDestination + ' "autoxautoxleft")');
				});
			}
		});
	},
	"click #youtubeMarkdownButton": function () {
		new Splashscreen({
			autostart: true,
			templateName: "youtubeInsertSplashscreen",
			closeOnButton: "#js-btn-closeYoutube, #js-btn-saveYoutube",
			onRendered: function (instance) {
				var textarea = document.getElementById('questionText');
				if (textarea.selectionStart != textarea.selectionEnd) {
					var strPosBegin = textarea.selectionStart;
					var strPosEnd = textarea.selectionEnd;
					var frontText = (textarea.value).substring(0, strPosBegin);
					var middleText = (textarea.value).substring(strPosBegin, strPosEnd);
					var backText = (textarea.value).substring(strPosEnd, textarea.value.length);

					instance.templateSelector.find('#youtubeText').val(middleText);
					textarea.value = frontText + backText;
				}
				$('#js-btn-saveYoutube').on('click', function () {
					var linkText = document.getElementById('youtubeText').value;
					var linkDestination = document.getElementById('youtubeDestination').value;
					var picUrl = linkDestination.replace("www.", "img.").replace("watch?v=", "vi/").concat("/0.jpg");
					insertInQuestionText('[![' + linkText + '](' + picUrl + ')](' + linkDestination + ')');
				});
			}
		});
	},
	"click #vimeoMarkdownButton": function () {
		new Splashscreen({
			autostart: true,
			templateName: "vimeoInsertSplashscreen",
			closeOnButton: "#js-btn-closeVimeo, #js-btn-saveVimeo",
			onRendered: function (instance) {
				var textarea = document.getElementById('questionText');
				if (textarea.selectionStart != textarea.selectionEnd) {
					var strPosBegin = textarea.selectionStart;
					var strPosEnd = textarea.selectionEnd;
					var frontText = (textarea.value).substring(0, strPosBegin);
					var middleText = (textarea.value).substring(strPosBegin, strPosEnd);
					var backText = (textarea.value).substring(strPosEnd, textarea.value.length);

					instance.templateSelector.find('#vimeoText').val(middleText);
					textarea.value = frontText + backText;
				}
				$('#js-btn-saveVimeo').on('click', function () {
					var linkText = document.getElementById('vimeoText').value;
					var linkDestination = document.getElementById('vimeoDestination').value;
					var videoId = linkDestination.substr(linkDestination.lastIndexOf("/") + 1);
					var picUrl = 'https://i.vimeocdn.com/video/' + videoId + '_200x150.jpg';
					var videoUrl = 'https://player.vimeo.com/video/' + videoId;
					insertInQuestionText('[![' + linkText + '](' + picUrl + ')](' + videoUrl + ')');
				});
			}
		});
	}
});