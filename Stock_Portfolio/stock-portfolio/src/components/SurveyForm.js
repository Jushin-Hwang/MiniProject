// src/components/SurveyForm.js
import React from 'react';
import Question from './Question';

function SurveyForm({ questions, onAnswerChange, onSubmit }) {
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }}>
      {questions.map(question => (
        <Question
          key={question.id}
          question={question}
          onAnswerChange={onAnswerChange}
        />
      ))}
      <button type="submit">제출하기</button>
    </form>
  );
}

export default SurveyForm;
