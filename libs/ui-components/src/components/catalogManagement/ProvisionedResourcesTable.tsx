import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Content, Pagination, PaginationVariant, Stack, StackItem } from '@patternfly/react-core';
import type { OnPerPageSelect, OnSetPage } from '@patternfly/react-core';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';

import { useTranslation } from '../../hooks/useTranslation';
import ListPageBody from '../Page/ListPageBody';
import { Timestamp, type TimestampProps } from '../Primitives/Timestamp';

export interface ProvisionedResourceRow {
  id: string;
  name: string;
  status: ReactNode;
  createdAt: TimestampProps['value'];
  href: string;
}

interface ProvisionedResourcesTableProps {
  rows: ProvisionedResourceRow[];
  total: number;
  isLoading: boolean;
  error: unknown;
  page: number;
  perPage: number;
  onSetPage: OnSetPage;
  onPerPageSelect: OnPerPageSelect;
}

const ProvisionedResourcesTable = ({
  rows,
  total,
  isLoading,
  error,
  page,
  perPage,
  onSetPage,
  onPerPageSelect,
}: ProvisionedResourcesTableProps) => {
  const { t } = useTranslation();

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
            onSetPage={onSetPage}
            onPerPageSelect={onPerPageSelect}
            variant={PaginationVariant.bottom}
          />
        </StackItem>
      ) : null}
    </Stack>
  );
};

export default ProvisionedResourcesTable;
