import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { DeleterequestService } from './deleterequest.service';
import { CreateDeleterequestDto } from './dto/create-deleterequest.dto';
import { UpdateDeleterequestDto } from './dto/update-deleterequest.dto';

@Controller('deleterequest')
export class DeleterequestController {
  constructor(private readonly deleterequestService: DeleterequestService) {}

  @Post()
  create(@Body() createDeleterequestDto: CreateDeleterequestDto) {
    return this.deleterequestService.create(createDeleterequestDto);
  }

  @Get()
  findAll() {
    return this.deleterequestService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.deleterequestService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDeleterequestDto: UpdateDeleterequestDto) {
    return this.deleterequestService.update(+id, updateDeleterequestDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.deleterequestService.remove(+id);
  }
}
