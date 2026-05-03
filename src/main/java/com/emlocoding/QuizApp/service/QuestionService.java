package com.emlocoding.QuizApp.service;

import com.emlocoding.QuizApp.model.QuestionModel;
import com.emlocoding.QuizApp.dao.QuestionDao;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class QuestionService {

    @Autowired
    QuestionDao questionDao;

    public List<QuestionModel> getAllQuestions() {
        return questionDao.findAll();
    }
}
