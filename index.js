let fs = require('fs'),
  PDFParser = require("pdf2json");
const string = require('./string');
const pdf = require('./pdf');
const prompt = require("prompt-sync")({ sigint: true });

const pdfRegexp = new RegExp('.pdf');
const enableDebug = true;

function customLog(message) {
  if (enableDebug) {
    console.log(message);
  }
}


const outputMappedContent = function (pagesExtract, mapper, outputFilename) {
  let outputPath = "csv/" + outputFilename;
  let writeStream = fs.createWriteStream(outputPath);

  writeStream.write(Object.keys(mapper).join(',') + "\n");

  // console.log('date,transaction,narrative,debit,credit,balance');

  const pageContent = [];

  Object.keys(pagesExtract).forEach(function (page) {
    let pageExtract = pagesExtract[page];

    pageExtract.forEach(function (row) {
      var rowMapper = {}
      for (let label in mapper) {
        let details = mapper[label];
        let content = string.findContentByLocation(row, details.location);
        rowMapper[label] = content ? content : '';
      }

      let values = Object.values(rowMapper);

      writeStream.write(values.join(',') + "\n");
      pageContent.push(rowMapper);
    })
  })

  // cont output =
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

        // Found the first statement entry
        if (string.getContentType(content) === string.TYPE_TRANSACTION && !foundStatement
        ) {
          foundStatement = true;
          statementContent['transaction'] = content;
        } else if (foundStatement) {
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
    }

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

