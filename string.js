const TYPE_DATE = 'date';
const TYPE_TRANSACTION = 'transaction';
const TYPE_FLOAT = 'float';
const TYPE_STRING = 'string';
const CONTENT_TYPE_DATE = 'date';
const CONTENT_TYPE_TRANSACTION = 'transaction';
const CONTENT_TYPE_NARRATIVE = 'narrative';
const CONTENT_TYPE_AMOUNT = 'amount';
const CONTENT_TYPE_DEBIT = 'debit';
const CONTENT_TYPE_CREDIT = 'credit';
const CONTENT_TYPE_BALANCE = 'balance';

const TRANSACTION_TYPES = [
  'DD',
  'CR',
  'SO',
  'CHQ',
  'TFR',
  'VIS'
];

// TODO: tidy this
const requiredKeys = [TYPE_DATE, TYPE_TRANSACTION, CONTENT_TYPE_NARRATIVE, CONTENT_TYPE_AMOUNT];

const dateRegExp = new RegExp('[0-9]{2}%20(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)%20[0-9]{2}');
const floatRegExp = new RegExp('^[0-9,]{1,}\.[0-9]{2}$');

const cleanString = function (string) {
  // spaces, commas and ampersands
  string = string.split('%20').join(' ');
  string = string.split('%2C').join(',');
  string = string.split('%26').join('&');

  return string;
}

const convertFloat = function (float) {
  if (typeof float === 'string') {
    float = cleanString(float).replace(',', '');
  }

  return parseFloat(float).toFixed(2);
}

const isFloat = function (string) {
  return floatRegExp.test(cleanString(string));
}

const getContentType = function (content) {
  if (dateRegExp.test(content) === true) {
    return TYPE_DATE
  } else if (TRANSACTION_TYPES.indexOf(content) !== -1) {
    return TYPE_TRANSACTION;
  } else if (isFloat(content) === true) {
    return TYPE_FLOAT;
  } else {
    return TYPE_STRING;
  }
}

const extractCleanDetailsFromText = function (rowContent) {
  let details = {};

  for (let xCo in rowContent) {
    let currentContent = rowContent[xCo];
    let contentType = getContentType(currentContent)

    switch (contentType) {
      case TYPE_DATE:
        details.date = cleanString(currentContent);
        break;

      case TYPE_TRANSACTION:
        details.transaction = currentContent;
        break;

      case TYPE_STRING:
        details.narrative = cleanString(currentContent);
        break;

      case TYPE_FLOAT:
        details.amount = convertFloat(currentContent);
        break;

      default:
        break;
    }
  }

  return details;
}

const contentHasAllKeys = function (content) {
  let filled = true;

  requiredKeys.forEach(key => {
    if (!content.hasOwnProperty(key)) {
      filled = false
    }
  });

  return filled;
}

const mergeContentObjects = function (content, content2) {
  for (const contentType in content2) {
    if (contentType === 'narrative' && content.hasOwnProperty(contentType)) {
      content['narrative'] += ` ${content2['narrative']}`
    } else {
      content[contentType] = content2[contentType];
    }
  }

  return content;
}

//
const getContentTypeCoOrdinates = function (content) {
  const contentTypes = [
    CONTENT_TYPE_DATE,
    CONTENT_TYPE_TRANSACTION,
    CONTENT_TYPE_NARRATIVE,
    CONTENT_TYPE_DEBIT,
    CONTENT_TYPE_CREDIT,
    CONTENT_TYPE_BALANCE
  ];
  let mapper = {};
  let beginMapping = false;
  let amountXCoordinates = [];

  for (let yCoOrdinate in content) {
    let rowContent = content[yCoOrdinate];

    for (let xCo in rowContent) {
      let currentContent = rowContent[xCo];
      let contentType = getContentType(currentContent)

      if (contentType === TYPE_DATE || beginMapping) {
        beginMapping = true;

        if (!mapper.hasOwnProperty(CONTENT_TYPE_DATE) && contentType === TYPE_DATE) {
          mapper[CONTENT_TYPE_DATE] = xCo;
        }

        if (!mapper.hasOwnProperty(CONTENT_TYPE_TRANSACTION) && contentType === TYPE_TRANSACTION) {
          mapper[CONTENT_TYPE_TRANSACTION] = xCo;
        }

        if (!mapper.hasOwnProperty(CONTENT_TYPE_NARRATIVE) && contentType === TYPE_STRING) {
          mapper[CONTENT_TYPE_NARRATIVE] = xCo;
        }

        if (contentType === TYPE_FLOAT) {
          amountXCoordinates.push(xCo);

          // We should have debit, credit and balance locations
          if (amountXCoordinates.length === 3) {
            mapper[CONTENT_TYPE_DEBIT] = amountXCoordinates[0];
            mapper[CONTENT_TYPE_CREDIT] = amountXCoordinates[1];
            mapper[CONTENT_TYPE_BALANCE] = amountXCoordinates[2];
          }
        }
      }
    }
  }

  return mapper;
}

// Constants
exports.TYPE_DATE = TYPE_DATE
exports.TYPE_TRANSACTION = TYPE_TRANSACTION
exports.TYPE_FLOAT = TYPE_FLOAT
exports.TYPE_STRING = TYPE_STRING

// Functions
exports.cleanString = cleanString
exports.convertFloat = convertFloat
exports.getContentType = getContentType
exports.extractCleanDetailsFromText = extractCleanDetailsFromText
exports.contentHasAllKeys = contentHasAllKeys
exports.mergeContentObjects = mergeContentObjects
exports.getContentTypeCoOrdinates = getContentTypeCoOrdinates
