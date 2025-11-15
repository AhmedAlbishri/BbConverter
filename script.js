/**
 * Blackboard Question Converter
 * Converts SEU-formatted questions to Blackboard Ultra tab-delimited format
 * Based on official Blackboard documentation: https://help.blackboard.com/Learn/Instructor/Ultra/Tests_Pools_Surveys/Reuse_Questions/Upload_Questions
 */

// ============================================================================
// CONSTANTS
// ============================================================================

const QUESTION_TYPES = {
    MC: 'MC',      // Multiple Choice
    MA: 'MA',      // Multiple Answer
    TF: 'TF',      // True/False
    ESS: 'ESS',    // Essay
    MAT: 'MAT',    // Matching
    FIB: 'FIB',    // Fill in the Blank
    FIB_PLUS: 'FIB_PLUS', // Fill in Multiple Blanks
    NUM: 'NUM'     // Numeric Response
};

const MAX_BATCH_SIZE = 250;

// SEU Metadata Patterns - Specific patterns to preserve legitimate parentheses/brackets
// These patterns match metadata in both English and Arabic
// Order matters: more specific patterns should be listed first
const METADATA_PATTERNS = [
    // Learning Outcomes (most specific first)
    /\(LO\d+\)/gi,                    // Learning Outcome: (LO1), (LO2), etc.
    /\(CLO\d+\)/gi,                   // Course Learning Outcome: (CLO1), etc.
    
    // Module patterns
    /\[Module\s+\d+\]/gi,             // Module: [Module 1], [Module 7], etc.
    /\[الوحدة\s+\d+\]/gi,              // Module in Arabic: [الوحدة 1], etc.
    /\[Module\s*\d+\]/gi,              // Module without space: [Module1]
    /\[الوحدة\s*\d+\]/gi,              // Module in Arabic without space: [الوحدة1]
    
    // Difficulty patterns
    /\[Difficulty\s+Level?:\s*(Low|Mid|High)\]/gi, // Difficulty: [Difficulty Level: Low] (handles typo "Leve")
    /\[مستوى\s+الصعوبة:\s*(منخفض|متوسط|عالي|Low|Mid|High)\]/gi, // Difficulty in Arabic
    
    // Author patterns (more specific)
    /\([^)]*(?:Dr\.|La\.|Dr|Author|د\.|دكتور|المؤلف)[^)]*\)/gi,  // Author names (English and Arabic)
    /\([^)]*Dr[^)]*\)/gi,              // Any parentheses containing "Dr"
    /\([^)]*د[^)]*\)/gi,               // Any parentheses containing Arabic "د"
    
    // General metadata patterns (less specific, catch-all)
    /\([^)]*(?:LO|CLO|Module|Difficulty|Level|Author)[^)]*\)/gi, // Any parentheses with metadata keywords
    /\[[^\]]*(?:Module|Difficulty|Level|Author|وحدة|صعوبة|مستوى)[^\]]*\]/gi // Any brackets with metadata keywords
];

// Question Numbering Patterns
const QUESTION_PATTERNS = {
    NUMBERED: /^\d+\.\s+/,                 // Numbered: "1. ", "19. "
    LETTERED: /^[a-z\u0600-\u06FF]\)\s+/i  // Lettered: "a) ", "ب) ", "أ) " (supports English and Arabic letters)
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Shows a notification message to the user
 * @param {string} message - The message to display
 * @param {string} type - The type of notification ('success', 'error', 'info')
 * @param {number} duration - Duration in milliseconds (default: 3000)
 */
function showNotification(message, type = 'info', duration = 3000) {
    // Remove existing notifications
    const existing = document.querySelector('.notification');
    if (existing) {
        existing.remove();
    }

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.setAttribute('role', 'alert');
    notification.setAttribute('aria-live', 'polite');
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideInRight 0.3s ease-out reverse';
        setTimeout(() => notification.remove(), 300);
    }, duration);
}

/**
 * Strips SEU metadata from text using specific patterns
 * Preserves legitimate parentheses and brackets in question text
 * Metadata is ALWAYS removed from converted questions for Blackboard
 * @param {string} text - The text to process
 * @returns {string} - Text with metadata removed
 */
function stripSEUMetadata(text) {
    // Always strip metadata from converted questions (metadata should never appear in Blackboard output)
    if (!text || typeof text !== 'string') {
        return text || '';
    }
    
    let cleaned = text;

    // Remove metadata patterns in order (most specific first)
    // Run multiple passes to catch nested or overlapping patterns
    let previousLength = cleaned.length;
    let iterations = 0;
    const maxIterations = 5; // Prevent infinite loops
    
    do {
        previousLength = cleaned.length;
        
        // Remove all metadata patterns (array order ensures specific patterns run first)
        METADATA_PATTERNS.forEach(pattern => {
            cleaned = cleaned.replace(pattern, '');
        });
        
        iterations++;
    } while (cleaned.length !== previousLength && iterations < maxIterations);

    // Clean up extra spaces (multiple spaces, tabs, newlines) and trim
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    
    return cleaned;
}

/**
 * Extracts question number prefix (numbered or lettered)
 * @param {string} text - The question text
 * @returns {Object} - Object with prefix and cleaned text
 */
function extractQuestionPrefix(text) {
    let prefix = '';
    let cleaned = text;

    // Check for numbered format
    const numberedMatch = text.match(QUESTION_PATTERNS.NUMBERED);
    if (numberedMatch) {
        prefix = numberedMatch[0];
        cleaned = text.replace(QUESTION_PATTERNS.NUMBERED, '').trim();
        return { prefix, cleaned, type: 'numbered' };
    }

    // Check for lettered format
    const letteredMatch = text.match(QUESTION_PATTERNS.LETTERED);
    if (letteredMatch) {
        prefix = letteredMatch[0];
        cleaned = text.replace(QUESTION_PATTERNS.LETTERED, '').trim();
        return { prefix, cleaned, type: 'lettered' };
    }

    return { prefix: '', cleaned: text.trim(), type: 'none' };
}

/**
 * Validates tab-delimited format
 * @param {string} text - The text to validate
 * @returns {boolean} - True if valid
 */
function validateTabDelimited(text) {
    const lines = text.split('\n').filter(line => line.trim() !== '');
    return lines.every(line => {
        const parts = line.split('\t');
        return parts.length >= 2; // At least question type and question text
    });
}

// ============================================================================
// QUESTION PARSING FUNCTIONS
// ============================================================================

/**
 * Parses and converts Multiple Choice questions
 * Format: "1. [Question] (LO#) (Author) [Module #] [Difficulty Level: X]\na. [choice]\nb. [choice]*\n..."
 * @param {string} text - The MCQ question block
 * @returns {string} - Blackboard formatted question
 */
function parseMCQ(text) {
    try {
        // First, split into lines before processing to preserve structure
        const rawLines = text.split('\n').map(line => line.trim()).filter(line => line !== '');
        
        if (rawLines.length < 2) {
            throw new Error('MCQ must have at least a question and one choice');
        }

        // Process the question line (first line)
        let questionLine = rawLines[0];
        // Strip metadata from question line only
        questionLine = stripSEUMetadata(questionLine);
        const { cleaned: question } = extractQuestionPrefix(questionLine);
        
        if (!question || question.trim() === '') {
            throw new Error('MCQ question text is required');
        }

        // Process choices (remaining lines)
        const choices = [];
        for (let i = 1; i < rawLines.length; i++) {
            let choiceLine = rawLines[i];
            // Strip metadata from choice line
            choiceLine = stripSEUMetadata(choiceLine);
            
            // Check for correct answer marker before processing
            const isCorrect = choiceLine.includes('*');
            
            // Remove letter prefix (a., b., c., etc.) - case insensitive, supports both . and ) formats
            // Pattern matches: "a.", "a)", "a ", "A.", etc.
            let choice = choiceLine.replace(/^[a-z\u0600-\u06FF]\)?\s*\.?\s*/i, '').trim();
            
            // Remove asterisk
            choice = choice.replace(/\*/g, '').trim();
            
            // Skip empty choices
            if (!choice || choice === '') continue;
            
            choices.push({
                text: choice,
                isCorrect: isCorrect
            });
        }

        if (choices.length === 0) {
            throw new Error('MCQ must have at least one choice');
        }

        if (choices.filter(c => c.isCorrect).length === 0) {
            throw new Error('MCQ must have at least one correct answer');
        }

        // Format: MC TAB question TAB choice TAB correct|incorrect TAB ...
        let formatted = `${QUESTION_TYPES.MC}\t${question}`;
        choices.forEach(choice => {
            formatted += `\t${choice.text}\t${choice.isCorrect ? 'correct' : 'incorrect'}`;
        });

        return formatted;
    } catch (error) {
        throw new Error(`MCQ parsing error: ${error.message}`);
    }
}

/**
 * Parses and converts Essay questions
 * Supports both numbered "1. [Question]" and lettered "a) [Question]" formats
 * @param {string} text - The Essay question block
 * @returns {string} - Blackboard formatted question
 */
function parseEssay(text) {
    try {
        let cleaned = stripSEUMetadata(text);
        const { cleaned: question } = extractQuestionPrefix(cleaned);
        
        if (!question) {
            throw new Error('Essay question text is required');
        }

        // Format: ESS TAB question TAB [example]
        return `${QUESTION_TYPES.ESS}\t${question}\t`;
    } catch (error) {
        throw new Error(`Essay parsing error: ${error.message}`);
    }
}

/**
 * Parses and converts True/False questions
 * Format: "1. [Question] (LO#) ...\nTrue*\nFalse" or "1. [Question] ...\nFalse*\nTrue"
 * @param {string} text - The T/F question block
 * @returns {string} - Blackboard formatted question
 */
function parseTrueFalse(text) {
    try {
        let cleaned = stripSEUMetadata(text);
        const lines = cleaned.split('\n').map(line => line.trim()).filter(line => line !== '');
        
        if (lines.length < 1) {
            throw new Error('True/False question text is required');
        }

        const { cleaned: question } = extractQuestionPrefix(lines[0]);
        
        if (!question) {
            throw new Error('True/False question text is required');
        }

        // Default to false, check for true marked with *
        let answer = 'false';
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].toLowerCase();
            if (line.includes('true') && lines[i].includes('*')) {
                answer = 'true';
                break;
            } else if (line.includes('false') && lines[i].includes('*')) {
                answer = 'false';
                break;
            }
        }

        // Format: TF TAB question TAB true|false
        return `${QUESTION_TYPES.TF}\t${question}\t${answer}`;
    } catch (error) {
        throw new Error(`True/False parsing error: ${error.message}`);
    }
}

/**
 * Parses and converts Fill in the Blank questions
 * Format: "1. [Question] (LO#) ...\n[answer1]\n[answer2]\n..."
 * @param {string} text - The FIB question block
 * @returns {string} - Blackboard formatted question
 */
function parseFillInBlank(text) {
    try {
        // First, split into lines before processing to preserve structure
        const rawLines = text.split('\n').map(line => line.trim()).filter(line => line !== '');
        
        if (rawLines.length < 1) {
            throw new Error('Fill in the Blank question text is required');
        }

        // Process the question line (first line)
        let questionLine = rawLines[0];
        // Strip metadata from question line only
        questionLine = stripSEUMetadata(questionLine);
        const { cleaned: question } = extractQuestionPrefix(questionLine);
        
        if (!question || question.trim() === '') {
            throw new Error('Fill in the Blank question text is required');
        }

        // Process answers (remaining lines)
        const answers = [];
        for (let i = 1; i < rawLines.length; i++) {
            let answerLine = rawLines[i];
            // Strip metadata from answer line
            answerLine = stripSEUMetadata(answerLine);
            // Trim and skip empty answers
            if (answerLine && answerLine.trim() !== '') {
                answers.push(answerLine.trim());
            }
        }
        
        if (answers.length === 0) {
            throw new Error('Fill in the Blank must have at least one answer');
        }

        // Format: FIB TAB question TAB answer1 TAB answer2 ...
        let formatted = `${QUESTION_TYPES.FIB}\t${question}`;
        answers.forEach(answer => {
            formatted += `\t${answer}`;
        });

        return formatted;
    } catch (error) {
        throw new Error(`Fill in the Blank parsing error: ${error.message}`);
    }
}

/**
 * Parses and converts Multiple Answer questions
 * Format: Similar to MCQ but allows multiple correct answers
 * @param {string} text - The MA question block
 * @returns {string} - Blackboard formatted question
 */
function parseMultipleAnswer(text) {
    try {
        // First, split into lines before processing to preserve structure
        const rawLines = text.split('\n').map(line => line.trim()).filter(line => line !== '');
        
        if (rawLines.length < 2) {
            throw new Error('Multiple Answer must have at least a question and one choice');
        }

        // Process the question line (first line)
        let questionLine = rawLines[0];
        // Strip metadata from question line only
        questionLine = stripSEUMetadata(questionLine);
        const { cleaned: question } = extractQuestionPrefix(questionLine);
        
        if (!question || question.trim() === '') {
            throw new Error('Multiple Answer question text is required');
        }

        // Process choices (remaining lines)
        const choices = [];
        for (let i = 1; i < rawLines.length; i++) {
            let choiceLine = rawLines[i];
            // Strip metadata from choice line
            choiceLine = stripSEUMetadata(choiceLine);
            
            // Check for correct answer marker before processing
            const isCorrect = choiceLine.includes('*');
            
            // Remove letter prefix (a., b., c., etc.) - case insensitive, supports both . and ) formats
            // Pattern matches: "a.", "a)", "a ", "A.", etc.
            let choice = choiceLine.replace(/^[a-z\u0600-\u06FF]\)?\s*\.?\s*/i, '').trim();
            
            // Remove asterisk
            choice = choice.replace(/\*/g, '').trim();
            
            // Skip empty choices
            if (!choice || choice === '') continue;
            
            choices.push({
                text: choice,
                isCorrect: isCorrect
            });
        }

        if (choices.length === 0) {
            throw new Error('Multiple Answer must have at least one choice');
        }

        if (choices.filter(c => c.isCorrect).length === 0) {
            throw new Error('Multiple Answer must have at least one correct answer');
        }

        // Format: MA TAB question TAB choice TAB correct|incorrect TAB ...
        let formatted = `${QUESTION_TYPES.MA}\t${question}`;
        choices.forEach(choice => {
            formatted += `\t${choice.text}\t${choice.isCorrect ? 'correct' : 'incorrect'}`;
        });

        return formatted;
    } catch (error) {
        throw new Error(`Multiple Answer parsing error: ${error.message}`);
    }
}

/**
 * Parses and converts Matching questions
 * Format: "1. [Question] (LO#) ...\n[answer1] [matching1]\n[answer2] [matching2]\n..."
 * @param {string} text - The MAT question block
 * @returns {string} - Blackboard formatted question
 */
function parseMatching(text) {
    try {
        let cleaned = stripSEUMetadata(text);
        const lines = cleaned.split('\n').map(line => line.trim()).filter(line => line !== '');
        
        if (lines.length < 2) {
            throw new Error('Matching must have at least a question and one answer pair');
        }

        const { cleaned: question } = extractQuestionPrefix(lines[0]);
        
        if (!question) {
            throw new Error('Matching question text is required');
        }

        const pairs = [];
        for (let i = 1; i < lines.length; i++) {
            const parts = lines[i].split(/\s+/).filter(p => p !== '');
            if (parts.length >= 2) {
                // Assume format: answer matching_text
                const answer = parts[0];
                const matching = parts.slice(1).join(' ');
                pairs.push({ answer, matching });
            }
        }

        if (pairs.length === 0) {
            throw new Error('Matching must have at least one answer pair');
        }

        // Format: MAT TAB question TAB answer TAB matching TAB answer2 TAB matching2 ...
        let formatted = `${QUESTION_TYPES.MAT}\t${question}`;
        pairs.forEach(pair => {
            formatted += `\t${pair.answer}\t${pair.matching}`;
        });

        return formatted;
    } catch (error) {
        throw new Error(`Matching parsing error: ${error.message}`);
    }
}

/**
 * Parses and converts Numeric Response questions
 * Format: "1. [Question] (LO#) ...\n[answer]\n[tolerance]" (tolerance optional)
 * @param {string} text - The NUM question block
 * @returns {string} - Blackboard formatted question
 */
function parseNumericResponse(text) {
    try {
        // First, split into lines before processing to preserve structure
        const rawLines = text.split('\n').map(line => line.trim()).filter(line => line !== '');
        
        if (rawLines.length < 1) {
            throw new Error('Numeric Response question text is required');
        }

        // Process the question line (first line)
        let questionLine = rawLines[0];
        // Strip metadata from question line only
        questionLine = stripSEUMetadata(questionLine);
        const { cleaned: question } = extractQuestionPrefix(questionLine);
        
        if (!question || question.trim() === '') {
            throw new Error('Numeric Response question text is required');
        }

        // Process answer (second line, if exists)
        let answer = '';
        if (rawLines.length > 1) {
            answer = stripSEUMetadata(rawLines[1]).trim();
        }

        // Process tolerance (third line, if exists)
        let tolerance = '';
        if (rawLines.length > 2) {
            tolerance = stripSEUMetadata(rawLines[2]).trim();
        }

        if (!answer || answer === '') {
            throw new Error('Numeric Response must have an answer');
        }

        // Format: NUM TAB question TAB answer TAB [tolerance]
        return `${QUESTION_TYPES.NUM}\t${question}\t${answer}${tolerance ? `\t${tolerance}` : ''}`;
    } catch (error) {
        throw new Error(`Numeric Response parsing error: ${error.message}`);
    }
}

// ============================================================================
// QUESTION COUNTING FUNCTIONS
// ============================================================================

/**
 * Counts questions based on numbering pattern
 * Supports both numbered and lettered formats
 * @param {string} text - The text to count questions in
 * @param {string} type - Question type ('essay' supports lettered format)
 * @returns {number} - Number of questions found
 */
function countQuestions(text, type = 'default') {
    if (!text || text.trim() === '') return 0;

    const lines = text.split('\n').map(line => line.trim()).filter(line => line !== '');
    
    if (type === 'essay') {
        // Essay supports both numbered and lettered formats
        return lines.filter(line => 
            QUESTION_PATTERNS.NUMBERED.test(line) || QUESTION_PATTERNS.LETTERED.test(line)
        ).length;
    } else {
        // Other types use numbered format
        return lines.filter(line => QUESTION_PATTERNS.NUMBERED.test(line)).length;
    }
}

/**
 * Updates the question counter for a specific type
 * @param {string} type - Question type ('mcq', 'essay', 'tf', 'fib', etc.)
 */
function updateQuestionCounter(type) {
    const textareaId = `${type}Text`;
    const counterId = `${type}Counter`;
    
    const textarea = document.getElementById(textareaId);
    const counter = document.getElementById(counterId);
    
    if (textarea && counter) {
        const count = countQuestions(textarea.value, type === 'essay' ? 'essay' : 'default');
        counter.textContent = count;
    }
}

/**
 * Updates the total question count
 */
function updateTotalQuestions() {
    const counters = ['mcq', 'essay', 'tf', 'fib', 'ma', 'mat', 'num'];
    let total = 0;
    
    counters.forEach(type => {
        const counter = document.getElementById(`${type}Counter`);
        if (counter) {
            total += parseInt(counter.textContent) || 0;
        }
    });
    
    const totalElement = document.getElementById('totalQuestions');
    if (totalElement) {
        totalElement.textContent = total;
    }
}

// ============================================================================
// CONVERSION FUNCTIONS
// ============================================================================

/**
 * Converts questions from all tabs to Blackboard format
 * Includes validation and error handling
 */
function convertQuestions() {
  const outputText = document.getElementById('outputText');
    if (!outputText) return;

    // Show loading state
    const convertButton = document.querySelector('button[onclick="convertQuestions()"]');
    const originalText = convertButton?.textContent;
    if (convertButton) {
        convertButton.disabled = true;
        convertButton.innerHTML = '<span class="loading"></span> Converting...';
    }

    try {
  let convertedText = '';
        const errors = [];
        let totalQuestions = 0;

        // Process MCQ
        const mcqText = document.getElementById('mcqText')?.value || '';
  if (mcqText.trim() !== '') {
            // Split by numbered questions, but also handle cases where first question might not have number
            let mcqQuestions = mcqText.split(/\n(?=\d+\.\s+)/).filter(block => block.trim() !== '');
            
            // If no numbered questions found, treat entire text as one question
            if (mcqQuestions.length === 0 && mcqText.trim() !== '') {
                mcqQuestions = [mcqText.trim()];
            }
            
            const convertedMCQ = [];
            
            mcqQuestions.forEach((block, index) => {
                try {
                    // Trim the block to remove any leading/trailing whitespace
                    const trimmedBlock = block.trim();
                    if (trimmedBlock) {
                        convertedMCQ.push(parseMCQ(trimmedBlock));
                        totalQuestions++;
                    }
                } catch (error) {
                    errors.push(`MCQ Question ${index + 1}: ${error.message}`);
                }
            });
            
            if (convertedMCQ.length > 0) {
    convertedText += convertedMCQ.join('\n');
            }
            updateQuestionCounter('mcq');
  }

        // Process Essay (supports both numbered and lettered)
        const essayText = document.getElementById('essayText')?.value || '';
  if (essayText.trim() !== '') {
            // Split by both numbered and lettered patterns (supports English and Arabic letters)
            const essayQuestions = essayText.split(/\n(?=\d+\.\s+|[a-z\u0600-\u06FF]\)\s+)/i).filter(block => block.trim() !== '');
            const convertedEssay = [];
            
            essayQuestions.forEach((block, index) => {
                try {
                    convertedEssay.push(parseEssay(block));
                    totalQuestions++;
                } catch (error) {
                    errors.push(`Essay Question ${index + 1}: ${error.message}`);
                }
            });
            
            if (convertedEssay.length > 0) {
                convertedText += (convertedText ? '\n' : '') + convertedEssay.join('\n');
            }
            updateQuestionCounter('essay');
        }

        // Process True/False
        const tfText = document.getElementById('tfText')?.value || '';
  if (tfText.trim() !== '') {
            const tfQuestions = tfText.split(/\n(?=\d+\.\s+)/).filter(block => block.trim() !== '');
            const convertedTF = [];
            
            tfQuestions.forEach((block, index) => {
                try {
                    convertedTF.push(parseTrueFalse(block));
                    totalQuestions++;
                } catch (error) {
                    errors.push(`True/False Question ${index + 1}: ${error.message}`);
                }
            });
            
            if (convertedTF.length > 0) {
                convertedText += (convertedText ? '\n' : '') + convertedTF.join('\n');
            }
            updateQuestionCounter('tf');
        }

        // Process Fill in the Blank
        const fibText = document.getElementById('fibText')?.value || '';
  if (fibText.trim() !== '') {
            const fibQuestions = fibText.split(/\n(?=\d+\.\s+)/).filter(block => block.trim() !== '');
            const convertedFIB = [];
            
            fibQuestions.forEach((block, index) => {
                try {
                    convertedFIB.push(parseFillInBlank(block));
                    totalQuestions++;
                } catch (error) {
                    errors.push(`Fill in the Blank Question ${index + 1}: ${error.message}`);
                }
            });
            
            if (convertedFIB.length > 0) {
                convertedText += (convertedText ? '\n' : '') + convertedFIB.join('\n');
            }
            updateQuestionCounter('fib');
        }

        // Process Multiple Answer
        const maText = document.getElementById('maText')?.value || '';
        if (maText.trim() !== '') {
            const maQuestions = maText.split(/\n(?=\d+\.\s+)/).filter(block => block.trim() !== '');
            const convertedMA = [];
            
            maQuestions.forEach((block, index) => {
                try {
                    convertedMA.push(parseMultipleAnswer(block));
                    totalQuestions++;
                } catch (error) {
                    errors.push(`Multiple Answer Question ${index + 1}: ${error.message}`);
                }
            });
            
            if (convertedMA.length > 0) {
                convertedText += (convertedText ? '\n' : '') + convertedMA.join('\n');
            }
            updateQuestionCounter('ma');
        }

        // Process Matching
        const matText = document.getElementById('matText')?.value || '';
        if (matText.trim() !== '') {
            const matQuestions = matText.split(/\n(?=\d+\.\s+)/).filter(block => block.trim() !== '');
            const convertedMAT = [];
            
            matQuestions.forEach((block, index) => {
                try {
                    convertedMAT.push(parseMatching(block));
                    totalQuestions++;
                } catch (error) {
                    errors.push(`Matching Question ${index + 1}: ${error.message}`);
                }
            });
            
            if (convertedMAT.length > 0) {
                convertedText += (convertedText ? '\n' : '') + convertedMAT.join('\n');
            }
            updateQuestionCounter('mat');
        }

        // Process Numeric Response
        const numText = document.getElementById('numText')?.value || '';
        if (numText.trim() !== '') {
            const numQuestions = numText.split(/\n(?=\d+\.\s+)/).filter(block => block.trim() !== '');
            const convertedNUM = [];
            
            numQuestions.forEach((block, index) => {
                try {
                    convertedNUM.push(parseNumericResponse(block));
                    totalQuestions++;
                } catch (error) {
                    errors.push(`Numeric Response Question ${index + 1}: ${error.message}`);
                }
            });
            
            if (convertedNUM.length > 0) {
                convertedText += (convertedText ? '\n' : '') + convertedNUM.join('\n');
            }
            updateQuestionCounter('num');
        }

        // Validate output format
        if (convertedText && !validateTabDelimited(convertedText)) {
            errors.push('Warning: Output format validation failed. Please review the converted questions.');
        }

        // Check batch size
        if (totalQuestions > MAX_BATCH_SIZE) {
            errors.push(`Warning: Batch size (${totalQuestions}) exceeds recommended maximum (${MAX_BATCH_SIZE}). Consider splitting into smaller batches.`);
        }

        // Set output
  outputText.value = convertedText.trim();

        // Show results
        if (errors.length > 0) {
            showNotification(`${totalQuestions} questions converted with ${errors.length} error(s). Check console for details.`, 'error', 5000);
            console.error('Conversion errors:', errors);
        } else if (totalQuestions > 0) {
            showNotification(`Successfully converted ${totalQuestions} question(s)!`, 'success');
        } else {
            showNotification('No questions found to convert.', 'info');
        }

        updateTotalQuestions();

    } catch (error) {
        showNotification(`Conversion failed: ${error.message}`, 'error', 5000);
        console.error('Conversion error:', error);
    } finally {
        // Restore button state
        if (convertButton) {
            convertButton.disabled = false;
            convertButton.textContent = originalText || 'Convert';
        }
    }
}

// ============================================================================
// DOWNLOAD FUNCTION
// ============================================================================

/**
 * Downloads the converted output as a tab-delimited text file
 * Includes validation and cleanup
 */
function downloadOutput() {
    const outputText = document.getElementById('outputText');
    if (!outputText) return;

    const content = outputText.value.trim();

    if (!content) {
        showNotification('No content to download. Please convert questions first.', 'error');
        return;
    }

    try {
        // Validate format
        if (!validateTabDelimited(content)) {
            showNotification('Warning: Output format may be invalid. Downloading anyway...', 'error', 3000);
        }

        // Create blob and download
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
        link.href = url;
  link.download = 'blackboard_questions.txt';
        document.body.appendChild(link);
  link.click();
        document.body.removeChild(link);

        // Clean up blob URL
        setTimeout(() => {
            window.URL.revokeObjectURL(url);
        }, 100);

        showNotification('File downloaded successfully!', 'success');
    } catch (error) {
        showNotification(`Download failed: ${error.message}`, 'error', 5000);
        console.error('Download error:', error);
    }
}

/**
 * Copies output to clipboard
 */
function copyToClipboard() {
    const outputText = document.getElementById('outputText');
    if (!outputText) return;

    const content = outputText.value.trim();

    if (!content) {
        showNotification('No content to copy. Please convert questions first.', 'error');
        return;
    }

    outputText.select();
    outputText.setSelectionRange(0, 99999); // For mobile devices

    try {
        document.execCommand('copy');
        showNotification('Copied to clipboard!', 'success');
    } catch (error) {
        // Fallback for modern browsers
        navigator.clipboard.writeText(content).then(() => {
            showNotification('Copied to clipboard!', 'success');
        }).catch(err => {
            showNotification('Failed to copy to clipboard.', 'error');
            console.error('Copy error:', err);
        });
    }
}

/**
 * Clears all input fields and output
 */
function clearAll() {
    if (confirm('Are you sure you want to clear all questions and output?')) {
        const textareas = ['mcqText', 'essayText', 'tfText', 'fibText', 'maText', 'matText', 'numText', 'outputText'];
        textareas.forEach(id => {
            const element = document.getElementById(id);
            if (element) element.value = '';
        });

        const counters = ['mcq', 'essay', 'tf', 'fib', 'ma', 'mat', 'num'];
        counters.forEach(type => {
            const counter = document.getElementById(`${type}Counter`);
            if (counter) counter.textContent = '0';
        });

        updateTotalQuestions();
        showNotification('All fields cleared.', 'info');
    }
}

// ============================================================================
// TAB MANAGEMENT
// ============================================================================

/**
 * Opens a specific tab
 * @param {Event} evt - The event object
 * @param {string} tabName - The name of the tab to open
 */
function openTab(evt, tabName) {
    let i, tabcontent, tablinks;
    
    // Hide all tab content
    tabcontent = document.getElementsByClassName('tabcontent');
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = 'none';
        tabcontent[i].setAttribute('aria-hidden', 'true');
    }
    
    // Remove active class from all tab links (both sidebar and top nav)
    tablinks = document.getElementsByClassName('tablinks');
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].classList.remove('active');
        tablinks[i].setAttribute('aria-selected', 'false');
        tablinks[i].setAttribute('tabindex', '-1');
    }
    
    // Show the selected tab content
    const selectedTab = document.getElementById(tabName);
    if (selectedTab) {
        selectedTab.style.display = 'block';
        selectedTab.setAttribute('aria-hidden', 'false');
    }
    
    // Add active class to the clicked tab link and corresponding link in other nav
    if (evt && evt.currentTarget) {
        evt.currentTarget.classList.add('active');
        evt.currentTarget.setAttribute('aria-selected', 'true');
        evt.currentTarget.setAttribute('tabindex', '0');
        
        // Also update the corresponding link in the other navigation (sidebar or top nav)
        const allLinks = document.querySelectorAll(`[aria-controls="${tabName}"]`);
        allLinks.forEach(link => {
            if (link !== evt.currentTarget) {
                link.classList.add('active');
                link.setAttribute('aria-selected', 'true');
                link.setAttribute('tabindex', '0');
            }
        });
    }
}

/**
 * Handles keyboard navigation for tabs
 * @param {Event} evt - The keyboard event
 */
function handleTabKeyboard(evt) {
    const tabs = Array.from(document.querySelectorAll('.tablinks'));
    const currentIndex = tabs.findIndex(tab => tab.classList.contains('active'));
    
    let newIndex = currentIndex;
    
    switch (evt.key) {
        case 'ArrowLeft':
            newIndex = currentIndex > 0 ? currentIndex - 1 : tabs.length - 1;
            evt.preventDefault();
            break;
        case 'ArrowRight':
            newIndex = currentIndex < tabs.length - 1 ? currentIndex + 1 : 0;
            evt.preventDefault();
            break;
        case 'Home':
            newIndex = 0;
            evt.preventDefault();
            break;
        case 'End':
            newIndex = tabs.length - 1;
            evt.preventDefault();
            break;
        default:
            return;
    }
    
    if (newIndex !== currentIndex && tabs[newIndex]) {
        const tabName = tabs[newIndex].getAttribute('onclick')?.match(/'([^']+)'/)?.[1];
        if (tabName) {
            tabs[newIndex].click();
            tabs[newIndex].focus();
        }
    }
}

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initializes the application
 */
function initializeApp() {
    // Initialize theme
    const currentTheme = localStorage.getItem('theme') || 'light';
    document.body.className = currentTheme + '-theme';
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.querySelector('.icon').textContent = currentTheme === 'light' ? '🌙' : '☀️';
        themeToggle.addEventListener('click', () => {
            const isDark = document.body.classList.contains('dark-theme');
            if (isDark) {
                document.body.classList.remove('dark-theme');
                document.body.classList.add('light-theme');
                themeToggle.querySelector('.icon').textContent = '🌙';
                localStorage.setItem('theme', 'light');
            } else {
                document.body.classList.remove('light-theme');
                document.body.classList.add('dark-theme');
                themeToggle.querySelector('.icon').textContent = '☀️';
                localStorage.setItem('theme', 'dark');
            }
        });
    }

    // Initialize language switcher
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const lang = btn.dataset.lang;
            if (window.setLanguage) {
                window.setLanguage(lang);
            }
        });
    });

    // Open first tab by default
    const firstTab = document.querySelector('.tablinks');
    if (firstTab) {
        firstTab.click();
    }

    // Add keyboard shortcuts
    document.addEventListener('keydown', (evt) => {
        // Ctrl+Enter or Cmd+Enter to convert
        if ((evt.ctrlKey || evt.metaKey) && evt.key === 'Enter') {
            evt.preventDefault();
            convertQuestions();
        }
    });

    // Add keyboard navigation to tabs
    document.querySelectorAll('.tablinks').forEach(tab => {
        tab.addEventListener('keydown', handleTabKeyboard);
    });

    // Initialize counters
    updateTotalQuestions();
}

/**
 * Toggles example visibility
 * @param {string} exampleId - The ID of the example element to toggle
 */
function toggleExample(exampleId) {
    const example = document.getElementById(exampleId);
    const button = document.querySelector(`[aria-controls="${exampleId}"]`);
    
    if (!example || !button) return;
    
    const isExpanded = example.classList.contains('expanded');
    
    if (isExpanded) {
        example.classList.remove('expanded');
        if (window.t) {
            button.textContent = window.t('showExample');
        } else {
            button.textContent = 'Show Example';
        }
        button.setAttribute('aria-expanded', 'false');
    } else {
        example.classList.add('expanded');
        if (window.t) {
            button.textContent = window.t('hideExample');
        } else {
            button.textContent = 'Hide Example';
        }
        button.setAttribute('aria-expanded', 'true');
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initializeApp);
