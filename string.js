const TYPE_DATE = 'date';
const TYPE_TRANSACTION = 'transaction';
const TYPE_FLOAT = 'float';
const TYPE_STRING = 'string';
const TRANSACTION_TYPES = [
  'DD',
  'CR',
  'SO',
  'CHQ',
  'TFR',
  'VIS',
  'BP',
  ')))'
];

const partialDateRegExp = new RegExp('[0-9]{2}%20(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)');
const dateRegExp = new RegExp('[0-9]{2}%20(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)%20[0-9]{2}');
const floatRegExp = /^[0-9,]{1,}\.[0-9]{2}$/;

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
  // CC - Statements have only partial date
  if (dateRegExp.test(content) === true || partialDateRegExp.test(content) === true) {
    return TYPE_DATE
  } else if (TRANSACTION_TYPES.indexOf(content) !== -1) {
    return TYPE_TRANSACTION;
  } else if (isFloat(content) === true) {
    return TYPE_FLOAT;
  } else {
    return TYPE_STRING;
  }
}

const cleanContent = function (content) {
  let contentType = getContentType(content);

  switch (contentType) {
    case TYPE_DATE:
      return cleanString(content);

    case TYPE_STRING:
      return cleanString(content);

    case TYPE_FLOAT:
      return convertFloat(content);

    default:
      return content;
  }
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
exports.cleanContent = cleanContent;
