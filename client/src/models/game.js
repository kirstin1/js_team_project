const Questions = require('./questions');
const PubSub = require('../helpers/pub_sub');

const Game = function() {
    this.questions = null;
    this.currentQuestion = null;
}

Game.prototype.bindEvents = function(){

    PubSub.subscribe('Questions:questions-data-ready', (event) => {
        this.questions = event.detail;
        this.nextQuestion();
    });

    PubSub.subscribe('AnswerView:answer-submitted', (event) => {
        const answerSubmitted = event.detail;
        const correctAnswer = this.currentQuestion.correct_answer;

        if (correctAnswer == answerSubmitted) {
            console.log("correct answer");
            this.nextQuestion();
            // additional logic
        }
        else {
            console.log('incorrect answer');
            // end game logic
        }
    })
}

Game.prototype.nextQuestion = function(){
    this.currentQuestion = this.questions.getQuestion();
    //consider reformatting the question into something usable in the view
    PubSub.publish("Game:next-question-ready", this.currentQuestion);
}

Game.prototype.checkAnswer = function(){

}

module.exports = Game;