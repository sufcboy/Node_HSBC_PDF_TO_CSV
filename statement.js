
const keyDate = 'date';
const keyType = 'type';
const keyNarrative = 'narrative';
const keyDebit = 'debit';
const keyCredit = 'credit';
const keyBalance = 'balance';

exports.isFilled = function (statementRecord) {
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

exports.keyDate = keyDate
exports.keyType = keyType
exports.keyNarrative = keyNarrative
exports.keyDebit = keyDebit
exports.keyCredit = keyCredit
exports.keyBalance = keyBalance
