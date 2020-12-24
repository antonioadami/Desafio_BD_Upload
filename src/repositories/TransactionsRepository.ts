import { EntityRepository, Repository } from 'typeorm';

import Transaction from '../models/Transaction';

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  public async getBalance(): Promise<Balance> {
    const outcomeTransactions = await this.find({
      where: { type: 'outcome' },
    });

    const incomeTransactions = await this.find({
      where: { type: 'income' },
    });

    let outcome = 0;
    let income = 0;

    outcomeTransactions.forEach(transaction => {
      outcome += transaction.value;
    });

    incomeTransactions.forEach(transaction => {
      income += transaction.value;
    });

    return { income, outcome, total: income - outcome };
  }

  public async findWithCategory(): Promise<Transaction[]> {
    const transactions = await this.find({
      relations: ['category'],
    });

    return transactions.map(trans => {
      delete trans.category_id;
      return trans;
    });
  }
}

export default TransactionsRepository;
