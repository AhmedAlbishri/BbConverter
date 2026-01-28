/**
 * QTI 2.1 Export Module
 * Handles parsing questions and generating QTI 2.1 compliant ZIP packages
 */

// ============================================================================
// CONSTANTS & HELPERS
// ============================================================================

const QTI_METADATA_PATTERNS = [
    /\(LO\d+\)/gi,
    /\(CLO\d+\)/gi,
    /\[Module\s+\d+\]/gi,
    /\[الوحدة\s+\d+\]/gi,
    /\[Module\s*\d+\]/gi,
    /\[الوحدة\s*\d+\]/gi,
    /\[Difficulty\s+Level?:\s*(Low|Mid|High)\]/gi,
    /\[مستوى\s+الصعوبة:\s*(منخفض|متوسط|عالي|Low|Mid|High)\]/gi,
    /\([^)]*(?:Dr\.|La\.|Dr|Author|د\.|دكتور|المؤلف)[^)]*\)/gi,
    /\([^)]*Dr[^)]*\)/gi,
    /\([^)]*د[^)]*\)/gi,
    /\([^)]*(?:LO|CLO|Module|Difficulty|Level|Author)[^)]*\)/gi,
    /\[[^\]]*(?:Module|Difficulty|Level|Author|وحدة|صعوبة|مستوى)[^\]]*\]/gi
];

const QTI_QUESTION_PATTERNS = {
    NUMBERED: /^\d+\.\s+/,
    LETTERED: /^[a-z\u0600-\u06FF]\)\s+/i
};

function stripQTIMetadata(text) {
    if (!text || typeof text !== 'string') return text || '';
    let cleaned = text;
    let previousLength = cleaned.length;
    let iterations = 0;
    do {
        previousLength = cleaned.length;
        QTI_METADATA_PATTERNS.forEach(pattern => {
            cleaned = cleaned.replace(pattern, '');
        });
        iterations++;
    } while (cleaned.length !== previousLength && iterations < 5);
    return cleaned.replace(/\s+/g, ' ').trim();
}

function extractQTIPrefix(text) {
    let prefix = '';
    let cleaned = text;
    const numberedMatch = text.match(QTI_QUESTION_PATTERNS.NUMBERED);
    if (numberedMatch) {
        prefix = numberedMatch[0];
        cleaned = text.replace(QTI_QUESTION_PATTERNS.NUMBERED, '').trim();
        return { prefix, cleaned };
    }
    const letteredMatch = text.match(QTI_QUESTION_PATTERNS.LETTERED);
    if (letteredMatch) {
        prefix = letteredMatch[0];
        cleaned = text.replace(QTI_QUESTION_PATTERNS.LETTERED, '').trim();
        return { prefix, cleaned };
    }
    return { prefix: '', cleaned: text.trim() };
}

function generateUUID() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function escapeXML(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&apos;');
}

// ============================================================================
// PARSING FUNCTIONS
// ============================================================================

function parseMCQData(text) {
    const rawLines = text.split('\n').map(line => line.trim()).filter(line => line !== '');
    if (rawLines.length < 2) return null;

    let questionLine = stripQTIMetadata(rawLines[0]);
    const { cleaned: question } = extractQTIPrefix(questionLine);
    if (!question) return null;

    const choices = [];
    for (let i = 1; i < rawLines.length; i++) {
        let choiceLine = stripQTIMetadata(rawLines[i]);
        const isCorrect = choiceLine.includes('*');
        let choice = choiceLine.replace(/^[a-z\u0600-\u06FF]\)?\s*\.?\s*/i, '').replace(/\*/g, '').trim();
        if (choice) {
            choices.push({ id: generateUUID(), text: choice, isCorrect });
        }
    }
    if (choices.length === 0 || !choices.some(c => c.isCorrect)) return null;

    return { type: 'MCQ', id: generateUUID(), question, choices };
}

function parseEssayData(text) {
    let cleaned = stripQTIMetadata(text);
    const { cleaned: question } = extractQTIPrefix(cleaned);
    if (!question) return null;
    return { type: 'ESSAY', id: generateUUID(), question };
}

function parseTFData(text) {
    let cleaned = stripQTIMetadata(text);
    const lines = cleaned.split('\n').map(line => line.trim()).filter(line => line !== '');
    if (lines.length < 1) return null;

    const { cleaned: question } = extractQTIPrefix(lines[0]);
    if (!question) return null;

    let correctAnswer = false;
    for (let i = 1; i < lines.length; i++) {
        if (lines[i].toLowerCase().includes('true') && lines[i].includes('*')) correctAnswer = true;
    }
    // Note: If False is marked with *, correctAnswer stays false. If True is *, it becomes true.

    return { type: 'TF', id: generateUUID(), question, correctAnswer };
}

function parseFIBData(text) {
    const rawLines = text.split('\n').map(line => line.trim()).filter(line => line !== '');
    if (rawLines.length < 2) return null;

    let questionLine = stripQTIMetadata(rawLines[0]);
    const { cleaned: question } = extractQTIPrefix(questionLine);
    if (!question) return null;

    const answers = [];
    for (let i = 1; i < rawLines.length; i++) {
        let ans = stripQTIMetadata(rawLines[i]);
        if (ans) answers.push(ans);
    }
    if (answers.length === 0) return null;

    return { type: 'FIB', id: generateUUID(), question, answers };
}

function parseMAData(text) {
    // Similar structure to MCQ but multiple correct answers allowed
    const data = parseMCQData(text);
    if (data) {
        data.type = 'MA';
        // Validate at least one correct choice (already checked in parseMCQData logic, but checking logic there is some(), which is fine for MA too)
    }
    return data;
}

function parseMatchingData(text) {
    let cleaned = stripQTIMetadata(text);
    const lines = cleaned.split('\n').map(line => line.trim()).filter(line => line !== '');
    if (lines.length < 2) return null;

    const { cleaned: question } = extractQTIPrefix(lines[0]);
    if (!question) return null;

    const pairs = [];
    for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(/\s+/).filter(p => p !== '');
        if (parts.length >= 2) {
            pairs.push({
                id: generateUUID(),
                left: parts[0],
                right: parts.slice(1).join(' ')
            });
        }
    }
    if (pairs.length === 0) return null;

    return { type: 'MATCH', id: generateUUID(), question, pairs };
}

function parseNumericData(text) {
    const rawLines = text.split('\n').map(line => line.trim()).filter(line => line !== '');
    if (rawLines.length < 2) return null;

    let questionLine = stripQTIMetadata(rawLines[0]);
    const { cleaned: question } = extractQTIPrefix(questionLine);
    if (!question) return null;

    const answer = stripQTIMetadata(rawLines[1]);
    const tolerance = rawLines.length > 2 ? stripQTIMetadata(rawLines[2]) : null;

    return { type: 'NUMERIC', id: generateUUID(), question, answer, tolerance };
}


// ============================================================================
// XML GENERATION
// ============================================================================

function generateManifest(items) {
    const manifestId = generateUUID();
    const testId = generateUUID();
    const testFilename = `qti21/question_bank_${testId}.xml`;
    
    let dependenciesXML = '';
    items.forEach(item => {
        dependenciesXML += `<dependency identifierref="${item.id}"/>`;
    });

    let resourcesXML = '';
    // Add Question Bank Resource
    resourcesXML += `
    <resource identifier="resource-${testId}" type="imsqti_test_xmlv2p1" href="${testFilename}">
      <file href="${testFilename}"/>
      ${dependenciesXML}
    </resource>`;

    // Add Item Resources
    items.forEach(item => {
        resourcesXML += `
    <resource identifier="${item.id}" type="imsqti_item_xmlv2p1" href="qti21/${item.filename}">
      <file href="qti21/${item.filename}"/>
    </resource>`;
    });

    return `<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="http://www.imsglobal.org/xsd/imscp_v1p1"
    xmlns:csm="http://www.imsglobal.org/xsd/imsccv1p2/imscsmd_v1p0"
    xmlns:imsmd="http://ltsc.ieee.org/xsd/LOM"
    xmlns:imsqti="http://www.imsglobal.org/xsd/imsqti_metadata_v2p1"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://www.imsglobal.org/xsd/imscp_v1p1 http://www.imsglobal.org/xsd/imscp_v1p2.xsd http://ltsc.ieee.org/xsd/LOM imsmd_loose_v1p3.xsd http://www.imsglobal.org/xsd/imsqti_metadata_v2p1 http://www.imsglobal.org/xsd/qti/qtiv2p1/imsqti_metadata_v2p1.xsd http://www.imsglobal.org/xsd/imsccv1p2/imscsmd_v1p0 http://www.imsglobal.org/profile/cc/ccv1p2/ccv1p2_imscsmd_v1p0.xsd"
    identifier="manifest-${manifestId}">
  <metadata>
    <schema>QTIv2.1</schema>
    <schemaversion>2.0</schemaversion>
  </metadata>
  <organizations/>
  <resources>${resourcesXML}
  </resources>
</manifest>`;
}

function generateAssessmentTestXML(items, testId) {
    let itemRefs = '';
    items.forEach(item => {
        itemRefs += `<assessmentItemRef identifier="${item.id}" href="${item.filename}" />`;
    });

    return `<?xml version="1.0" encoding="UTF-8"?>
<assessmentTest xmlns="http://www.imsglobal.org/xsd/imsqti_v2p1"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://www.imsglobal.org/xsd/imsqti_v2p1 http://www.imsglobal.org/xsd/qti/qtiv2p1/imsqti_v2p1.xsd"
    identifier="${testId}" title="Question Bank">
  <testPart identifier="part_${testId}" navigationMode="nonlinear" submissionMode="simultaneous">
    <assessmentSection identifier="section_${testId}" visible="false" title="Section 1">
      ${itemRefs}
    </assessmentSection>
  </testPart>
</assessmentTest>`;
}

function generateMCQXML(data) {
    const maxChoices = data.type === 'MA' ? 0 : 1;
    const card = 'multiple'; // Blackboard seems to prefer multiple for both
    const correctIds = data.choices.filter(c => c.isCorrect).map(c => c.id);
    
    let correctXML = '';
    correctIds.forEach(id => {
        correctXML += `<value>${id}</value> `;
    });

    let choicesXML = '';
    data.choices.forEach(choice => {
        choicesXML += `
      <simpleChoice identifier="${choice.id}" fixed="true">
        <div>${escapeXML(choice.text)}</div>
      </simpleChoice>`;
    });

    // Determine feedback ID (simplified for now)
    const correctFeedbackId = "correct_fb";
    const incorrectFeedbackId = "incorrect_fb";

    return `<?xml version="1.0" encoding="UTF-8"?>
<assessmentItem xmlns="http://www.imsglobal.org/xsd/imsqti_v2p1"
    xmlns:ns9="http://www.imsglobal.org/xsd/apip/apipv1p0/imsapip_qtiv1p0"
    xmlns:ns8="http://www.w3.org/1999/xlink"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://www.imsglobal.org/xsd/imsqti_v2p1 http://www.imsglobal.org/xsd/qti/qtiv2p1/imsqti_v2p1.xsd"
    identifier="${data.id}" title="" adaptive="false" timeDependent="false">
  <responseDeclaration identifier="RESPONSE" cardinality="${card}" baseType="identifier">
    <correctResponse>
      ${correctXML}
    </correctResponse>
  </responseDeclaration>
  <outcomeDeclaration identifier="SCORE" cardinality="single" baseType="float">
    <defaultValue><value>0</value></defaultValue>
  </outcomeDeclaration>
  <outcomeDeclaration identifier="FEEDBACKBASIC" cardinality="single" baseType="identifier"/>
  <outcomeDeclaration identifier="MAXSCORE" cardinality="single" baseType="float">
    <defaultValue><value>0</value></defaultValue>
  </outcomeDeclaration>
  <itemBody>
    <div>
      <div>${escapeXML(data.question)}</div>
    </div>
    <choiceInteraction responseIdentifier="RESPONSE" shuffle="false" maxChoices="${maxChoices}">
      ${choicesXML}
    </choiceInteraction>
  </itemBody>
  <responseProcessing>
    <responseCondition>
      <responseIf>
        <match><variable identifier="RESPONSE"/><correct identifier="RESPONSE"/></match>
        <setOutcomeValue identifier="SCORE"><variable identifier="MAXSCORE"/></setOutcomeValue>
        <setOutcomeValue identifier="FEEDBACKBASIC"><baseValue baseType="identifier">${correctFeedbackId}</baseValue></setOutcomeValue>
      </responseIf>
      <responseElse>
        <setOutcomeValue identifier="FEEDBACKBASIC"><baseValue baseType="identifier">${incorrectFeedbackId}</baseValue></setOutcomeValue>
      </responseElse>
    </responseCondition>
  </responseProcessing>
</assessmentItem>`;
}

function generateTFXML(data) {
    const trueId = "choice-true";
    const falseId = "choice-false";
    const correctId = data.correctAnswer ? trueId : falseId;

    return `<?xml version="1.0" encoding="UTF-8"?>
<assessmentItem xmlns="http://www.imsglobal.org/xsd/imsqti_v2p1"
    xmlns:ns9="http://www.imsglobal.org/xsd/apip/apipv1p0/imsapip_qtiv1p0"
    xmlns:ns8="http://www.w3.org/1999/xlink"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://www.imsglobal.org/xsd/imsqti_v2p1 http://www.imsglobal.org/xsd/qti/qtiv2p1/imsqti_v2p1.xsd"
    identifier="${data.id}" title="" adaptive="false" timeDependent="false">
  <responseDeclaration identifier="RESPONSE" cardinality="single" baseType="identifier">
    <correctResponse>
      <value>${correctId}</value>
    </correctResponse>
  </responseDeclaration>
  <outcomeDeclaration identifier="SCORE" cardinality="single" baseType="float">
    <defaultValue><value>0</value></defaultValue>
  </outcomeDeclaration>
  <outcomeDeclaration identifier="FEEDBACKBASIC" cardinality="single" baseType="identifier"/>
  <outcomeDeclaration identifier="MAXSCORE" cardinality="single" baseType="float">
    <defaultValue><value>0</value></defaultValue>
  </outcomeDeclaration>
  <itemBody>
    <div>
      <div>${escapeXML(data.question)}</div>
    </div>
    <choiceInteraction responseIdentifier="RESPONSE" shuffle="false" maxChoices="1">
      <simpleChoice identifier="${trueId}"><p>True</p></simpleChoice>
      <simpleChoice identifier="${falseId}"><p>False</p></simpleChoice>
    </choiceInteraction>
  </itemBody>
  <responseProcessing>
    <responseCondition>
      <responseIf>
        <match><variable identifier="RESPONSE"/><correct identifier="RESPONSE"/></match>
        <setOutcomeValue identifier="SCORE"><variable identifier="MAXSCORE"/></setOutcomeValue>
        <setOutcomeValue identifier="FEEDBACKBASIC"><baseValue baseType="identifier">correct_fb</baseValue></setOutcomeValue>
      </responseIf>
      <responseElse>
        <setOutcomeValue identifier="FEEDBACKBASIC"><baseValue baseType="identifier">incorrect_fb</baseValue></setOutcomeValue>
      </responseElse>
    </responseCondition>
  </responseProcessing>
</assessmentItem>`;
}

function generateEssayXML(data) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<assessmentItem xmlns="http://www.imsglobal.org/xsd/imsqti_v2p1"
    xmlns:ns9="http://www.imsglobal.org/xsd/apip/apipv1p0/imsapip_qtiv1p0"
    xmlns:ns8="http://www.w3.org/1999/xlink"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://www.imsglobal.org/xsd/imsqti_v2p1 http://www.imsglobal.org/xsd/qti/qtiv2p1/imsqti_v2p1.xsd"
    identifier="${data.id}" title="" adaptive="false" timeDependent="false">
  <responseDeclaration identifier="RESPONSE" cardinality="single" baseType="string"/>
  <outcomeDeclaration identifier="SCORE" cardinality="single" baseType="float">
    <defaultValue><value>0</value></defaultValue>
  </outcomeDeclaration>
  <outcomeDeclaration identifier="MAXSCORE" cardinality="single" baseType="float">
    <defaultValue><value>0</value></defaultValue>
  </outcomeDeclaration>
  <itemBody>
    <div>
      <div>${escapeXML(data.question)}</div>
    </div>
    <extendedTextInteraction responseIdentifier="RESPONSE"/>
  </itemBody>
</assessmentItem>`;
}

function generateFIBXML(data) {
    let valuesXML = '';
    data.answers.forEach(ans => {
        valuesXML += `<value>${escapeXML(ans)}</value>`;
    });

    return `<?xml version="1.0" encoding="UTF-8"?>
<assessmentItem xmlns="http://www.imsglobal.org/xsd/imsqti_v2p1"
    xmlns:ns9="http://www.imsglobal.org/xsd/apip/apipv1p0/imsapip_qtiv1p0"
    xmlns:ns8="http://www.w3.org/1999/xlink"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://www.imsglobal.org/xsd/imsqti_v2p1 http://www.imsglobal.org/xsd/qti/qtiv2p1/imsqti_v2p1.xsd"
    identifier="${data.id}" title="" adaptive="false" timeDependent="false">
  <responseDeclaration identifier="RESPONSE" cardinality="single" baseType="string">
    <correctResponse>
      ${valuesXML}
    </correctResponse>
  </responseDeclaration>
  <outcomeDeclaration identifier="SCORE" cardinality="single" baseType="float">
    <defaultValue><value>0</value></defaultValue>
  </outcomeDeclaration>
  <outcomeDeclaration identifier="MAXSCORE" cardinality="single" baseType="float">
    <defaultValue><value>0</value></defaultValue>
  </outcomeDeclaration>
  <itemBody>
    <div>
      <div>${escapeXML(data.question)}</div>
    </div>
    <textEntryInteraction responseIdentifier="RESPONSE"/>
  </itemBody>
</assessmentItem>`;
}

function generateMatchingXML(data) {
    const leftIds = data.pairs.map((p, i) => `L${i}`);
    const rightIds = data.pairs.map((p, i) => `R${i}`);
    
    let sourceChoices = '';
    data.pairs.forEach((p, i) => {
        sourceChoices += `
        <simpleAssociableChoice identifier="${leftIds[i]}" matchMax="1">
            <p>${escapeXML(p.left)}</p>
        </simpleAssociableChoice>`;
    });

    let targetChoices = '';
    data.pairs.forEach((p, i) => {
        targetChoices += `
        <simpleAssociableChoice identifier="${rightIds[i]}" matchMax="1">
            <p>${escapeXML(p.right)}</p>
        </simpleAssociableChoice>`;
    });
    
    let correctResponse = '';
    data.pairs.forEach((p, i) => {
        correctResponse += `<value>${leftIds[i]} ${rightIds[i]}</value> `;
    });

    return `<?xml version="1.0" encoding="UTF-8"?>
<assessmentItem xmlns="http://www.imsglobal.org/xsd/imsqti_v2p1"
    xmlns:ns9="http://www.imsglobal.org/xsd/apip/apipv1p0/imsapip_qtiv1p0"
    xmlns:ns8="http://www.w3.org/1999/xlink"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://www.imsglobal.org/xsd/imsqti_v2p1 http://www.imsglobal.org/xsd/qti/qtiv2p1/imsqti_v2p1.xsd"
    identifier="${data.id}" title="" adaptive="false" timeDependent="false">
  <responseDeclaration identifier="RESPONSE" cardinality="multiple" baseType="directedPair">
    <correctResponse>
      ${correctResponse}
    </correctResponse>
  </responseDeclaration>
  <outcomeDeclaration identifier="SCORE" cardinality="single" baseType="float">
    <defaultValue><value>0</value></defaultValue>
  </outcomeDeclaration>
  <outcomeDeclaration identifier="MAXSCORE" cardinality="single" baseType="float">
    <defaultValue><value>0</value></defaultValue>
  </outcomeDeclaration>
  <itemBody>
    <div>
      <div>${escapeXML(data.question)}</div>
    </div>
    <matchInteraction responseIdentifier="RESPONSE" shuffle="false" maxAssociations="${data.pairs.length}">
      <simpleMatchSet>
        ${sourceChoices}
      </simpleMatchSet>
      <simpleMatchSet>
        ${targetChoices}
      </simpleMatchSet>
    </matchInteraction>
  </itemBody>
</assessmentItem>`;
}

function generateNumericXML(data) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<assessmentItem xmlns="http://www.imsglobal.org/xsd/imsqti_v2p1"
    xmlns:ns9="http://www.imsglobal.org/xsd/apip/apipv1p0/imsapip_qtiv1p0"
    xmlns:ns8="http://www.w3.org/1999/xlink"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://www.imsglobal.org/xsd/imsqti_v2p1 http://www.imsglobal.org/xsd/qti/qtiv2p1/imsqti_v2p1.xsd"
    identifier="${data.id}" title="" adaptive="false" timeDependent="false">
  <responseDeclaration identifier="RESPONSE" cardinality="single" baseType="float">
    <correctResponse>
      <value>${data.answer}</value>
    </correctResponse>
  </responseDeclaration>
  <outcomeDeclaration identifier="SCORE" cardinality="single" baseType="float">
    <defaultValue><value>0</value></defaultValue>
  </outcomeDeclaration>
  <outcomeDeclaration identifier="MAXSCORE" cardinality="single" baseType="float">
    <defaultValue><value>0</value></defaultValue>
  </outcomeDeclaration>
  <itemBody>
    <div>
      <div>${escapeXML(data.question)}</div>
    </div>
    <textEntryInteraction responseIdentifier="RESPONSE"/>
  </itemBody>
</assessmentItem>`;
}

// ============================================================================
// MAIN DOWNLOAD FUNCTION
// ============================================================================

async function downloadQTI() {
    if (typeof JSZip === 'undefined') {
        alert("JSZip library not loaded. Please refresh the page.");
        return;
    }

    const zip = new JSZip();
    const items = [];
    let hasQuestions = false;

    // Helper to process text area
    const processTextArea = (id, parser, generator) => {
        const text = document.getElementById(id)?.value || '';
        if (!text.trim()) return;

        // Split regex depends on type slightly, reusing logic from script.js roughly
        let blocks = [];
        if (id === 'mcqText' || id === 'tfText' || id === 'fibText' || id === 'maText' || id === 'matText' || id === 'numText') {
             blocks = text.split(/\n(?=\d+\.\s+)/).filter(b => b.trim());
             if (blocks.length === 0 && text.trim()) blocks = [text];
        } else if (id === 'essayText') {
             blocks = text.split(/\n(?=\d+\.\s+|[a-z\u0600-\u06FF]\)\s+)/i).filter(b => b.trim());
        }

        blocks.forEach(block => {
            const data = parser(block);
            if (data) {
                const xml = generator(data);
                // Items go in qti21/ folder
                const filename = `item_${data.id}.xml`;
                zip.file(`qti21/${filename}`, xml);
                items.push({ id: data.id, filename: filename });
                hasQuestions = true;
            }
        });
    };

    // Process all types
    processTextArea('mcqText', parseMCQData, generateMCQXML);
    processTextArea('essayText', parseEssayData, generateEssayXML);
    processTextArea('tfText', parseTFData, generateTFXML);
    processTextArea('fibText', parseFIBData, generateFIBXML);
    processTextArea('maText', parseMAData, generateMCQXML); 
    processTextArea('matText', parseMatchingData, generateMatchingXML);
    processTextArea('numText', parseNumericData, generateNumericXML);

    if (!hasQuestions) {
        if (window.showNotification) {
            window.showNotification('No questions to export.', 'error');
        } else {
            alert('No questions to export.');
        }
        return;
    }

    // Generate Question Bank (Assessment Test)
    // Extract test ID from manifest logic (needs to be consistent)
    // Actually, generateAssessmentTestXML needs a test ID.
    // generateManifest calls items. But we need to coordinate the test ID if we want consistency, 
    // although manifest just needs to point to the file.
    
    // Let's generate the test file first
    // We'll peek into generateManifest to see how it handles the test ID
    // Better yet, refactor generateManifest to return the test ID or accept it?
    // Current generateManifest generates a new test ID internally. 
    // Wait, I updated generateManifest above to generate the test ID internally and return the XML.
    // BUT I also need the test XML content itself!
    // The previous implementation of generateManifest returned just the manifest XML string.
    // I need to extract the test generation logic or split it.
    
    // Let's modify the flow slightly:
    // 1. Generate items (done above)
    // 2. Generate Test ID
    const testId = generateUUID();
    const testFilename = `question_bank_${testId}.xml`;
    
    // 3. Generate Test XML
    const testXML = generateAssessmentTestXML(items, testId);
    zip.file(`qti21/${testFilename}`, testXML);
    
    // 4. Generate Manifest (passing test info)
    // I need to update generateManifest to accept testId and testFilename instead of generating them
    const manifestXML = generateManifestWithTest(items, testId, testFilename);
    zip.file('imsmanifest.xml', manifestXML);

    // Generate ZIP
    try {
        const content = await zip.generateAsync({ type: "blob" });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = "blackboard_qti_2_1_export.zip";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        if (window.showNotification) {
            window.showNotification('QTI 2.1 Package downloaded successfully!', 'success');
        }
    } catch (e) {
        console.error(e);
        if (window.showNotification) {
            window.showNotification('Error generating ZIP file.', 'error');
        } else {
            alert('Error generating ZIP file.');
        }
    }
}

function generateManifestWithTest(items, testId, testFilename) {
    const manifestId = generateUUID();
    
    let dependenciesXML = '';
    items.forEach(item => {
        dependenciesXML += `<dependency identifierref="${item.id}"/>`;
    });

    let resourcesXML = '';
    // Add Question Bank Resource (Note: testFilename includes qti21/ prefix if passed that way)
    // In downloadQTI, we pass `question_bank_${testId}.xml`. We need to prepend qti21/ for href.
    
    resourcesXML += `
    <resource identifier="resource-${testId}" type="imsqti_test_xmlv2p1" href="qti21/${testFilename}">
      <file href="qti21/${testFilename}"/>
      ${dependenciesXML}
    </resource>`;

    // Add Item Resources
    items.forEach(item => {
        resourcesXML += `
    <resource identifier="${item.id}" type="imsqti_item_xmlv2p1" href="qti21/${item.filename}">
      <file href="qti21/${item.filename}"/>
    </resource>`;
    });

    return `<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="http://www.imsglobal.org/xsd/imscp_v1p1"
    xmlns:csm="http://www.imsglobal.org/xsd/imsccv1p2/imscsmd_v1p0"
    xmlns:imsmd="http://ltsc.ieee.org/xsd/LOM"
    xmlns:imsqti="http://www.imsglobal.org/xsd/imsqti_metadata_v2p1"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://www.imsglobal.org/xsd/imscp_v1p1 http://www.imsglobal.org/xsd/imscp_v1p2.xsd http://ltsc.ieee.org/xsd/LOM imsmd_loose_v1p3.xsd http://www.imsglobal.org/xsd/imsqti_metadata_v2p1 http://www.imsglobal.org/xsd/qti/qtiv2p1/imsqti_metadata_v2p1.xsd http://www.imsglobal.org/xsd/imsccv1p2/imscsmd_v1p0 http://www.imsglobal.org/profile/cc/ccv1p2/ccv1p2_imscsmd_v1p0.xsd"
    identifier="manifest-${manifestId}">
  <metadata>
    <schema>QTIv2.1</schema>
    <schemaversion>2.0</schemaversion>
  </metadata>
  <organizations/>
  <resources>${resourcesXML}
  </resources>
</manifest>`;
}
// Attach to window
window.downloadQTI = downloadQTI;
