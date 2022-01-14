let fs = require('fs'),
  PDFParser = require("pdf2json");
const string = require('./string');
const statement = require('./statement');
const pdf = require('./pdf');
const { exit } = require('process');

const pdfRegexp = new RegExp('\.pdf');
const debitTypes = ['DD', 'SO'];

const isDoubleNarrative = function (statementRecords, previousRow, rowsSinceCompleteStatement) {
  if ((previousRow.length === 2 || previousRow.length === 3) && rowsSinceCompleteStatement === 1) {
    return true;
  }

  return false;
}

// THIS IS CRAZY! WILL ALWAYS RETURN TRUE
// const isEmpty = function (statementRecord) {
//   for (var key in statementRecord) {
//     if (statementRecord.hasOwnProperty(key)) {
//       return false;
//     }
//   }
//   return true;
// }

const inflateBalance = function (currentStatement, previousRecord) {
  if (false === currentStatement.hasOwnProperty(keyBalance) && currentStatement.hasOwnProperty(keyCredit) && currentStatement.hasOwnProperty(keyDebit) && currentStatement.hasOwnProperty(keyType)) {
    let newBalance;

    if (debitTypes.indexOf(currentStatement['type']) !== -1) {
      newBalance = string.convertFloat(previousRecord[keyBalance]) - string.convertFloat(currentStatement[keyDebit]);
    } else {
      newBalance = string.convertFloat(previousRecord[keyBalance]) + string.convertFloat(currentStatement[keyCredit]);
    }

    currentStatement[keyBalance] = string.convertFloat(newBalance);
  }

  return currentStatement;
}

const inflateDebitOrCredit = function (content, currentRecord, previousRecord = {}) {
  if (currentRecord.hasOwnProperty('balance') && previousRecord.hasOwnProperty('balance')) {
    if (previousRecord['balance'] < currentRecord['balance']) {
      currentRecord[keyCredit] = string.convertFloat(content);
      currentRecord[keyDebit] = 0;
    } else {
      currentRecord[keyCredit] = 0;
      currentRecord[keyDebit] = string.convertFloat(content);
    }
  } else {
    console.log('Unable to determine whether one row is debit or credit');
    currentRecord[keyCredit] = 'N/A';
    currentRecord[keyDebit] = 'NA';
  }

  return currentRecord;
}

const processPdfData = function (pdfData, outputFilename) {
  let yContent = {};

  // Each of the pages
  for (let key in pdfData['Pages']) {
    let page = pdfData['Pages'][key];

    for (let key2 in page['Texts']) {
      let textNode = page['Texts'][key2];

      if (typeof yContent[textNode['y']] !== 'object') {
        yContent[textNode['y']] = [];
      }

      yContent[textNode['y']].push(textNode['R'][0]['T']);
    }
  }

  let lastDate = '';
  let foundStatementData = false;
  let statementRecord = {};
  let statementRecords = [];
  let previousRow;
  let rowsSinceCompleteStatement = 0;

  // Loop through y content
  for (let yAxis in yContent) {
    let rowData = yContent[yAxis];

    for (let key3 in rowData) {
      let content = rowData[key3];
      let contentType = string.getContentType(rowData[key3]);
      let ignoreFloat = false;

      // Found a date
      if (contentType === string.TYPE_DATE) {
        if (foundStatementData === false) {
          foundStatementData = true;
        }

        statementRecord['date'] = string.cleanString(content);
        lastDate = string.cleanString(content);

        // Date might not be set
      } else if (lastDate !== '' && foundStatementData === true) {
        statementRecord['date'] = lastDate;
      }

      // We aren't in the header
      if (foundStatementData === true) {
        // Type of transaction?
        if (contentType === string.TYPE_TRANSACTION) {
          statementRecord['type'] = content;
        }

        // Narrative
        if (contentType === string.TYPE_STRING) {
          if (isDoubleNarrative(statementRecords, previousRow, rowsSinceCompleteStatement)) {
            statementRecord['narrative'] = cleanString(statementRecord['narrative'] + ' ' + content, ' ');
          } else {
            statementRecord['narrative'] = string.cleanString(content);
          }

          // Cheques have a numeric value as description
        } else if (statementRecord.hasOwnProperty('type') && statementRecord['type'] === 'CHQ' && !statementRecord.hasOwnProperty('narrative') && contentType === typeFloat) {
          statementRecord['narrative'] = cleanString(content, '');
          ignoreFloat = true;
        }

        // Paid our or paid in
        if (contentType === typeFloat && !ignoreFloat) {
          // Credit or debit
          if (false === statementRecord.hasOwnProperty('debit') && false === statementRecord.hasOwnProperty('credit')) {
            if (debitTypes.indexOf(statementRecord['type']) !== -1) {
              statementRecord['debit'] = string.convertFloat(content);
              statementRecord['credit'] = 0.00;
            } else if (statementRecord['type'] === 'CR') {
              statementRecord['debit'] = 0.00;
              statementRecord['credit'] = string.convertFloat(content);
            } else {
              let nextKey = parseInt(key3, 10) + 1;

              // Skip to balance so we can work out whether it a debit or credit
              if (rowData.hasOwnProperty(nextKey) && true === isFloat(rowData[nextKey])) {
                statementRecord['balance'] = string.convertFloat(rowData[nextKey]);
                statementRecord = inflateDebitOrCredit(
                  content,
                  statementRecord,
                  statementRecords[statementRecords.length - 1]
                );
              }
              // See if we have another key
              // See if it's a float
              // Assign to balance
              // rowData[key3]
            }
            // Running total
          } else if (!statementRecord.hasOwnProperty('balance')) {
            statementRecord['balance'] = string.convertFloat(content)
          }
        }
      }
    }

    if (statementRecords.length > 0) {
      statementRecord = inflateBalance(
        statementRecord,
        statementRecords[statementRecords.length - 1]
      );
    }

    if (statementRecordFilled(statementRecord)) {
      statementRecords.push(statementRecord);
      // Reset
      statementRecord = {};
      lastNarrative = '';
      rowsSinceCompleteStatement = 0;
    } else {
      console.log('Incomplete Statement Record', statementRecord);
      rowsSinceCompleteStatement++;
    }

    previousRow = yContent[yAxis];
  }

  let outputPath = "csv/" + outputFilename;
  let writeStream = fs.createWriteStream(outputPath);

  writeStream.write(keyDate + ',' + keyType + ',' + keyNarrative + ',' + keyDebit + ',' + keyCredit + ',' + keyBalance + "\n");

  for (let statementIndex in statementRecords) {
    let statementRow = statementRecords[statementIndex];

    writeStream.write(statementRow[keyDate] + ',' + statementRow[keyType] + ',' + statementRow[keyNarrative] + ',' + statementRow[keyDebit] + ',' + statementRow[keyCredit] + ',' + statementRow[keyBalance] + "\n");
  }

  writeStream.on('finish', () => {
    console.log('Created file - ' + outputPath);
  });
  writeStream.end();
}

const processPdfData2 = function (pdfData, outputFilename) {
  // console.log(pdfData);
  // let content = {};
  // let yLookup = []
  let processedkeys = []
  const content = pdf.extractPdfDataToContent(pdfData);
  const yLookup = Object.keys(content)

  // return console.log(yLookup);

  const transactions = []
  let foundTransactions = false;
  let currentDate = '';

  // Get mapper
  for (let yCoOrdinate in content) {
    let extractedContent = string.extractCleanDetailsFromText(content[yCoOrdinate]);

    if (extractedContent.hasOwnProperty('date')) {

    }

  }

  return
  for (let yCoOrdinate in content) {

    // Add skip here id y processed
    if (processedkeys.indexOf(yCoOrdinate) !== -1) {
      continue;
    }

    // Get X co-ordinates for each of the headings


    let extractedContent = string.extractCleanDetailsFromText(content[yCoOrdinate]);
    // console.log(extractedContent);

    if (transactions.length === 3) {
      continue;
    }

    // We have something of interest
    if (extractedContent.hasOwnProperty('date') || foundTransactions) {
      if (!foundTransactions) {
        foundTransactions = true;
      }

      if (extractedContent.hasOwnProperty('date')) {
        currentDate = extractedContent['date'];
      } else {
        // The date is only defined for the 1st transaction of the day
        extractedContent['date'] = currentDate;
      }

      // Do we have all of the fields required
      if (string.contentHasAllKeys(extractedContent)) {
        transactions.push(extractedContent);
        processedkeys.push(yCoOrdinate)

        // Nope, lets find the next row via the lookup
      } else {
        results = getNextCompleteContent(yCoOrdinate, yLookup, content, extractedContent)
        console.log(results);
        extractedContent = results[0];
        processedkeys = results[1];

        transactions.push(extractedContent)
      }
    }
  }

  console.log(transactions);
}

function getNextCompleteContent(currentY, yLookup, content, extractedContent) {
  let nextIndex = yLookup.indexOf(currentY) + 1;
  let usedKeys = [currentY, yLookup[nextIndex]];
  let nextExtract = string.extractCleanDetailsFromText(content[yLookup[nextIndex]]);
  extractedContent = string.mergeContentObjects(extractedContent, nextExtract);

  // Recurssive until we get all content
  if (!string.contentHasAllKeys(extractedContent)) {
    let [newContent, newKeys] = getNextCompleteContent(yLookup[nextIndex], yLookup, content, extractedContent)

    extractedContent = newContent;
    usedKeys = usedKeys.concat(newKeys);
  }

  return [extractedContent, usedKeys];
}

function getStatementRecord(content, yCo, date, yLookup) {
  const statement = {
    'date': date,
    'type': '',
    'narrative': [],
    'debit': 0,
    'credit': 0,
    'balance': 0
  }

  // Loop through current yCo
  for (let xCo in content[yCo]) {
    let currentContent = content[yCo][xCo];

    if (string.getContentType(currentContent) === string.TYPE_TRANSACTION) {
      statement.type = currentContent;
    } else if (string.getContentType(currentContent) === string.TYPE_STRING) {
      statement.narrative.push(string.cleanString(currentContent))
    }
  }

  // Incomplete?
  if (statement.debit === 0 && statement.credit === 0) {

  }




  return statement
}




// const processDir = function () {
fs.readdir('pdf', function (err, items) {
  for (let key in items) {
    let fileName = items[key];

    if (true === pdfRegexp.test(fileName)) {
      let pdfParser = new PDFParser();
      let outputFilename = fileName.replace('.pdf', '.csv');

      pdfParser.on("pdfParser_dataError", errData => console.error(errData.parserError));
      pdfParser.on("pdfParser_dataReady", pdfData => {
        // processPdfData(pdfData, outputFilename);
        processPdfData2(pdfData, outputFilename);
      });

      pdfParser.loadPDF('pdf/' + fileName);
    }
  }
});
// }

