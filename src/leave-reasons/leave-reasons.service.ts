import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LeaveReason } from '../database/entities/leave-reason.entity';
import { CreateLeaveReasonDto } from './dto/create-leave-reason.dto';
import { UpdateLeaveReasonDto } from './dto/update-leave-reason.dto';
import { FilterLeaveReasonDto } from './dto/filter-leave-reason.dto';

const SORTABLE = ['id', 'reasonCode', 'reasonName', 'isActive', 'createdAt'];

@Injectable()
export class LeaveReasonsService {
  constructor(
    @InjectRepository(LeaveReason)
    private readonly leaveReasonRepo: Repository<LeaveReason>,
  ) {}

  async findAll(companyId: number, filter: FilterLeaveReasonDto) {
    const { page = 1, limit = 20, sort = 'createdAt', order = 'desc', search, isActive } = filter;

    const qb = this.leaveReasonRepo
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

  async findAllActive(companyId: number): Promise<LeaveReason[]> {
    return this.leaveReasonRepo.find({
      where: { companyId, isActive: true },
      order: { reasonName: 'ASC' },
    });
  }

  async findOne(id: number, companyId: number): Promise<LeaveReason> {
    const lr = await this.leaveReasonRepo.findOne({ where: { id, companyId } });
    if (!lr) throw new NotFoundException(`Leave reason #${id} not found`);
    return lr;
  }

  async create(companyId: number, dto: CreateLeaveReasonDto): Promise<LeaveReason> {
    const exists = await this.leaveReasonRepo.findOne({ where: { reasonCode: dto.reasonCode, companyId } });
    if (exists) throw new ConflictException(`Reason code '${dto.reasonCode}' already exists`);
    return this.leaveReasonRepo.save(this.leaveReasonRepo.create({ ...dto, companyId }));
  }

  async update(id: number, companyId: number, dto: UpdateLeaveReasonDto): Promise<LeaveReason> {
    const lr = await this.findOne(id, companyId);
    if (dto.reasonCode && dto.reasonCode !== lr.reasonCode) {
      const exists = await this.leaveReasonRepo.findOne({ where: { reasonCode: dto.reasonCode, companyId } });
      if (exists) throw new ConflictException(`Reason code '${dto.reasonCode}' already exists`);
    }
    Object.assign(lr, dto);
    return this.leaveReasonRepo.save(lr);
  }

  async remove(id: number, companyId: number) {
    const lr = await this.findOne(id, companyId);
    lr.isActive = false;
    await this.leaveReasonRepo.save(lr);
    return { message: `Leave reason #${id} deactivated successfully` };
  }
}
