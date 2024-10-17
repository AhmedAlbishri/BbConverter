// Tab switching logic
function openTab(evt, tabName) {
  let i, tabcontent, tablinks;
  tabcontent = document.getElementsByClassName("tabcontent");
  for (i = 0; i < tabcontent.length; i++) {
    tabcontent[i].style.display = "none";
  }
  tablinks = document.getElementsByClassName("tablinks");
  for (i = 0; i < tablinks.length; i++) {
    tablinks[i].className = tablinks[i].className.replace(" active", "");
  }
  document.getElementById(tabName).style.display = "block";
  evt.currentTarget.className += " active";
}

// Initialize the first tab to be open by default
document.addEventListener("DOMContentLoaded", function() {
  document.querySelector('.tablinks').click();
});

// Function to count the number of questions based on numbering (e.g., "1.", "2.")
function liveCountQuestionsByNumber(text) {
  // Use a regex pattern to identify lines that start with a number followed by a period (e.g., "37. ")
  const questionPattern = /^\d+\.\s*/;

  // Split the input into individual lines
  const lines = text.split('\n').map(line => line.trim());

  // Count lines that match the question pattern
  const questionCount = lines.filter(line => questionPattern.test(line)).length;

  return questionCount;
}

// Function to count MCQs (count the number of actual questions, not choices)
function countMCQs(text) {
  let mcqBlocks = text.split('\n\n').filter(block => block.trim() !== '');
  return mcqBlocks.length;
}


// Update the MCQ counter in real-time
function liveCountMCQs() {
  const mcqText = document.getElementById('mcqText').value;
  const count = liveCountQuestionsByNumber(mcqText);
  document.getElementById('mcqCounter').textContent = count;  // Update MCQ counter
}

// Update the Essay counter in real-time
function liveCountEssay() {
  const essayText = document.getElementById('essayText').value;
  const count = liveCountQuestionsByNumber(essayText);
  document.getElementById('essayCounter').textContent = count;  // Update Essay counter
}

// Update the True/False counter in real-time
function liveCountTF() {
  const tfText = document.getElementById('tfText').value;
  const count = liveCountQuestionsByNumber(tfText);
  document.getElementById('tfCounter').textContent = count;  // Update TF counter
}

// Update the FIB counter in real-time
function liveCountFIB() {
  const fibText = document.getElementById('fibText').value;
  const count = liveCountQuestionsByNumber(fibText);
  document.getElementById('fibCounter').textContent = count;  // Update FIB counter
}

// Function to strip metadata if toggle is checked
function stripMetadataIfPresent(text) {
  const includesMetadata = document.getElementById('toggleMetadata').checked;

  if (includesMetadata) {
    // Remove Learning Outcomes, Module, Difficulty Levels
    text = text.replace(/\(LO.*?\)/g, '').replace(/\(.*?\)/g, '').replace(/\[.*?\]/g, '').trim();
  }

  return text;
}

// Function to strip metadata and handle formatting for Essay
function stripMetadataForEssay(text) {
  text = stripMetadataIfPresent(text); // Remove metadata if present

  // Remove the question number (e.g., "37. ") from the start of the question
  text = text.replace(/^\d+\.\s*/, '').trim();

  // Format the output as ESS\t<question>\t[example]
  return `ESS\t${text}\t`;
}

// Function to strip metadata and handle formatting for True/False
function stripMetadataAndTF(text) {
  text = stripMetadataIfPresent(text); // Remove metadata if present

  const lines = text.split('\n').map(line => line.trim()).filter(line => line !== ''); // Remove blank lines

  // Extract the question (the first line)
  let question = lines[0].replace(/^\d+\./, '').trim(); // Remove the number "1."

  // True/False choices
  let formattedQuestion = `TF\t${question}\tfalse`;

  // Set correct answer based on the input (True or False marked with "*")
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].toLowerCase().includes('true') && lines[i].includes('*')) {
      formattedQuestion = `TF\t${question}\ttrue`;
    } else if (lines[i].toLowerCase().includes('false') && lines[i].includes('*')) {
      formattedQuestion = `TF\t${question}\tfalse`;
    }
  }

  return formattedQuestion;
}

// Function to strip metadata and handle formatting for Fill in the Blank (FIB)
function stripMetadataAndFIB(text) {
  text = stripMetadataIfPresent(text); // Remove metadata if present

  // Split the question and answer (we assume answers are provided after the question)
  const parts = text.split('\n').map(line => line.trim()).filter(line => line !== ''); // Remove blank lines

  // The first part is the question, the rest are answers
  let question = parts[0].replace(/^\d+\./, '').trim(); // Remove the number "1."
  let answers = parts.slice(1).map(answer => answer.trim()); // Collect answers from the rest of the lines

  // Prepare the Blackboard format: FIB question followed by answers
  let formattedQuestion = `FIB\t${question}`;
  answers.forEach(answer => {
    formattedQuestion += `\t${answer}`;
  });

  return formattedQuestion;
}

// Function to strip metadata and handle formatting for MCQs
function stripMetadataAndChoices(text) {
  // First, handle metadata removal if necessary
  text = stripMetadataIfPresent(text);

  // Split the text by newlines to process the question and its choices
  const lines = text.split('\n').map(line => line.trim()).filter(line => line !== ''); // Remove blank lines

  // Extract the question (the first line)
  let question = lines[0].replace(/^\d+\./, '').trim(); // Remove the number "1."

  // Initialize variables for choices
  let choices = [];
  let correctAnswer = '';

  // Loop through the rest of the lines to process choices
  for (let i = 1; i < lines.length; i++) {
    let choice = lines[i].replace(/^[a-dA-D]\.\s*/, '').trim(); // Remove the choice label (e.g., "a.")

    if (choice.includes('*')) {
      correctAnswer = choice.replace('*', '').trim();  // Remove the asterisk (*) and set the correct answer
      choices.push({ text: correctAnswer, isCorrect: true });
    } else {
      choices.push({ text: choice, isCorrect: false });
    }
  }

  // Prepare the Blackboard format: MC question followed by choices with "correct" or "incorrect"
  let formattedQuestion = `MC\t${question}`;
  choices.forEach(choice => {
    formattedQuestion += `\t${choice.text}\t${choice.isCorrect ? 'correct' : 'incorrect'}`;
  });

  return formattedQuestion;
}

// Function to convert the questions from all tabs
function convertQuestions() {
  const mcqText = document.getElementById('mcqText').value;
  const essayText = document.getElementById('essayText').value;
  const tfText = document.getElementById('tfText').value;
  const fibText = document.getElementById('fibText').value;
  const outputText = document.getElementById('outputText');

  let convertedText = '';

  // Convert MCQs based on question numbering and ignore empty lines
  if (mcqText.trim() !== '') {
    const mcqQuestions = mcqText.split(/\n(?=\d+\.\s+)/).filter(block => block.trim() !== '');  // Filter out any empty lines
    const convertedMCQ = mcqQuestions.map(stripMetadataAndChoices);  // Process each MCQ question
    convertedText += convertedMCQ.join('\n');
    document.getElementById('mcqCounter').textContent = convertedMCQ.length;  // Update MCQ counter
  }

// Convert Essay questions
  if (essayText.trim() !== '') {
    const essayQuestions = essayText.split(/\n(?=\d+\.\s+)/).filter(block => block.trim() !== '');  // Filter out any empty lines
    const convertedEssay = essayQuestions.map(stripMetadataForEssay);  // Process each Essay question
    convertedText += '\n' + convertedEssay.join('\n');
    document.getElementById('essayCounter').textContent = convertedEssay.length;  // Update Essay counter
  }

  // Convert True/False questions
  if (tfText.trim() !== '') {
    const tfQuestions = tfText.split(/\n(?=\d+\.\s+)/).filter(block => block.trim() !== '');  // Filter out any empty lines
    const convertedTF = tfQuestions.map(stripMetadataAndTF);  // Process each True/False question
    convertedText += '\n' + convertedTF.join('\n');
    document.getElementById('tfCounter').textContent = convertedTF.length;  // Update TF counter
  }

  // Convert Fill in the Blank (FIB) questions and ignore empty lines
  if (fibText.trim() !== '') {
    const fibQuestions = fibText.split(/\n(?=\d+\.\s+)/).filter(block => block.trim() !== '');  // Filter out any empty lines
    const convertedFIB = fibQuestions.map(stripMetadataAndFIB);  // Process each FIB question
    convertedText += '\n' + convertedFIB.join('\n');
    document.getElementById('fibCounter').textContent = convertedFIB.length;  // Update FIB counter
  }

  outputText.value = convertedText.trim();
}


// Function to download the converted output
function downloadOutput() {
  const outputText = document.getElementById('outputText').value;
  const blob = new Blob([outputText], { type: 'text/plain' });
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.download = 'blackboard_questions.txt';
  link.click();
}


