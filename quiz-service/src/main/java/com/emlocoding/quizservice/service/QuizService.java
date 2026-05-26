package com.emlocoding.quizservice.service;

import com.emlocoding.quizservice.dao.QuizDao;
import com.emlocoding.quizservice.feign.QuizFeignClient;
import com.emlocoding.quizservice.model.QuestionWrapper;
import com.emlocoding.quizservice.model.Quiz;
import com.emlocoding.quizservice.model.QuizInfoDto;
import com.emlocoding.quizservice.model.Response;
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
    QuizFeignClient quizFeignClient;

    public ResponseEntity<String> createQuiz(String category, int numQ, String title) {
        try {
            ResponseEntity<List<Long>> response = quizFeignClient.getQuestionsForQuiz(category, numQ);
            List<Long> questionIds = response.getBody();

            Quiz quiz = new Quiz();
            quiz.setTitle(title);
            quiz.setQuestionIds(questionIds);
            quizDao.save(quiz);

            return new ResponseEntity<>("Success", HttpStatus.CREATED);
        } catch (Exception e) {
            e.printStackTrace();
        }
        return new ResponseEntity<>("Failed", HttpStatus.BAD_REQUEST);
    }

    public ResponseEntity<List<QuestionWrapper>> getQuizQuestions(Integer id) {
        java.util.Optional<Quiz> quizOpt = quizDao.findById(id);
        if (!quizOpt.isPresent()) {
            return new ResponseEntity<>(new java.util.ArrayList<>(), HttpStatus.NOT_FOUND);
        }
        List<Long> questionIds = quizOpt.get().getQuestionIds();
        return quizFeignClient.getQuestionsFromId(questionIds);
    }

    public ResponseEntity<List<QuizInfoDto>> getAllQuizzes() {
        List<Quiz> quizzes = quizDao.findAll();
        List<QuizInfoDto> quizInfoList = new java.util.ArrayList<>();
        for (Quiz q : quizzes) {
            quizInfoList.add(new QuizInfoDto(q.getId(), q.getTitle()));
        }
        return new ResponseEntity<>(quizInfoList, HttpStatus.OK);
    }

    public ResponseEntity<Integer> calculateResult(Integer id, List<Response> responses) {
        java.util.Optional<Quiz> quizOpt = quizDao.findById(id);
        if (!quizOpt.isPresent()) {
            return new ResponseEntity<>(0, HttpStatus.NOT_FOUND);
        }
        Quiz quiz = quizOpt.get();
        List<Long> questionIds = quiz.getQuestionIds();
        List<Response> filteredResponses = new java.util.ArrayList<>();
        for (Response r : responses) {
            if (questionIds.contains(r.getId())) {
                filteredResponses.add(r);
            }
        }
        return quizFeignClient.getScore(filteredResponses);
    }
}
