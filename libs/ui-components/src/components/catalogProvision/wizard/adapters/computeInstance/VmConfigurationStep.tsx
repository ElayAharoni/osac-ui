import { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Alert, Button, EmptyState, EmptyStateBody, Stack, StackItem } from '@patternfly/react-core';
import { useField, useFormikContext } from 'formik';

import type { ComputeInstanceCatalogItem } from '@osac/types';
import { Architecture, DiskImageLifecycle } from '@osac/types';
import { resourceDisplayName } from '@osac/ui-components/api/v1/networking';
import { formatInstanceTypeOptionLabel } from '@osac/ui-components/components/vm/utils';

import { useDiskImages } from '../../../../../api/v1/disk-image';
import {
  INSTANCE_TYPE_ACTIVE_LIST_FILTER,
  useInstanceTypes,
} from '../../../../../api/v1/instance-types';
import { useTranslation } from '../../../../../hooks/useTranslation';
import OsacForm from '../../../../Form/OsacForm';
import { SelectField } from '../../../../Form/SelectField';
import {
  getCatalogFieldOverlay,
  hasCatalogFieldDefinition,
  readCatalogFieldDefinitions,
} from '../../catalogOverlay';
import UserDataField from '../../fields/UserDataField';
import { VM_DISK_IMAGE_WIRE_PATH } from './fields';

const ARCH_LABELS: Record<Architecture, string> = {
  [Architecture.UNSPECIFIED]: '',
  [Architecture.AMD64]: 'AMD64',
  [Architecture.ARM64]: 'ARM64',
  [Architecture.S390X]: 'S390X',
};

interface Props {
  catalogItem: ComputeInstanceCatalogItem | null;
}

export const VmConfigurationStep = ({ catalogItem }: Props) => {
  const { t } = useTranslation();

  const {
    data: instanceTypes = [],
    isPending: instanceTypesLoading,
    isError: instanceTypesError,
    refetch: refetchInstanceTypes,
  } = useInstanceTypes({ filter: INSTANCE_TYPE_ACTIVE_LIST_FILTER });

  const {
    data: diskImages = [],
    isPending: diskImagesLoading,
    isError: diskImagesError,
    refetch: refetchDiskImages,
  } = useDiskImages();

  const [diskImageField] = useField<string>('spec.diskImage');
  const { setFieldValue } = useFormikContext();

  const selectedDiskImage = useMemo(
    () => diskImages.find((di) => di.id === diskImageField.value),
    [diskImages, diskImageField.value],
  );

  const instanceTypeOptions = useMemo(
    () =>
      instanceTypes.map((instanceType) => ({
        value: instanceType.id,
        label: formatInstanceTypeOptionLabel(
          instanceType,
          t('catalogProvision.instanceTypes.deprecatedSuffix'),
        ),
      })),
    [instanceTypes, t],
  );

  const diskImageOptions = useMemo(
    () =>
      diskImages.map((di) => {
        const name = resourceDisplayName(di.metadata, di.id);
        const deprecated = di.spec?.lifecycle === DiskImageLifecycle.DEPRECATED;
        const archList = (di.spec?.architecture ?? [])
          .map((a) => ARCH_LABELS[a])
          .filter(Boolean)
          .join(', ');
        return {
          value: di.id,
          label: deprecated
            ? `${name} ${t('catalogProvision.vm.fields.diskImageDeprecatedSuffix')}`
            : name,
          description: archList || undefined,
        };
      }),
    [diskImages, t],
  );

  const definitions = useMemo(() => readCatalogFieldDefinitions(catalogItem), [catalogItem]);

  // If disk images finish loading and the current value isn't in the visible options
  // (e.g. a catalog default pointed to an OBSOLETE image), clear the selection so
  // the user sees the placeholder and must pick a valid image.
  useEffect(() => {
    if (!diskImagesLoading && diskImageField.value && !diskImages.find((di) => di.id === diskImageField.value)) {
      void setFieldValue('spec.diskImage', '');
    }
  }, [diskImagesLoading, diskImages, diskImageField.value, setFieldValue]);

  const overlays = useMemo(
    () => ({
      diskImage: getCatalogFieldOverlay(
        VM_DISK_IMAGE_WIRE_PATH,
        definitions,
        t('catalogProvision.vm.fields.diskImage'),
      ),
      userData: getCatalogFieldOverlay(
        'spec.user_data',
        definitions,
        t('catalogProvision.vm.fields.userData'),
      ),
      userDataRequired: hasCatalogFieldDefinition('spec.user_data', definitions),
    }),
    [definitions, t],
  );

  if (!catalogItem) {
    return null;
  }

  return (
    <Stack hasGutter>
      {diskImagesError ? (
        <StackItem>
          <Alert variant="danger" isInline title={t('catalogProvision.diskImages.loadError')}>
            <Button variant="link" isInline onClick={() => void refetchDiskImages()}>
              {t('catalogProvision.actions.retry')}
            </Button>
          </Alert>
        </StackItem>
      ) : null}
      {instanceTypesError ? (
        <StackItem>
          <Alert variant="danger" isInline title={t('catalogProvision.instanceTypes.loadError')}>
            <Button variant="link" isInline onClick={() => void refetchInstanceTypes()}>
              {t('catalogProvision.actions.retry')}
            </Button>
          </Alert>
        </StackItem>
      ) : null}
      {!diskImagesLoading && !diskImagesError && diskImages.length === 0 ? (
        <StackItem>
          <EmptyState>
            <EmptyStateBody>{t('catalogProvision.diskImages.emptyStateBody')}</EmptyStateBody>
            <Button
              variant="link"
              component={Link}
              to="/admin/infrastructure/disk-images/create"
            >
              {t('catalogProvision.diskImages.createCTA')}
            </Button>
          </EmptyState>
        </StackItem>
      ) : null}
      {selectedDiskImage?.spec?.lifecycle === DiskImageLifecycle.DEPRECATED ? (
        <StackItem>
          <Alert
            variant="warning"
            isInline
            title={t('catalogProvision.diskImages.deprecatedWarning')}
          />
        </StackItem>
      ) : null}
      <StackItem>
        <OsacForm>
          <SelectField
            name="spec.diskImage"
            label={overlays.diskImage.label}
            fieldId="vm-disk-image"
            isRequired
            autoSelectSingleOption
            isLoading={diskImagesLoading}
            placeholder={t('catalogProvision.vm.placeholders.selectDiskImage')}
            isDisabled={!overlays.diskImage.editable || diskImages.length === 0}
            options={diskImageOptions}
          />
          <SelectField
            name="spec.instanceType"
            label={t('catalogProvision.vm.fields.instanceType')}
            fieldId="vm-instance-type"
            isRequired
            autoSelectSingleOption
            isLoading={instanceTypesLoading}
            placeholder={t('catalogProvision.vm.placeholders.selectInstanceType')}
            options={instanceTypeOptions}
          />
          <UserDataField catalogItem={catalogItem} name="spec.userData" wirePath="spec.user_data" />
        </OsacForm>
      </StackItem>
    </Stack>
  );
};
