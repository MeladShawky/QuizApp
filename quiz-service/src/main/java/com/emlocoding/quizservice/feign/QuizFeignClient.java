package com.emlocoding.quizservice.feign;

import com.emlocoding.quizservice.model.QuestionWrapper;
import com.emlocoding.quizservice.model.Response;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;

@FeignClient(name = "QUESTION-SERVICE", path = "question")
public interface QuizFeignClient {

    @GetMapping("generate")
    ResponseEntity<List<Long>> getQuestionsForQuiz(@RequestParam String categoryName, @RequestParam Integer numQuestions);

    @PostMapping("getQuestions")
    ResponseEntity<List<QuestionWrapper>> getQuestionsFromId(@RequestBody List<Long> questionIds);

    @PostMapping("getScore")
    ResponseEntity<Integer> getScore(@RequestBody List<Response> responses);
}
