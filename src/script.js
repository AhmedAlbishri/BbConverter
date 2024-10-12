function convertQuestions() {
  const inputText = document.getElementById('inputText').value;
  const outputText = document.getElementById('outputText');
  const questionCounter = document.getElementById('questionCounter');  // Get the counter element

  const numberingPattern = /^\d+\.\s*/;
  const choicePattern = /^[a-dA-D]\./;
  const metadataPattern = /\(.*?\)|\[.*?\]/g;  // This pattern detects text inside parentheses or square brackets
  const paragraphs = inputText.split('\n');

  let content = [];
  let currentQuestion = null;
  let questionText = "";
  let choices = [];
  let correctAnswer = null;
  let questionCount = 0;

  paragraphs.forEach((para, index) => {
    const text = para.trim();

    if (!text) return;

    // Detect the start of a new question based on numbering or the absence of a current question
    if (numberingPattern.test(text) || (!currentQuestion && !choicePattern.test(text))) {
      if (currentQuestion) {
        content.push({
          number: questionCount,
          question: questionText,
          choices: choices,
          correctAnswer: correctAnswer,
          type: choices.length ? "MCQ" : "Essay"
        });
      }

      currentQuestion = text;
      // Remove metadata from the question
      questionText = text.replace(numberingPattern, '').replace(metadataPattern, '').trim();
      choices = [];
      correctAnswer = null;
      questionCount++;
    } else if (currentQuestion && choicePattern.test(text)) {
      if (text.includes("*")) {
        correctAnswer = text.replace("*", '').trim();
      }
      choices.push(text.replace("*", '').trim());
    }
  });

  // Ensure the last question is added
  if (currentQuestion) {
    content.push({
      number: questionCount,
      question: questionText,
      choices: choices,
      correctAnswer: correctAnswer,
      type: choices.length ? "MCQ" : "Essay"
    });
  }

  let blackboardContent = "";
  content.forEach((item) => {
    if (item.type === "MCQ") {
      let line = `MC\t${item.question}`;
      item.choices.forEach((choice) => {
        const correctness = choice === item.correctAnswer ? "correct" : "incorrect";
        line += `\t${choice}\t${correctness}`;
      });
      blackboardContent += line + "\n\n";  // Add extra line break after each question block
    } else if (item.type === "Essay") {
      blackboardContent += `ESS\t${item.question}\t[Placeholder essay text]\n\n`;  // Add extra line break after each essay
    }
  });

  outputText.value = blackboardContent.trim();

  // Update the question counter with the number of questions converted
  questionCounter.textContent = content.length;
}

function downloadOutput() {
  const outputText = document.getElementById('outputText').value;
  const blob = new Blob([outputText], { type: 'text/plain' });
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.download = 'blackboard_questions.txt';
  link.click();
}
