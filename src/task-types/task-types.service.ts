import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaskType } from '../database/entities/task-type.entity';
import { CreateTaskTypeDto } from './dto/create-task-type.dto';
import { UpdateTaskTypeDto } from './dto/update-task-type.dto';
import { FilterTaskTypeDto } from './dto/filter-task-type.dto';

const SORTABLE = ['id', 'typeCode', 'typeName', 'category', 'isActive', 'createdAt'];

@Injectable()
export class TaskTypesService {
  constructor(
    @InjectRepository(TaskType)
    private readonly taskTypeRepo: Repository<TaskType>,
  ) {}

  async findAll(companyId: number, filter: FilterTaskTypeDto) {
    const { page = 1, limit = 20, sort = 'createdAt', order = 'desc', search, category, isActive } = filter;

    const qb = this.taskTypeRepo
      .createQueryBuilder('tt')
      .where('tt.companyId = :companyId', { companyId })
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy(`tt.${SORTABLE.includes(sort) ? sort : 'createdAt'}`, order.toUpperCase() as 'ASC' | 'DESC');

    if (search) qb.andWhere('(tt.typeCode LIKE :s OR tt.typeName LIKE :s)', { s: `%${search}%` });
    if (category) qb.andWhere('tt.category = :category', { category });
    if (isActive !== undefined) qb.andWhere('tt.isActive = :isActive', { isActive });

    const [data, total] = await qb.getManyAndCount();
    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: number, companyId: number): Promise<TaskType> {
    const tt = await this.taskTypeRepo.findOne({ where: { id, companyId } });
    if (!tt) throw new NotFoundException(`Task type #${id} not found`);
    return tt;
  }

  async create(companyId: number, dto: CreateTaskTypeDto): Promise<TaskType> {
    const exists = await this.taskTypeRepo.findOne({ where: { typeCode: dto.typeCode, companyId } });
    if (exists) throw new ConflictException(`Type code '${dto.typeCode}' already exists`);
    return this.taskTypeRepo.save(this.taskTypeRepo.create({ ...dto, companyId }));
  }

  async update(id: number, companyId: number, dto: UpdateTaskTypeDto): Promise<TaskType> {
    const tt = await this.findOne(id, companyId);
    if (dto.typeCode && dto.typeCode !== tt.typeCode) {
      const exists = await this.taskTypeRepo.findOne({ where: { typeCode: dto.typeCode, companyId } });
      if (exists) throw new ConflictException(`Type code '${dto.typeCode}' already exists`);
    }
    Object.assign(tt, dto);
    return this.taskTypeRepo.save(tt);
  }

  async remove(id: number, companyId: number) {
    const tt = await this.findOne(id, companyId);
    tt.isActive = false;
    await this.taskTypeRepo.save(tt);
    return { message: `Task type #${id} deactivated successfully` };
  }
}
