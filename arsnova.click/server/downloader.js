/*
 * This file is part of ARSnova Click.
 * Copyright (C) 2018 The ARSnova Team
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

import mkdirp from 'mkdirp';
import process from 'process';
import path from 'path';
import fs from 'fs';
import http from 'http';
import https from 'https';
import ytdl from 'ytdl-core';
import vidl from 'vimeo-downloader';
import {DefaultQuestionGroup} from "/lib/questions/questiongroup_default";

export class AssetDownloader {

	constructor({quizData, privateKey}) {
		this.questionGroup = new DefaultQuestionGroup(quizData);
		this.privateKey = privateKey;
	}

	/**
	 * Downloads the file contents from a URL to the destination directory file.
	 * @param url
	 * @param destination
	 * @param successCallback
	 * @param errorCallback
	 * @source https://stackoverflow.com/a/22907134/7992104
	 */
	download(url, destination, successCallback, errorCallback) {
		const file = fs.createWriteStream(destination);
		const loader = url.startsWith("https") ? https : http;
		loader.get(url, function (response) {
			response.pipe(file);
			file.on('finish', function () {
				file.close(successCallback);
			});
		 }).on('error', function (err) { // Handle errors
			fs.unlink(destination, err => {if (err) {console.error(err)}});
			if (errorCallback) {
				errorCallback(err);
			}
		});
	}

	getDirectory () {
		return `${process.cwd()}/quiz_assets/${this.privateKey}/${this.questionGroup.getHashtag().replace(/[^a-z0-9]/gi, '_').toLowerCase()}`;
	}

	start () {
		const urlParser = /((https?:\/\/)?[\w-]+(\.[\w-]+)+\.?(:\d+)?(\/\S*\w)?)/;
		const targetDirectory = this.getDirectory();
		const extensions = [".gif", ".png", ".mpg", ".mpeg", ".mp4", ".jpg", ".jpeg", ".avi"];
		const downloadMatches = [];
		const failedDownloads = [];
		let urls = [];

		this.questionGroup.getQuestionList().forEach(function (question) {
			const questionLines = question.getQuestionText().split("\n");
			const questionUrlsToParse = questionLines.filter(l => urlParser.test(l)).map(l => urlParser.exec(l)[0]);
			const answerUrlsToParse = question.getAnswerOptionList().filter(a => urlParser.test(a.getAnswerText())).map(a => urlParser.exec(a)[0]);
			const urlsToParse = [].concat(questionUrlsToParse).concat(answerUrlsToParse);
			urls = urls.concat(urlsToParse);
		});

		if (urls.length === 0) {
			return Promise.reject();
		}

		mkdirp.sync(targetDirectory);

		const dl = this.download;
		return new Promise(function (resolve, reject) {
			const promises = [];
			urls.forEach(function (url) {
				// FIXME cth: sanitize file name
				// FIXME cth: add domain+path info into the file name to avoid conflicts
				const fileLocation = `${targetDirectory}/${url.substring(url.lastIndexOf("/") + 1).replace(/\?/g, "_")}`;
				const fileName = path.basename(fileLocation);
				const result = {url, fileLocation, fileName};
				let video = null;

				const p = new Promise(function (res, rej) {
					if (fs.existsSync(fileLocation)) {
						// FIXME cth: we do not refresh a downloaded file, so it might get stale.
						res(result);
						return;
					}

					// FIXME cth: this should better check the domain name
					// FIXME cth: combine with vimeo section
					// FIXME cth: handle error case: delete file, refresh proxy data
					if (url.indexOf("youtu") > -1) {
						video = ytdl(url);
						video.pipe(fs.createWriteStream(fileLocation));
						video.on('end', function () {
							// Download finished!
						});
						// Don't wait for the download to finish
						res(result);
						return;
					}

					// FIXME cth: this should better check the domain name
					if (url.indexOf("vimeo") > -1) {
						video = vidl(url, {quality: '360p'});
						video.pipe(fs.createWriteStream(fileLocation));
						video.on('end', function () {
							// Download finished!
						});
						// Don't wait for the download to finish
						res(result);
						return;
					}

					const foundExtensions = extensions.filter(e => url.endsWith(e));
					if (foundExtensions.length === 0) {
						res(null);
						return;
					}

					// FIXME cth: regular file download currently blocks the request
					dl(url, fileLocation, function success() {
						// Download finished!
						res(result);
					}, rej);
				});
				promises.push(p);
			});
			Promise.all(promises).then(function (data) {
				resolve(data.filter(d => d !== null));
			}).catch(function (err) {
				reject(err);
			});
		});
	}
}