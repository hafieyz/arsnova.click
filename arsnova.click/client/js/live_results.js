Template.live_results.onCreated(function () {
    this.autorun(() => {
        this.subscription = Meteor.subscribe('Responses.instructor', Session.get("hashtag"));
        this.subscription = Meteor.subscribe('AnswerOptions.options', Session.get("hashtag"), function () {
            Session.set("rightAnswerOptionCount", AnswerOptions.find({isCorrect: 1}).count());
        });
        this.subscription = Meteor.subscribe('MemberList.members', Session.get("hashtag"));
        this.subscription = Meteor.subscribe('Sessions.question', Session.get("hashtag"), function () {
            var sessionDoc = Sessions.findOne();
            Session.set("sessionCountDown", sessionDoc.timer);
            var timestamp = new Date().getTime();
            countdown = new ReactiveCountdown((timestamp - sessionDoc.startTime + sessionDoc.timer) / 1000);
            countdown.start(function () {
                Session.set("sessionClosed", true);
            });
            Session.set("countdownInitialized", true);
        });
        this.subscription = Meteor.subscribe('Hashtags.public', Session.get("hashtag"));
    });
});

Template.live_results.helpers({
    votingText: function () {
      if (Session.get("sessionClosed")){
          return "Abstimmung beendet";
      }  else{
          return "Abstimmung läuft...";
      }
    },
    isNotOwner: function(){
        return !Session.get("isOwner");
    },

    sessionClosed: function () {
        return (Session.get("sessionClosed") && (Session.get("rightAnswerOptionCount") > 0));
    },
    result: function () {
        var result = [];

        var memberAmount = Responses.find({hashtag: Session.get("hashtag")}).fetch();
        memberAmount = _.uniq(memberAmount, false, function(user) {return user.userNick}).length;

        var correctAnswerOptions = AnswerOptions.find({hashtag: Session.get("hashtag"), isCorrect: 1}).count();

        if(!correctAnswerOptions){ //survey
            AnswerOptions.find({hashtag: Session.get("hashtag")}, {sort:{'answerOptionNumber':1}}).forEach(function(value){
                var amount = Responses.find({hashtag: Session.get("hashtag"), answerOptionNumber: value.answerOptionNumber}).count();
                result.push({name: String.fromCharCode(value.answerOptionNumber + 65), absolute: amount, percent: memberAmount ? ( Math.floor((amount * 100) / memberAmount)) : 0, isCorrect: -1});
            });
        } else { //MC / SC
            if(correctAnswerOptions === 1){ //SC
                AnswerOptions.find({hashtag: Session.get("hashtag")}, {sort:{'answerOptionNumber':1}}).forEach(function(value){
                    var amount = Responses.find({hashtag: Session.get("hashtag"), answerOptionNumber: value.answerOptionNumber}).count();
                    result.push({name: String.fromCharCode(value.answerOptionNumber + 65), absolute: amount, percent: memberAmount ? (Math.floor((amount * 100) / memberAmount)) : 0, isCorrect: value.isCorrect});
                });

            } else { //MC
                AnswerOptions.find({hashtag: Session.get("hashtag")}, {sort:{'answerOptionNumber':1}}).forEach(function(value){

                    var amount = Responses.find({hashtag: Session.get("hashtag"), answerOptionNumber: value.answerOptionNumber}).count();
                    result.push({name: String.fromCharCode(value.answerOptionNumber + 65), absolute: amount, percent: memberAmount ? ( Math.floor((amount * 100) / memberAmount)) : 0, isCorrect: value.isCorrect});
                });
            }
        }
        return result;
    },
    isMC: function(){
        var answerOptions = AnswerOptions.find({hashtag: Session.get("hashtag"), isCorrect: 1}).count();
        return answerOptions > 1;
    },
    mcOptions: function(){

        let memberAmount = Responses.find({hashtag: Session.get("hashtag")}).fetch();
        memberAmount = _.uniq(memberAmount, false, function(user) {return user.userNick}).length;

        const correctAnswers = [];
        AnswerOptions.find({hashtag: Session.get("hashtag"), isCorrect:1},{fields:{"answerOptionNumber":1}}).forEach(function (answer){
            correctAnswers.push(answer.answerOptionNumber);
        });
        let allCorrect = 0;
        let allWrong = 0;
        MemberList.find({hashtag: Session.get("hashtag")}).forEach(function(user){
            let responseAmount = 0;
            let everythingRight = true;
            let everythingWrong = true;
            Responses.find({hashtag: Session.get("hashtag"), userNick: user.nick}).forEach(function (response){
                if($.inArray(response.answerOptionNumber, correctAnswers) !== -1){
                    everythingWrong = false;
                }else{
                    everythingRight = false;
                }
                responseAmount++;
            });
            if(responseAmount){
                if(everythingRight && responseAmount === correctAnswers.length){
                    allCorrect++;
                }
                if(everythingWrong){
                    allWrong++;
                }
            }
        });
        return {
            allCorrect: {absolute: allCorrect, percent: memberAmount ? Math.floor((allCorrect * 100) / memberAmount) : 0},
            allWrong: {absolute: allWrong, percent: memberAmount ? Math.floor((allWrong * 100) / memberAmount) : 0}
        };
    }
});



Template.live_results.events({
    "click #js-btn-showQuestionModal": function () {
        $('.questionContentSplash').parents('.modal').modal();
    },
    "click #js-btn-showAnswerModal": function () {
        $('.answerTextSplash').parents('.modal').modal();
    },
    "click #js-btn-showLeaderBoard": function () {
        Router.go("/statistics");
    }

});


Template.result_button.helpers({
    getCSSClassForIsCorrect: function (isCorrect) {
        if (isCorrect > 0) {
            return 'progress-success';
        } else if (isCorrect < 0) {
            return 'progress-default';
        } else {
            return 'progress-failure';
        }
    }
});

Template.result_button_mc.helpers({
    getCSSClassForIsCorrect: function (isCorrect) {
        if (isCorrect > 0) {
            return 'progress-success';
        } else if (isCorrect < 0) {
            return 'progress-default';
        } else {
            return 'progress-failure';
        }
    }
});
