# Node_HSBC_PDF_TO_CSV
Using Node to convert HSBC statements into a CSV file.

HSBC are still refusing to provide statements in a CSV format. In the meantime, you could use this approach to at least extract this data.


## Installation

```
npm install
```

## How to run

1. Place the PDF into the /pdf directory
2. Open the PDF and make a note of the date of the 1st transaction
3. Run the following:
```
node index.js
```
4. You'll be prompted for the statement type (credit card or other)
5. Next you'll be asked for the date of the first statement entry
6. The process is a bit cumbersome, but you'll be asked to identify the float value of the record (is it a debit, credit or balance)
7. Then you'll be asked if the transaction entry is complete (you can also ignore entries or skip to the next page)
8. This process is repeated for each page of the PDF
9. Check the csv directory for the resultant file

## Up next

My hope is that HSBC eventually catch up but I'll try and keep making incremental changes. I had hoped to fully automate this but the formats of the PDF I found very inconsistent. This prompt approach is cumbersome but feels slightly less effort than copying and pasting and organising the PDF.