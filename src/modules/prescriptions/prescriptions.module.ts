import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PrescriptionsController } from './prescriptions.controller';
import { PrescriptionsService } from './prescriptions.service';
import { PrescriptionsRepository } from './prescriptions.repository';
import { PrescriptionEntity, PrescriptionItemEntity } from './entities/prescription.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PrescriptionEntity, PrescriptionItemEntity])],
  controllers: [PrescriptionsController],
  providers: [PrescriptionsService, PrescriptionsRepository],
  exports: [PrescriptionsService],
})
export class PrescriptionsModule {}
