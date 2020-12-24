import csvParse from 'csv-parse';
import fs from 'fs';
import path from 'path';

import Transaction from '../models/Transaction';
import CreateTransactionService from './CreateTransactionService';
import uploadConfig from '../config/multer';

class ImportTransactionsService {
  async execute(filename: string): Promise<Transaction[]> {
    const createTransactionService = new CreateTransactionService();

    const csvFilePath = path.resolve(uploadConfig.directory, filename);

    const readCSVStream = fs.createReadStream(csvFilePath);

    const parseStream = csvParse({
      from_line: 2,
      ltrim: true,
      rtrim: true,
    });

    const parseCSV = readCSVStream.pipe(parseStream);

    const transactions: Transaction[] = [];
    const lines: [] = [];

    parseCSV.on('data', async line => {
      lines.push(line);
    });

    await new Promise(resolve => {
      parseCSV.on('end', async () => {
        const promises = await lines.map(async line => {
          const transaction = await createTransactionService.execute({
            title: line[0],
            type: line[1],
            value: line[2],
            category_title: line[3],
          });

          transactions.push(transaction);
        });

        return Promise.all(promises).then(() => resolve());
      });
    });

    return transactions;
  }
}

export default ImportTransactionsService;
