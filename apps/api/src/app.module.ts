import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CvModule } from './cv/cv.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [CvModule, UserModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
