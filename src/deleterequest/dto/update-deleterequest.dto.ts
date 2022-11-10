import { PartialType } from '@nestjs/mapped-types';
import { CreateDeleterequestDto } from './create-deleterequest.dto';

export class UpdateDeleterequestDto extends PartialType(CreateDeleterequestDto) {}
