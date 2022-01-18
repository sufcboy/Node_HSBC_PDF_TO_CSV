var assert = require('assert');
const { it } = require('mocha');
var string = require('../string')

describe('string', function () {
  describe('#getContentType()', function () {
    it('should return date type when date string passed', function () {
      assert.equal(string.TYPE_DATE, string.getContentType('18%20Dec%2020'));
    });

    it('should return transaction type when transaction string passed', function () {
      assert.equal(string.TYPE_TRANSACTION, string.getContentType('VIS'))
    })

    it('should return float type when float string passed', function () {
      assert.equal(string.TYPE_FLOAT, string.getContentType('27.30'))
    })

    it('should return float type when string contains encoded comma', function () {
      assert.equal(string.TYPE_FLOAT, string.getContentType('4%2C523.22'))
    })

    it('should return string type for everything else', function () {
      assert.equal(string.TYPE_STRING, string.getContentType('PHH%20ACCOUNTANCY%20LI'))
    })
  });

  describe('#cleanString()', function () {
    it('should replace encoded space with non-encoded', function () {
      assert.equal('My House', string.cleanString('My%20House'))
    })

    it('should replace encoded commas with spaces', function () {
      assert.equal('4,523.22', string.cleanString('4%2C523.22'))
    })

    it('should replace encoded ampersands with &', function () {
      assert.equal('Bradford & Bingley', string.cleanString('Bradford%20%26%20Bingley'))
    })
  })

  describe('#convertFloat()', function () {
    it('should convert a string float to an actual float', function () {
      assert.equal(4523.22, string.convertFloat('4%2C523.22'))
    })
  })

  // describe('#extractCleanDetailsFromText()', function () {
  //   it('should extract and clean raw string to parts', function () {
  //     assert.deepEqual({ date: '18 Dec 20', transaction: 'VIS', narrative: 'AMZNMktplace' }, string.extractCleanDetailsFromText({ '3.081': '18%20Dec%2020', '6.813': 'VIS', '8.519': 'AMZNMktplace' }))
  //   })
  // })

  // describe('#contentHasAllKeys', function () {
  //   it('should return false if not all keys are contained', function () {
  //     assert.equal(false, string.contentHasAllKeys({ date: '18 Dec 20', narrative: 'Hello' }))
  //   })

  //   it('should return true if not all keys are contained', function () {
  //     assert.equal(true, string.contentHasAllKeys({ date: '18 Dec 20', narrative: 'Hello', amount: '112.32', transaction: 'VIS' }))
  //   })
  // })

  // describe('#mergeContentObjects', function () {
  //   it('should return a mutated content combining both objects', function () {
  //     assert.deepEqual(
  //       { date: '18 Dec 20', transaction: 'VIS', narrative: 'AMZNMktplace amazon.co.uk', amount: '13.94' }, string.mergeContentObjects({ date: '18 Dec 20', transaction: 'VIS', narrative: 'AMZNMktplace' }, { narrative: 'amazon.co.uk', amount: '13.94' })
  //     )
  //   })
  // })

  // describe.only('#getContentTypeCoOrdinates', function () {
  //   it('should return mapping for the content types', function () {
  //     assert.deepEqual({
  //       date: '3.081',
  //       transaction: '6.813',
  //       narrative: '8.519',
  //       debit: '22.975',
  //       credit: '27.438',
  //       balance: '32.406'
  //     }, string.getContentTypeCoOrdinates({
  //       '29.649': { '3.081': '18%20Dec%2020', '6.813': 'VIS', '8.519': 'AMZNMktplace' },
  //       '30.361': { '8.519': 'amazon.co.uk', '22.975': '13.94' },
  //       '38.911': {
  //         '3.081': '23%20Dec%2020',
  //         '6.813': 'CR',
  //         '8.519': 'PHH%20ACCOUNTANCY%20LI',
  //         '27.438': '4%2C523.22',
  //         '32.406': '4%2C855.48'
  //       },
  //     }))
  //   })

  //   it('should order the xCo for floats before assigning', function () {
  //     assert.deepEqual({
  //       date: '3.081',
  //       transaction: '6.813',
  //       narrative: '8.519',
  //       debit: '22.975',
  //       debit_with_balance: '23.256',
  //       credit: '27.438',
  //       balance: '32.406'
  //     }, string.getContentTypeCoOrdinates({
  //       '38.199': { '8.519': '08001076285', '23.256': '2.49', '32.837': '332.26' },
  //       '29.649': {
  //         '3.081': '23%20Dec%2020',
  //         '6.813': 'CR',
  //         '8.519': 'PHH%20ACCOUNTANCY%20LI',
  //         '27.438': '4%2C523.22',
  //         '32.406': '4%2C855.48'
  //       },
  //       '30.361': { '8.519': 'amazon.co.uk', '22.975': '13.94' },
  //       '38.911': { '3.081': '18%20Dec%2020', '6.813': 'VIS', '8.519': 'AMZNMktplace' },
  //     }))
  //   })
  // })

  describe('#extractCleanContentForMapper', function () {
    it('should return mapped content to label using mapping', function () {
      assert.deepEqual({
        '3.081': '18 Dec 20',
        '6.813': 'VIS',
        '8.519': 'amazon.co.uk',
        '22.975': '13.94',
        '27.438': '2.99',
        '32.406': '4855.48'
      }, string.extractCleanContentForMapper({ '3.081': '18%20Dec%2020', '6.813': 'VIS', '8.519': 'amazon.co.uk', '22.975': '13.94', '27.438': '2.99', '32.406': '4%2C855.48' }
        , {
          date: {
            location: ['3.081'],
            type: string.TYPE_DATE
          },
          transaction: {
            location: ['6.813'],
            type: string.TYPE_TRANSACTION
          },
          narrative: {
            location: ['8.519'],
            type: string.TYPE_STRING
          },
          debit: {
            location: ['22.975'],
            type: string.TYPE_FLOAT
          },
          credit: {
            location: ['27.438'],
            type: string.TYPE_FLOAT
          },
          balance: {
            location: ['32.406'],
            type: string.TYPE_FLOAT
          }
        }))
    })
  })

  describe.only('#findContentByLocation', function () {
    it('should find the content and return for a details', function () {
      assert.deepEqual(
        'aws.amazon.co'
        ,
        string.findContentByLocation({ '8.4630': 'aws.amazon.co', '22.919': '10.67', '32.350': '1612.42' }, { location: ['8.4630'] })
        // { '8.4630': 'aws.amazon.co', '22.919': '10.67', '32.350': '1612.42' }
      )
    })
  })
});