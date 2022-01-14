exports.extractPdfDataToContent = function (pdfData) {
  let content = {};

  for (let key in pdfData['Pages']) {
    let page = pdfData['Pages'][key];

    for (let key2 in page['Texts']) {
      let textNode = page['Texts'][key2];

      // Create co-ordinate lookup of text
      let yCo = textNode['y'].toPrecision(5);
      let xCo = textNode['x'].toPrecision(5);

      // Initialise the object
      if (typeof content[yCo] !== 'object') {
        content[yCo] = {};
      }

      content[yCo][xCo] = textNode['R'][0]['T'];
    }
  }

  return content;
}