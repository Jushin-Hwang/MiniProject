// src/components/Question.js
import React from 'react';

function Question({ question, onAnswerChange }) {
  const handleChange = (event) => {
    onAnswerChange(question.id, event.target.value);
  };

  return (
    <div>
      <h3>{question.text}</h3>
      {question.options.map(option => (
        <label key={option.text}>
          <input
            type="radio"
            name={`question-${question.id}`}
            value={option.text}
            onChange={handleChange}
          />
          {option.text}
        </label>
      ))}
    </div>
  );
}

export default Question;
