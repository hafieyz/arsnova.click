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
import {deleteCountdown} from './lib.js';
import {Router} from 'meteor/iron:router';
import  * as localData from '/lib/local_storage.js';
import {TimerMap} from "/lib/performance_analysis/Timer.js";

Template.votingview.onDestroyed(function () {
	if (!localData.containsHashtag(Router.current().params.quizName)) {
		TimerMap.clickOnResponseButton.end();
		TimerMap.routeToLiveResults.start();
	}
	if (this.data && this.data["data-questionIndex"]) {
		Session.delete("previewQuestionIndex");
		return;
	}
	Session.delete("questionSC");
	Session.delete("responses");
	Session.delete("countdownInitialized");
	Session.delete("hasToggledResponse");
	Session.delete("hasSendResponse");
	Session.delete("confidenceValue");
	deleteCountdown();
});
