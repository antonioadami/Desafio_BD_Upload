import csvParse from 'csv-parse';
import fs from 'fs';
import path from 'path';

import Transaction from '../models/Transaction';
import CreateTransactionService from './CreateTransactionService';
import uploadConfig from '../config/multer';

interface CSVTransaction {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class ImportTransactionsService {
  async execute(filename: string): Promise<Transaction[]> {
    const createTransactionService = new CreateTransactionService();

    const csvFilePath = path.join(uploadConfig.directory, filename);

    const readCSVStream = fs.createReadStream(csvFilePath);

    const parseStream = csvParse({
      from_line: 2,
      ltrim: true,
      rtrim: true,
    });

    const parseCSV = readCSVStream.pipe(parseStream);

    const transactions: Transaction[] = [];
    const lines: CSVTransaction[] = [];

    parseCSV.on('data', async line => {
      const [title, type, value, category] = line.map((cell: string) => cell);

      if (!title || !type || !value || !category) return;
      lines.push({ title, type, value, category });
    });

    await new Promise(resolve => {
      parseCSV.on('end', resolve);
    });

    const promises = await lines.map(async line => {
      const transaction = await createTransactionService.execute({
        title: line.title,
        type: line.type,
        value: line.value,
        category_title: line.category,
      });

      transactions.push(transaction);
    });

    await Promise.all(promises).then(() => {});

    return transactions;
  }
}

export default ImportTransactionsService;
