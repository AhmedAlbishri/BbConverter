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

// Function to convert the questions from all tabs
function convertQuestions() {
  const mcqText = document.getElementById('mcqText').value;
  const essayText = document.getElementById('essayText').value;
  const tfText = document.getElementById('tfText').value;
  const matchingText = document.getElementById('matchingText').value;
  const numericText = document.getElementById('numericText').value;
  const outputText = document.getElementById('outputText');

  let convertedText = '';

  // Convert MCQs
  if (mcqText.trim() !== '') {
    const mcqQuestions = mcqText.split('\n').filter(line => line.trim() !== '');
    mcqQuestions.forEach(question => {
      convertedText += `MC\t${question}\n`;
    });
    document.getElementById('mcqCounter').textContent = mcqQuestions.length;
  }

  // Convert Essay questions
  if (essayText.trim() !== '') {
    const essayQuestions = essayText.split('\n').filter(line => line.trim() !== '');
    essayQuestions.forEach(question => {
      convertedText += `ESS\t${question}\n`;
    });
    document.getElementById('essayCounter').textContent = essayQuestions.length;
  }

  // Convert True/False questions
  if (tfText.trim() !== '') {
    const tfQuestions = tfText.split('\n').filter(line => line.trim() !== '');
    tfQuestions.forEach(question => {
      convertedText += `TF\t${question}\n`;
    });
    document.getElementById('tfCounter').textContent = tfQuestions.length;
  }

  // Convert Matching questions
  if (matchingText.trim() !== '') {
    const matchingQuestions = matchingText.split('\n').filter(line => line.trim() !== '');
    matchingQuestions.forEach(question => {
      convertedText += `MAT\t${question}\n`;
    });
    document.getElementById('matchingCounter').textContent = matchingQuestions.length;
  }

  // Convert Numeric Response questions
  if (numericText.trim() !== '') {
    const numericQuestions = numericText.split('\n').filter(line => line.trim() !== '');
    numericQuestions.forEach(question => {
      convertedText += `NUM\t${question}\n`;
    });
    document.getElementById('numericCounter').textContent = numericQuestions.length;
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
