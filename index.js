let fs = require('fs'),
  PDFParser = require("pdf2json");
const string = require('./string');
const pdf = require('./pdf');

const pdfRegexp = new RegExp('.pdf');
const enableDebug = true;

function customLog(message) {
  if (enableDebug) {
    console.log(message);
  }
}

// const debitTypes = ['DD', 'SO'];

// const isDoubleNarrative = function (statementRecords, previousRow, rowsSinceCompleteStatement) {
//   if ((previousRow.length === 2 || previousRow.length === 3) && rowsSinceCompleteStatement === 1) {
//     return true;
//   }

//   return false;
// }


// const inflateBalance = function (currentStatement, previousRecord) {
//   if (false === currentStatement.hasOwnProperty(keyBalance) && currentStatement.hasOwnProperty(keyCredit) && currentStatement.hasOwnProperty(keyDebit) && currentStatement.hasOwnProperty(keyType)) {
//     let newBalance;

//     if (debitTypes.indexOf(currentStatement['type']) !== -1) {
//       newBalance = string.convertFloat(previousRecord[keyBalance]) - string.convertFloat(currentStatement[keyDebit]);
//     } else {
//       newBalance = string.convertFloat(previousRecord[keyBalance]) + string.convertFloat(currentStatement[keyCredit]);
//     }

//     currentStatement[keyBalance] = string.convertFloat(newBalance);
//   }

//   return currentStatement;
// }

// const inflateDebitOrCredit = function (content, currentRecord, previousRecord = {}) {
//   if (currentRecord.hasOwnProperty('balance') && previousRecord.hasOwnProperty('balance')) {
//     if (previousRecord['balance'] < currentRecord['balance']) {
//       currentRecord[keyCredit] = string.convertFloat(content);
//       currentRecord[keyDebit] = 0;
//     } else {
//       currentRecord[keyCredit] = 0;
//       currentRecord[keyDebit] = string.convertFloat(content);
//     }
//   } else {
//     console.log('Unable to determine whether one row is debit or credit');
//     currentRecord[keyCredit] = 'N/A';
//     currentRecord[keyDebit] = 'NA';
//   }

//   return currentRecord;
// }

// const processPdfData = function (pdfData, outputFilename) {
//   let yContent = {};

//   // Each of the pages
//   for (let key in pdfData['Pages']) {
//     let page = pdfData['Pages'][key];

//     for (let key2 in page['Texts']) {
//       let textNode = page['Texts'][key2];

//       if (typeof yContent[textNode['y']] !== 'object') {
//         yContent[textNode['y']] = [];
//       }

//       yContent[textNode['y']].push(textNode['R'][0]['T']);
//     }
//   }

//   let lastDate = '';
//   let foundStatementData = false;
//   let statementRecord = {};
//   let statementRecords = [];
//   let previousRow;
//   let rowsSinceCompleteStatement = 0;

//   // Loop through y content
//   for (let yAxis in yContent) {
//     let rowData = yContent[yAxis];

//     for (let key3 in rowData) {
//       let content = rowData[key3];
//       let contentType = string.getContentType(rowData[key3]);
//       let ignoreFloat = false;

//       // Found a date
//       if (contentType === string.TYPE_DATE) {
//         if (foundStatementData === false) {
//           foundStatementData = true;
//         }

//         statementRecord['date'] = string.cleanString(content);
//         lastDate = string.cleanString(content);

//         // Date might not be set
//       } else if (lastDate !== '' && foundStatementData === true) {
//         statementRecord['date'] = lastDate;
//       }

//       // We aren't in the header
//       if (foundStatementData === true) {
//         // Type of transaction?
//         if (contentType === string.TYPE_TRANSACTION) {
//           statementRecord['type'] = content;
//         }

//         // Narrative
//         if (contentType === string.TYPE_STRING) {
//           if (isDoubleNarrative(statementRecords, previousRow, rowsSinceCompleteStatement)) {
//             statementRecord['narrative'] = cleanString(statementRecord['narrative'] + ' ' + content, ' ');
//           } else {
//             statementRecord['narrative'] = string.cleanString(content);
//           }

//           // Cheques have a numeric value as description
//         } else if (statementRecord.hasOwnProperty('type') && statementRecord['type'] === 'CHQ' && !statementRecord.hasOwnProperty('narrative') && contentType === typeFloat) {
//           statementRecord['narrative'] = cleanString(content, '');
//           ignoreFloat = true;
//         }

//         // Paid our or paid in
//         if (contentType === typeFloat && !ignoreFloat) {
//           // Credit or debit
//           if (false === statementRecord.hasOwnProperty('debit') && false === statementRecord.hasOwnProperty('credit')) {
//             if (debitTypes.indexOf(statementRecord['type']) !== -1) {
//               statementRecord['debit'] = string.convertFloat(content);
//               statementRecord['credit'] = 0.00;
//             } else if (statementRecord['type'] === 'CR') {
//               statementRecord['debit'] = 0.00;
//               statementRecord['credit'] = string.convertFloat(content);
//             } else {
//               let nextKey = parseInt(key3, 10) + 1;

//               // Skip to balance so we can work out whether it a debit or credit
//               if (rowData.hasOwnProperty(nextKey) && true === isFloat(rowData[nextKey])) {
//                 statementRecord['balance'] = string.convertFloat(rowData[nextKey]);
//                 statementRecord = inflateDebitOrCredit(
//                   content,
//                   statementRecord,
//                   statementRecords[statementRecords.length - 1]
//                 );
//               }
//               // See if we have another key
//               // See if it's a float
//               // Assign to balance
//               // rowData[key3]
//             }
//             // Running total
//           } else if (!statementRecord.hasOwnProperty('balance')) {
//             statementRecord['balance'] = string.convertFloat(content)
//           }
//         }
//       }
//     }

//     if (statementRecords.length > 0) {
//       statementRecord = inflateBalance(
//         statementRecord,
//         statementRecords[statementRecords.length - 1]
//       );
//     }

//     if (statementRecordFilled(statementRecord)) {
//       statementRecords.push(statementRecord);
//       // Reset
//       statementRecord = {};
//       lastNarrative = '';
//       rowsSinceCompleteStatement = 0;
//     } else {
//       console.log('Incomplete Statement Record', statementRecord);
//       rowsSinceCompleteStatement++;
//     }

//     previousRow = yContent[yAxis];
//   }

//   let outputPath = "csv/" + outputFilename;
//   let writeStream = fs.createWriteStream(outputPath);

//   writeStream.write(keyDate + ',' + keyType + ',' + keyNarrative + ',' + keyDebit + ',' + keyCredit + ',' + keyBalance + "\n");

//   for (let statementIndex in statementRecords) {
//     let statementRow = statementRecords[statementIndex];

//     writeStream.write(statementRow[keyDate] + ',' + statementRow[keyType] + ',' + statementRow[keyNarrative] + ',' + statementRow[keyDebit] + ',' + statementRow[keyCredit] + ',' + statementRow[keyBalance] + "\n");
//   }

//   writeStream.on('finish', () => {
//     console.log('Created file - ' + outputPath);
//   });
//   writeStream.end();
// }

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
  const mapper = string.getContentTypeCoOrdinates();
  const pagesExtracts = {};
  let pageCount = 1;

  if (!mapper) {
    throw Error('Unable to locate the expected format in the PDFData');
  }

  // Phase 1 - Get mapped data out from content
  for (let pageKey in pageTextNodes) {
    customLog(`Processing page ${pageCount}\n`);

    const pageContent = [];

    for (let yAxis in pageTextNodes[pageKey]) {
      let extractedContent = string.extractCleanContentForMapper(pageTextNodes[pageKey][yAxis], mapper);

      if (Object.keys(extractedContent).length > 0) {
        pageContent.push(extractedContent)
      }
    }

    customLog(`Page has ${pageContent.length} extracts\n`);

    if (pageContent.length > 0) {
      pagesExtracts[pageCount] = pageContent;
    }

    pageCount++;
  }

  outputMappedContent(pagesExtracts, mapper, outputFilename);
}



function getNextCompleteContent(currentY, yLookup, content, extractedContent, mapper) {
  let nextIndex = yLookup.indexOf(currentY) + 1;
  let usedKeys = [currentY, yLookup[nextIndex]];
  let nextExtract = string.extractCleanContentForMapper(content[yLookup[nextIndex]], mapper);
  extractedContent = string.mergeContentObjects(extractedContent, nextExtract);

  // Recurssive until we get all content
  if (!string.contentHasAllKeys(extractedContent)) {
    let [newContent, newKeys] = getNextCompleteContent(yLookup[nextIndex], yLookup, content, extractedContent, mapper)

    extractedContent = newContent;
    usedKeys = usedKeys.concat(newKeys);
  }

  return [extractedContent, usedKeys];
}

// function getStatementRecord(content, yCo, date, yLookup) {
//   const statement = {
//     'date': date,
//     'type': '',
//     'narrative': [],
//     'debit': 0,
//     'credit': 0,
//     'balance': 0
//   }

//   // Loop through current yCo
//   for (let xCo in content[yCo]) {
//     let currentContent = content[yCo][xCo];

//     if (string.getContentType(currentContent) === string.TYPE_TRANSACTION) {
//       statement.type = currentContent;
//     } else if (string.getContentType(currentContent) === string.TYPE_STRING) {
//       statement.narrative.push(string.cleanString(currentContent))
//     }
//   }

//   // Incomplete?
//   if (statement.debit === 0 && statement.credit === 0) {

//   }

//   return statement
// }




// const processDir = function () {
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
// }

