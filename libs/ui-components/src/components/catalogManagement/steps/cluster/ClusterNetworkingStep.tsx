import { useTranslation } from '../../../../hooks/useTranslation';
import { StringFieldDefinition } from '../../fieldDefinitions/StringFieldDefinition';

export const ClusterNetworkingStep = () => {
  const { t } = useTranslation();

  return (
    <>
      <StringFieldDefinition
        path="network.pod_cidr"
        label={t('Pod CIDR')}
        fieldId="pod-cidr"
        helperText={t('Use IPv4 CIDR notation (for example 10.128.0.0/14).')}
      />
      <StringFieldDefinition
        path="network.service_cidr"
        label={t('Service CIDR')}
        fieldId="service-cidr"
        helperText={t('Use IPv4 CIDR notation (for example 172.30.0.0/16).')}
      />
    </>
  );
};
