package com.emlocoding.questionservice.service;

import com.emlocoding.questionservice.model.QuestionModel;
import com.emlocoding.questionservice.model.QuestionWrapper;
import com.emlocoding.questionservice.model.Response;
import com.emlocoding.questionservice.dao.QuestionDao;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class QuestionService {

    @Autowired
    QuestionDao questionDao;

    public ResponseEntity<List<QuestionModel>> getAllQuestions() {
        try {
            return new ResponseEntity<>(questionDao.findAll(), HttpStatus.OK);
        } catch (Exception e) {
            e.printStackTrace();
        }
        return new ResponseEntity<>(new ArrayList<>(), HttpStatus.BAD_REQUEST);
    }

    public ResponseEntity<List<QuestionModel>> getQuestionsByCategory(String category) {
        try {
            return new ResponseEntity<>(questionDao.findByCategory(category), HttpStatus.OK);
        } catch (Exception e) {
            e.printStackTrace();
        }
        return new ResponseEntity<>(new ArrayList<>(), HttpStatus.BAD_REQUEST);
    }

    public ResponseEntity<String> addQuestion(QuestionModel question) {
        try {
            questionDao.save(question);
            return new ResponseEntity<>("success", HttpStatus.CREATED);
        } catch (Exception e) {
            e.printStackTrace();
        }
        return new ResponseEntity<>("failed", HttpStatus.BAD_REQUEST);
    }

    public ResponseEntity<List<Long>> generateQuestionsForQuiz(String categoryName, Integer numQuestions) {
        List<Long> questions = questionDao.findRandomQuestionsByCategory(categoryName, numQuestions);
        return new ResponseEntity<>(questions, HttpStatus.OK);
    }

    public ResponseEntity<List<QuestionWrapper>> getQuestionsFromId(List<Long> questionIds) {
        List<QuestionWrapper> wrappers = new ArrayList<>();
        for (Long id : questionIds) {
            java.util.Optional<QuestionModel> questionOpt = questionDao.findById(id);
            if (questionOpt.isPresent()) {
                QuestionModel q = questionOpt.get();
                QuestionWrapper qw = new QuestionWrapper(q.getId(), q.getQuestionTitle(), q.getOption1(), q.getOption2(), q.getOption3(), q.getOption4());
                wrappers.add(qw);
            }
        }
        return new ResponseEntity<>(wrappers, HttpStatus.OK);
    }

    public ResponseEntity<Integer> getScore(List<Response> responses) {
        int right = 0;
        for (Response response : responses) {
            java.util.Optional<QuestionModel> questionOpt = questionDao.findById(response.getId());
            if (questionOpt.isPresent()) {
                QuestionModel q = questionOpt.get();
                if (q.getRightAnswer() != null && q.getRightAnswer().trim().equalsIgnoreCase(response.getResponse().trim())) {
                    right++;
                }
            }
        }
        return new ResponseEntity<>(right, HttpStatus.OK);
    }
}
