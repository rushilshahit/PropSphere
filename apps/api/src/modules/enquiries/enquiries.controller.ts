import { Body, Controller, Headers, Post, UsePipes } from '@nestjs/common';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { createEnquirySchema, type CreateEnquiryDto } from './dto/create-enquiry.dto';
import { EnquiriesService } from './enquiries.service';

@Controller('enquiries')
export class EnquiriesController {
  constructor(private readonly enquiriesService: EnquiriesService) {}

  @Post()
  @UsePipes(new ZodValidationPipe(createEnquirySchema))
  create(@Body() dto: CreateEnquiryDto, @Headers('authorization') auth?: string) {
    return this.enquiriesService.create(dto, auth);
  }
}
