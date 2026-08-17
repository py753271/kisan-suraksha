import db from '../config/database.config';

export class BaseRepository<T> {
  protected modelName: string;

  constructor(modelName: string) {
    this.modelName = modelName;
  }

  protected get model(): any {
    return (db as any)[this.modelName];
  }

  async findById(id: string): Promise<T | null> {
    return this.model.findUnique({
      where: { id },
    });
  }

  async findMany(args: any = {}): Promise<T[]> {
    return this.model.findMany(args);
  }

  async create(data: any): Promise<T> {
    return this.model.create({ data });
  }

  async update(id: string, data: any): Promise<T> {
    return this.model.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<T> {
    return this.model.delete({
      where: { id },
    });
  }
}
export default BaseRepository;
