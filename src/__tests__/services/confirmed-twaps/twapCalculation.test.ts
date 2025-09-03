import { ConfirmedTWAPsCalculationService } from '@/services/confirmed-twaps/twapCalculationService';
import { ConfirmedTWAPsDatabaseService } from '@/services/confirmed-twaps/databaseService';
import { TWAPState, TWAPWindowType } from '@/shared/types';

// Create a proper mock database service
const createMockDatabaseService = () => ({
  getTWAPState: jest.fn(),
  getFossilBlocks: jest.fn(),
  initialize: jest.fn(),
  saveTWAPState: jest.fn(),
  shutdown: jest.fn(),
});

describe('TWAP Calculation Service', () => {
  let twapService: ConfirmedTWAPsCalculationService;
  let mockDbService: ReturnType<typeof createMockDatabaseService>;

  beforeEach(() => {
    mockDbService = createMockDatabaseService();
    twapService = new ConfirmedTWAPsCalculationService(mockDbService as any);
    jest.clearAllMocks();
  });

  describe('calculateTWAP - Initial Calculation', () => {
    it('should calculate TWAP for new window with blocks', async () => {
      const mockBlocks = [
        { timestamp: 1000, basefee: '1000000000' }, // 1 Gwei
        { timestamp: 1012, basefee: '2000000000' }, // 2 Gwei
        { timestamp: 1024, basefee: '3000000000' }, // 3 Gwei
      ];

      mockDbService.getTWAPState.mockResolvedValue(null);
      mockDbService.getFossilBlocks.mockResolvedValue(mockBlocks);

      const result = await twapService.calculateTWAP(
        'twelve_min' as TWAPWindowType,
        1024,
        24 // 24 seconds duration
      );

      // Expected calculation:
      // Block 1: 1 Gwei * 12s = 12 Gwei-seconds
      // Block 2: 2 Gwei * 12s = 24 Gwei-seconds  
      // Block 3: 3 Gwei * 12s = 36 Gwei-seconds
      // Total: 72 Gwei-seconds / 24s = 3 Gwei
      expect(result.twapValue).toBe(3);
      expect(result.weightedSum).toBe(72);
      expect(result.totalSeconds).toBe(24);
    });

    it('should return zero values when no blocks exist', async () => {
      mockDbService.getTWAPState.mockResolvedValue(null);
      mockDbService.getFossilBlocks.mockResolvedValue([]);

      const result = await twapService.calculateTWAP(
        'twelve_min' as TWAPWindowType,
        1024,
        24
      );

      expect(result.twapValue).toBe(0);
      expect(result.weightedSum).toBe(0);
      expect(result.totalSeconds).toBe(0);
    });
  });

  describe('calculateTWAP - Incremental Calculation', () => {
    it('should combine existing state with new blocks', async () => {
      const existingState: TWAPState = {
        twapValue: 2.5,
        weightedSum: 50,
        totalSeconds: 20,
        lastBlockNumber: 100,
        lastBlockTimestamp: 1000,
      };

      const newBlocks = [
        { timestamp: 1020, basefee: '4000000000' }, // 4 Gwei
        { timestamp: 1032, basefee: '5000000000' }, // 5 Gwei
      ];

      mockDbService.getTWAPState.mockResolvedValue(existingState);
      mockDbService.getFossilBlocks.mockResolvedValue(newBlocks);

      const result = await twapService.calculateTWAP(
        'twelve_min' as TWAPWindowType,
        1032,
        32
      );

      // Existing: 50 Gwei-seconds / 20s = 2.5 Gwei
      // New: 4 Gwei * 12s + 5 Gwei * 12s = 108 Gwei-seconds
      // Total: (50 + 108) / (20 + 24) = 158 / 44 = 3.59...
      expect(result.weightedSum).toBe(158);
      expect(result.totalSeconds).toBe(44);
      expect(result.twapValue).toBeCloseTo(3.59, 2);
    });

    it('should return existing state when no new blocks', async () => {
      const existingState: TWAPState = {
        twapValue: 2.5,
        weightedSum: 50,
        totalSeconds: 20,
        lastBlockNumber: 100,
        lastBlockTimestamp: 1000,
      };

      mockDbService.getTWAPState.mockResolvedValue(existingState);
      mockDbService.getFossilBlocks.mockResolvedValue([]);

      const result = await twapService.calculateTWAP(
        'twelve_min' as TWAPWindowType,
        1032,
        32
      );

      expect(result.twapValue).toBe(2.5);
      expect(result.weightedSum).toBe(50);
      expect(result.totalSeconds).toBe(20);
    });
  });

  describe('updateAllTWAPs', () => {
    it('should update all TWAP windows', async () => {
      const currentTimestamp = 1000000;
      
      mockDbService.getTWAPState.mockResolvedValue(null);
      mockDbService.getFossilBlocks.mockResolvedValue([]);
      mockDbService.saveTWAPState.mockResolvedValue(undefined);

      await twapService.updateAllTWAPs(currentTimestamp);

      // Should call saveTWAPState for each window type
      expect(mockDbService.saveTWAPState).toHaveBeenCalledTimes(3);
      
      // Check that saveTWAPState was called with correct parameters
      expect(mockDbService.saveTWAPState).toHaveBeenCalledWith(
        'twelve_min',
        expect.objectContaining({
          twapValue: 0,
          weightedSum: 0,
          totalSeconds: 0,
          lastBlockNumber: 0,
          lastBlockTimestamp: currentTimestamp,
        })
      );
    });
  });
}); 