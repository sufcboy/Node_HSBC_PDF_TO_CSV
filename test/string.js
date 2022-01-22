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

    it('should return string type when string a id number', function () {
      assert.equal(string.TYPE_STRING, string.getContentType('08001076285'))
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
});