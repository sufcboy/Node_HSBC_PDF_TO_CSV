# Node_HSBC_PDF_TO_CSV
Using Node to convert HSBC statements into a CSV file

This project is still in it's infancy so please be patient.

```
npm install
```

Manually update the path to the PDF in index.js

```
pdfParser.loadPDF("PATH_TO_MY_PDF.pdf");
```

run

```
node index.js > output.csv
```

See output.csv