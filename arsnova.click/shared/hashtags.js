Meteor.methods({
    'Hashtags.checkPrivateKey': function (privateKey, hashtag) {
        new SimpleSchema({
            hashtag: {type: String},
            privateKey: {type: String}
        }).validate({
                privateKey,
                hashtag
            });
        var doc = Hashtags.findOne({
            hashtag: hashtag,
            privateKey: privateKey
        });
        if (doc) {
            return true;
        } else {
            return false;
        }
    },
    'Hashtags.setSessionStatus': function (privateKey, hashtag, sessionStatus) {
        new SimpleSchema({
            hashtag: {type: String},
            privateKey: {type: String},
            sessionStatus: {
                type: Number,
                min: 0,
                max: 3
            }
        }).validate({
                privateKey,
                hashtag,
                sessionStatus
            });
        var doc = Hashtags.findOne({
            hashtag: hashtag,
            privateKey: privateKey
        });
        if (doc) {
            Hashtags.update({_id: doc._id}, {$set: {sessionStatus: sessionStatus}});
        } else {
            throw new Meteor.Error('Hashtags.setSessionStatus', 'Either the hashtag isn\'t available or the key is wrong');
            return;
        }
    },
    'Hashtags.addHashtag': function (doc) {

        var testDoc = Hashtags.findOne({
            hashtag: doc.hashtag
        });

        if (!testDoc){
            for (var i = 0; i < 4; i++) {
                var emptyAnswerDoc = {
                    privateKey: doc.privateKey,
                    hashtag: doc.hashtag,
                    answerText: "",
                    answerOptionNumber: i,
                    isCorrect: 0
                };
                AnswerOptions.insert(emptyAnswerDoc);
            }
            Hashtags.insert(doc);
        }else{
            throw new Meteor.Error('Hashtags.addHashtag', 'Session already exists!');
            return;
        }

    },
    'Hashtags.export': function ({hashtag, privateKey}) {
        if (Meteor.isServer) {
            var hashtagDoc = Hashtags.findOne({
                hashtag: hashtag,
                privateKey: privateKey
            }, {
                fields: {
                    _id: 0,
                    privateKey: 0
                }
            });
            if (!hashtagDoc) {
                throw new Meteor.Error('Hashtags.export', 'No such hashtag with the given key');
                return;
            }
            var sessionDoc = Sessions.find({hashtag: hashtag}, {
                fields: {
                    _id: 0
                }
            });
            var answerOptionsDoc = AnswerOptions.find({hashtag: hashtag}, {
                fields: {
                    _id: 0
                }
            }).fetch();
            var memberListDoc = MemberList.find({hashtag: hashtag}, {
                fields: {
                    _id: 0
                }
            }).fetch();
            var responsesDoc = Responses.find({hashtag: hashtag}, {
                fields: {
                    _id: 0
                }
            }).fetch();
            var exportData = {
                hashtagDoc: hashtagDoc,
                sessionDoc: sessionDoc,
                answerOptionsDoc: answerOptionsDoc,
                memberListDoc: memberListDoc,
                responsesDoc: responsesDoc,
            };
            return JSON.stringify(exportData);
        }
    },
    'keepalive': function (privateKey, hashtag) {
        if (Meteor.isServer){
            new SimpleSchema({
                hashtag: {type: String},
                privateKey: {type: String},
            }).validate({
                privateKey,
                hashtag,
            });

            var doc = Hashtags.findOne({
                hashtag: hashtag,
                privateKey: privateKey
            });

            if (doc) {
                Hashtags.update({_id: doc._id}, {$set: {lastConnection: (new Date()).getTime()}});
            }
        }
    }
});