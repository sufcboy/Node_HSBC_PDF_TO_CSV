let fs = require('fs'),
  PDFParser = require("pdf2json");
const string = require('./string');
const pdf = require('./pdf');
const prompt = require("prompt-sync")({ sigint: true });

const pdfRegexp = new RegExp('.pdf');
const enableDebug = true;
const statementType = getStatementType();
const firstEntryDate = getDateOfFirstEntry();

function getStatementType() {
  return prompt('What type of statement is this (credit (c) or other (o))?')
}

function getDateOfFirstEntry() {
  return prompt('What is the first transaction date (dd mmm)?')
}

function customLog(message) {
  if (enableDebug) {
    console.log(message);
  }
}

function isThisTheFirstTransactionDate(content) {
  if (string.getContentType(content) !== string.TYPE_DATE) {
    return false;
  }

  const clean = string.cleanString(content)

  // Credit card
  // 21 Dec
  if (statementType === 'c') {
    if (clean.toLowerCase() === firstEntryDate.toLowerCase()) {
      return true
    }
    // 21 Dec 20
  } else {
    const dateParts = clean.explode(' ');

    if (`${dateParts[0]} ${dateParts[1]}`.toLowerCase() === firstEntryDate.toLowerCase()) {
      return true;
    }
  }

  return false;
}

const processPdfData = function (pdfData, outputFilename) {
  // Get the page content
  const pageTextNodes = pdf.extractPdfDataToContent(pdfData);

  // const pagesExtracts = {};
  let pageCount = 1;
  let statements = [];

  // Phase 1 - Get mapped data out from content
  for (let pageKey in pageTextNodes) {
    customLog(`Processing page ${pageCount}\n`);

    let statementContent = {};
    let skipCurrentPage = false
    let foundStatement = false;

    for (let yAxis in pageTextNodes[pageKey]) {
      const rowContent = pageTextNodes[pageKey][yAxis];

      if (skipCurrentPage) {
        continue;
      }

      // Check if statement content is complete
      if (foundStatement) {
        console.log(statementContent);
        const complete = prompt(`Is this statement record complete (y/n) or ignore (i) or skip to next page (p)?`);

        if (complete === 'y' || complete === 'i' || complete == 'p') {
          if (complete === 'y') {
            statements.push(statementContent);
          }

          if (complete === 'p') {
            skipCurrentPage = true;
          }

          statementContent = {}
        }
      }

      for (let xAxis in rowContent) {
        const content = rowContent[xAxis];

        if (!foundStatement) {
          foundStatement = isThisTheFirstTransactionDate(content);

          if (!foundStatement) {
            continue;
          }
        }

        // Found the first statement entry
        const contentType = string.getContentType(content);
        const cleanContent = string.cleanContent(content);

        switch (contentType) {
          case string.TYPE_TRANSACTION:
            statementContent['transaction'] = cleanContent;
            break;
          case string.TYPE_DATE:
            statementContent['date'] = cleanContent;
            break;
          case string.TYPE_FLOAT:
            statementContent = setFloatContent(statementContent, cleanContent);
            break;

          case string.TYPE_STRING:
            statementContent['narrative'] = Object.prototype.hasOwnProperty.call(statementContent, 'narrative') ? `${statementContent['narrative']} ${cleanContent}` : cleanContent;
            break
          default:
            break;
        }
      }
    }

    pageCount++;

    if (statements.length > 0) {
      console.log('statements', statements);
    }

  }

  writeToCSV(statements, outputFilename);
}

const writeToCSV = function (statements, outputFilename) {
  let outputPath = "csv/" + outputFilename;
  let writeStream = fs.createWriteStream(outputPath);

  const headers = ['date', 'transaction', 'narrative', 'debit', 'credit', 'balance']

  writeStream.write(headers.join(',') + "\n");

  statements.forEach(function (statement) {
    let rowContent = [];
    for (let headerKey in headers) {
      let header = headers[headerKey];

      // TODO - Escape the content
      if (Object.prototype.hasOwnProperty.call(statement, header)) {
        rowContent.push(statement[header])
      } else {
        rowContent.push('')
      }
    }

    writeStream.write(rowContent.join(',') + "\n");
  })
}

const setFloatContent = function (currentStatement, value) {

  const floatId = Object.prototype.hasOwnProperty.call(currentStatement, 'narrative') ? `${currentStatement['narrative']} - ${value}` : value;
  const type = prompt(`Is this value ${floatId} a debit/credit/balance? (d/c/b)`);

  if (type === 'd') {
    currentStatement['debit'] = value;
  } else if (type === 'c') {
    currentStatement['credit'] = value;
  } else if (type === 'b') {
    currentStatement['balance'] = value;
  }

  return currentStatement;
}

fs.readdir('pdf', function (err, items) {
  for (let key in items) {
    let fileName = items[key];

    if (true === pdfRegexp.test(fileName)) {
      let pdfParser = new PDFParser();
      let outputFilename = fileName.replace('.pdf', '.csv');

      pdfParser.on("pdfParser_dataError", errData => console.error(errData.parserError));
      pdfParser.on("pdfParser_dataReady", pdfData => {
        processPdfData(pdfData, outputFilename);
      });

      pdfParser.loadPDF('pdf/' + fileName);
    }
  }
});

