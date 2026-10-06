import { Module } from '@nestjs/common';
import { SecretsCertificatePlatformController } from './secrets-certificate-platform.controller';
import { SecretsCertificatePlatformService } from './secrets-certificate-platform.service';

@Module({
  controllers: [SecretsCertificatePlatformController],
  providers: [SecretsCertificatePlatformService],
  exports: [SecretsCertificatePlatformService],
})
export class SecretsCertificatePlatformModule {}
