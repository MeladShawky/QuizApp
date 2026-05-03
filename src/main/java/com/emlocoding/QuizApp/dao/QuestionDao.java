package com.emlocoding.QuizApp.dao;

import com.emlocoding.QuizApp.model.QuestionModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface QuestionDao extends JpaRepository<QuestionModel, Long> {
}
