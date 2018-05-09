const Sequelize = require("sequelize");
const {models} = require("../models");

// Autoload the quiz with id equals to :quizId
exports.load = (req, res, next, quizId) => {

    models.quiz.findById(quizId)
    .then(quiz => {
        if (quiz) {
            req.quiz = quiz;
            next();
        } else {
            throw new Error('There is no quiz with id=' + quizId);
        }
    })
    .catch(error => next(error));
};

// GET /quizzes
exports.index = (req, res, next) => {

    models.quiz.findAll()
    .then(quizzes => {
        res.render('quizzes/index.ejs', {quizzes});
    })
    .catch(error => next(error));
};


// GET /quizzes/:quizId
exports.show = (req, res, next) => {

    const {quiz} = req;

    res.render('quizzes/show', {quiz});
};


// GET /quizzes/new
exports.new = (req, res, next) => {

    const quiz = {
        question: "", 
        answer: ""
    };

    res.render('quizzes/new', {quiz});
};

// POST /quizzes/create
exports.create = (req, res, next) => {

    const {question, answer} = req.body;

    const quiz = models.quiz.build({
        question,
        answer
    });

    // Saves only the fields question and answer into the DDBB
    quiz.save({fields: ["question", "answer"]})
    .then(quiz => {
        req.flash('success', 'Quiz created successfully.');
        res.redirect('/quizzes/' + quiz.id);
    })
    .catch(Sequelize.ValidationError, error => {
        req.flash('error', 'There are errors in the form:');
        error.errors.forEach(({message}) => req.flash('error', message));
        res.render('quizzes/new', {quiz});
    })
    .catch(error => {
        req.flash('error', 'Error creating a new Quiz: ' + error.message);
        next(error);
    });
};


// GET /quizzes/:quizId/edit
exports.edit = (req, res, next) => {

    const {quiz} = req;

    res.render('quizzes/edit', {quiz});
};


// PUT /quizzes/:quizId
exports.update = (req, res, next) => {

    const {quiz, body} = req;

    quiz.question = body.question;
    quiz.answer = body.answer;

    quiz.save({fields: ["question", "answer"]})
    .then(quiz => {
        req.flash('success', 'Quiz edited successfully.');
        res.redirect('/quizzes/' + quiz.id);
    })
    .catch(Sequelize.ValidationError, error => {
        req.flash('error', 'There are errors in the form:');
        error.errors.forEach(({message}) => req.flash('error', message));
        res.render('quizzes/edit', {quiz});
    })
    .catch(error => {
        req.flash('error', 'Error editing the Quiz: ' + error.message);
        next(error);
    });
};


// DELETE /quizzes/:quizId
exports.destroy = (req, res, next) => {

    req.quiz.destroy()
    .then(() => {
        req.flash('success', 'Quiz deleted successfully.');
        res.redirect('/quizzes');
    })
    .catch(error => {
        req.flash('error', 'Error deleting the Quiz: ' + error.message);
        next(error);
    });
};


// GET /quizzes/:quizId/play
exports.play = (req, res, next) => {

    const {quiz, query} = req;

    const answer = query.answer || '';

    res.render('quizzes/play', {
        quiz,
        answer
    });
};


// GET /quizzes/:quizId/check
exports.check = (req, res, next) => {

    const {quiz, query} = req;

    const answer = query.answer || "";
    const result = answer.toLowerCase().trim() === quiz.answer.toLowerCase().trim();

    res.render('quizzes/result', {
        quiz,
        result,
        answer
    });
};

exports.randomPlay= (req, res, next) => {

    if (req.session.quizzes === undefined) {
        req.session.score = 0;

        models.quiz.findAll()
            .then(quizzes => {
                req.session.quizzes = quizzes;
                req.session.index = Math.floor(Math.random()*req.session.quizzes.length);
                res.render('quizzes/random_play', {
                    quiz: req.session.quizzes[req.session.index],
                    score: req.session.score
                })
            })
    } else {
        req.session.index = Math.floor(Math.random()*req.session.quizzes.length);
        res.render('quizzes/random_play', {
            quiz: req.session.quizzes[req.session.index],
            score: req.session.score
        });
    }
};

exports.randomCheck = (req, res, next) => {

    let resp = req.query.answer;
    let result = false;

    if (limpia(resp) === limpia(req.session.quizzes[req.session.index].answer)) {
        req.session.score++;
        result = true;
        req.session.quizzes.splice(req.session.index, 1);
        if(req.session.quizzes.length === 0){
            req.session.quizzes = undefined;
            res.render('quizzes/random_nomore', {
                score: req.session.score
            });
        } else {
            res.render('quizzes/random_result', {
                score: req.session.score,
                result: result,
                answer: resp
            });
        }
    } else {
        req.session.quizzes = undefined;
        let score = req.session.score;
        req.session.score = 0;
        res.render('quizzes/random_result', {
            score: score,
            result: result,
            answer: resp
        });
    }
};

limpia = comp => {
    comp = comp.replace(/\s+/g, '');
    comp = comp.toLowerCase();
    comp = comp.replace(/á/gi, "a");
    comp = comp.replace(/é/gi, "e");
    comp = comp.replace(/í/gi, "i");
    comp = comp.replace(/ó/gi, "o");
    comp = comp.replace(/ú/gi, "u");
    return comp;
};