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
 * along with ARSnova Click.  If not, see <http://www.gnu.org/licenses/>.
 */

import { Mongo } from 'meteor/mongo';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';

export const MemberList = new Mongo.Collection("memberlist");

MemberList.attachSchema(new SimpleSchema({
    hashtag: {
        type: String,
        min: 1,
        max: 25
    },
    nick: {
        type: String,
        min: 3,
        max: 25
    },
    lowerCaseNick: {
        type: String,
        min: 3,
        max: 25
    },
    readConfirmed: {
        type: [Number]
    },
    backgroundColor: {
        type: String,
        min: 7,
        max: 7
    },
    foregroundColor: {
        type: String,
        min: 7,
        max: 7
    },
    insertDate: {
        type: String
    }
}));
