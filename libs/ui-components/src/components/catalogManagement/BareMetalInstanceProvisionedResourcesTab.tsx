import { useEffect, useState } from 'react';
import type { OnPerPageSelect, OnSetPage } from '@patternfly/react-core';

import type { BareMetalInstance } from '@osac/types';

import ProvisionedResourcesTable, {
  type ProvisionedResourceRow,
} from './ProvisionedResourcesTable';
import { useBareMetalInstancesForCatalogItem } from '../../api/v1/baremetal-instance';
import { resourceDisplayName } from '../../api/v1/networking';
import { BareMetalStatusLabel } from '../BareMetalInstance/BareMetalStatusLabel';

interface BareMetalInstanceProvisionedResourcesTabProps {
  catalogItemId: string;
}

const DEFAULT_PER_PAGE = 10;

const bareMetalRow = (item: BareMetalInstance): ProvisionedResourceRow => ({
  id: item.id,
  name: resourceDisplayName(item.metadata, item.id),
  status: <BareMetalStatusLabel state={item.status?.state} />,
  createdAt: item.metadata?.creationTimestamp,
  href: `/bare-metal/${item.id}`,
});

const BareMetalInstanceProvisionedResourcesTab = ({
  catalogItemId,
}: BareMetalInstanceProvisionedResourcesTabProps) => {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const offset = (page - 1) * perPage;

  // The parent route only swaps the `:id` param when the admin navigates between catalog items —
  // this component's instance is reused rather than remounted, so page state must reset explicitly.
  useEffect(() => {
    setPage(1);
  }, [catalogItemId]);

  const { data, isLoading, error } = useBareMetalInstancesForCatalogItem(catalogItemId, {
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
      rows={(data?.items ?? []).map(bareMetalRow)}
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

export default BareMetalInstanceProvisionedResourcesTab;
