import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { CvService } from './cv.service';

@Controller('cvs')
export class CvController {
  constructor(private readonly cvService: CvService) {}

  @Get(':cvId/download')
  async getDownloadUrl(@Param('cvId') cvId: string) {
    const downloadUrl = await this.cvService.getDownloadUrl(cvId);
    
    if (!downloadUrl) {
      throw new NotFoundException('CV not found');
    }

    return {
      url: downloadUrl.url,
      filename: downloadUrl.filename,
      expiresIn: 3600, // 1 hour
    };
  }
}
