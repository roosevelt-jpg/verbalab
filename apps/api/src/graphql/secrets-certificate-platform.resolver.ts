import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { GetSecretsCertificatePlatformEngineQuery } from '../secrets-certificate-platform/application/messages';
import { GqlSecretsCertificatePlatformEngine } from './gql.types';

@Resolver
export class SecretsCertificatePlatformGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query( => GqlSecretsCertificatePlatformEngine, { name: 'secretsCertificatePlatformEngine' })
  async secretsCertificatePlatformEngine: Promise<GqlSecretsCertificatePlatformEngine> {
    const catalog = await this.queries.execute(new GetSecretsCertificatePlatformEngineQuery);
    return {
      product: catalog.product,
      note: catalog.note,
      encryptedAtRest: catalog.honesty.encryptedAtRest,
      neverLogPlaintextSecrets: catalog.honesty.neverLogPlaintextSecrets,
      envelopeEncryptionPattern: catalog.honesty.envelopeEncryptionPattern,
      accessAuditing: catalog.honesty.accessAuditing,
      hashicorpVaultOs: catalog.honesty.hashicorpVaultOs,
      secretCount: Array.isArray(catalog.secrets) ? catalog.secrets.length : 0,
    };
  }
}
