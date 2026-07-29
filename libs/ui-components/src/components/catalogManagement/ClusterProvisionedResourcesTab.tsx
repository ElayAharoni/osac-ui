import { useEffect, useState } from 'react';
import type { OnPerPageSelect, OnSetPage } from '@patternfly/react-core';

import type { Cluster } from '@osac/types';

import ProvisionedResourcesTable, {
  type ProvisionedResourceRow,
} from './ProvisionedResourcesTable';
import { useClustersForCatalogItem } from '../../api/v1/cluster';
import { resourceDisplayName } from '../../api/v1/networking';
import { ClusterStatusLabel } from '../Cluster/ClusterStatusLabel';

interface ClusterProvisionedResourcesTabProps {
  catalogItemId: string;
}

const DEFAULT_PER_PAGE = 10;

const clusterRow = (item: Cluster): ProvisionedResourceRow => ({
  id: item.id,
  name: resourceDisplayName(item.metadata, item.id),
  status: <ClusterStatusLabel state={item.status?.state} />,
  createdAt: item.metadata?.creationTimestamp,
  href: `/clusters/${item.id}`,
});

const ClusterProvisionedResourcesTab = ({ catalogItemId }: ClusterProvisionedResourcesTabProps) => {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const offset = (page - 1) * perPage;

  // The parent route only swaps the `:id` param when the admin navigates between catalog items —
  // this component's instance is reused rather than remounted, so page state must reset explicitly.
  useEffect(() => {
    setPage(1);
  }, [catalogItemId]);

  const { data, isLoading, error } = useClustersForCatalogItem(catalogItemId, {
    limit: perPage,
    offset,
  });

  const handleSetPage: OnSetPage = (_event, newPage) => {
    setPage(newPage);
  };

  const handlePerPageSelect: OnPerPageSelect = (_event, newPerPage) => {
    setPerPage(newPerPage);
    setPage(1);
  };

  return (
    <ProvisionedResourcesTable
      rows={(data?.items ?? []).map(clusterRow)}
      total={data?.total ?? 0}
      isLoading={isLoading}
      error={error}
      page={page}
      perPage={perPage}
      onSetPage={handleSetPage}
      onPerPageSelect={handlePerPageSelect}
    />
  );
};

export default ClusterProvisionedResourcesTab;
