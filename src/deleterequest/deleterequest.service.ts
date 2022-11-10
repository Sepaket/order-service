import { Injectable } from '@nestjs/common';
import { CreateDeleterequestDto } from './dto/create-deleterequest.dto';
import { UpdateDeleterequestDto } from './dto/update-deleterequest.dto';

@Injectable()
export class DeleterequestService {
  create(createDeleterequestDto: CreateDeleterequestDto) {
    return 'This action adds a new deleterequest';
  }

  findAll() {
    return `This action returns all deleterequest`;
  }

  findOne(id: number) {
    return `This action returns a #${id} deleterequest`;
  }

  update(id: number, updateDeleterequestDto: UpdateDeleterequestDto) {
    return `This action updates a #${id} deleterequest`;
  }

  remove(id: number) {
    return `This action removes a #${id} deleterequest`;
  }
}
