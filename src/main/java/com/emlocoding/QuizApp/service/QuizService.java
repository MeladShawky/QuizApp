package com.emlocoding.QuizApp.service;

import com.emlocoding.QuizApp.dao.QuestionDao;
import com.emlocoding.QuizApp.dao.QuizDao;
import com.emlocoding.QuizApp.model.QuestionModel;
import com.emlocoding.QuizApp.model.QuestionWrapper;
import com.emlocoding.QuizApp.model.Quiz;
import com.emlocoding.QuizApp.model.QuizInfoDto;
import com.emlocoding.QuizApp.model.Response;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class QuizService {

    @Autowired
    QuizDao quizDao;

    @Autowired
    QuestionDao questionDao;

    public ResponseEntity<String> createQuiz(String category, int numQ, String title) {
        List<QuestionModel> questions = questionDao.findRandomQuestionsByCategory(category, numQ);

        Quiz quiz = new Quiz();
        quiz.setTitle(title);
        quiz.setQuestions(questions);
        quizDao.save(quiz);

        return new ResponseEntity<>("Success", HttpStatus.CREATED);
    }

    public ResponseEntity<List<QuestionWrapper>> getQuizQuestions(Integer id) {
        java.util.Optional<Quiz> quiz = quizDao.findById(id);
        List<QuestionModel> questionsFromDB = quiz.get().getQuestions();
        List<QuestionWrapper> questionsForUser = new java.util.ArrayList<>();
        for(QuestionModel q : questionsFromDB) {
            QuestionWrapper qw = new QuestionWrapper(q.getId(), q.getQuestionTitle(), q.getOption1(), q.getOption2(), q.getOption3(), q.getOption4());
            questionsForUser.add(qw);
        }

        return new ResponseEntity<>(questionsForUser, HttpStatus.OK);
    }

    public ResponseEntity<List<QuizInfoDto>> getAllQuizzes() {
        List<Quiz> quizzes = quizDao.findAll();
        List<QuizInfoDto> quizInfoList = new java.util.ArrayList<>();
        for(Quiz q : quizzes) {
            quizInfoList.add(new QuizInfoDto(q.getId(), q.getTitle()));
        }
        return new ResponseEntity<>(quizInfoList, HttpStatus.OK);
    }

    public ResponseEntity<Integer> calculateResult(Integer id, List<Response> responses) {
        java.util.Optional<Quiz> quizOpt = quizDao.findById(id);
        if (!quizOpt.isPresent()) {
            return new ResponseEntity<>(0, HttpStatus.NOT_FOUND);
        }
        List<QuestionModel> questions = quizOpt.get().getQuestions();
        int right = 0;
        for(Response response : responses) {
            for(QuestionModel q : questions) {
                if(q.getId().equals(response.getId())) {
                    if(q.getRightAnswer() != null && q.getRightAnswer().trim().equalsIgnoreCase(response.getResponse().trim())) {
                        right++;
                    }
                    break;
                }
            }
        }
        return new ResponseEntity<>(right, HttpStatus.OK);
    }
}
