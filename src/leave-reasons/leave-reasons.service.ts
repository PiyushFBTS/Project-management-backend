import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LeaveType } from '../database/entities/leave-reason.entity';
import { CreateLeaveTypeDto } from './dto/create-leave-reason.dto';
import { UpdateLeaveTypeDto } from './dto/update-leave-reason.dto';
import { FilterLeaveTypeDto } from './dto/filter-leave-reason.dto';

const SORTABLE = ['id', 'reasonCode', 'reasonName', 'isActive', 'createdAt'];

@Injectable()
export class LeaveTypesService {
  constructor(
    @InjectRepository(LeaveType)
    private readonly leaveTypeRepo: Repository<LeaveType>,
  ) {}

  async findAll(companyId: number, filter: FilterLeaveTypeDto) {
    const { page = 1, limit = 20, sort = 'createdAt', order = 'desc', search, isActive } = filter;

    const qb = this.leaveTypeRepo
      .createQueryBuilder('lr')
      .where('lr.companyId = :companyId', { companyId })
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy(`lr.${SORTABLE.includes(sort) ? sort : 'createdAt'}`, order.toUpperCase() as 'ASC' | 'DESC');

    if (search) qb.andWhere('(lr.reasonCode LIKE :s OR lr.reasonName LIKE :s)', { s: `%${search}%` });
    if (isActive !== undefined) qb.andWhere('lr.isActive = :isActive', { isActive });

    const [data, total] = await qb.getManyAndCount();
    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findAllActive(companyId: number): Promise<LeaveType[]> {
    return this.leaveTypeRepo.find({
      where: { companyId, isActive: true },
      order: { reasonName: 'ASC' },
    });
  }

  async findOne(id: number, companyId: number): Promise<LeaveType> {
    const lr = await this.leaveTypeRepo.findOne({ where: { id, companyId } });
    if (!lr) throw new NotFoundException(`Leave type #${id} not found`);
    return lr;
  }

  async create(companyId: number, dto: CreateLeaveTypeDto): Promise<LeaveType> {
    const exists = await this.leaveTypeRepo.findOne({ where: { reasonCode: dto.reasonCode, companyId } });
    if (exists) throw new ConflictException(`Reason code '${dto.reasonCode}' already exists`);
    return this.leaveTypeRepo.save(this.leaveTypeRepo.create({ ...dto, companyId }));
  }

  async update(id: number, companyId: number, dto: UpdateLeaveTypeDto): Promise<LeaveType> {
    const lr = await this.findOne(id, companyId);
    if (dto.reasonCode && dto.reasonCode !== lr.reasonCode) {
      const exists = await this.leaveTypeRepo.findOne({ where: { reasonCode: dto.reasonCode, companyId } });
      if (exists) throw new ConflictException(`Reason code '${dto.reasonCode}' already exists`);
    }
    Object.assign(lr, dto);
    return this.leaveTypeRepo.save(lr);
  }

  async remove(id: number, companyId: number) {
    const lr = await this.findOne(id, companyId);
    lr.isActive = false;
    await this.leaveTypeRepo.save(lr);
    return { message: `Leave type #${id} deactivated successfully` };
  }
}
