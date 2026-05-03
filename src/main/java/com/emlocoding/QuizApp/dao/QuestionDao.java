package com.emlocoding.QuizApp.dao;

import com.emlocoding.QuizApp.model.QuestionModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import org.springframework.data.jpa.repository.Query;

@Repository
public interface QuestionDao extends JpaRepository<QuestionModel, Long> {
    List<QuestionModel> findByCategory(String category);

    @Query(value = "SELECT * FROM questions q Where q.category=:category ORDER BY RAND() LIMIT :numQ", nativeQuery = true)
    List<QuestionModel> findRandomQuestionsByCategory(String category, int numQ);
}
