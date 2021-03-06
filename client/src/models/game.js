const Questions = require('./questions');
const PubSub = require('../helpers/pub_sub');
const GameOverView = require('../views/game_over_view');
const Score = require('./score');
const formatterHelper = require('../helpers/formatHTTPElements.js');

const Game = function() {
    this.questionsArray = null;
    this.currentQuestion = null;
    this.currentQuestionNumber = 0;
    this.maxNumberOfQuestionsInGame = 12;
    this.numberOfQuestionsCorrect = 0;
    this.gameWon = false;
    this.score = new Score();
}

Game.prototype.bindEvents = function(){

    PubSub.subscribe('NewGameView:new-game-button-clicked', () => {
        this.newGame();
    });

    PubSub.subscribe('Questions:questions-data-ready', (event) => {
        const questions = event.detail;
        this.setupNewGame(questions);
    });

    PubSub.subscribe('AnswerView:answer-submitted', (event) => {
        const answerSubmitted = event.detail;
        this.checkAnswer(answerSubmitted);
    });

}

Game.prototype.newGame = function(){
    this.score.bindEvents();
    this.score.resetScore();
    PubSub.publish('Game:start-new-game');
}

Game.prototype.setupNewGame = function(questions){
    console.log("Setting up new game...");

    this.numberOfQuestionsCorrect = 0;
    this.currentQuestionNumber = 0;
    this.gameWon = false;
    this.questionsArray = questions;
    this.nextQuestion();
}

Game.prototype.nextQuestion = function(){
    this.currentQuestionNumber++;
    this.currentQuestion = this.questionsArray.pop();
    this.currentQuestion.incorrect_answers = this.currentQuestion.incorrect_answers.map((incorrectAnswer) => {
        return formatterHelper(incorrectAnswer);
    })
    this.currentQuestion.correct_answer = formatterHelper(this.currentQuestion.correct_answer);
   
    PubSub.publish("Game:next-question-ready", this.currentQuestion);
    this.score.createScoreOptions(this.currentQuestionNumber);
    console.log(this.currentQuestion);
    console.log(this.currentQuestion.correct_answer);
    
}

Game.prototype.checkAnswer = function(answerSubmitted){
    const correctAnswer = this.currentQuestion.correct_answer;

    if (correctAnswer == answerSubmitted) {
        this.numberOfQuestionsCorrect++;
        const gbpValueOfAnswer = this.score.convertChosenCryptoIntoGBPScore(this.currentQuestionNumber);
        PubSub.publish('Game:render-notification', { message: 'Correct Answer!, that was worth £' +  Math.trunc(gbpValueOfAnswer) + "!!"});
        PubSub.publish('Game:correct-answer-submitted')
        this.score.incrementScore(this.currentQuestionNumber);
        this.checkWinCondition();
    }
    else {
        console.log('incorrect answer');
        console.log(answerSubmitted);
        console.log(correctAnswer);
        this.endGame();
    }
}

Game.prototype.endGame = function(){
    const gameDisplayDiv = document.querySelector('#game_display'); 
    console.log("Game ending");    
    const cryptoOverviewData = this.score.returnGameOverData();
    if (this.gameWon) {
        const gameOverMessage = 'Congratulations - you won, you smart little ducky!';
        const gameOverView = new GameOverView(gameDisplayDiv, gameOverMessage, cryptoOverviewData);
        gameOverView.render();
    }
    else {
        const gameOverMessage = 'Game Over!';
        const correctAnswerMessage = `That was quackers! The correct answer was: ${this.currentQuestion.correct_answer}`;
        const gameOverView = new GameOverView(gameDisplayDiv, gameOverMessage, cryptoOverviewData, correctAnswerMessage);
        gameOverView.render();
    }
}

Game.prototype.checkWinCondition = function(){
    console.log('Checking win condition');
    console.log('Number of correct answers: ', this.numberOfQuestionsCorrect);
    if (this.numberOfQuestionsCorrect == this.maxNumberOfQuestionsInGame) {
        this.gameWon = true;
        this.endGame();
    }
    else {
        console.log('game not won...next question...');
        this.nextQuestion();
    }
}

module.exports = Game;