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
import {Router} from 'meteor/iron:router';
import {QuestionGroupCollection} from '/lib/questions/collection.js';
import {DefaultQuestionGroup} from "/lib/questions/questiongroup_default.js";
import * as leaderboardLib from '/lib/leaderboard.js';
import * as localData from "/lib/local_storage.js";

Template.liveResults.onCreated(function () {
	if (!Session.get("questionGroup") && localData.containsHashtag(Router.current().params.quizName)) {
		Session.set("questionGroup", new DefaultQuestionGroup(QuestionGroupCollection.findOne({hashtag: Router.current().params.quizName})));
	}
	leaderboardLib.init(Router.current().params.quizName);
});
