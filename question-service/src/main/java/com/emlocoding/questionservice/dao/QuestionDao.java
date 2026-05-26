package com.emlocoding.questionservice.dao;

import com.emlocoding.questionservice.model.QuestionModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import org.springframework.data.jpa.repository.Query;

@Repository
public interface QuestionDao extends JpaRepository<QuestionModel, Long> {
    List<QuestionModel> findByCategory(String category);

    @Query(value = "SELECT q.id FROM questions q WHERE q.category=:category ORDER BY RAND() LIMIT :numQ", nativeQuery = true)
    List<Long> findRandomQuestionsByCategory(String category, int numQ);
}
