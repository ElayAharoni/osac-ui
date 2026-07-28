import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Content, Pagination, PaginationVariant, Stack, StackItem } from '@patternfly/react-core';
import type { OnPerPageSelect, OnSetPage } from '@patternfly/react-core';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';

import type { BareMetalInstance, Cluster, ComputeInstance } from '@osac/types';

import { useBareMetalInstancesForCatalogItem } from '../../api/v1/baremetal-instance';
import { useClustersForCatalogItem } from '../../api/v1/cluster';
import { useComputeInstancesForCatalogItem } from '../../api/v1/compute-instance';
import { resourceDisplayName } from '../../api/v1/networking';
import { useTranslation } from '../../hooks/useTranslation';
import { VmStatusLabel } from '../../VmStatusLabel';
import { BareMetalStatusLabel } from '../BareMetalInstance/BareMetalStatusLabel';
import { ClusterStatusLabel } from '../Cluster/ClusterStatusLabel';
import ListPageBody from '../Page/ListPageBody';
import { Timestamp, type TimestampProps } from '../Primitives/Timestamp';

export type CatalogItemDetailKind = 'cluster' | 'compute-instance' | 'baremetal-instance';

interface CatalogItemProvisionedResourcesTabProps {
  catalogItemId: string;
  kind: CatalogItemDetailKind;
}

interface ProvisionedResourceRow {
  id: string;
  name: string;
  status: ReactNode;
  createdAt: TimestampProps['value'];
  href: string;
}

const clusterRow = (item: Cluster): ProvisionedResourceRow => ({
  id: item.id,
  name: resourceDisplayName(item.metadata, item.id),
  status: <ClusterStatusLabel state={item.status?.state} />,
  createdAt: item.metadata?.creationTimestamp,
  href: `/clusters/${item.id}`,
});

const computeInstanceRow = (item: ComputeInstance): ProvisionedResourceRow => ({
  id: item.id,
  name: resourceDisplayName(item.metadata, item.id),
  status: <VmStatusLabel state={item.status?.state} />,
  createdAt: item.metadata?.creationTimestamp,
  href: `/vms/${item.id}`,
});

const bareMetalRow = (item: BareMetalInstance): ProvisionedResourceRow => ({
  id: item.id,
  name: resourceDisplayName(item.metadata, item.id),
  status: <BareMetalStatusLabel state={item.status?.state} />,
  createdAt: item.metadata?.creationTimestamp,
  href: `/bare-metal/${item.id}`,
});

const DEFAULT_PER_PAGE = 10;

const CatalogItemProvisionedResourcesTab = ({
  catalogItemId,
  kind,
}: CatalogItemProvisionedResourcesTabProps) => {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const offset = (page - 1) * perPage;

  // The parent route only swaps the `:id` param when the admin navigates between catalog items —
  // this component's instance is reused rather than remounted, so page state must reset explicitly.
  useEffect(() => {
    setPage(1);
  }, [catalogItemId, kind]);

  const clustersResult = useClustersForCatalogItem(kind === 'cluster' ? catalogItemId : '', {
    limit: perPage,
    offset,
  });
  const computeInstancesResult = useComputeInstancesForCatalogItem(
    kind === 'compute-instance' ? catalogItemId : '',
    { limit: perPage, offset },
  );
  const bareMetalResult = useBareMetalInstancesForCatalogItem(
    kind === 'baremetal-instance' ? catalogItemId : '',
    { limit: perPage, offset },
  );

  let rows: ProvisionedResourceRow[];
  let total: number;
  let isLoading: boolean;
  let error: unknown;

  switch (kind) {
    case 'cluster':
      rows = (clustersResult.data?.items ?? []).map(clusterRow);
      total = clustersResult.data?.total ?? 0;
      isLoading = clustersResult.isLoading;
      error = clustersResult.error;
      break;
    case 'compute-instance':
      rows = (computeInstancesResult.data?.items ?? []).map(computeInstanceRow);
      total = computeInstancesResult.data?.total ?? 0;
      isLoading = computeInstancesResult.isLoading;
      error = computeInstancesResult.error;
      break;
    case 'baremetal-instance':
      rows = (bareMetalResult.data?.items ?? []).map(bareMetalRow);
      total = bareMetalResult.data?.total ?? 0;
      isLoading = bareMetalResult.isLoading;
      error = bareMetalResult.error;
      break;
  }

  const handleSetPage: OnSetPage = (_event, newPage) => {
    setPage(newPage);
  };

  const handlePerPageSelect: OnPerPageSelect = (_event, newPerPage) => {
    setPerPage(newPerPage);
    setPage(1);
  };

  return (
    <Stack hasGutter>
      <StackItem>
        <ListPageBody isLoading={isLoading} error={error}>
          {rows.length === 0 ? (
            <Content component="p">
              {t('No resources have been provisioned from this catalog item.')}
            </Content>
          ) : (
            <Table aria-label={t('Provisioned resources')} variant="compact">
              <Thead>
                <Tr>
                  <Th>{t('Name')}</Th>
                  <Th>{t('Status')}</Th>
                  <Th>{t('Created')}</Th>
                </Tr>
              </Thead>
              <Tbody>
                {rows.map((row) => (
                  <Tr key={row.id}>
                    <Td dataLabel={t('Name')}>
                      <Link to={row.href}>{row.name}</Link>
                    </Td>
                    <Td dataLabel={t('Status')}>{row.status}</Td>
                    <Td dataLabel={t('Created')}>
                      <Timestamp value={row.createdAt} />
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          )}
        </ListPageBody>
      </StackItem>
      {total > 0 ? (
        <StackItem>
          <Pagination
            itemCount={total}
            page={page}
            perPage={perPage}
            onSetPage={handleSetPage}
            onPerPageSelect={handlePerPageSelect}
            variant={PaginationVariant.bottom}
          />
        </StackItem>
      ) : null}
    </Stack>
  );
};

export default CatalogItemProvisionedResourcesTab;
