var assert = require('assert');
var pdf = require('../pdf')

const rawPdfExample = {
  Transcoder: 'pdf2json@2.0.0 [https://github.com/modesty/pdf2json]',
  Meta: {
    PDFFormatVersion: '1.4',
    IsAcroFormPresent: false,
    IsXFAPresent: false,
    Title: '',
    Author: '',
    Subject: '',
    Keywords: '',
    Creator: '',
    Producer: 'Actuate Content Services Document Transform - 5.0.00',
    CreationDate: "D:20220109152224GMT00'00'",
    ModDate: "D:20220109152224GMT00'00'",
    Metadata: {}
  },
  Pages: [
    {
      Width: 37.215,
      Height: 52.605,
      HLines: [],
      VLines: [],
      Fills: [],
      Texts: [
        {
          x: 27.269,
          y: 42.574,
          w: 8.046,
          sw: 0.40884375,
          A: 'left',
          R: [{ T: 'Page1', S: -1, TS: [] }],
          oc: undefined
        }
      ],
      Fields: [],
      Boxsets: []
    },
    {
      Width: 37.215,
      Height: 52.605,
      HLines: [],
      VLines: [],
      Fills: [],
      Texts: [
        {
          x: 27.269,
          y: 42.574,
          w: 8.046,
          sw: 0.40884375,
          A: 'left',
          R: [{ T: 'Page2', S: -1, TS: [] }],
          oc: undefined
        }
      ],
      Fields: [],
      Boxsets: []
    },
    {
      Width: 37.215,
      Height: 52.605,
      HLines: [],
      VLines: [],
      Fills: [],
      Texts: [
        {
          x: 27.269,
          y: 42.574,
          w: 8.046,
          sw: 0.40884375,
          A: 'left',
          R: [{ T: 'Page3', S: -1, TS: [] }],
          oc: undefined
        }
      ],
      Fields: [],
      Boxsets: []
    }
  ]
}


describe('#extractPdfDataToContent', function () {
  it('should extact each page to PDF data', function () {
    assert.deepEqual([
      {
        '42.574': {
          '27.269': 'Page1'
        }
      },
      {
        '42.574': {
          '27.269': 'Page2'
        }
      },
      {
        '42.574': {
          '27.269': 'Page3'
        }
      },
    ], pdf.extractPdfDataToContent(rawPdfExample));
  })
})