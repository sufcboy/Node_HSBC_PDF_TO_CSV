let fs = require('fs'),
    PDFParser = require("pdf2json");

const pdfRegexp = new RegExp('\.pdf');
const keyDate = 'date';
const keyType = 'type';
const keyNarrative = 'narrative';
const keyDebit = 'debit';
const keyCredit = 'credit';
const keyBalance = 'balance';
const debitTypes = ['DD', 'SO', 'CHQ'];
const typeDate = 'date';
const typeType = 'type';
const typeFloat = 'float';
const typeString = 'string';

const getContentType = function(content) {
    if (isDate(content) === true) {
        return typeDate
    } else if (isType(content) === true) {
        return typeType;
    } else if (isFloat(content) === true) {
        return typeFloat;
    } else {
        return typeString;
    }
}

const isDate = function(string) {
    const regex = new RegExp('[0-9]{2}%20(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)%20[0-9]{2}');

    return regex.test(string);
}

const isType = function(string) {
    const validTypes = [
        'DD',
        'CR',
        'SO',
        'CHQ',
        'TRF'
    ];

    if (validTypes.indexOf(string) === -1) {
        return false;
    }

    return true;
}

const isFloat = function(string) {
    if (typeof string !== 'string') {
        return false;
    }

    let formattedStr = string.replace('%2C', '');
    return !isNaN(formattedStr);
}

const isDoubleNarrative = function(statementRecords, previousRow, rowsSinceCompleteStatement) {
    if ((previousRow.length === 2 || previousRow.length === 3) && rowsSinceCompleteStatement === 1) {
        return true;
    }

    return false;
}

const isEmpty = function(statementRecord) {
    for(var key in statementRecord) {
        if(statementRecord.hasOwnProperty(key)) {
            return false;
        }
    }
    return true;
}

const statementRecordFilled = function(statementRecord) {
    const allKeys = [
        keyDate,
        keyType,
        keyNarrative,
        keyCredit,
        keyDebit,
        keyBalance
    ];

    for (let key in allKeys) {
        let property = allKeys[key];
        if (false === statementRecord.hasOwnProperty(property)) {
            return false;
        }
    }

    return true;
}

const inflateBalance = function(currentStatement, previousRecord) {
    if (false === currentStatement.hasOwnProperty(keyBalance) && currentStatement.hasOwnProperty(keyCredit) && currentStatement.hasOwnProperty(keyDebit) && currentStatement.hasOwnProperty(keyType)) {
        let newBalance;

        if (debitTypes.indexOf(currentStatement['type']) !== -1) {
            newBalance = convertFloat(previousRecord[keyBalance]) - convertFloat(currentStatement[keyDebit]);
        } else {
            newBalance = convertFloat(previousRecord[keyBalance]) + convertFloat(currentStatement[keyCredit]);
        }

        currentStatement[keyBalance] = convertFloat(newBalance);
    }

    return currentStatement;
}

const convertFloat = function(float) {
    if (typeof float === 'string' ) {
        float = cleanString(float, '');
    }

    float = parseFloat(float);

    return float.toFixed(2);
}

const cleanString = function(string, join) {
    string = string.split('%20').join(join);
    string = string.split('%2C').join(join);
    string = string.split('%26').join(join);

    return string;
}

const processPdfData = function(pdfData, outputFilename) {
    let yContent = {};

    // Each of the pages
    for (let key in pdfData['formImage']['Pages']) {
        let page = pdfData['formImage']['Pages'][key];

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
            let contentType = getContentType(rowData[key3]);
            let ignoreFloat = false;

            // Found a date
            if (contentType === typeDate) {
                if (foundStatementData === false) {
                    foundStatementData = true;
                }

                statementRecord['date'] = cleanString(content, ' ');
                lastDate = cleanString(content, ' ');
            // Date might not be set
            } else if (lastDate !== '' && isEmpty(statementRecord) && foundStatementData === true) {
                statementRecord['date'] = lastDate;
            }

            // We aren't in the header
            if (foundStatementData === true) {
                // Type of transaction?
                if (contentType === typeType) {
                    statementRecord['type'] = content;
                }

                // Narrative
                if (contentType === typeString) {
                    if (isDoubleNarrative(statementRecords, previousRow, rowsSinceCompleteStatement)) {
                        statementRecord['narrative'] = cleanString(statementRecord['narrative'] + ' ' + content, ' ');
                    } else {
                        statementRecord['narrative'] = cleanString(content, ' ');
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
                            statementRecord['debit'] = convertFloat(content);
                            statementRecord['credit'] = 0.00;
                        } else {
                            statementRecord['debit'] = 0.00;
                            statementRecord['credit'] = convertFloat(content);
                        }
                    // Running total
                    } else {
                        statementRecord['balance'] = convertFloat(content)
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

fs.readdir('pdf', function(err, items) {
    for (let key in items) {
        let fileName = items[key];

        if (true === pdfRegexp.test(fileName)) {
            let pdfParser = new PDFParser();
            let outputFilename = fileName.replace('.pdf', '.csv');

            pdfParser.on("pdfParser_dataError", errData => console.error(errData.parserError) );
            pdfParser.on("pdfParser_dataReady", pdfData => {
                processPdfData(pdfData, outputFilename);
            });

            pdfParser.loadPDF('pdf/' + fileName);
        }
    }
});