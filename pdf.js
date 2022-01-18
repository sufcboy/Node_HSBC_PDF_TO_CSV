function getTextNodesForPage(textNodes) {
  let pageContent = {};

  for (let nodes in textNodes) {
    let textNode = textNodes[nodes];

    // Create co-ordinate lookup of text
    let yCo = textNode['y'].toPrecision(5);
    let xCo = textNode['x'].toPrecision(5);

    // Initialise the object
    if (typeof pageContent[yCo] !== 'object') {
      pageContent[yCo] = {};
    }

    pageContent[yCo][xCo] = textNode['R'][0]['T'];
  }

  return pageContent;
}

exports.extractPdfDataToContent = function (pdfData) {
  let content = [];

  for (let pageKey in pdfData['Pages']) {
    let page = pdfData['Pages'][pageKey];

    content.push(getTextNodesForPage(page['Texts']));
  }

  return content;
}