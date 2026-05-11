import { Module } from '@nestjs/common';
import { SupabaseService } from '../../database/supabase.service';
import { SchoolsController } from './schools.controller';
import { SchoolsService } from './schools.service';

@Module({
  controllers: [SchoolsController],
  providers: [SchoolsService, SupabaseService],
})
export class SchoolsModule {}
