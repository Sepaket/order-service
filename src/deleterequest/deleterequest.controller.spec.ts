import { Test, TestingModule } from '@nestjs/testing';
import { DeleterequestController } from './deleterequest.controller';
import { DeleterequestService } from './deleterequest.service';

describe('DeleterequestController', () => {
  let controller: DeleterequestController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DeleterequestController],
      providers: [DeleterequestService],
    }).compile();

    controller = module.get<DeleterequestController>(DeleterequestController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
