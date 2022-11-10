import { Module } from '@nestjs/common';
import { DeleterequestService } from './deleterequest.service';
import { DeleterequestController } from './deleterequest.controller';

@Module({
  controllers: [DeleterequestController],
  providers: [DeleterequestService]
})
export class DeleterequestModule {}
