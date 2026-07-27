import { portfolioApplicationService } from './PortfolioApplicationService';
import { familyRepository } from '../../repositories/SQLiteFamilyRepository';
import { familyMemberRepository } from '../../repositories/SQLiteFamilyMemberRepository';
import { DashboardOverviewResponseDTO } from '../../dto/PortfolioDTOs';
import { DTOMapper } from '../../mappers/DTOMapper';
import { NotFoundError } from '../../errors/AppError';

export class DashboardApplicationService {
  public async getDashboardOverview(
    familyId: number,
    asOfDate?: string
  ): Promise<DashboardOverviewResponseDTO> {
    const family = familyRepository.findById(familyId);
    if (!family) {
      throw new NotFoundError(`Family with ID ${familyId} not found`);
    }

    const portfolioDTO = await portfolioApplicationService.getConsolidatedPortfolio({
      familyId,
      asOfDate,
      reportingCurrency: family.currency || 'INR',
      includeRiskMetrics: false
    });

    const members = familyMemberRepository.findAll(familyId);
    const memberNodes = members.map(m => ({
      id: m.id,
      name: m.name,
      marketValue: portfolioDTO.netWorth.totalMarketValue
    }));

    const mockNetWorthSnapshot: any = {
      timeModel: { valuationDate: portfolioDTO.asOfDate },
      reportingCurrency: portfolioDTO.reportingCurrency,
      summary: {
        totalMarketValue: portfolioDTO.netWorth.totalMarketValue,
        totalCostBasis: portfolioDTO.netWorth.totalCostBasis,
        totalUnrealizedGain: portfolioDTO.netWorth.unrealizedGain,
        totalUnrealizedGainPercent: portfolioDTO.netWorth.unrealizedGainPercent
      },
      hierarchy: {
        children: memberNodes
      },
      manifest: { checksum: portfolioDTO.masterChecksum }
    };

    return DTOMapper.toDashboardOverviewResponseDTO(
      familyId,
      family.name,
      mockNetWorthSnapshot,
      undefined
    );
  }
}

export const dashboardApplicationService = new DashboardApplicationService();
