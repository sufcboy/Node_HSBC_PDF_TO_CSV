var assert = require('assert');
var statement = require('../statement')

describe('statement', function () {
  describe('#isFilled', function () {
    it('should return false if a property is missing', function () {
      assert.equal(false, statement.isFilled({}))
    })

    it('should return true if all properties are available', function () {
      assert.equal(true, statement.isFilled({ 'date': '', 'type': '', 'narrative': '', 'debit': '', 'credit': '', 'balance': '' }))
    })
  })
})