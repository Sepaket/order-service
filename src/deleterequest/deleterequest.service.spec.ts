import { Test, TestingModule } from '@nestjs/testing';
import { DeleterequestService } from './deleterequest.service';

describe('DeleterequestService', () => {
  let service: DeleterequestService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DeleterequestService],
    }).compile();

    service = module.get<DeleterequestService>(DeleterequestService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
