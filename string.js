const TYPE_DATE = 'date';
const TYPE_TRANSACTION = 'transaction';
const TYPE_FLOAT = 'float';
const TYPE_STRING = 'string';
const CONTENT_TYPE_DATE = 'date';
const CONTENT_TYPE_TRANSACTION = 'transaction';
const CONTENT_TYPE_NARRATIVE = 'narrative';
const CONTENT_TYPE_DEBIT = 'debit';
const CONTENT_TYPE_DEBIT_WITH_BALANCE = 'debit_with_balance';
const CONTENT_TYPE_CREDIT = 'credit';
const CONTENT_TYPE_BALANCE = 'balance';

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

// TODO: tidy this
// const requiredKeys = [
//   CONTENT_TYPE_DATE,
//   CONTENT_TYPE_TRANSACTION,
//   CONTENT_TYPE_NARRATIVE
// ];

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

// const extractCleanDetailsFromText = function (rowContent) {
//   let details = {};

//   for (let xCo in rowContent) {
//     let currentContent = rowContent[xCo];
//     let contentType = getContentType(currentContent)

//     switch (contentType) {
//       case TYPE_DATE:
//         details.date = cleanString(currentContent);
//         break;

//       case TYPE_TRANSACTION:
//         details.transaction = currentContent;
//         break;

//       case TYPE_STRING:
//         details.narrative = cleanString(currentContent);
//         break;

//       case TYPE_FLOAT:
//         details.amount = convertFloat(currentContent);
//         break;

//       default:
//         break;
//     }
//   }

//   return details;
// }

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

const extractCleanContentForMapper = function (rowContent, mapper) {
  let returnContent = {};
  let lookup = {};
  let typeLookup = {};

  // TODO: Move this outside of the loop
  // Convert mapper to lookup - xAxix -> label
  for (let label in mapper) {
    let details = mapper[label];

    for (let locationKey in details['location']) {
      let xAxis = details['location'][locationKey];
      lookup[xAxis] = label;
      typeLookup[xAxis] = details['type'];
    }
  }

  for (let xCo in rowContent) {
    const content = rowContent[xCo];
    const hasXAxis = Object.prototype.hasOwnProperty.call(lookup, xCo);

    if (hasXAxis && getContentType(content) === typeLookup[xCo]) {
      returnContent[xCo] = cleanContent(content);
    }
  }

  return returnContent;
}

// const contentHasAllKeys = function (content) {
//   let filled = true;

//   // Must have's
//   requiredKeys.forEach(key => {
//     if (!content.hasOwnProperty(key)) {
//       filled = false
//     }
//   });

//   // Check for the presence of debit or credit
//   if (filled) {
//     filled = content.hasOwnProperty(CONTENT_TYPE_DEBIT) || content.hasOwnProperty(CONTENT_TYPE_DEBIT_WITH_BALANCE) || content.hasOwnProperty(CONTENT_TYPE_CREDIT)
//   }

//   return filled;
// }

// const mergeContentObjects = function (content, content2) {
//   for (const contentType in content2) {
//     if (contentType === 'narrative' && content.hasOwnProperty(contentType)) {
//       content['narrative'] += ` ${content2['narrative']}`
//     } else {
//       content[contentType] = content2[contentType];
//     }
//   }

//   return content;
// }

const findContentByLocation = function (content, location) {
  let found = null;

  for (let xCo in content) {
    if (location.indexOf(xCo) !== -1) {
      found = content[xCo];
      break;
    }
  }

  return found;
}

// TODO: Change name
const getContentTypeCoOrdinates = function () {

  // Hard code it for now
  return {
    [CONTENT_TYPE_DATE]: {
      location: ['3.0810', '3.0250'],
      type: TYPE_DATE
    },
    [CONTENT_TYPE_TRANSACTION]: {
      location: ['6.8130', '6.7560'],
      type: TYPE_TRANSACTION
    },
    [CONTENT_TYPE_NARRATIVE]: {
      location: ['8.5190', '8.4630'],
      type: TYPE_STRING
    },
    [CONTENT_TYPE_DEBIT]: {
      location: ['22.975', '23.256', '22.637', '22.694', '22.919'],
      type: TYPE_FLOAT
    },
    [CONTENT_TYPE_CREDIT]: {
      location: ['27.438'],
      type: TYPE_FLOAT
    },
    [CONTENT_TYPE_BALANCE]: {
      location: ['32.406', '32.350', '32.837'],
      type: TYPE_FLOAT
    }
  };

  const contentTypes = [
    CONTENT_TYPE_DATE,
    CONTENT_TYPE_TRANSACTION,
    CONTENT_TYPE_NARRATIVE,
    CONTENT_TYPE_DEBIT,
    CONTENT_TYPE_DEBIT_WITH_BALANCE,
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

        if (contentType === TYPE_FLOAT && amountXCoordinates.indexOf(xCo) === -1) {
          amountXCoordinates.push(xCo);



          console.log(amountXCoordinates);
          // We should have debit, credit and balance locations
          // if (amountXCoordinates.length === 4) {
          //   amountXCoordinates.sort()
          //   mapper[CONTENT_TYPE_DEBIT] = amountXCoordinates[0];
          //   mapper[CONTENT_TYPE_CREDIT] = amountXCoordinates[1];
          //   mapper[CONTENT_TYPE_DEBIT_WITH_BALANCE] = amountXCoordinates[2]
          //   mapper[CONTENT_TYPE_BALANCE] = amountXCoordinates[3];
          // }
        }
      }
    }

    // Preventing looping through all records
    let hasAllKeys = true;

    for (let requiredKey in contentTypes) {
      if (!mapper.hasOwnProperty(contentTypes[requiredKey])) {
        hasAllKeys = false;
      }
    }

    if (hasAllKeys) {
      return mapper;
    }
  }
}

const determineFloatType = function (statement, content) {

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
// exports.extractCleanDetailsFromText = extractCleanDetailsFromText
// exports.contentHasAllKeys = contentHasAllKeys
// exports.mergeContentObjects = mergeContentObjects
exports.getContentTypeCoOrdinates = getContentTypeCoOrdinates
exports.extractCleanContentForMapper = extractCleanContentForMapper
exports.findContentByLocation = findContentByLocation;
exports.cleanContent = cleanContent;
